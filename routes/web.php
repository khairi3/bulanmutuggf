<?php

use App\Http\Controllers\AdminUnlockController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\JudgeController;
use App\Http\Controllers\ParticipantProjectController;
use App\Http\Controllers\PhaseController;
use App\Http\Controllers\RecapController;
use App\Http\Controllers\ScoringParameterController;
use App\Http\Controllers\SelectionController;
use App\Http\Controllers\SettingController;
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

    Route::get('/register', fn () => redirect('/login?register=1'))->name('register');
    Route::post('/register-account/check', [AuthController::class, 'checkEmployeeActivation'])->name('register.check');
    Route::post('/register-account', [AuthController::class, 'registerAccount'])->name('register.submit');

    Route::get('/forgot-password', [AuthController::class, 'showForgotPassword'])->name('password.request');
    Route::post('/forgot-password', [AuthController::class, 'sendResetInstructions'])->name('password.email');
});

// Public Certificate Verification (REP-04)
Route::get('/verify-certificate/{verify_code}', [CertificateController::class, 'verify'])->name('certificates.verify');

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
        Route::get('/employees/template', [EmployeeController::class, 'downloadTemplate'])->name('employees.template');
        Route::post('/employees/preview-import', [EmployeeController::class, 'previewImport'])->name('employees.preview-import');
        Route::post('/employees/commit-import', [EmployeeController::class, 'commitImport'])->name('employees.commit-import');
        Route::post('/employees/{employee}/toggle-active', [EmployeeController::class, 'toggleActive'])->name('employees.toggle-active');
        Route::post('/employees/{employee}/reset-password', [EmployeeController::class, 'resetPassword'])->name('employees.reset-password');

        // Event & Stream Configurations (Task 2.4, 2.5, 2.6, 2.7, 2.8)
        Route::get('/events', [EventController::class, 'index'])->name('events.index');
        Route::post('/events', [EventController::class, 'store'])->name('events.store');
        Route::put('/events/{event}', [EventController::class, 'update'])->name('events.update');
        Route::post('/events/{event}/streams', [EventController::class, 'storeStream'])->name('events.streams.store');
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
        Route::post('/assignments/evaluators', [AssignmentController::class, 'storeEvaluator'])->name('assignments.evaluators.store');
        Route::delete('/assignments/{assignment}', [AssignmentController::class, 'destroy'])->name('assignments.destroy');
        Route::post('/users/{user}/toggle-role', [AssignmentController::class, 'toggleUserRole'])->name('users.toggle-role');

        // Selection & Convention Day Prep (Tasks 5.1, 5.2, 5.3)
        Route::get('/selection', [SelectionController::class, 'index'])->name('selection.index');
        Route::post('/selection/draft', [SelectionController::class, 'storeDraft'])->name('selection.draft');
        Route::post('/streams/{stream}/selection/publish', [SelectionController::class, 'publish'])->name('selection.publish');
        Route::post('/projects/{project}/selection/override', [SelectionController::class, 'override'])->name('selection.override');

        // Recap, Leaderboard & Winners Announcement (Tasks 6.1, 6.2, 6.3)
        Route::get('/recap', [RecapController::class, 'index'])->name('recap.index');
        Route::post('/streams/{stream}/recap/awards', [RecapController::class, 'updateAwards'])->name('recap.awards');
        Route::post('/streams/{stream}/recap/publish', [RecapController::class, 'publish'])->name('recap.publish');
        Route::get('/export', [RecapController::class, 'export'])->name('export');

        // Admin Unlock with Audit Log (Task 6.4)
        Route::post('/projects/{project}/unlock', [AdminUnlockController::class, 'unlockProject'])->name('projects.unlock');
        Route::post('/score-sheets/{scoreSheet}/unlock', [AdminUnlockController::class, 'unlockScoreSheet'])->name('score-sheets.unlock');
        Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
        Route::post('/settings/login-background', [SettingController::class, 'updateLoginBackground'])->name('settings.login-background');
        Route::post('/certificates/toggle-publish', [CertificateController::class, 'togglePublish'])->name('certificates.toggle-publish');
        Route::post('/certificates/signatory', [CertificateController::class, 'updateSignatory'])->name('certificates.signatory');
        Route::post('/certificates/template', [CertificateController::class, 'uploadTemplate'])->name('certificates.template.upload');
        Route::post('/certificates/template/reset', [CertificateController::class, 'resetTemplate'])->name('certificates.template.reset');
        Route::post('/certificates/template/settings', [CertificateController::class, 'updateTemplateSettings'])->name('certificates.template.settings');
        Route::get('/certificates/preview/{project?}', [CertificateController::class, 'previewSample'])->name('certificates.preview');
    });

    // Participant Area (Phase 3, 5 & 6)
    Route::middleware(['must.change.password', 'role:participant'])->prefix('participant')->name('participant.')->group(function () {
        Route::get('/dashboard', [ParticipantProjectController::class, 'index'])->name('dashboard');
        Route::get('/projects/{project}/certificate', [CertificateController::class, 'download'])->name('projects.certificate.download');
        Route::get('/projects/create', [ParticipantProjectController::class, 'create'])->name('projects.create');
        Route::post('/projects/draft', [ParticipantProjectController::class, 'storeDraft'])->name('projects.draft');
        Route::post('/projects/submit', [ParticipantProjectController::class, 'submit'])->name('projects.submit');
        Route::get('/projects/{project}', [ParticipantProjectController::class, 'show'])->name('projects.show');
        Route::post('/projects/{project}/charter', [ParticipantProjectController::class, 'updateCharter'])->name('projects.charter.update');
        Route::post('/projects/{project}/files', [ParticipantProjectController::class, 'uploadFile'])->name('projects.files.upload');
        Route::get('/projects/{project}/files/{file}/download', [ParticipantProjectController::class, 'downloadFile'])->name('projects.files.download');
        Route::get('/projects/{project}/files/{file}/preview/{asset?}', [ParticipantProjectController::class, 'previewFile'])->where('asset', '.*')->name('projects.files.preview');
        Route::post('/feedback/{feedback}/read', [ParticipantProjectController::class, 'markFeedbackRead'])->name('feedback.read');
        Route::post('/feedback/{feedback}/reply', [ParticipantProjectController::class, 'replyFeedback'])->name('feedback.reply');
        Route::post('/feedback/{feedback}/resolve', [ParticipantProjectController::class, 'resolveFeedback'])->name('feedback.resolve');
        Route::post('/projects/{project}/finalise', [ParticipantProjectController::class, 'finaliseProject'])->name('projects.finalise');
    });

    // Verifier Area (Phase 4, 5 & 6)
    Route::middleware(['must.change.password', 'role:verifier'])->prefix('verifier')->name('verifier.')->group(function () {
        Route::get('/dashboard', [VerifierController::class, 'dashboard'])->name('dashboard');
        Route::get('/projects/{project}', [VerifierController::class, 'show'])->name('projects.show');
        Route::post('/projects/{project}/feedback', [VerifierController::class, 'storeFeedback'])->name('projects.feedback.store');
        Route::delete('/projects/{project}/feedback/{feedback}', [VerifierController::class, 'destroyFeedback'])->name('projects.feedback.destroy');
        Route::post('/projects/{project}/visits', [VerifierController::class, 'storeVisit'])->name('projects.visits.store');
        Route::post('/projects/{project}/score', [VerifierController::class, 'saveScore'])->name('projects.score.save');
        Route::get('/projects/{project}/files/{file}/download', [VerifierController::class, 'downloadFile'])->name('projects.files.download');
        Route::get('/projects/{project}/files/{file}/preview/{asset?}', [ParticipantProjectController::class, 'previewFile'])->where('asset', '.*')->name('projects.files.preview');
        Route::get('/selection', [SelectionController::class, 'index'])->name('selection.index');
        Route::post('/selection/draft', [SelectionController::class, 'storeDraft'])->name('selection.draft');
        Route::post('/streams/{stream}/selection/publish', [SelectionController::class, 'publish'])->name('selection.publish');
        Route::get('/recap', [RecapController::class, 'index'])->name('recap.index');
        Route::get('/export', [RecapController::class, 'export'])->name('export');
    });

    // Judge Area (Phase 5)
    Route::middleware(['must.change.password', 'role:judge'])->prefix('judge')->name('judge.')->group(function () {
        Route::get('/dashboard', [JudgeController::class, 'dashboard'])->name('dashboard');
        Route::get('/projects/{project}', [JudgeController::class, 'show'])->name('projects.show');
        Route::post('/projects/{project}/score', [JudgeController::class, 'saveScore'])->name('projects.score.save');
        Route::get('/projects/{project}/files/{file}/download', [ParticipantProjectController::class, 'downloadFile'])->name('projects.files.download');
        Route::get('/projects/{project}/files/{file}/preview/{asset?}', [ParticipantProjectController::class, 'previewFile'])->where('asset', '.*')->name('projects.files.preview');
    });

    // Viewer Management Area (Phase 6)
    Route::middleware(['must.change.password', 'role:viewer'])->prefix('viewer')->name('viewer.')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'viewer'])->name('dashboard');
        Route::get('/recap', [RecapController::class, 'index'])->name('recap.index');
    });
});
