<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Role;
use App\Models\Stream;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EvaluatorManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->adminUser = User::whereHas('roles', fn ($q) => $q->where('code', 'admin'))->first();
    }

    public function test_admin_can_promote_employee_to_evaluator_with_roles(): void
    {
        // Pick an employee who currently doesn't have a verifier or judge role
        $employee = Employee::whereDoesntHave('user.roles', function ($q) {
            $q->whereIn('code', ['verifier', 'judge']);
        })->first();

        $this->assertNotNull($employee);

        $stream = Stream::first();

        $response = $this->actingAs($this->adminUser)
            ->withSession(['active_role' => 'admin'])
            ->post('/admin/assignments/evaluators', [
                'employee_id' => $employee->id,
                'roles' => ['verifier', 'judge'],
                'stream_id' => $stream->id,
                'stage' => 'verification',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        // Verify user exists and has roles
        $user = User::where('employee_id', $employee->id)->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('verifier'));
        $this->assertTrue($user->hasRole('judge'));

        // Verify assignment created
        $this->assertDatabaseHas('assignments', [
            'user_id' => $user->id,
            'stream_id' => $stream->id,
            'stage' => 'verification',
        ]);

        // Verify audit log created
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'ADD_EVALUATOR',
            'entity_type' => 'User',
            'entity_id' => $user->id,
        ]);
    }

    public function test_admin_can_assign_employee_directly_to_stream(): void
    {
        $employee = Employee::whereDoesntHave('user.roles', function ($q) {
            $q->whereIn('code', ['verifier', 'judge']);
        })->first();

        $stream = Stream::first();

        $response = $this->actingAs($this->adminUser)
            ->withSession(['active_role' => 'admin'])
            ->post('/admin/assignments', [
                'employee_id' => $employee->id,
                'stream_id' => $stream->id,
                'stage' => 'judging',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $user = User::where('employee_id', $employee->id)->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('judge'));

        $this->assertDatabaseHas('assignments', [
            'user_id' => $user->id,
            'stream_id' => $stream->id,
            'stage' => 'judging',
        ]);
    }
}
