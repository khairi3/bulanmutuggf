<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\FinalResult;
use App\Models\Project;
use App\Models\Stream;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Rekap nilai akhir + ranking per kategori (REP-01, ADM-05, NOT-07).
 */
class RecapService
{
    public function __construct(
        protected ScoringService $scoring,
        protected NotificationService $notifier,
    ) {}

    /**
     * Hitung ulang final_results seluruh project Convention stream ini.
     * Tie-breaker: nilai juri lebih tinggi, lalu waktu Finalise lebih awal.
     */
    public function compute(Stream $stream): Collection
    {
        if ($stream->isResultsPublished()) {
            return $this->results($stream);
        }

        $stream->loadMissing(['categoryDimensions.options', 'event']);
        $dimension = $stream->rankingDimension();

        $projects = $stream->projects()
            ->with(['categories', 'scoreSheets', 'stream.event'])
            ->whereIn('status', Project::CONVENTION_STATUSES)
            ->get();

        $rows = $projects->map(function (Project $project) use ($dimension) {
            $verification = $this->scoring->verificationScore($project);
            $judging = $this->scoring->judgingScore($project);

            return [
                'project' => $project,
                'option_id' => $dimension ? $project->categories->firstWhere('dimension_id', $dimension->id)?->id : null,
                'verification' => $verification,
                'judging' => $judging,
                'final' => $this->scoring->finalScore($project, $verification, $judging),
                'finalised_at' => $project->finalised_at?->timestamp ?? PHP_INT_MAX,
            ];
        });

        DB::transaction(function () use ($rows, $stream) {
            foreach ($rows->groupBy(fn ($r) => $r['option_id'] ?? 0) as $group) {
                $ranked = $group->sort(function ($a, $b) {
                    return [($b['final'] ?? -1), ($b['judging'] ?? -1), $a['finalised_at']]
                        <=> [($a['final'] ?? -1), ($a['judging'] ?? -1), $b['finalised_at']];
                })->values();

                foreach ($ranked as $idx => $row) {
                    FinalResult::updateOrCreate(
                        ['project_id' => $row['project']->id],
                        [
                            'ranking_option_id' => $row['option_id'],
                            'verification_score' => $row['verification'],
                            'judging_score' => $row['judging'],
                            'final_score' => $row['final'],
                            'rank_in_category' => $idx + 1,
                        ]
                    );
                }
            }

            AuditLog::log(
                action: 'COMPUTE_RECAP',
                entityType: 'Stream',
                entityId: $stream->id,
                reason: "Rekap nilai & ranking {$stream->name} dihitung ulang ({$rows->count()} project)",
            );
        });

        return $this->results($stream);
    }

    /**
     * Hasil ranking tersimpan, dikelompokkan per kategori.
     */
    public function results(Stream $stream): Collection
    {
        $stream->loadMissing('categoryDimensions.options');
        $dimension = $stream->rankingDimension();

        $results = FinalResult::with(['project.leader', 'project.categories.dimension', 'project.scoreSheets'])
            ->whereHas('project', fn ($q) => $q->where('stream_id', $stream->id))
            ->orderBy('rank_in_category')
            ->get();

        $options = $dimension ? $dimension->options : collect();

        $groups = $options->map(fn ($option) => [
            'option' => ['id' => $option->id, 'name' => $option->name, 'abbreviation' => $option->abbreviation],
            'results' => $results->where('ranking_option_id', $option->id)->values()->map(fn ($r) => $this->present($r)),
        ]);

        $other = $results->whereNull('ranking_option_id');
        if ($other->isNotEmpty()) {
            $groups->push(['option' => null, 'results' => $other->values()->map(fn ($r) => $this->present($r))]);
        }

        return $groups->filter(fn ($g) => $g['results']->isNotEmpty())->values();
    }

    /**
     * Publish pengumuman pemenang (ADM-05, NOT-07): nilai dikunci.
     */
    public function publish(Stream $stream, User $admin): void
    {
        if ($stream->isResultsPublished()) {
            throw ValidationException::withMessages(['recap' => 'Hasil stream ini sudah diumumkan.']);
        }

        $pending = $stream->projects()->where('status', Project::STATUS_FINALISED)->count();
        if ($pending > 0) {
            throw ValidationException::withMessages([
                'recap' => "Masih ada {$pending} project Finalised yang belum dinilai lengkap oleh semua juri.",
            ]);
        }

        $this->compute($stream);

        DB::transaction(function () use ($stream, $admin) {
            $now = now();

            FinalResult::whereHas('project', fn ($q) => $q->where('stream_id', $stream->id))
                ->update(['published_at' => $now]);

            $stream->projects()->where('status', Project::STATUS_JUDGING)->update(['status' => Project::STATUS_ANNOUNCED]);
            $stream->update(['results_published_at' => $now]);

            AuditLog::log(
                action: 'PUBLISH_RESULTS',
                entityType: 'Stream',
                entityId: $stream->id,
                reason: "Pengumuman pemenang {$stream->name} dipublish",
                userId: $admin->id,
            );
        });

        // NOT-07: semua peserta stream
        $stream->projects()->where('status', '!=', Project::STATUS_DRAFT)->get()->each(function (Project $project) use ($stream) {
            $this->notifier->notifyTeam(
                $project,
                'winner_announcement',
                "Pengumuman Pemenang {$stream->name}",
                'Hasil akhir dan ranking Bulan Mutu GGF telah diumumkan. Buka portal untuk melihat hasil tim Anda dan leaderboard juara per kategori.',
            );
        });
    }

    public function present(FinalResult $result): array
    {
        $project = $result->project;

        return [
            'project_id' => $project->id,
            'registration_code' => $project->registration_code,
            'title' => $project->title,
            'status' => $project->status,
            'status_label' => $project->status_label,
            'category_label' => $project->categoryLabel(),
            'leader' => $project->leader?->only(['full_name', 'unit']),
            'verification_score' => $result->verification_score,
            'judging_score' => $result->judging_score,
            'final_score' => $result->final_score,
            'rank' => $result->rank_in_category,
            'judge_count' => $project->scoreSheets->where('stage', 'judging')->where('status', 'submitted')->count(),
            'published_at' => $result->published_at,
        ];
    }
}
