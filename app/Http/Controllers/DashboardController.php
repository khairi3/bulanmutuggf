<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\User;
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
        return Inertia::render('Viewer/Dashboard', [
            'kpis' => [], // Populated in Phase 6
        ]);
    }
}
