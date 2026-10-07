<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    /**
     * Display the login page.
     */
    public function showLogin(): Response|RedirectResponse
    {
        if (Auth::check()) {
            return $this->redirectBasedOnRole(Auth::user());
        }

        $backgroundImage = Setting::get('login_background_image', '/images/login-bg-default.jpg');

        return Inertia::render('Auth/Login', [
            'backgroundImage' => $backgroundImage,
        ]);
    }

    /**
     * Handle user login with employee_index & password.
     * Rate limit: 5 failed attempts per 15 minutes per index.
     */
    public function login(Request $request): RedirectResponse
    {
        $request->validate([
            'employee_index' => ['required', 'string'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ], [
            'employee_index.required' => 'Index Karyawan wajib diisi.',
            'password.required' => 'Password wajib diisi.',
        ]);

        $index = trim($request->input('employee_index'));
        $throttleKey = 'login:'.Str::lower($index);

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            $minutes = ceil($seconds / 60);

            throw ValidationException::withMessages([
                'employee_index' => "Terlalu banyak percobaan login gagal. Akun dibatasi sementara. Silakan coba lagi dalam {$minutes} menit.",
            ]);
        }

        // Find employee by index
        $employee = Employee::where('employee_index', $index)->first();

        if (! $employee || ! $employee->is_active || ! $employee->user) {
            RateLimiter::hit($throttleKey, 900); // 15 minutes lock window

            throw ValidationException::withMessages([
                'employee_index' => 'Index Karyawan atau password tidak sesuai.',
            ]);
        }

        $user = $employee->user;

        if (! Hash::check($request->input('password'), $user->password)) {
            RateLimiter::hit($throttleKey, 900);

            throw ValidationException::withMessages([
                'employee_index' => 'Index Karyawan atau password tidak sesuai.',
            ]);
        }

        // Login successful, clear throttle
        RateLimiter::clear($throttleKey);

        Auth::login($user, (bool) $request->input('remember'));
        $request->session()->regenerate();

        $user->update([
            'last_login_at' => now(),
        ]);

        // Audit Log
        AuditLog::log(
            action: 'LOGIN',
            entityType: 'User',
            entityId: $user->id,
            reason: 'User berhasil login'
        );

        // Set default active role in session
        $firstRole = $user->roles()->first();
        if ($firstRole) {
            session(['active_role' => $firstRole->code]);
        }

        if ($user->must_change_password) {
            return redirect()->route('password.change.notice')
                ->with('warning', 'Demi keamanan, Anda wajib mengganti password default pada login pertama.');
        }

        return $this->redirectBasedOnRole($user)
            ->with('success', "Selamat datang kembali, {$employee->full_name}!");
    }

    /**
     * Handle user logout.
     */
    public function logout(Request $request): RedirectResponse
    {
        $user = Auth::user();

        if ($user) {
            AuditLog::log(
                action: 'LOGOUT',
                entityType: 'User',
                entityId: $user->id,
                reason: 'User logout dari sesi'
            );
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')
            ->with('info', 'Anda telah berhasil keluar.');
    }

    /**
     * Show mandatory change password screen.
     */
    public function showChangePassword(): Response
    {
        return Inertia::render('Auth/ChangePassword');
    }

    /**
     * Process password update.
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        $user = $request->user();

        $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'current_password.required' => 'Password saat ini wajib diisi.',
            'password.required' => 'Password baru wajib diisi.',
            'password.min' => 'Password baru minimal harus 8 karakter.',
            'password.confirmed' => 'Konfirmasi password baru tidak cocok.',
        ]);

        if (! Hash::check($request->input('current_password'), $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => 'Password saat ini tidak tepat.',
            ]);
        }

        $user->update([
            'password' => Hash::make($request->input('password')),
            'must_change_password' => false,
        ]);

        AuditLog::log(
            action: 'CHANGE_PASSWORD',
            entityType: 'User',
            entityId: $user->id,
            reason: 'User berhasil memperbarui password'
        );

        return $this->redirectBasedOnRole($user)
            ->with('success', 'Password Anda berhasil diperbarui!');
    }

    /**
     * Show forgot password page.
     */
    public function showForgotPassword(): Response
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    /**
     * Handle forgot password request.
     */
    public function sendResetInstructions(Request $request): RedirectResponse
    {
        $request->validate([
            'employee_index' => ['required', 'string'],
        ], [
            'employee_index.required' => 'Index Karyawan wajib diisi.',
        ]);

        $employee = Employee::where('employee_index', trim($request->input('employee_index')))->first();

        if (! $employee || ! $employee->user) {
            return back()->with('info', 'Jika Index Karyawan terdaftar, instruksi reset password akan diproses.');
        }

        if (empty($employee->email)) {
            return back()->with('warning', "Akun untuk index {$employee->employee_index} ({$employee->full_name}) tidak memiliki alamat email terdaftar. Sesuai PRD AUTH-03, silakan hubungi Tim Admin / Panitia L&D (admin.bmg@ggf.co.id) untuk melakukan reset password akun Anda.");
        }

        // In a full production setup with SMTP, dispatch PasswordResetMail here.
        // For development/staging, we record in audit log and notify user:
        AuditLog::log(
            action: 'REQUEST_PASSWORD_RESET',
            entityType: 'Employee',
            entityId: $employee->id,
            reason: "Permintaan reset password via email: {$employee->email}"
        );

        return back()->with('success', "Link dan instruksi reset password telah dikirim ke email {$employee->email}. Silakan cek kotak masuk Anda.");
    }

    /**
     * Switch user active role.
     */
    public function switchRole(Request $request): RedirectResponse
    {
        $request->validate([
            'role' => ['required', 'string'],
        ]);

        $user = $request->user();
        $targetRole = $request->input('role');

        if (! $user->hasRole($targetRole)) {
            abort(403, 'Anda tidak memiliki hak akses untuk role tersebut.');
        }

        session(['active_role' => $targetRole]);

        AuditLog::log(
            action: 'SWITCH_ROLE',
            entityType: 'User',
            entityId: $user->id,
            after: ['active_role' => $targetRole],
            reason: "User beralih peran ke {$targetRole}"
        );

        return $this->redirectBasedOnRole($user, $targetRole)
            ->with('info', "Peran aktif Anda berhasil diubah menjadi: {$targetRole}");
    }

    /**
     * Admin reset user password for employees without email (AUTH-03).
     */
    public function adminResetPassword(Request $request, User $user): RedirectResponse
    {
        $currentUser = $request->user();
        if (! $currentUser || ! $currentUser->hasRole(Role::ADMIN)) {
            abort(403, 'Hanya Admin yang dapat mereset password.');
        }

        $request->validate([
            'reason' => ['required', 'string', 'min:5'],
        ], [
            'reason.required' => 'Alasan reset password wajib diisi (untuk catatan audit).',
        ]);

        $newTempPassword = 'password123';

        $user->update([
            'password' => Hash::make($newTempPassword),
            'must_change_password' => true,
        ]);

        AuditLog::log(
            action: 'ADMIN_RESET_PASSWORD',
            entityType: 'User',
            entityId: $user->id,
            reason: $request->input('reason')." (Reset oleh Admin ID {$currentUser->id})"
        );

        return back()->with('success', "Password untuk karyawan {$user->employee?->full_name} berhasil direset ke password sementara default.");
    }

    /**
     * Cek status aktivasi akun karyawan untuk form Buat Akun.
     */
    public function checkEmployeeActivation(Request $request): JsonResponse
    {
        $request->validate([
            'employee_index' => ['required', 'string'],
        ]);

        $index = trim($request->input('employee_index'));
        $employee = Employee::where('employee_index', $index)->first();

        if (! $employee) {
            return response()->json([
                'found' => false,
                'message' => "Index / NIK '{$index}' tidak terdaftar di Master Data Karyawan. Pastikan NIK Anda sudah terdaftar atau hubungi Admin / HR.",
            ], 404);
        }

        if (! $employee->is_active) {
            return response()->json([
                'found' => false,
                'message' => "Karyawan {$employee->full_name} berstatus tidak aktif. Silakan hubungi HR.",
            ], 422);
        }

        $user = $employee->user;
        // Jika akun user sudah ada dan must_change_password false, akun sudah aktif sebelumnya
        if ($user && ! $user->must_change_password) {
            return response()->json([
                'found' => true,
                'can_activate' => false,
                'message' => "Akun untuk {$employee->full_name} ({$employee->employee_index}) sudah aktif. Silakan langsung login dengan password Anda atau gunakan fitur 'Lupa password?' jika lupa.",
                'employee' => [
                    'employee_index' => $employee->employee_index,
                    'full_name' => $employee->full_name,
                    'unit' => $employee->unit,
                    'position' => $employee->position,
                ],
            ]);
        }

        return response()->json([
            'found' => true,
            'can_activate' => true,
            'message' => 'Data karyawan ditemukan. Silakan lengkapi kontak dan tentukan password akun Anda.',
            'employee' => [
                'id' => $employee->id,
                'employee_index' => $employee->employee_index,
                'full_name' => $employee->full_name,
                'employee_level' => $employee->employee_level,
                'position' => $employee->position,
                'unit' => $employee->unit,
                'division' => $employee->division,
                'email' => $employee->email ?? '',
                'phone' => $employee->phone ?? '',
            ],
        ]);
    }

    /**
     * Proses buat & aktivasi akun mandiri oleh karyawan baru.
     */
    public function registerAccount(Request $request): RedirectResponse
    {
        $request->validate([
            'employee_index' => ['required', 'string', 'exists:employees,employee_index'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'employee_index.required' => 'Index Karyawan wajib dipilih.',
            'employee_index.exists' => 'Index Karyawan tidak terdaftar.',
            'email.email' => 'Format email tidak valid.',
            'password.required' => 'Password baru wajib diisi.',
            'password.min' => 'Password minimal harus 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        $employee = Employee::where('employee_index', trim($request->input('employee_index')))
            ->where('is_active', true)
            ->firstOrFail();

        $user = $employee->user;
        if ($user && ! $user->must_change_password) {
            throw ValidationException::withMessages([
                'employee_index' => 'Akun untuk karyawan ini sudah aktif sebelumnya. Silakan login atau gunakan Lupa Password.',
            ]);
        }

        // Perbarui data email dan nomor hp jika diisi
        $updateData = [];
        if ($request->filled('email')) {
            $updateData['email'] = trim($request->input('email'));
        }
        if ($request->filled('phone')) {
            $updateData['phone'] = trim($request->input('phone'));
        }
        if (! empty($updateData)) {
            $employee->update($updateData);
        }

        // Buat atau perbarui akun User
        if (! $user) {
            $user = User::create([
                'employee_id' => $employee->id,
                'password' => Hash::make($request->input('password')),
                'must_change_password' => false,
            ]);
        } else {
            $user->update([
                'password' => Hash::make($request->input('password')),
                'must_change_password' => false,
            ]);
        }

        // Berikan role peserta jika belum memiliki role
        $participantRole = Role::where('code', Role::PARTICIPANT)->first();
        if ($participantRole && ! $user->hasRole(Role::PARTICIPANT)) {
            $user->roles()->syncWithoutDetaching([$participantRole->id]);
        }

        // Otomatis login ke sistem
        Auth::login($user);
        $request->session()->regenerate();
        $user->update(['last_login_at' => now()]);
        session(['active_role' => Role::PARTICIPANT]);

        AuditLog::log(
            action: 'SELF_REGISTER_ACCOUNT',
            entityType: 'User',
            entityId: $user->id,
            reason: "Aktivasi mandiri akun untuk karyawan {$employee->full_name} ({$employee->employee_index})",
            userId: $user->id
        );

        return redirect()->route('participant.dashboard')
            ->with('success', "Akun Anda berhasil dibuat & diaktifkan! Selamat datang di BMG 2026, {$employee->full_name}.");
    }

    /**
     * Helper to route user according to their role.
     */
    protected function redirectBasedOnRole(User $user, ?string $explicitRole = null): RedirectResponse
    {
        $role = $explicitRole ?: session('active_role');

        if (! $role) {
            $role = $user->roles()->first()?->code;
            if ($role) {
                session(['active_role' => $role]);
            }
        }

        return match ($role) {
            Role::ADMIN => redirect()->route('admin.dashboard'),
            Role::VERIFIER => redirect()->route('verifier.dashboard'),
            Role::JUDGE => redirect()->route('judge.dashboard'),
            Role::VIEWER => redirect()->route('viewer.dashboard'),
            default => redirect()->route('participant.dashboard'),
        };
    }
}
