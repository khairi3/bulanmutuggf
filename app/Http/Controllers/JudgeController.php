<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ScoringParameter;
use App\Models\Stream;
use App\Services\ProjectAccessService;
use App\Services\ScoringService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JudgeController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        protected ProjectAccessService $access,
        protected ScoringService $scoringService,
    ) {}

    /**
     * Dashboard Juri Convention Day (JUR-01, JUR-02).
     */
    public function dashboard(Request $request): Response
    {
        $user = $request->user();

        // Scoped projects: qualified/finalised/judging projects in assigned stream, conflict-blocked
        $query = $this->access->judgeQuery($user)
            ->with([
                'stream.categoryDimensions.options',
                'categories.dimension',
                'leader',
                'files',
                'scoreSheets' => fn ($q) => $q->where('scorer_user_id', $user->id)->where('stage', ScoringParameter::STAGE_JUDGING),
            ]);

        $projects = $query->get();

        // Calculate progress stats for this judge
        $totalProjects = $projects->count();
        $evaluatedCount = $projects->filter(function ($p) {
            $sheet = $p->scoreSheets->first();

            return $sheet && $sheet->status === 'submitted';
        })->count();
        $draftCount = $projects->filter(function ($p) {
            $sheet = $p->scoreSheets->first();

            return $sheet && $sheet->status === 'draft';
        })->count();
        $unratedCount = $totalProjects - $evaluatedCount - $draftCount;

        // Group projects by ranking option (Category)
        $grouped = $projects->groupBy(function (Project $p) {
            $dim = $p->stream->rankingDimension();
            $option = $dim ? $p->categories->firstWhere('dimension_id', $dim->id) : null;

            return $option ? $option->name : ($p->stream->name ?? 'Umum');
        })->map(function ($groupProjects, $categoryName) {
            return [
                'category_name' => $categoryName,
                'total' => $groupProjects->count(),
                'evaluated' => $groupProjects->filter(fn ($p) => $p->scoreSheets->first()?->status === 'submitted')->count(),
                'projects' => $groupProjects->map(function (Project $p) {
                    $sheet = $p->scoreSheets->first();

                    return [
                        'id' => $p->id,
                        'registration_code' => $p->registration_code,
                        'title' => $p->title,
                        'status' => $p->status,
                        'stream_name' => $p->stream?->name,
                        'leader_name' => $p->leader?->full_name,
                        'unit' => $p->leader?->unit,
                        'my_score_status' => $sheet?->status ?? 'none',
                        'my_score' => $sheet?->total_weighted,
                        'finalised_at' => $p->finalised_at?->format('d M Y H:i'),
                        'has_presentation' => $p->files->where('file_category', 'final_presentation')->isNotEmpty(),
                        'has_video' => $p->files->where('file_category', 'final_video')->isNotEmpty() || (bool) $p->video_url,
                    ];
                })->values(),
            ];
        })->values();

        return Inertia::render('Judge/Dashboard', [
            'stats' => [
                'total' => $totalProjects,
                'evaluated' => $evaluatedCount,
                'draft' => $draftCount,
                'unrated' => $unratedCount,
            ],
            'categories' => $grouped,
        ]);
    }

    /**
     * Layar Penilaian Split-Screen Juri (JUR-03, JUR-04, JUR-05).
     */
    public function show(Request $request, Project $project): Response
    {
        $user = $request->user();

        if (! $this->access->canJudge($user, $project)) {
            abort(403, 'Akses penilaian ditolak. Anda tidak di-assign untuk project ini atau terdapat konflik kepentingan.');
        }

        $project->load([
            'stream.scoringParameters' => fn ($q) => $q->where('stage', ScoringParameter::STAGE_JUDGING)->orderBy('sort_order'),
            'categories.dimension',
            'leader',
            'teamMembers.employee',
            'currentVersion',
            'files',
        ]);

        // Materials for presentation & video
        $presentationFile = $project->files->firstWhere('file_category', 'final_presentation');
        if (! $presentationFile) {
            $presentationFile = $project->files->first(function ($f) {
                $ext = strtolower(pathinfo($f->original_name, PATHINFO_EXTENSION));

                return in_array($ext, ['pdf', 'pptx', 'ppt', 'ppsx', 'odp']);
            });
        }

        $videoFile = $project->files->firstWhere('file_category', 'final_video');
        if (! $videoFile) {
            $videoFile = $project->files->first(function ($f) {
                $ext = strtolower(pathinfo($f->original_name, PATHINFO_EXTENSION));

                return in_array($ext, ['mp4', 'mov', 'webm', 'm4v']) || $f->external_url;
            });
        }

        // Dynamic scoring parameters for judging stage
        $scoringParameters = $project->stream->stageParameters(ScoringParameter::STAGE_JUDGING);

        // Judge's own score sheet (blind scoring: JUR-07)
        $scoreSheet = $this->scoringService->sheetFor($project, $user, ScoringParameter::STAGE_JUDGING);
        $scoreSheet->load(['items.parameter']);

        // Find next and previous project in the judge's list for rapid navigation (JUR-06)
        $allJudgeProjectIds = $this->access->judgeQuery($user)->pluck('id')->all();
        $currentIndex = array_search($project->id, $allJudgeProjectIds);
        $prevProjectId = ($currentIndex !== false && $currentIndex > 0) ? $allJudgeProjectIds[$currentIndex - 1] : null;
        $nextProjectId = ($currentIndex !== false && $currentIndex < count($allJudgeProjectIds) - 1) ? $allJudgeProjectIds[$currentIndex + 1] : null;

        return Inertia::render('Judge/Projects/Show', [
            'project' => $project,
            'presentationFile' => $presentationFile,
            'videoFile' => $videoFile,
            'scoringParameters' => $scoringParameters,
            'myScoreSheet' => $scoreSheet,
            'prevProjectId' => $prevProjectId,
            'nextProjectId' => $nextProjectId,
        ]);
    }

    /**
     * Simpan Draf atau Submit Final Nilai Juri (JUR-05, JUR-06).
     */
    public function saveScore(Request $request, Project $project): RedirectResponse
    {
        $user = $request->user();

        if (! $this->access->canJudge($user, $project)) {
            abort(403, 'Akses penilaian ditolak.');
        }

        $isSubmit = (bool) $request->input('submit', false);
        $items = (array) $request->input('scores', []);

        $this->scoringService->saveSheet(
            project: $project,
            scorer: $user,
            stage: ScoringParameter::STAGE_JUDGING,
            items: $items,
            submit: $isSubmit
        );

        $msg = $isSubmit
            ? 'Penilaian juri berhasil disubmit dan nilai telah dikunci.'
            : 'Draf nilai juri berhasil disimpan.';

        return back()->with('success', $msg);
    }
}
