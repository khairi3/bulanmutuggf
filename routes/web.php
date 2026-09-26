<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
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
    });

    // Participant Area
    Route::middleware(['must.change.password', 'role:participant'])->prefix('participant')->name('participant.')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'participant'])->name('dashboard');
    });

    // Verifier Area
    Route::middleware(['must.change.password', 'role:verifier'])->prefix('verifier')->name('verifier.')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'verifier'])->name('dashboard');
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
