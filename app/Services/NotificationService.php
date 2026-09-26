<?php

namespace App\Services;

use App\Mail\BmgNotificationMail;
use App\Models\Notification;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Notifikasi in-app + email (PRD 4.8, NOT-01 s.d. NOT-07).
 */
class NotificationService
{
    /**
     * @param  iterable<User>  $users
     */
    public function notifyUsers(
        iterable $users,
        string $type,
        string $title,
        string $message,
        ?string $link = null,
        bool $inApp = true,
        bool $email = true,
    ): void {
        foreach ($users as $user) {
            if ($inApp) {
                Notification::send($user->id, $type, $title, $message, $link);
            }

            if ($email) {
                $this->sendEmail($user, $title, $message, $link);
            }
        }
    }

    /**
     * Kirim ke ketua (+ anggota bila $includeMembers) sebuah project.
     */
    public function notifyTeam(
        Project $project,
        string $type,
        string $title,
        string $message,
        bool $includeMembers = true,
        bool $inApp = true,
        bool $email = true,
    ): void {
        $employeeIds = $includeMembers
            ? $project->teamMembers()->pluck('employee_id')->push($project->leader_employee_id)->unique()
            : collect([$project->leader_employee_id]);

        $users = User::with('employee')->whereIn('employee_id', $employeeIds)->get();

        $this->notifyUsers($users, $type, $title, $message, "/participant/projects/{$project->id}", $inApp, $email);
    }

    protected function sendEmail(User $user, string $title, string $message, ?string $link): void
    {
        $user->loadMissing('employee');
        $address = $user->employee?->email;

        // Karyawan tanpa email tetap mendapat notifikasi in-app (Asumsi A4)
        if (! $address) {
            return;
        }

        try {
            Mail::to($address)->queue(new BmgNotificationMail(
                recipientName: $user->employee->full_name,
                heading: $title,
                body: $message,
                actionUrl: $link ? url($link) : url('/'),
            ));
        } catch (\Throwable $e) {
            Log::warning('Gagal mengantrekan email notifikasi BMG', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }
    }
}
