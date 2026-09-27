<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    /**
     * Tampilan Audit Trail / Log Aktivitas Sistem (ADM-07).
     */
    public function index(Request $request): Response
    {
        $query = AuditLog::with(['user.employee'])->latest();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                    ->orWhere('entity_type', 'like', "%{$search}%")
                    ->orWhere('reason', 'like', "%{$search}%");
            });
        }

        if ($action = $request->input('action')) {
            $query->where('action', $action);
        }

        if ($userId = $request->input('user_id')) {
            $query->where('user_id', $userId);
        }

        $logs = $query->paginate(25)->withQueryString();

        $actionTypes = AuditLog::select('action')->distinct()->pluck('action');

        return Inertia::render('Admin/AuditLogs/Index', [
            'logs' => $logs,
            'actionTypes' => $actionTypes,
            'filters' => [
                'search' => $request->input('search', ''),
                'action' => $request->input('action', ''),
                'user_id' => $request->input('user_id', ''),
            ],
        ]);
    }
}
