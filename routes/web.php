<?php

use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ParticipantProjectController;
use App\Http\Controllers\PhaseController;
use App\Http\Controllers\ScoringParameterController;
use App\Http\Controllers\VerifierController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

// Redirect root to dashboard or login
Route::get('/', function () {
    if (Auth::check()) {
        $activeRole = session('active_role') ?? Auth::user()->roles()->first()?->code ?? 'participant';

        return redirect()->route("{$activeRole}.dashboard");
    }

    return redirect()->route('login');
});

// Guest Authentication Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);

    Route::get('/forgot-password', [AuthController::class, 'showForgotPassword'])->name('password.request');
    Route::post('/forgot-password', [AuthController::class, 'sendResetInstructions'])->name('password.email');
});

// Public Autocomplete API (EMP-03, EMP-04)
Route::get('/api/employees/search', [EmployeeController::class, 'search'])->name('api.employees.search');

// Authenticated Routes
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Mandatory Password Change Routes
    Route::get('/change-password', [AuthController::class, 'showChangePassword'])->name('password.change.notice');
    Route::post('/change-password', [AuthController::class, 'updatePassword'])->name('password.change.update');

    // Role Switcher Route
    Route::post('/switch-role', [AuthController::class, 'switchRole'])->name('role.switch');

    // Admin Area
    Route::middleware(['must.change.password', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'admin'])->name('dashboard');
        Route::post('/users/{user}/reset-password', [AuthController::class, 'adminResetPassword'])->name('users.reset-password');

        // Employee Management & Import (Task 2.1)
        Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
        Route::post('/employees/preview-import', [EmployeeController::class, 'previewImport'])->name('employees.preview-import');
        Route::post('/employees/commit-import', [EmployeeController::class, 'commitImport'])->name('employees.commit-import');
        Route::post('/employees/{employee}/toggle-active', [EmployeeController::class, 'toggleActive'])->name('employees.toggle-active');

        // Event & Stream Configurations (Task 2.4, 2.5, 2.6, 2.7, 2.8)
        Route::get('/events', [EventController::class, 'index'])->name('events.index');
        Route::post('/events', [EventController::class, 'store'])->name('events.store');
        Route::put('/events/{event}', [EventController::class, 'update'])->name('events.update');
        Route::post('/streams/{stream}/toggle', [EventController::class, 'toggleStream'])->name('streams.toggle');
        Route::post('/streams/{stream}/rules', [EventController::class, 'updateStreamRules'])->name('streams.rules');

        // Phases Schedule (Task 2.5)
        Route::post('/streams/{stream}/phases', [PhaseController::class, 'update'])->name('phases.update');

        // Categories & Options (Task 2.6)
        Route::post('/streams/{stream}/dimensions', [CategoryController::class, 'storeDimension'])->name('categories.store-dimension');
        Route::post('/dimensions/{dimension}/options', [CategoryController::class, 'storeOption'])->name('categories.store-option');
        Route::put('/options/{option}', [CategoryController::class, 'updateOption'])->name('categories.update-option');
        Route::delete('/options/{option}', [CategoryController::class, 'destroyOption'])->name('categories.destroy-option');

        // Scoring Parameters (Task 2.7)
        Route::post('/streams/{stream}/scoring-parameters', [ScoringParameterController::class, 'updateStageParameters'])->name('scoring-parameters.update');

        // User Management & Assignments Matrix (Task 2.9)
        Route::get('/assignments', [AssignmentController::class, 'index'])->name('assignments.index');
        Route::post('/assignments', [AssignmentController::class, 'store'])->name('assignments.store');
        Route::delete('/assignments/{assignment}', [AssignmentController::class, 'destroy'])->name('assignments.destroy');
        Route::post('/users/{user}/toggle-role', [AssignmentController::class, 'toggleUserRole'])->name('users.toggle-role');
    });

    // Participant Area (Phase 3)
    Route::middleware(['must.change.password', 'role:participant'])->prefix('participant')->name('participant.')->group(function () {
        Route::get('/dashboard', [ParticipantProjectController::class, 'index'])->name('dashboard');
        Route::get('/projects/create', [ParticipantProjectController::class, 'create'])->name('projects.create');
        Route::post('/projects/draft', [ParticipantProjectController::class, 'storeDraft'])->name('projects.draft');
        Route::post('/projects/submit', [ParticipantProjectController::class, 'submit'])->name('projects.submit');
        Route::get('/projects/{project}', [ParticipantProjectController::class, 'show'])->name('projects.show');
        Route::post('/projects/{project}/charter', [ParticipantProjectController::class, 'updateCharter'])->name('projects.charter.update');
        Route::post('/projects/{project}/files', [ParticipantProjectController::class, 'uploadFile'])->name('projects.files.upload');
        Route::get('/projects/{project}/files/{file}/download', [ParticipantProjectController::class, 'downloadFile'])->name('projects.files.download');
        Route::post('/feedback/{feedback}/read', [ParticipantProjectController::class, 'markFeedbackRead'])->name('feedback.read');
    });

    // Verifier Area (Phase 4)
    Route::middleware(['must.change.password', 'role:verifier'])->prefix('verifier')->name('verifier.')->group(function () {
        Route::get('/dashboard', [VerifierController::class, 'dashboard'])->name('dashboard');
        Route::get('/projects/{project}', [VerifierController::class, 'show'])->name('projects.show');
        Route::post('/projects/{project}/feedback', [VerifierController::class, 'storeFeedback'])->name('projects.feedback.store');
        Route::delete('/projects/{project}/feedback/{feedback}', [VerifierController::class, 'destroyFeedback'])->name('projects.feedback.destroy');
        Route::post('/projects/{project}/visits', [VerifierController::class, 'storeVisit'])->name('projects.visits.store');
        Route::post('/projects/{project}/score', [VerifierController::class, 'saveScore'])->name('projects.score.save');
        Route::get('/projects/{project}/files/{file}/download', [VerifierController::class, 'downloadFile'])->name('projects.files.download');
    });

    // Judge Area
    Route::middleware(['must.change.password', 'role:judge'])->prefix('judge')->name('judge.')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'judge'])->name('dashboard');
    });

    // Viewer Management Area
    Route::middleware(['must.change.password', 'role:viewer'])->prefix('viewer')->name('viewer.')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'viewer'])->name('dashboard');
    });
});
