<?php

namespace App\Services;

use App\Models\Assignment;
use App\Models\Project;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Row-level security project (PRD 2.3): setiap query project untuk verifikator
 * dan juri difilter berdasarkan assignment stream/kategori + konflik kepentingan.
 */
class ProjectAccessService
{
    /** Status yang terlihat oleh juri (setelah seleksi dipublish). */
    public const JUDGE_VISIBLE_STATUSES = [
        Project::STATUS_QUALIFIED,
        Project::STATUS_FINALISED,
        Project::STATUS_JUDGING,
        Project::STATUS_ANNOUNCED,
    ];

    public function assignmentsFor(User $user, string $stage): Collection
    {
        return $user->assignments()->where('stage', $stage)->get();
    }

    /**
     * Query project yang boleh dilihat verifikator (VER-01).
     */
    public function verifierQuery(User $user): Builder
    {
        return $this->scopedQuery($user, 'verification')
            ->where('status', '!=', Project::STATUS_DRAFT);
    }

    /**
     * Query project yang boleh dilihat juri (VER-10, JUR-08): hanya yang lolos.
     */
    public function judgeQuery(User $user): Builder
    {
        return $this->scopedQuery($user, 'judging')
            ->whereIn('status', self::JUDGE_VISIBLE_STATUSES)
            ->whereHas('stream', fn ($q) => $q->whereNotNull('selection_published_at'));
    }

    public function canVerify(User $user, Project $project): bool
    {
        return $user->hasRole(Role::VERIFIER)
            && $this->verifierQuery($user)->whereKey($project->id)->exists();
    }

    public function canJudge(User $user, Project $project): bool
    {
        return $user->hasRole(Role::JUDGE)
            && $this->judgeQuery($user)->whereKey($project->id)->exists();
    }

    /**
     * Konflik kepentingan: penilai anggota tim (atau opsional satu unit kerja).
     */
    public function hasConflict(User $user, Project $project): bool
    {
        $employee = $user->employee;
        if (! $employee) {
            return false;
        }

        if ($project->isMember($employee->id)) {
            return true;
        }

        if (config('bmg.block_same_unit') && $employee->unit) {
            return $project->leader?->unit === $employee->unit;
        }

        return false;
    }

    /**
     * Daftar juri yang di-assign ke sebuah project (tanpa yang konflik).
     */
    public function assignedJudges(Project $project): Collection
    {
        $categoryIds = $project->categories()->pluck('category_options.id');

        $userIds = Assignment::where('stage', 'judging')
            ->where('stream_id', $project->stream_id)
            ->where(fn ($q) => $q->whereNull('category_option_id')->orWhereIn('category_option_id', $categoryIds))
            ->pluck('user_id')
            ->unique();

        return User::with('employee')
            ->whereIn('id', $userIds)
            ->whereHas('roles', fn ($q) => $q->where('code', Role::JUDGE))
            ->get()
            ->reject(fn (User $judge) => $this->hasConflict($judge, $project))
            ->values();
    }

    /**
     * Daftar verifikator yang di-assign ke stream/kategori project.
     */
    public function assignedVerifiers(Project $project): Collection
    {
        $categoryIds = $project->categories()->pluck('category_options.id');

        $userIds = Assignment::where('stage', 'verification')
            ->where('stream_id', $project->stream_id)
            ->where(fn ($q) => $q->whereNull('category_option_id')->orWhereIn('category_option_id', $categoryIds))
            ->pluck('user_id')
            ->unique();

        return User::with('employee')
            ->whereIn('id', $userIds)
            ->whereHas('roles', fn ($q) => $q->where('code', Role::VERIFIER))
            ->get()
            ->reject(fn (User $verifier) => $this->hasConflict($verifier, $project))
            ->values();
    }

    protected function scopedQuery(User $user, string $stage): Builder
    {
        $assignments = $this->assignmentsFor($user, $stage);

        $query = Project::query();

        if ($assignments->isEmpty()) {
            return $query->whereRaw('1 = 0');
        }

        $query->where(function (Builder $q) use ($assignments) {
            foreach ($assignments->groupBy('stream_id') as $streamId => $streamAssignments) {
                $q->orWhere(function (Builder $sq) use ($streamId, $streamAssignments) {
                    $sq->where('stream_id', $streamId);

                    // Assignment tanpa kategori = seluruh stream
                    if ($streamAssignments->contains(fn ($a) => $a->category_option_id === null)) {
                        return;
                    }

                    $optionIds = $streamAssignments->pluck('category_option_id')->all();
                    $sq->whereHas('categories', fn ($cq) => $cq->whereIn('category_options.id', $optionIds));
                });
            }
        });

        // Konflik kepentingan: sembunyikan project tim sendiri (JUR-08)
        if ($employee = $user->employee) {
            $query->where('leader_employee_id', '!=', $employee->id)
                ->whereDoesntHave('teamMembers', fn ($tm) => $tm->where('employee_id', $employee->id));

            if (config('bmg.block_same_unit') && $employee->unit) {
                $query->whereHas('leader', fn ($lq) => $lq->where('unit', '!=', $employee->unit)->orWhereNull('unit'));
            }
        }

        return $query;
    }
}
