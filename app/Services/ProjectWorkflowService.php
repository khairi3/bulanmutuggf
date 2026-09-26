<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Transisi status project yang tidak berasal dari penilaian (PRD 3.2).
 */
class ProjectWorkflowService
{
    public function __construct(
        protected NotificationService $notifier,
        protected RegistrationCodeService $codeService,
    ) {}

    /**
     * Submitted -> Dalam Verifikasi saat verifikator membuka/mulai menilai (Task 4.9).
     */
    public function markInVerification(Project $project): void
    {
        if ($project->status !== Project::STATUS_SUBMITTED) {
            return;
        }

        $project->update(['status' => Project::STATUS_IN_VERIFICATION]);

        $this->notifier->notifyTeam(
            $project,
            'status_changed',
            'Status project berubah: Dalam Verifikasi',
            "Project {$project->registration_code} sedang direview oleh tim verifikator. Pantau tab Feedback untuk catatan perbaikan.",
            includeMembers: false,
            email: false,
        );
    }

    /**
     * Checklist kelengkapan sebelum Finalise (PAR-11).
     *
     * @return array<int, array{key: string, label: string, done: bool}>
     */
    public function finaliseChecklist(Project $project): array
    {
        $version = $project->currentVersion;
        $results = collect($version?->results ?? [])->filter(fn ($r) => ! empty($r['metric_name'] ?? null));

        $hasPresentation = $project->files()
            ->where('file_category', ProjectFile::CATEGORY_FINAL_PRESENTATION)
            ->where('mime_type', 'application/pdf')
            ->exists();

        $hasVideo = $project->files()->where('file_category', ProjectFile::CATEGORY_FINAL_VIDEO)->exists();

        return [
            ['key' => 'charter', 'label' => 'Project Charter lengkap (judul, summary, problem, goal)', 'done' => (bool) ($version?->title && $version?->executive_summary && $version?->problem_statement && $version?->goal_statement)],
            ['key' => 'results', 'label' => 'Tabel Results terisi minimal 1 metrik (wajib saat Finalise)', 'done' => $results->isNotEmpty()],
            ['key' => 'presentation', 'label' => 'Final Presentation (PDF) sudah diunggah', 'done' => $hasPresentation],
            ['key' => 'video', 'label' => 'Final Video (file atau link) - opsional', 'done' => $hasVideo, 'optional' => true],
        ];
    }

    /**
     * Lolos Convention -> Finalised (PAR-11). Irreversible kecuali dibuka Admin.
     */
    public function finalise(Project $project, ?User $actor, bool $auto = false): void
    {
        if ($project->status !== Project::STATUS_QUALIFIED) {
            throw ValidationException::withMessages([
                'finalise' => 'Hanya project berstatus Lolos Convention yang dapat di-Finalise.',
            ]);
        }

        if (! $auto) {
            $missing = collect($this->finaliseChecklist($project))
                ->reject(fn ($item) => $item['done'] || ($item['optional'] ?? false));

            if ($missing->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'finalise' => 'Belum lengkap: '.$missing->pluck('label')->implode('; '),
                ]);
            }
        }

        DB::transaction(function () use ($project, $actor, $auto) {
            $project->update([
                'status' => Project::STATUS_FINALISED,
                'is_locked' => true,
                'finalised_at' => now(),
            ]);

            AuditLog::log(
                action: $auto ? 'AUTO_FINALISE_PROJECT' : 'FINALISE_PROJECT',
                entityType: 'Project',
                entityId: $project->id,
                before: ['status' => Project::STATUS_QUALIFIED],
                after: ['status' => Project::STATUS_FINALISED],
                reason: $auto
                    ? "Finalise otomatis saat deadline dengan versi terakhir v{$project->currentVersion?->version_no}"
                    : "Peserta melakukan Finalise Project {$project->registration_code}",
                userId: $actor?->id,
            );
        });

        $this->notifier->notifyTeam(
            $project,
            'project_finalised',
            $auto ? 'Project di-Finalise otomatis' : 'Project berhasil di-Finalise',
            $auto
                ? "Deadline finalisasi telah lewat. Project {$project->registration_code} otomatis di-Finalise menggunakan versi terakhir dan siap dinilai juri."
                : "Project {$project->registration_code} telah dikunci dan siap dinilai juri pada Convention Day.",
            email: $auto,
        );
    }

    /**
     * Admin membuka kunci project Finalised -> Lolos Convention (ADM-04).
     */
    public function unlock(Project $project, User $admin, string $reason): void
    {
        $before = ['status' => $project->status, 'is_locked' => $project->is_locked];

        DB::transaction(function () use ($project, $admin, $reason, $before) {
            $newStatus = in_array($project->status, Project::CONVENTION_STATUSES, true)
                ? Project::STATUS_QUALIFIED
                : $project->status;

            $project->update([
                'status' => $newStatus,
                'is_locked' => false,
                'finalised_at' => null,
            ]);

            AuditLog::log(
                action: 'UNLOCK_PROJECT',
                entityType: 'Project',
                entityId: $project->id,
                before: $before,
                after: ['status' => $newStatus, 'is_locked' => false],
                reason: $reason,
                userId: $admin->id,
            );
        });

        $this->notifier->notifyTeam(
            $project,
            'status_changed',
            'Kunci project dibuka Admin',
            "Panitia membuka kunci project {$project->registration_code}. Alasan: {$reason}. Silakan perbarui lalu Finalise kembali.",
            includeMembers: false,
        );
    }

    /**
     * Admin mengubah kategori setelah Submit: kode baru terbit, kode lama disimpan (PRD 3.3).
     */
    public function changeCategories(Project $project, array $optionIds, User $admin, string $reason): string
    {
        return DB::transaction(function () use ($project, $optionIds, $admin, $reason) {
            $oldCode = $project->registration_code;
            $oldCategories = $project->categories()->pluck('category_options.id')->all();

            $project->categories()->sync($optionIds);

            $newPrefix = $this->codeService->determinePrefix($project->stream, $optionIds);
            $oldPrefix = $oldCode ? preg_replace('/-\d+$/', '', $oldCode) : null;

            $newCode = $oldCode;
            if ($oldCode && $newPrefix !== $oldPrefix) {
                $newCode = $this->codeService->generateCode($project->stream, $optionIds);
                $history = $project->code_history ?? [];
                $history[] = ['code' => $oldCode, 'replaced_at' => now()->toDateTimeString(), 'reason' => $reason];
                $project->update(['registration_code' => $newCode, 'code_history' => $history]);
            }

            AuditLog::log(
                action: 'CHANGE_PROJECT_CATEGORY',
                entityType: 'Project',
                entityId: $project->id,
                before: ['registration_code' => $oldCode, 'category_option_ids' => $oldCategories],
                after: ['registration_code' => $newCode, 'category_option_ids' => $optionIds],
                reason: $reason,
                userId: $admin->id,
            );

            return $newCode;
        });
    }
}
