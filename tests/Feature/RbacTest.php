<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Role;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RbacTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_participant_is_forbidden_from_admin_area(): void
    {
        // EMP1007 is a regular participant with must_change_password = false
        $participant = Employee::where('employee_index', 'EMP1007')->first()->user;

        $response = $this->actingAs($participant)->get('/admin/dashboard');

        $response->assertStatus(403);
    }

    public function test_admin_can_access_admin_dashboard(): void
    {
        $admin = Employee::where('employee_index', 'ADMIN001')->first()->user;

        $response = $this->actingAs($admin)->get('/admin/dashboard');

        $response->assertStatus(200);
    }

    public function test_multi_role_user_can_switch_active_role(): void
    {
        // EMP1001 has both participant and verifier roles
        $multiUser = Employee::where('employee_index', 'EMP1001')->first()->user;
        $multiUser->update(['must_change_password' => false]);

        // Initially access as participant
        session(['active_role' => Role::PARTICIPANT]);

        // Switch to verifier
        $response = $this->actingAs($multiUser)->post('/switch-role', [
            'role' => Role::VERIFIER,
        ]);

        $response->assertRedirect('/verifier/dashboard');
        $this->assertEquals(Role::VERIFIER, session('active_role'));

        // Can access verifier dashboard
        $dashResponse = $this->actingAs($multiUser)->get('/verifier/dashboard');
        $dashResponse->assertStatus(200);

        // Audit log recorded for switch
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $multiUser->id,
            'action' => 'SWITCH_ROLE',
        ]);
    }

    public function test_user_cannot_switch_to_unassigned_role(): void
    {
        $participant = Employee::where('employee_index', 'EMP1007')->first()->user;
        $participant->update(['must_change_password' => false]);

        $response = $this->actingAs($participant)->post('/switch-role', [
            'role' => Role::ADMIN,
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_reset_employee_password_with_reason(): void
    {
        $admin = Employee::where('employee_index', 'ADMIN001')->first()->user;
        $targetUser = Employee::where('employee_index', 'EMP1015')->first()->user;

        $response = $this->actingAs($admin)->post("/admin/users/{$targetUser->id}/reset-password", [
            'reason' => 'Permintaan reset langsung via telepon dari Supervisor PG1',
        ]);

        $response->assertSessionHas('success');

        $targetUser->refresh();
        $this->assertTrue($targetUser->must_change_password);
        $this->assertTrue(Hash::check('password123', $targetUser->password));

        // Audit log verified
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'ADMIN_RESET_PASSWORD',
            'entity_type' => 'User',
            'entity_id' => $targetUser->id,
        ]);
    }

    public function test_non_admin_cannot_reset_passwords(): void
    {
        $participant = Employee::where('employee_index', 'EMP1007')->first()->user;
        $targetUser = Employee::where('employee_index', 'EMP1015')->first()->user;

        $response = $this->actingAs($participant)->post("/admin/users/{$targetUser->id}/reset-password", [
            'reason' => 'Unauthorized reset attempt',
        ]);

        $response->assertStatus(403);
    }
}
