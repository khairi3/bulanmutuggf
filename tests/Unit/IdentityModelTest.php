<?php

namespace Tests\Unit;

use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IdentityModelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_employee_has_one_user(): void
    {
        $employee = Employee::where('employee_index', 'ADMIN001')->first();

        $this->assertNotNull($employee->user);
        $this->assertInstanceOf(User::class, $employee->user);
    }

    public function test_user_has_roles(): void
    {
        $user = Employee::where('employee_index', 'EMP1001')->first()->user;

        $this->assertTrue($user->hasRole(Role::PARTICIPANT));
        $this->assertTrue($user->hasRole(Role::VERIFIER));
        $this->assertFalse($user->hasRole(Role::ADMIN));
    }

    public function test_audit_log_helper_records_data(): void
    {
        $admin = Employee::where('employee_index', 'ADMIN001')->first()->user;

        $log = AuditLog::log(
            action: 'TEST_ACTION',
            entityType: 'TestEntity',
            entityId: 99,
            before: ['status' => 'draft'],
            after: ['status' => 'submitted'],
            reason: 'Unit test audit verification',
            userId: $admin->id
        );

        $this->assertDatabaseHas('audit_logs', [
            'id' => $log->id,
            'action' => 'TEST_ACTION',
            'entity_type' => 'TestEntity',
            'entity_id' => 99,
            'reason' => 'Unit test audit verification',
        ]);
    }
}
