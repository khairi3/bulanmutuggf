<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Project;
use App\Models\SelectionDecision;
use App\Models\Stream;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Seleksi Convention Day (VER-09, VER-10, ADM-03, NOT-05).
 */
class SelectionService
{
    public function __construct(
        protected ScoringService $scoring,
        protected ProjectAccessService $access,
        protected NotificationService $notifier,
    ) {}

    /**
     * Ranking per kategori berdasarkan nilai verifikasi.
     *
     * @return Collection<int, array{option: array|null, quota: int|null, qualified_count: int, projects: Collection}>
     */
    public function ranking(Stream $stream, ?Collection $projectIds = null): Collection
    {
        $stream->load('categoryDimensions.options');
        $dimension = $stream->rankingDimension();

        $query = $stream->projects()
            ->with(['categories.dimension', 'leader', 'selectionDecision', 'scoreSheets'])
            ->whereIn('status', [
                Project::STATUS_VERIFIED,
                Project::STATUS_QUALIFIED,
                Project::STATUS_UNQUALIFIED,
                Project::STATUS_FINALISED,
                Project::STATUS_JUDGING,
                Project::STATUS_ANNOUNCED,
            ]);

        if ($projectIds !== null) {
            $query->whereIn('id', $projectIds);
        }

        $rows = $query->get()->map(function (Project $project) use ($dimension) {
            $option = $dimension ? $project->categories->firstWhere('dimension_id', $dimension->id) : null;

            return [
                'id' => $project->id,
                'registration_code' => $project->registration_code,
                'title' => $project->title,
                'status' => $project->status,
                'status_label' => $project->status_label,
                'category_label' => $project->categoryLabel(),
                'leader' => $project->leader?->only(['full_name', 'unit']),
                'verification_score' => $this->scoring->verificationScore($project),
                'verifier_count' => $project->scoreSheets->where('stage', 'verification')->where('status', 'submitted')->count(),
                'decision' => $project->selectionDecision?->decision,
                'decision_published' => (bool) $project->selectionDecision?->published_at,
                'decision_note' => $project->selectionDecision?->note,
                'option_id' => $option?->id,
            ];
        });

        $options = $dimension ? $dimension->options : collect();

        $groups = $options->map(function ($option) use ($rows) {
            $projects = $rows->where('option_id', $option->id)
                ->sortByDesc(fn ($r) => $r['verification_score'] ?? -1)
                ->values();

            return [
                'option' => ['id' => $option->id, 'name' => $option->name, 'abbreviation' => $option->abbreviation],
                'quota' => $option->quota,
                'qualified_count' => $projects->where('decision', SelectionDecision::QUALIFIED)->count(),
                'projects' => $projects,
            ];
        })->values();

        $uncategorised = $rows->whereNull('option_id');
        if ($uncategorised->isNotEmpty()) {
            $groups->push([
                'option' => null,
                'quota' => null,
                'qualified_count' => $uncategorised->where('decision', SelectionDecision::QUALIFIED)->count(),
                'projects' => $uncategorised->sortByDesc(fn ($r) => $r['verification_score'] ?? -1)->values(),
            ]);
        }

        return $groups;
    }

    /**
     * Simpan keputusan seleksi (belum dipublish atau draf susulan). $qualifiedIds = project yang dicentang "Lolos".
     */
    public function saveDecisions(Stream $stream, array $projectIds, array $qualifiedIds, User $actor): void
    {
        $projects = $stream->projects()
            ->whereIn('id', $projectIds)
            ->whereIn('status', [Project::STATUS_VERIFIED, Project::STATUS_QUALIFIED, Project::STATUS_UNQUALIFIED])
            ->get();

        DB::transaction(function () use ($projects, $qualifiedIds, $actor, $stream) {
            foreach ($projects as $project) {
                SelectionDecision::updateOrCreate(
                    ['project_id' => $project->id],
                    [
                        'decision' => in_array($project->id, $qualifiedIds) ? SelectionDecision::QUALIFIED : SelectionDecision::NOT_QUALIFIED,
                        'decided_by' => $actor->id,
                    ]
                );
            }

            AuditLog::log(
                action: 'SUBMIT_SELECTION',
                entityType: 'Stream',
                entityId: $stream->id,
                after: ['qualified_project_ids' => array_values($qualifiedIds)],
                reason: "Submit seleksi {$stream->name}: ".count($qualifiedIds).' project lolos dari '.$projects->count().' project',
                userId: $actor->id,
            );
        });
    }

    /**
     * Publish atau update hasil seleksi resmi ke Dashboard Juri (ADM-03, NOT-05, VER-10).
     * Mendukung pengiriman awal maupun susulan peserta baru.
     */
    public function publish(Stream $stream, User $admin): array
    {
        $projects = $stream->projects()
            ->with('selectionDecision')
            ->whereIn('status', [Project::STATUS_VERIFIED, Project::STATUS_QUALIFIED, Project::STATUS_UNQUALIFIED])
            ->get();

        $qualified = 0;
        $unqualified = 0;
        $newlyQualified = 0;

        DB::transaction(function () use ($projects, $stream, $admin, &$qualified, &$unqualified, &$newlyQualified) {
            foreach ($projects as $project) {
                $decision = $project->selectionDecision;
                $isQualified = $decision?->decision === SelectionDecision::QUALIFIED;

                if (! $decision) {
                    $decision = SelectionDecision::create([
                        'project_id' => $project->id,
                        'decision' => SelectionDecision::NOT_QUALIFIED,
                        'decided_by' => $admin->id,
                    ]);
                }

                $decision->update(['published_at' => now()]);

                $newStatus = $isQualified ? Project::STATUS_QUALIFIED : Project::STATUS_UNQUALIFIED;
                if ($newStatus === Project::STATUS_QUALIFIED && $project->status !== Project::STATUS_QUALIFIED) {
                    $newlyQualified++;
                }

                $project->update(['status' => $newStatus]);
                $isQualified ? $qualified++ : $unqualified++;
            }

            $stream->update(['selection_published_at' => now()]);

            AuditLog::log(
                action: 'PUBLISH_SELECTION',
                entityType: 'Stream',
                entityId: $stream->id,
                after: [
                    'qualified' => $qualified,
                    'unqualified' => $unqualified,
                    'newly_qualified' => $newlyQualified,
                ],
                reason: "Publish/Pembaruan hasil seleksi Convention Day {$stream->name}",
                userId: $admin->id,
            );
        });

        foreach ($projects->fresh() as $project) {
            $this->notifySelection($project);
        }

        $this->notifyJudgesReady($stream);

        return [
            'qualified' => $qualified,
            'unqualified' => $unqualified,
            'newly_qualified' => $newlyQualified,
        ];
    }

    /**
     * Admin override: tambah/hapus project lolos dengan alasan (ADM-03).
     */
    public function override(Project $project, string $decision, User $admin, string $reason): void
    {
        $allowedStatuses = [Project::STATUS_VERIFIED, Project::STATUS_QUALIFIED, Project::STATUS_UNQUALIFIED];
        if (! in_array($project->status, $allowedStatuses, true)) {
            throw ValidationException::withMessages([
                'decision' => 'Override seleksi hanya untuk project Terverifikasi / Lolos / Tidak Lolos yang belum di-Finalise.',
            ]);
        }

        $published = $project->stream->isSelectionPublished();
        $before = ['decision' => $project->selectionDecision?->decision, 'status' => $project->status];

        DB::transaction(function () use ($project, $decision, $admin, $reason, $published, $before) {
            SelectionDecision::updateOrCreate(
                ['project_id' => $project->id],
                [
                    'decision' => $decision,
                    'decided_by' => $admin->id,
                    'note' => $reason,
                    'published_at' => $published ? now() : null,
                ]
            );

            if ($published) {
                $project->update([
                    'status' => $decision === SelectionDecision::QUALIFIED ? Project::STATUS_QUALIFIED : Project::STATUS_UNQUALIFIED,
                ]);
            }

            AuditLog::log(
                action: 'OVERRIDE_SELECTION',
                entityType: 'Project',
                entityId: $project->id,
                before: $before,
                after: ['decision' => $decision, 'status' => $project->fresh()->status],
                reason: $reason,
                userId: $admin->id,
            );
        });

        if ($published) {
            $this->notifySelection($project->fresh());
        }
    }

    protected function notifySelection(Project $project): void
    {
        $qualified = $project->status === Project::STATUS_QUALIFIED;

        $this->notifier->notifyTeam(
            $project,
            'selection_result',
            $qualified ? 'Selamat! Project Anda Lolos Convention Day' : 'Hasil Seleksi Convention Day',
            $qualified
                ? "Project {$project->registration_code} - {$project->title} lolos ke Convention Day. Buka menu Convention Day untuk mengunggah Final Presentation (PDF) dan Final Video, lalu klik Finalise Project sebelum deadline."
                : "Terima kasih atas partisipasi tim Anda. Project {$project->registration_code} belum lolos ke Convention Day tahun ini. Feedback verifikator tetap dapat dilihat di portal.",
        );
    }

    /**
     * NOT-06: beritahu juri bahwa project siap dinilai.
     */
    protected function notifyJudgesReady(Stream $stream): void
    {
        $judgeIds = $stream->assignments()->where('stage', 'judging')->pluck('user_id')->unique();
        $judges = User::with('employee')->whereIn('id', $judgeIds)->get();

        $this->notifier->notifyUsers(
            $judges,
            'judging_assigned',
            "Project Convention Day {$stream->name} siap dinilai",
            'Daftar project yang lolos seleksi kini tampil di dashboard juri Anda. Materi final dapat dinilai setelah peserta melakukan Finalise.',
            '/judge/dashboard',
        );
    }
}
