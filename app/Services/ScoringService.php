<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Project;
use App\Models\ScoreSheet;
use App\Models\ScoringParameter;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Satu-satunya tempat rumus nilai (PRD 6.3):
 *  - Nilai tahap  = Σ (nilai parameter × bobot parameter / 100)
 *  - Nilai akhir  = (nilai verifikasi × bobot verifikasi) + (rata-rata juri × bobot juri)
 */
class ScoringService
{
    public function __construct(
        protected ProjectAccessService $access,
        protected NotificationService $notifier,
    ) {}

    /**
     * Ambil atau buat score sheet penilai untuk project & tahap tertentu.
     */
    public function sheetFor(Project $project, User $scorer, string $stage): ScoreSheet
    {
        return ScoreSheet::firstOrCreate(
            ['project_id' => $project->id, 'scorer_user_id' => $scorer->id, 'stage' => $stage],
            ['status' => ScoreSheet::STATUS_DRAFT]
        );
    }

    /**
     * Simpan nilai (draft atau submit final). $items = [parameter_id => ['score' => x, 'note' => y]].
     */
    public function saveSheet(Project $project, User $scorer, string $stage, array $items, bool $submit = false): ScoreSheet
    {
        $parameters = $project->stream->scoringParameters()->where('stage', $stage)->get();

        if ($parameters->isEmpty()) {
            throw ValidationException::withMessages([
                'scores' => 'Parameter penilaian untuk tahap ini belum dikonfigurasi Admin.',
            ]);
        }

        return DB::transaction(function () use ($project, $scorer, $stage, $items, $submit, $parameters) {
            $sheet = ScoreSheet::where('project_id', $project->id)
                ->where('scorer_user_id', $scorer->id)
                ->where('stage', $stage)
                ->lockForUpdate()
                ->first() ?? $this->sheetFor($project, $scorer, $stage);

            if ($sheet->isSubmitted()) {
                throw ValidationException::withMessages([
                    'scores' => 'Nilai sudah disubmit final dan terkunci. Hubungi Admin untuk membuka kunci.',
                ]);
            }

            $normalizedItems = [];
            foreach ($items as $k => $item) {
                if (is_array($item)) {
                    $paramId = $item['parameter_id'] ?? $item['scoring_parameter_id'] ?? $k;
                    $normalizedItems[$paramId] = [
                        'score' => $item['score'] ?? null,
                        'note' => $item['note'] ?? $item['notes'] ?? null,
                    ];
                }
            }
            $items = $normalizedItems;

            $errors = [];
            foreach ($parameters as $parameter) {
                $raw = $items[$parameter->id]['score'] ?? null;
                $score = ($raw === null || $raw === '') ? null : (float) $raw;

                if ($score !== null && ($score < 0 || $score > 100)) {
                    $errors["scores.{$parameter->id}"] = "Nilai \"{$parameter->name}\" harus antara 0 sampai 100.";
                }

                if ($submit && $score === null) {
                    $errors["scores.{$parameter->id}"] = "Nilai \"{$parameter->name}\" wajib diisi sebelum Submit Final.";
                }

                $sheet->items()->updateOrCreate(
                    ['parameter_id' => $parameter->id],
                    ['score' => $score, 'note' => $items[$parameter->id]['note'] ?? null]
                );
            }

            if ($errors) {
                throw ValidationException::withMessages($errors);
            }

            $sheet->load('items');
            $sheet->total_weighted = $this->computeTotal($sheet, $parameters);

            if ($submit) {
                $sheet->status = ScoreSheet::STATUS_SUBMITTED;
                $sheet->submitted_at = now();
            }

            $sheet->save();

            if ($submit) {
                AuditLog::log(
                    action: $stage === ScoringParameter::STAGE_VERIFICATION ? 'SUBMIT_VERIFICATION_SCORE' : 'SUBMIT_JUDGING_SCORE',
                    entityType: 'ScoreSheet',
                    entityId: $sheet->id,
                    after: ['project_id' => $project->id, 'total_weighted' => $sheet->total_weighted],
                    reason: "Submit final nilai {$stage} untuk {$project->registration_code}"
                );

                $this->afterSubmit($project->fresh(), $stage);
            }

            return $sheet;
        });
    }

    /**
     * Total tertimbang satu score sheet.
     */
    public function computeTotal(ScoreSheet $sheet, ?Collection $parameters = null): float
    {
        $parameters ??= ScoringParameter::whereIn('id', $sheet->items->pluck('parameter_id'))->get();
        $weights = $parameters->pluck('weight', 'id');

        $total = $sheet->items->sum(function ($item) use ($weights) {
            return ($item->score ?? 0) * (($weights[$item->parameter_id] ?? 0) / 100);
        });

        return round($total, 2);
    }

    /**
     * Nilai verifikasi = rata-rata total verifikator yang sudah submit (VER-08).
     */
    public function verificationScore(Project $project): ?float
    {
        return $this->averageSubmitted($project, ScoringParameter::STAGE_VERIFICATION);
    }

    /**
     * Nilai juri = rata-rata total juri yang sudah submit.
     */
    public function judgingScore(Project $project): ?float
    {
        return $this->averageSubmitted($project, ScoringParameter::STAGE_JUDGING);
    }

    /**
     * Nilai akhir gabungan dengan bobot event (CFG-08).
     */
    public function finalScore(Project $project, ?float $verification = null, ?float $judging = null): ?float
    {
        $verification ??= $this->verificationScore($project);
        $judging ??= $this->judgingScore($project);

        if ($verification === null && $judging === null) {
            return null;
        }

        $event = $project->stream->event;
        $wv = (float) $event->final_weight_verification;
        $wj = (float) $event->final_weight_judging;

        return round((($verification ?? 0) * $wv / 100) + (($judging ?? 0) * $wj / 100), 2);
    }

    /**
     * Admin membuka kunci score sheet (ADM-04) - wajib alasan.
     */
    public function unlockSheet(ScoreSheet $sheet, User $admin, string $reason): void
    {
        DB::transaction(function () use ($sheet, $admin, $reason) {
            $before = ['status' => $sheet->status, 'total_weighted' => $sheet->total_weighted];

            $sheet->update(['status' => ScoreSheet::STATUS_DRAFT, 'submitted_at' => null]);

            $project = $sheet->project;

            // Nilai juri dibuka kembali -> project kembali ke Finalised
            if ($sheet->stage === ScoringParameter::STAGE_JUDGING && $project->status === Project::STATUS_JUDGING) {
                $project->update(['status' => Project::STATUS_FINALISED]);
            }

            // Nilai verifikasi dibuka sebelum seleksi -> kembali ke Dalam Verifikasi
            if ($sheet->stage === ScoringParameter::STAGE_VERIFICATION
                && $project->status === Project::STATUS_VERIFIED
                && ! $project->scoreSheets()->where('stage', $sheet->stage)->where('status', ScoreSheet::STATUS_SUBMITTED)->exists()) {
                $project->update(['status' => Project::STATUS_IN_VERIFICATION]);
            }

            AuditLog::log(
                action: 'UNLOCK_SCORE_SHEET',
                entityType: 'ScoreSheet',
                entityId: $sheet->id,
                before: $before,
                after: ['status' => ScoreSheet::STATUS_DRAFT],
                reason: $reason,
                userId: $admin->id,
            );
        });
    }

    protected function averageSubmitted(Project $project, string $stage): ?float
    {
        $totals = $project->scoreSheets()
            ->where('stage', $stage)
            ->where('status', ScoreSheet::STATUS_SUBMITTED)
            ->pluck('total_weighted');

        return $totals->isEmpty() ? null : round($totals->avg(), 2);
    }

    /**
     * Transisi status otomatis setelah submit nilai (PRD 3.2).
     */
    protected function afterSubmit(Project $project, string $stage): void
    {
        if ($stage === ScoringParameter::STAGE_VERIFICATION
            && in_array($project->status, [Project::STATUS_SUBMITTED, Project::STATUS_IN_VERIFICATION], true)) {
            $project->update(['status' => Project::STATUS_VERIFIED]);

            $this->notifier->notifyTeam(
                $project,
                'status_changed',
                'Status project berubah: Terverifikasi',
                "Project {$project->registration_code} telah selesai diverifikasi. Hasil seleksi Convention Day akan diumumkan panitia.",
                includeMembers: false,
                email: false,
            );

            return;
        }

        if ($stage === ScoringParameter::STAGE_JUDGING && $project->status === Project::STATUS_FINALISED) {
            $judges = $this->access->assignedJudges($project);
            $submitted = $project->scoreSheets()
                ->where('stage', ScoringParameter::STAGE_JUDGING)
                ->where('status', ScoreSheet::STATUS_SUBMITTED)
                ->pluck('scorer_user_id');

            if ($judges->isNotEmpty() && $judges->pluck('id')->diff($submitted)->isEmpty()) {
                $project->update(['status' => Project::STATUS_JUDGING]);

                $this->notifier->notifyTeam(
                    $project,
                    'status_changed',
                    'Status project berubah: Dinilai Juri',
                    "Seluruh juri telah menilai project {$project->registration_code}. Tunggu pengumuman pemenang dari panitia.",
                    includeMembers: false,
                    email: false,
                );
            }
        }
    }
}
