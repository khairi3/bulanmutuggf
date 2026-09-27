<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\CategoryOption;
use App\Models\FinalResult;
use App\Models\Project;
use App\Models\ScoringParameter;
use App\Models\Stream;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Service Rekap Nilai Akhir, Ranking, Tie-Breaker & Pengumuman Pemenang (REP-01, CFG-08, ADM-05, NOT-07).
 */
class RecapService
{
    public function __construct(
        protected ScoringService $scoring,
        protected NotificationService $notifier,
    ) {}

    /**
     * Hitung rekap nilai akhir, ranking, dan tie-breaker per kategori (REP-01, CFG-08).
     *
     * @return Collection<int, array{option: CategoryOption|null, projects: Collection}>
     */
    public function recomputeRecap(Stream $stream): Collection
    {
        $stream->load('categoryDimensions.options');
        $dimension = $stream->rankingDimension();

        // Bobot nilai akhir (CFG-08)
        $vWeight = $stream->verification_weight ?: 30;
        $jWeight = $stream->judging_weight ?: 70;

        // Ambil seluruh project yang masuk tahap penjurian/final
        $projects = $stream->projects()
            ->with([
                'categories.dimension',
                'leader',
                'teamMembers.employee',
                'scoreSheets.items',
                'finalResult',
            ])
            ->whereIn('status', [
                Project::STATUS_QUALIFIED,
                Project::STATUS_FINALISED,
                Project::STATUS_JUDGING,
                Project::STATUS_ANNOUNCED,
            ])
            ->get();

        $dimensionOptions = $dimension ? $dimension->options : collect();

        // Kalkulasi skor gabungan tiap project
        $recapRows = $projects->map(function (Project $p) use ($dimension, $vWeight, $jWeight) {
            $option = $dimension ? $p->categories->firstWhere('dimension_id', $dimension->id) : null;

            // Rata-rata nilai verifikasi (stage: verification, status: submitted)
            $vSheets = $p->scoreSheets->where('stage', ScoringParameter::STAGE_VERIFICATION)->where('status', 'submitted');
            $verificationScore = $vSheets->isNotEmpty() ? (float) $vSheets->avg('total_weighted') : null;

            // Rata-rata nilai juri (stage: judging, status: submitted)
            $jSheets = $p->scoreSheets->where('stage', ScoringParameter::STAGE_JUDGING)->where('status', 'submitted');
            $judgingScore = $jSheets->isNotEmpty() ? (float) $jSheets->avg('total_weighted') : null;

            // Final score gabungan: (vScore * vWeight / 100) + (jScore * jWeight / 100)
            $computedV = $verificationScore !== null ? ($verificationScore * $vWeight) / 100 : 0;
            $computedJ = $judgingScore !== null ? ($judgingScore * $jWeight) / 100 : 0;
            $finalScore = round($computedV + $computedJ, 2);

            return [
                'project' => $p,
                'project_id' => $p->id,
                'registration_code' => $p->registration_code,
                'title' => $p->title,
                'leader' => $p->leader?->only(['full_name', 'unit']),
                'option_id' => $option?->id,
                'option_name' => $option ? "{$option->name} ({$option->abbreviation})" : 'Umum',
                'verification_score' => $verificationScore !== null ? round($verificationScore, 2) : null,
                'judging_score' => $judgingScore !== null ? round($judgingScore, 2) : null,
                'verification_weight' => $vWeight,
                'judging_weight' => $jWeight,
                'final_score' => $finalScore,
                'finalised_at' => $p->finalised_at,
                'submitted_at' => $p->submitted_at ?? $p->created_at,
                'award_title' => $p->finalResult?->award_title,
                'status' => $p->status,
            ];
        });

        // Kelompokkan per kategori opsi dan terapkan Tie-Breaker
        $grouped = $dimensionOptions->map(function (CategoryOption $option) use ($recapRows, $stream, $vWeight, $jWeight) {
            $optionRows = $recapRows->where('option_id', $option->id);

            $rankedProjects = $this->applyTieBreakerAndRanking($optionRows, $stream, $option->id, $vWeight, $jWeight);

            return [
                'option' => [
                    'id' => $option->id,
                    'name' => $option->name,
                    'abbreviation' => $option->abbreviation,
                    'quota' => $option->quota,
                ],
                'projects' => $rankedProjects,
            ];
        })->values();

        // Project tanpa kategori jika ada
        $uncategorized = $recapRows->whereNull('option_id');
        if ($uncategorized->isNotEmpty()) {
            $rankedUncat = $this->applyTieBreakerAndRanking($uncategorized, $stream, null, $vWeight, $jWeight);
            $grouped->push([
                'option' => null,
                'projects' => $rankedUncat,
            ]);
        }

        return $grouped;
    }

    /**
     * Terapkan aturan Tie-Breaker resmi (REP-01) dan simpan ke final_results:
     * 1. final_score DESC
     * 2. judging_score DESC
     * 3. finalised_at ASC
     * 4. submitted_at ASC
     */
    protected function applyTieBreakerAndRanking(
        Collection $rows,
        Stream $stream,
        ?int $optionId,
        int $vWeight,
        int $jWeight
    ): Collection {
        $sorted = $rows->sort(function ($a, $b) {
            // 1. final_score DESC
            if ($a['final_score'] !== $b['final_score']) {
                return $a['final_score'] < $b['final_score'] ? 1 : -1;
            }

            // 2. Tie-break 1: judging_score DESC
            $jA = $a['judging_score'] ?? -1;
            $jB = $b['judging_score'] ?? -1;
            if ($jA !== $jB) {
                return $jA < $jB ? 1 : -1;
            }

            // 3. Tie-break 2: finalised_at ASC (lebih awal lebih baik)
            $fA = $a['finalised_at'] ? $a['finalised_at']->timestamp : PHP_INT_MAX;
            $fB = $b['finalised_at'] ? $b['finalised_at']->timestamp : PHP_INT_MAX;
            if ($fA !== $fB) {
                return $fA > $fB ? 1 : -1;
            }

            // 4. Tie-break 3: submitted_at ASC
            $sA = $a['submitted_at'] ? $a['submitted_at']->timestamp : PHP_INT_MAX;
            $sB = $b['submitted_at'] ? $b['submitted_at']->timestamp : PHP_INT_MAX;

            return $sA <=> $sB;
        })->values();

        // Assign Rank & Award Titles
        return $sorted->map(function ($row, $idx) use ($optionId, $vWeight, $jWeight) {
            $rank = $idx + 1;
            $suggestedAward = $row['award_title'] ?? match ($rank) {
                1 => 'Juara 1',
                2 => 'Juara 2',
                3 => 'Juara 3',
                4 => 'Harapan 1',
                5 => 'Harapan 2',
                default => null,
            };

            // Update or create final_results record
            FinalResult::updateOrCreate(
                ['project_id' => $row['project_id']],
                [
                    'ranking_option_id' => $optionId,
                    'verification_score' => $row['verification_score'],
                    'judging_score' => $row['judging_score'],
                    'verification_weight' => $vWeight,
                    'judging_weight' => $jWeight,
                    'final_score' => $row['final_score'],
                    'rank_in_category' => $rank,
                    'award_title' => $suggestedAward,
                ]
            );

            $row['rank'] = $rank;
            $row['award_title'] = $suggestedAward;

            return $row;
        });
    }

    /**
     * Simpan kustomisasi gelar juara oleh Admin (misal: Best Innovation, Juara Favorit).
     */
    public function updateAwardTitles(Stream $stream, array $awards, User $admin): void
    {
        DB::transaction(function () use ($awards, $admin) {
            foreach ($awards as $projectId => $awardTitle) {
                $finalResult = FinalResult::where('project_id', $projectId)->first();
                if ($finalResult) {
                    $finalResult->update(['award_title' => $awardTitle ?: null]);
                }
            }

            AuditLog::log(
                action: 'UPDATE_AWARDS',
                entityType: 'Stream',
                entityId: null,
                after: ['awards' => $awards],
                reason: 'Admin memperbarui penetapan gelar pemenang BMG',
                userId: $admin->id
            );
        });
    }

    /**
     * Publikasikan Hasil Resmi & Pengumuman Pemenang (ADM-05, NOT-07).
     */
    public function publishWinners(Stream $stream, User $admin): array
    {
        if ($stream->isResultsPublished()) {
            throw ValidationException::withMessages([
                'publish' => 'Hasil pemenang stream ini sudah dipublikasikan sebelumnya.',
            ]);
        }

        return DB::transaction(function () use ($stream, $admin) {
            $stream->update(['results_published_at' => now()]);

            // Ambil seluruh final results untuk stream ini
            $finalResults = FinalResult::whereHas('project', fn ($q) => $q->where('stream_id', $stream->id))->get();

            foreach ($finalResults as $fr) {
                $fr->update(['published_at' => now()]);
            }

            // Update status project ke announced
            $stream->projects()
                ->whereIn('status', [Project::STATUS_QUALIFIED, Project::STATUS_FINALISED, Project::STATUS_JUDGING])
                ->update(['status' => Project::STATUS_ANNOUNCED]);

            // Catat audit log
            AuditLog::log(
                action: 'PUBLISH_WINNERS',
                entityType: 'Stream',
                entityId: $stream->id,
                after: [
                    'results_published_at' => now(),
                    'total_announced' => $finalResults->count(),
                ],
                reason: "Admin mempublikasikan hasil resmi pemenang BMG untuk {$stream->name}",
                userId: $admin->id
            );

            // Broadcast notifikasi pemenang (NOT-07)
            $this->notifyAllParticipants($stream);

            return [
                'total_winners' => $finalResults->whereNotNull('award_title')->count(),
                'total_projects' => $finalResults->count(),
            ];
        });
    }

    /**
     * NOT-07: Broadcast notifikasi pemenang ke seluruh peserta di stream ini.
     */
    protected function notifyAllParticipants(Stream $stream): void
    {
        $projects = $stream->projects()->with(['leader', 'teamMembers.employee', 'finalResult'])->get();

        foreach ($projects as $project) {
            $award = $project->finalResult?->award_title;
            $rank = $project->finalResult?->rank_in_category;

            $title = $award
                ? "Selamat! Tim Anda Meraih {$award} di Bulan Mutu GGF 2026!"
                : 'Pengumuman Pemenang Bulan Mutu GGF 2026 Telah Resmi Dirilis';

            $message = $award
                ? "Selamat kepada tim {$project->registration_code} - {$project->title}! Anda resmi meraih gelar {$award} (Peringkat {$rank}) pada kategori ini."
                : "Terima kasih atas partisipasi dan inovasi luar biasa tim Anda pada project {$project->registration_code}. Seluruh rekap nilai dan pengumuman pemenang dapat diakses pada portal BMG.";

            $this->notifier->notifyTeam(
                $project,
                'winner_announcement',
                $title,
                $message,
                '/viewer/dashboard'
            );
        }
    }
}
