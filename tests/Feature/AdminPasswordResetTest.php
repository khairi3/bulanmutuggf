<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminPasswordResetTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->adminUser = User::whereHas('roles', fn ($q) => $q->where('code', 'admin'))->first();
    }

    public function test_admin_can_reset_password_for_existing_user(): void
    {
        $employee = Employee::create([
            'employee_index' => 'EMP9901',
            'full_name' => 'Budi Peserta',
            'employee_level' => 'Staff',
            'position' => 'Staff Operasional',
            'unit' => 'PG1',
            'division' => 'Plantation',
            'email' => 'budi@example.com',
            'is_active' => true,
        ]);

        $user = User::create([
            'employee_id' => $employee->id,
            'password' => Hash::make('old_password_hash'),
            'must_change_password' => false,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->withSession(['active_role' => 'admin'])
            ->post("/admin/employees/{$employee->id}/reset-password", [
                'password' => 'secret12345',
                'must_change_password' => true,
                'reason' => 'Lupa password akun peserta',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $user->refresh();
        $this->assertTrue(Hash::check('secret12345', $user->password));
        $this->assertTrue($user->must_change_password);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'ADMIN_RESET_PASSWORD',
            'entity_type' => 'User',
            'entity_id' => $user->id,
        ]);
    }

    public function test_admin_can_initialize_account_and_password_for_employee_without_account(): void
    {
        $employee = Employee::create([
            'employee_index' => 'EMP9902',
            'full_name' => 'Siti Belum Punya Akun',
            'employee_level' => 'Pelaksana',
            'position' => 'Operator',
            'unit' => 'PG2',
            'division' => 'Factory',
            'email' => null,
            'is_active' => true,
        ]);

        $this->assertNull($employee->user);

        $response = $this->actingAs($this->adminUser)
            ->withSession(['active_role' => 'admin'])
            ->post("/admin/employees/{$employee->id}/reset-password", [
                'password' => 'welcome2026',
                'must_change_password' => true,
                'reason' => 'Pembuatan akun baru oleh admin',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $employee->refresh();
        $this->assertNotNull($employee->user);
        $this->assertTrue(Hash::check('welcome2026', $employee->user->password));
        $this->assertTrue($employee->user->must_change_password);
        $this->assertTrue($employee->user->hasRole(Role::PARTICIPANT));

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'ADMIN_CREATE_USER',
            'entity_type' => 'User',
            'entity_id' => $employee->user->id,
        ]);
    }

    public function test_non_admin_cannot_reset_employee_password(): void
    {
        $participantUser = User::whereHas('roles', fn ($q) => $q->where('code', 'participant'))
            ->whereDoesntHave('roles', fn ($q) => $q->where('code', 'admin'))
            ->first();

        $participantUser->update(['must_change_password' => false]);

        $targetEmployee = Employee::first();

        $response = $this->actingAs($participantUser)
            ->withSession(['active_role' => 'participant'])
            ->post("/admin/employees/{$targetEmployee->id}/reset-password", [
                'password' => 'newpassword123',
            ]);

        $response->assertForbidden();
    }
}
