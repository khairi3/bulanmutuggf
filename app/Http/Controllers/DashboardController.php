<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\FinalResult;
use App\Models\Project;
use App\Models\Stream;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function admin(): Response
    {
        $stats = [
            'total_employees' => Employee::count(),
            'total_users' => User::count(),
            'active_employees' => Employee::where('is_active', true)->count(),
            'recent_audits' => AuditLog::with('user.employee')
                ->latest('created_at')
                ->limit(10)
                ->get(),
        ];

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
        ]);
    }

    public function participant(): Response
    {
        return Inertia::render('Participant/Dashboard', [
            'projects' => [], // Populated in Phase 3
        ]);
    }

    public function verifier(): Response
    {
        return Inertia::render('Verifier/Dashboard', [
            'assignedProjects' => [], // Populated in Phase 4
        ]);
    }

    public function judge(): Response
    {
        return Inertia::render('Judge/Dashboard', [
            'projects' => [], // Populated in Phase 5
        ]);
    }

    public function viewer(): Response
    {
        $totalProjects = Project::count();

        $stats = [
            'total_projects' => $totalProjects,
            'total_participants' => DB::table('team_members')->distinct('employee_id')->count('employee_id'),
            'submitted' => Project::whereIn('status', [Project::STATUS_SUBMITTED, Project::STATUS_IN_VERIFICATION])->count(),
            'verified' => Project::where('status', Project::STATUS_VERIFIED)->count(),
            'qualified' => Project::whereIn('status', [Project::STATUS_QUALIFIED, Project::STATUS_FINALISED, Project::STATUS_JUDGING, Project::STATUS_ANNOUNCED])->count(),
            'finalised' => Project::whereIn('status', [Project::STATUS_FINALISED, Project::STATUS_JUDGING, Project::STATUS_ANNOUNCED])->count(),
            'winners' => FinalResult::whereNotNull('award_title')->whereNotNull('published_at')->count(),
        ];

        // Funnel tahapan registrasi sampai pengumuman (REP-02)
        $funnel = [
            ['stage' => 'Draft', 'count' => Project::where('status', Project::STATUS_DRAFT)->count()],
            ['stage' => 'Submitted', 'count' => Project::whereIn('status', [Project::STATUS_SUBMITTED, Project::STATUS_IN_VERIFICATION])->count()],
            ['stage' => 'Terverifikasi', 'count' => Project::where('status', Project::STATUS_VERIFIED)->count()],
            ['stage' => 'Lolos Seleksi', 'count' => Project::whereIn('status', [Project::STATUS_QUALIFIED, Project::STATUS_FINALISED, Project::STATUS_JUDGING, Project::STATUS_ANNOUNCED])->count()],
            ['stage' => 'Finalised (Siap Juri)', 'count' => Project::whereIn('status', [Project::STATUS_FINALISED, Project::STATUS_JUDGING, Project::STATUS_ANNOUNCED])->count()],
            ['stage' => 'Pemenang Diumumkan', 'count' => FinalResult::whereNotNull('award_title')->whereNotNull('published_at')->count()],
        ];

        // Distribusi per Stream
        $streams = Stream::withCount([
            'projects',
            'projects as verified_count' => fn ($q) => $q->where('status', Project::STATUS_VERIFIED),
            'projects as qualified_count' => fn ($q) => $q->whereIn('status', [Project::STATUS_QUALIFIED, Project::STATUS_FINALISED, Project::STATUS_JUDGING, Project::STATUS_ANNOUNCED]),
        ])->get()->map(fn ($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'code' => $s->code,
            'total_projects' => $s->projects_count,
            'verified_projects' => $s->verified_count,
            'qualified_projects' => $s->qualified_count,
            'results_published' => (bool) $s->results_published_at,
        ]);

        // Partisipasi per Unit Bisnis / Plant (Top 10)
        $unitDistribution = DB::table('projects')
            ->join('employees', 'projects.leader_employee_id', '=', 'employees.id')
            ->select('employees.unit', DB::raw('count(projects.id) as total_projects'))
            ->whereNotNull('employees.unit')
            ->groupBy('employees.unit')
            ->orderByDesc('total_projects')
            ->limit(10)
            ->get();

        // Pemenang resmi (jika ada stream yang sudah dipublish)
        $winners = FinalResult::with(['project.stream', 'project.leader', 'rankingOption'])
            ->whereNotNull('published_at')
            ->whereNotNull('award_title')
            ->orderBy('rank_in_category')
            ->get()
            ->map(fn ($fr) => [
                'id' => $fr->id,
                'award_title' => $fr->award_title,
                'rank' => $fr->rank_in_category,
                'registration_code' => $fr->project?->registration_code,
                'project_title' => $fr->project?->title,
                'stream_name' => $fr->project?->stream?->name,
                'category_name' => $fr->rankingOption?->name ?? 'Umum',
                'leader_name' => $fr->project?->leader?->full_name,
                'unit' => $fr->project?->leader?->unit,
                'final_score' => $fr->final_score,
            ]);

        return Inertia::render('Viewer/Dashboard', [
            'stats' => $stats,
            'funnel' => $funnel,
            'streams' => $streams,
            'unitDistribution' => $unitDistribution,
            'winners' => $winners,
        ]);
    }
}
