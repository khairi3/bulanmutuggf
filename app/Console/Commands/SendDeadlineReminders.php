<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\Phase;
use App\Models\Project;
use App\Models\ScoreSheet;
use Carbon\Carbon;
use Illuminate\Console\Command;

/**
 * Pengingat Deadline Otomatis H-3 dan H-1 (NOT-04, NOT-06).
 */
class SendDeadlineReminders extends Command
{
    protected $signature = 'bmg:send-deadline-reminders';

    protected $description = 'Kirim notifikasi pengingat batas waktu (H-3 dan H-1) kepada peserta dan evaluator';

    public function handle(): int
    {
        $this->info('Memeriksa jadwal deadline fase BMG...');

        $activePhases = Phase::with('stream')->whereNotNull('end_at')->get();
        $totalReminders = 0;

        foreach ($activePhases as $phase) {
            $endDate = Carbon::parse($phase->end_at)->startOfDay();
            $now = Carbon::now()->startOfDay();
            $diffInDays = $now->diffInDays($endDate, false);

            // Periksa apakah hari ini H-3 atau H-1
            if (! in_array($diffInDays, [1, 3], true)) {
                continue;
            }

            $hLabel = "H-{$diffInDays}";
            $this->info("Menemukan fase {$phase->phase_type} ({$phase->stream?->name}) pada {$hLabel} (Deadline: {$phase->end_at->format('d M Y')})");

            if ($phase->phase_type === 'registration') {
                $totalReminders += $this->remindDraftParticipants($phase, $hLabel);
            } elseif ($phase->phase_type === 'finalisation') {
                $totalReminders += $this->remindQualifiedParticipants($phase, $hLabel);
            } elseif (in_array($phase->phase_type, ['verification', 'judging'], true)) {
                $totalReminders += $this->remindEvaluators($phase, $hLabel);
            }
        }

        $this->info("Selesai. Total {$totalReminders} notifikasi pengingat berhasil dikirimkan.");

        return Command::SUCCESS;
    }

    protected function remindDraftParticipants(Phase $phase, string $hLabel): int
    {
        $draftProjects = Project::where('stream_id', $phase->stream_id)
            ->where('status', Project::STATUS_DRAFT)
            ->with(['leader.user'])
            ->get();

        $count = 0;
        foreach ($draftProjects as $project) {
            $user = $project->leader?->user;
            if ($user) {
                Notification::send(
                    userId: $user->id,
                    type: 'deadline_reminder',
                    title: "Pengingat {$hLabel}: Batas Akhir Pendaftaran BMG",
                    message: "Project {$project->title} masih berstatus Draf. Mohon selesaikan dan submit sebelum {$phase->end_at->format('d M Y H:i')} WIB.",
                    link: "/participant/projects/{$project->id}"
                );
                $count++;
            }
        }

        return $count;
    }

    protected function remindQualifiedParticipants(Phase $phase, string $hLabel): int
    {
        $qualifiedProjects = Project::where('stream_id', $phase->stream_id)
            ->where('status', Project::STATUS_QUALIFIED)
            ->with(['leader.user'])
            ->get();

        $count = 0;
        foreach ($qualifiedProjects as $project) {
            $user = $project->leader?->user;
            if ($user) {
                Notification::send(
                    userId: $user->id,
                    type: 'deadline_reminder',
                    title: "Pengingat {$hLabel}: Finalisasi Materi Convention Day",
                    message: "Project {$project->registration_code} belum difinalisasi. Unggah materi presentasi final (PDF) dan lakukan Finalise Project sebelum batas waktu.",
                    link: "/participant/projects/{$project->id}?tab=convention"
                );
                $count++;
            }
        }

        return $count;
    }

    protected function remindEvaluators(Phase $phase, string $hLabel): int
    {
        $stage = $phase->phase_type === 'verification' ? 'verification' : 'judging';
        $roleName = $stage === 'verification' ? 'Verifikator' : 'Juri';

        $draftSheets = ScoreSheet::where('stage', $stage)
            ->where('status', 'draft')
            ->whereHas('project', fn ($q) => $q->where('stream_id', $phase->stream_id))
            ->with(['scorer', 'project'])
            ->get();

        $count = 0;
        foreach ($draftSheets as $sheet) {
            if ($sheet->scorer) {
                Notification::send(
                    userId: $sheet->scorer->id,
                    type: 'deadline_reminder',
                    title: "Pengingat {$hLabel}: Batas Penilaian {$roleName}",
                    message: "Nilai untuk project {$sheet->project?->registration_code} masih berupa draf. Mohon submit penilaian final sebelum deadline.",
                    link: "/{$stage}/projects/{$sheet->project_id}"
                );
                $count++;
            }
        }

        return $count;
    }
}
