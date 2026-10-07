<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\Event;
use App\Models\Role;
use App\Models\Stream;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class AssignmentController extends Controller
{
    /**
     * Display users management & verifier/judge assignments matrix.
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
     * Assign user or employee to stream and stage.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'employee_id' => ['nullable', 'exists:employees,id'],
            'stream_id' => ['required', 'exists:streams,id'],
            'stage' => ['required', 'in:verification,judging'],
            'category_option_id' => ['nullable', 'exists:category_options,id'],
        ]);

        if (! $request->filled('user_id') && ! $request->filled('employee_id')) {
            return back()->withErrors(['user_id' => 'Pilih evaluator atau cari karyawan terlebih dahulu.']);
        }

        if ($request->filled('user_id')) {
            $user = User::findOrFail($request->input('user_id'));
        } else {
            $employee = Employee::findOrFail($request->input('employee_id'));
            $user = User::firstOrCreate(
                ['employee_id' => $employee->id],
                [
                    'password' => Hash::make('password123'),
                    'must_change_password' => true,
                ]
            );
        }

        $stream = Stream::findOrFail($request->input('stream_id'));
        $stage = $request->input('stage');

        // Check if user has required role, auto-assign if not
        $requiredRole = $stage === 'verification' ? Role::VERIFIER : Role::JUDGE;
        if (! $user->hasRole($requiredRole)) {
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
     * Promote an employee to evaluator (verifier and/or judge) and optionally assign to a stream.
     */
    public function storeEvaluator(Request $request): RedirectResponse
    {
        $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['in:verifier,judge'],
            'stream_id' => ['nullable', 'exists:streams,id'],
            'stage' => ['nullable', 'in:verification,judging'],
            'category_option_id' => ['nullable', 'exists:category_options,id'],
        ]);

        $employee = Employee::findOrFail($request->input('employee_id'));

        // Find or create User for this employee
        $user = User::firstOrCreate(
            ['employee_id' => $employee->id],
            [
                'password' => Hash::make('password123'),
                'must_change_password' => true,
            ]
        );

        // Attach requested roles
        $roleCodes = $request->input('roles');
        $roleIds = Role::whereIn('code', $roleCodes)->pluck('id');
        $user->roles()->syncWithoutDetaching($roleIds);

        // Optional immediate stream assignment
        if ($request->filled('stream_id') && $request->filled('stage')) {
            $stream = Stream::findOrFail($request->input('stream_id'));
            $stage = $request->input('stage');

            $existing = Assignment::where('user_id', $user->id)
                ->where('stream_id', $stream->id)
                ->where('stage', $stage)
                ->where('category_option_id', $request->input('category_option_id'))
                ->first();

            if (! $existing) {
                Assignment::create([
                    'user_id' => $user->id,
                    'stream_id' => $stream->id,
                    'stage' => $stage,
                    'category_option_id' => $request->input('category_option_id'),
                ]);
            }
        }

        $rolesLabel = implode(' & ', array_map(fn ($r) => $r === 'verifier' ? 'Verifikator' : 'Juri', $roleCodes));

        AuditLog::log(
            action: 'ADD_EVALUATOR',
            entityType: 'User',
            entityId: $user->id,
            reason: "Menambahkan karyawan {$employee->full_name} ({$employee->employee_index}) sebagai {$rolesLabel}"
        );

        return back()->with('success', "Karyawan {$employee->full_name} berhasil ditambahkan sebagai {$rolesLabel}.");
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
