<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\AuditLog;
use App\Models\Event;
use App\Models\Role;
use App\Models\Stream;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AssignmentController extends Controller
{
    /**
     * Display users management & verifier/judge assignments matrix (ADM-01).
     */
    public function index(Request $request): Response
    {
        $activeEvent = Event::active() ?? Event::latest()->first();
        $streams = $activeEvent ? $activeEvent->streams()->with('categoryDimensions.options')->get() : [];

        $users = User::with(['employee', 'roles', 'assignments.stream', 'assignments.categoryOption'])
            ->whereHas('roles', function ($q) {
                $q->whereIn('code', [Role::VERIFIER, Role::JUDGE, Role::ADMIN]);
            })
            ->get();

        $roles = Role::all();

        return Inertia::render('Admin/Assignments/Index', [
            'users' => $users,
            'streams' => $streams,
            'roles' => $roles,
            'activeEvent' => $activeEvent,
        ]);
    }

    /**
     * Assign user to stream and stage (ADM-01).
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'stream_id' => ['required', 'exists:streams,id'],
            'stage' => ['required', 'in:verification,judging'],
            'category_option_id' => ['nullable', 'exists:category_options,id'],
        ]);

        $user = User::findOrFail($request->input('user_id'));
        $stream = Stream::findOrFail($request->input('stream_id'));
        $stage = $request->input('stage');

        // Check if user has required role
        $requiredRole = $stage === 'verification' ? Role::VERIFIER : Role::JUDGE;
        if (! $user->hasRole($requiredRole)) {
            // Auto assign role to user if not already has it
            $roleModel = Role::where('code', $requiredRole)->first();
            if ($roleModel) {
                $user->roles()->syncWithoutDetaching([$roleModel->id]);
            }
        }

        // Avoid duplicate assignment
        $existing = Assignment::where('user_id', $user->id)
            ->where('stream_id', $stream->id)
            ->where('stage', $stage)
            ->where('category_option_id', $request->input('category_option_id'))
            ->first();

        if ($existing) {
            return back()->with('info', 'Penugasan sudah terdaftar untuk pengguna ini.');
        }

        $assignment = Assignment::create([
            'user_id' => $user->id,
            'stream_id' => $stream->id,
            'stage' => $stage,
            'category_option_id' => $request->input('category_option_id'),
        ]);

        AuditLog::log(
            action: 'ASSIGN_EVALUATOR',
            entityType: 'Assignment',
            entityId: $assignment->id,
            reason: "Menugaskan {$user->employee?->full_name} sebagai evaluator tahap {$stage} pada stream {$stream->name}"
        );

        return back()->with('success', "Penugasan untuk {$user->employee?->full_name} berhasil ditambahkan.");
    }

    /**
     * Delete assignment.
     */
    public function destroy(Assignment $assignment): RedirectResponse
    {
        $userName = $assignment->user?->employee?->full_name;
        $assignment->delete();

        return back()->with('success', "Penugasan untuk {$userName} berhasil dihapus.");
    }

    /**
     * Add or toggle role on user.
     */
    public function toggleUserRole(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'role_code' => ['required', 'exists:roles,code'],
        ]);

        $role = Role::where('code', $request->input('role_code'))->firstOrFail();

        if ($user->hasRole($role->code)) {
            // Ensure at least 1 role remains
            if ($user->roles()->count() <= 1) {
                return back()->with('error', 'User harus memiliki setidaknya satu peran.');
            }
            $user->roles()->detach($role->id);
            $msg = "Peran {$role->name} dicabut dari {$user->employee?->full_name}.";
        } else {
            $user->roles()->attach($role->id);
            $msg = "Peran {$role->name} diberikan kepada {$user->employee?->full_name}.";
        }

        AuditLog::log(
            action: 'TOGGLE_USER_ROLE',
            entityType: 'User',
            entityId: $user->id,
            reason: $msg
        );

        return back()->with('success', $msg);
    }
}
