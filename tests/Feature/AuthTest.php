<?php

namespace Tests\Feature;

use App\Models\Employee;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_user_can_login_with_valid_index_and_password(): void
    {
        $response = $this->post('/login', [
            'employee_index' => 'ADMIN001',
            'password' => 'Admin123!',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect('/admin/dashboard');

        // Verify audit log entry was created
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'LOGIN',
            'entity_type' => 'User',
        ]);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        $response = $this->post('/login', [
            'employee_index' => 'ADMIN001',
            'password' => 'WrongPassword123',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('employee_index');
    }

    public function test_login_rate_limiting_locks_after_five_failed_attempts(): void
    {
        // 5 consecutive failed attempts
        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', [
                'employee_index' => 'ADMIN001',
                'password' => 'WrongPassword',
            ]);
        }

        // 6th attempt should be throttled
        $response = $this->post('/login', [
            'employee_index' => 'ADMIN001',
            'password' => 'Admin123!',
        ]);

        $response->assertSessionHasErrors('employee_index');
        $this->assertStringContainsString('Terlalu banyak percobaan', session('errors')->first('employee_index'));
    }

    public function test_first_time_login_is_redirected_to_change_password(): void
    {
        // EMP1001 has must_change_password = true
        $response = $this->post('/login', [
            'employee_index' => 'EMP1001',
            'password' => 'password123',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect('/change-password');
    }

    public function test_user_can_change_password_and_clears_must_change_flag(): void
    {
        $employee = Employee::where('employee_index', 'EMP1001')->first();
        $user = $employee->user;

        $response = $this->actingAs($user)->post('/change-password', [
            'current_password' => 'password123',
            'password' => 'NewSecurePassword123!',
            'password_confirmation' => 'NewSecurePassword123!',
        ]);

        $user->refresh();
        $this->assertFalse($user->must_change_password);
        $this->assertTrue(Hash::check('NewSecurePassword123!', $user->password));

        // Audit log recorded
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'CHANGE_PASSWORD',
        ]);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $admin = Employee::where('employee_index', 'ADMIN001')->first()->user;

        $response = $this->actingAs($admin)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/login');
    }

    public function test_forgot_password_request_for_employee_with_email(): void
    {
        $response = $this->post('/forgot-password', [
            'employee_index' => 'EMP1001', // has email budi.pratama@ggf.co.id
        ]);

        $response->assertSessionHas('success');
    }

    public function test_forgot_password_request_for_employee_without_email_shows_admin_notice(): void
    {
        $response = $this->post('/forgot-password', [
            'employee_index' => 'EMP1015', // operator without email
        ]);

        $response->assertSessionHas('warning');
        $this->assertStringContainsString('tidak memiliki alamat email', session('warning'));
    }
}
