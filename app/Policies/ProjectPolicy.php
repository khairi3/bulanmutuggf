<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\Role;
use App\Models\User;
use App\Services\ProjectAccessService;

class ProjectPolicy
{
    public function __construct(
        protected ProjectAccessService $access
    ) {}

    /**
     * Lihat detail project: admin, anggota tim, verifikator/juri yang di-assign
     * (row-level security PRD 2.3 - dicek di server, bukan hanya di UI).
     */
    public function view(User $user, Project $project): bool
    {
        if ($user->hasRole(Role::ADMIN)) {
            return true;
        }

        if ($user->employee_id && $project->isMember($user->employee_id)) {
            return true;
        }

        return $this->access->canVerify($user, $project) || $this->access->canJudge($user, $project);
    }

    public function update(User $user, Project $project): bool
    {
        return $project->canEdit($user);
    }

    /**
     * Finalise hanya oleh ketua tim (atau anggota yang diberi hak edit), sekali.
     */
    public function finalise(User $user, Project $project): bool
    {
        if ($project->status !== Project::STATUS_QUALIFIED || $project->is_locked) {
            return false;
        }

        return $project->canEdit($user);
    }

    public function verify(User $user, Project $project): bool
    {
        return $this->access->canVerify($user, $project);
    }

    public function judge(User $user, Project $project): bool
    {
        return $this->access->canJudge($user, $project);
    }

    /**
     * Hak akses diskusi feedback catatan verifikator (PAR-08, PAR-09).
     * Terbuka untuk admin, semua anggota tim peserta, dan verifikator yang ditugaskan.
     */
    public function feedback(User $user, Project $project): bool
    {
        if ($user->hasRole(Role::ADMIN)) {
            return true;
        }

        if ($user->employee_id && $project->isMember($user->employee_id)) {
            return true;
        }

        return $this->access->canVerify($user, $project);
    }

    /**
     * Unduh berkas: foto visit hanya untuk verifikator & admin.
     */
    public function downloadFile(User $user, Project $project, ProjectFile $file): bool
    {
        if ($file->project_id !== $project->id) {
            return false;
        }

        if ($file->file_category === ProjectFile::CATEGORY_VISIT_PHOTO) {
            return $user->hasRole(Role::ADMIN) || $this->access->canVerify($user, $project);
        }

        return $this->view($user, $project);
    }
}
