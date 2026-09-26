<?php

namespace App\Services;

use App\Models\Feedback;
use App\Models\Phase;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\ScoreSheet;
use App\Models\ScoringParameter;
use App\Models\User;

/**
 * Serialisasi detail project yang konsisten untuk semua role.
 * Data sensitif (nilai, feedback draft) hanya disertakan sesuai konteks.
 */
class ProjectPresenter
{
    public function __construct(
        protected ScoringService $scoring,
        protected ProjectWorkflowService $workflow,
    ) {}

    public function summary(Project $project): array
    {
        return [
            'id' => $project->id,
            'registration_code' => $project->registration_code,
            'title' => $project->title,
            'status' => $project->status,
            'status_label' => $project->status_label,
            'is_locked' => $project->is_locked,
            'stream' => $project->stream?->only(['id', 'code', 'name']),
            'category_label' => $project->categoryLabel(),
            'categories' => $project->categories->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'abbreviation' => $c->abbreviation,
                'dimension_id' => $c->dimension_id,
                'dimension' => $c->dimension?->name,
            ])->values(),
            'leader' => $project->leader?->only(['id', 'employee_index', 'full_name', 'employee_level', 'unit']),
            'submitted_at' => $project->submitted_at,
            'finalised_at' => $project->finalised_at,
            'updated_at' => $project->updated_at,
            'version_no' => $project->currentVersion?->version_no,
        ];
    }

    /**
     * Detail lengkap. $context: participant | verifier | judge | admin | viewer.
     */
    public function detail(Project $project, User $user, string $context): array
    {
        $project->loadMissing([
            'stream.event',
            'stream.phases',
            'leader',
            'categories.dimension',
            'currentVersion.creator.employee',
            'versions.creator.employee',
            'teamMembers.employee',
            'files.uploader.employee',
        ]);

        $files = $project->files
            ->reject(fn ($f) => $context === 'participant' && $f->file_category === ProjectFile::CATEGORY_VISIT_PHOTO)
            ->map(fn (ProjectFile $f) => $this->file($project, $f))
            ->values();

        $data = $this->summary($project) + [
            'code_history' => $project->code_history ?? [],
            'current_version' => $project->currentVersion,
            'versions' => $project->versions->map(fn ($v) => [
                'id' => $v->id,
                'version_no' => $v->version_no,
                'title' => $v->title,
                'executive_summary' => $v->executive_summary,
                'problem_statement' => $v->problem_statement,
                'goal_statement' => $v->goal_statement,
                'milestones' => $v->milestones,
                'initiatives' => $v->initiatives,
                'results' => $v->results,
                'change_note' => $v->change_note,
                'created_at' => $v->created_at,
                'creator' => $v->creator?->employee?->full_name,
            ])->values(),
            'team_members' => $project->teamMembers->map(fn ($tm) => [
                'id' => $tm->id,
                'member_role' => $tm->member_role,
                'can_edit' => $tm->can_edit,
                'employee' => $tm->employee?->only(['id', 'employee_index', 'full_name', 'employee_level', 'position', 'unit']),
            ])->sortByDesc(fn ($tm) => $tm['member_role'] === 'leader')->values(),
            'files' => $files,
            'can_edit' => $project->canEdit($user),
            'next_deadline' => $this->nextDeadline($project),
        ];

        if (in_array($context, ['participant', 'verifier', 'admin'], true)) {
            $data['feedbacks'] = $this->feedbacks($project, $user, $context);
        }

        if (in_array($context, ['verifier', 'admin'], true)) {
            $data['visits'] = $project->visits()->with(['verifier.employee', 'photos'])->get()->map(fn ($v) => [
                'id' => $v->id,
                'visit_date' => $v->visit_date?->format('Y-m-d'),
                'location' => $v->location,
                'notes' => $v->notes,
                'verifier' => $v->verifier?->employee?->full_name,
                'photos' => $v->photos->map(fn ($f) => $this->file($project, $f))->values(),
            ])->values();
        }

        if ($context === 'participant') {
            $data['finalise_checklist'] = $project->status === Project::STATUS_QUALIFIED
                ? $this->workflow->finaliseChecklist($project)
                : [];
            $data['result'] = $this->participantResult($project);
        }

        if ($context === 'admin') {
            $data['verification_score'] = $this->scoring->verificationScore($project);
            $data['judging_score'] = $this->scoring->judgingScore($project);
            $data['final_score'] = $this->scoring->finalScore($project);
            $data['score_sheets'] = $project->scoreSheets()->with(['scorer.employee', 'items.parameter'])->get()->map(fn (ScoreSheet $s) => [
                'id' => $s->id,
                'stage' => $s->stage,
                'status' => $s->status,
                'total_weighted' => $s->total_weighted,
                'submitted_at' => $s->submitted_at,
                'scorer' => $s->scorer?->employee?->full_name,
                'items' => $s->items->map(fn ($i) => ['parameter' => $i->parameter?->name, 'weight' => $i->parameter?->weight, 'score' => $i->score, 'note' => $i->note])->values(),
            ])->values();
            $data['selection_decision'] = $project->selectionDecision;
        }

        return $data;
    }

    public function file(Project $project, ProjectFile $file): array
    {
        return [
            'id' => $file->id,
            'file_category' => $file->file_category,
            'original_name' => $file->original_name,
            'mime_type' => $file->mime_type,
            'size_bytes' => $file->size_bytes,
            'formatted_size' => $file->formatted_size,
            'external_url' => $file->external_url,
            'charter_version_id' => $file->charter_version_id,
            'uploader' => $file->uploader?->employee?->full_name,
            'created_at' => $file->created_at,
            'url' => "/projects/{$project->id}/files/{$file->id}",
            'preview_url' => $file->external_url ? null : "/projects/{$project->id}/files/{$file->id}?inline=1",
        ];
    }

    /**
     * Parameter penilaian + sheet milik penilai sendiri (blind scoring JUR-07).
     */
    public function scoreForm(Project $project, User $scorer, string $stage): array
    {
        $parameters = $project->stream->scoringParameters()->where('stage', $stage)->get();
        $sheet = ScoreSheet::with('items')
            ->where('project_id', $project->id)
            ->where('scorer_user_id', $scorer->id)
            ->where('stage', $stage)
            ->first();

        return [
            'parameters' => $parameters->map(fn (ScoringParameter $p) => $p->only(['id', 'name', 'rubric', 'weight', 'sort_order']))->values(),
            'sheet' => $sheet ? [
                'id' => $sheet->id,
                'status' => $sheet->status,
                'total_weighted' => $sheet->total_weighted,
                'submitted_at' => $sheet->submitted_at,
                'updated_at' => $sheet->updated_at,
                'items' => $sheet->items->mapWithKeys(fn ($i) => [$i->parameter_id => ['score' => $i->score, 'note' => $i->note]]),
            ] : null,
        ];
    }

    protected function feedbacks(Project $project, User $user, string $context)
    {
        $query = $project->feedbacks()
            ->whereNull('parent_id')
            ->with(['author.employee', 'author.roles', 'replies.author.employee', 'replies.author.roles'])
            ->latest();

        // Peserta hanya melihat feedback terkirim; verifikator melihat draft miliknya
        if ($context === 'participant') {
            $query->where('status', Feedback::STATUS_SENT);
        } elseif ($context === 'verifier') {
            $query->where(fn ($q) => $q->where('status', Feedback::STATUS_SENT)->orWhere('author_user_id', $user->id));
        }

        return $query->get()->map(fn (Feedback $f) => [
            'id' => $f->id,
            'charter_section' => $f->charter_section,
            'charter_section_label' => Feedback::SECTIONS[$f->charter_section] ?? null,
            'body' => $f->body,
            'status' => $f->status,
            'is_resolved' => $f->is_resolved,
            'sent_at' => $f->sent_at,
            'read_at' => $f->read_at,
            'created_at' => $f->created_at,
            'author' => $f->author?->employee?->full_name,
            'is_mine' => $f->author_user_id === $user->id,
            'replies' => $f->replies->map(fn (Feedback $r) => [
                'id' => $r->id,
                'body' => $r->body,
                'created_at' => $r->created_at,
                'author' => $r->author?->employee?->full_name,
                'author_is_verifier' => (bool) $r->author?->roles->contains('code', 'verifier') && ! $project->isMember($r->author?->employee_id ?? 0),
                'is_mine' => $r->author_user_id === $user->id,
            ])->values(),
        ])->values();
    }

    /**
     * Hasil untuk peserta hanya tampil setelah diumumkan (matriks 2.2).
     */
    protected function participantResult(Project $project): ?array
    {
        if (! $project->stream->isResultsPublished()) {
            return null;
        }

        $result = $project->finalResult;
        if (! $result || ! $result->published_at) {
            return null;
        }

        return [
            'rank' => $result->rank_in_category,
            'category' => $result->rankingOption?->name,
            'final_score' => $result->final_score,
            'verification_score' => $result->verification_score,
            'judging_score' => $result->judging_score,
        ];
    }

    /**
     * Deadline fase berikutnya yang relevan bagi status project (PAR-07, prinsip desain 2).
     */
    public function nextDeadline(Project $project): ?array
    {
        $phaseType = match ($project->status) {
            Project::STATUS_DRAFT => Phase::REGISTRATION,
            Project::STATUS_SUBMITTED, Project::STATUS_IN_VERIFICATION => Phase::VERIFICATION,
            Project::STATUS_VERIFIED => Phase::SELECTION,
            Project::STATUS_QUALIFIED => Phase::FINALISATION,
            Project::STATUS_FINALISED, Project::STATUS_JUDGING => Phase::JUDGING,
            default => null,
        };

        if (! $phaseType) {
            return null;
        }

        $phase = $project->stream?->phase($phaseType);
        if (! $phase?->end_at) {
            return null;
        }

        $labels = [
            Phase::REGISTRATION => 'Tutup registrasi',
            Phase::VERIFICATION => 'Akhir fase verifikasi',
            Phase::SELECTION => 'Pengumuman seleksi',
            Phase::FINALISATION => 'Deadline Finalise Project',
            Phase::JUDGING => 'Convention Day',
        ];

        return [
            'label' => $labels[$phaseType],
            'phase_type' => $phaseType,
            'date' => $phase->end_at,
            'days_left' => (int) now()->startOfDay()->diffInDays($phase->end_at->copy()->startOfDay(), false),
        ];
    }
}
