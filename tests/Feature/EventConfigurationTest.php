<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Event;
use App\Models\Phase;
use App\Models\Stream;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class EventConfigurationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_admin_can_create_new_event(): void
    {
        $admin = Employee::where('employee_index', 'ADMIN001')->first()->user;

        $response = $this->actingAs($admin)->post('/admin/events', [
            'name' => 'Bulan Mutu GGF 2027',
            'year' => 2027,
            'status' => 'draft',
            'final_weight_verification' => 50,
            'final_weight_judging' => 50,
        ]);

        $this->assertDatabaseHas('events', [
            'name' => 'Bulan Mutu GGF 2027',
            'year' => 2027,
            'status' => 'draft',
        ]);
    }

    public function test_only_one_event_can_be_active_at_a_time(): void
    {
        $admin = Employee::where('employee_index', 'ADMIN001')->first()->user;

        // BMG 2026 is currently active
        $this->assertEquals(1, Event::where('status', Event::STATUS_ACTIVE)->count());

        // Create new active event
        $this->actingAs($admin)->post('/admin/events', [
            'name' => 'Bulan Mutu GGF 2027',
            'year' => 2027,
            'status' => 'active',
            'final_weight_verification' => 40,
            'final_weight_judging' => 60,
        ]);

        // Assert still only 1 active event exists
        $this->assertEquals(1, Event::where('status', Event::STATUS_ACTIVE)->count());

        $newEvent = Event::where('year', 2027)->first();
        $this->assertEquals('active', $newEvent->status);

        $oldEvent = Event::where('year', 2026)->first();
        $this->assertEquals('closed', $oldEvent->status);
    }

    public function test_admin_can_toggle_stream_status(): void
    {
        $admin = Employee::where('employee_index', 'ADMIN001')->first()->user;
        $cic = Stream::where('code', Stream::CODE_CIC)->first();

        $this->assertTrue($cic->is_active);

        $this->actingAs($admin)->post("/admin/streams/{$cic->id}/toggle");
        $cic->refresh();
        $this->assertFalse($cic->is_active);

        $this->actingAs($admin)->post("/admin/streams/{$cic->id}/toggle");
        $cic->refresh();
        $this->assertTrue($cic->is_active);
    }

    public function test_admin_can_update_stream_rules(): void
    {
        $admin = Employee::where('employee_index', 'ADMIN001')->first()->user;
        $cic = Stream::where('code', Stream::CODE_CIC)->first();

        $response = $this->actingAs($admin)->post("/admin/streams/{$cic->id}/rules", [
            'team_min' => 4,
            'team_max' => 8,
            'max_projects_per_employee' => 3,
            'code_pattern' => 'CIC-{AREA}-{NNN}',
        ]);

        $response->assertSessionHas('success');
        $cic->refresh();
        $this->assertEquals(4, $cic->team_min);
        $this->assertEquals(8, $cic->team_max);
        $this->assertEquals('CIC-{AREA}-{NNN}', $cic->code_pattern);
    }

    public function test_scoring_parameters_validation_requires_exact_hundred_percent(): void
    {
        $admin = Employee::where('employee_index', 'ADMIN001')->first()->user;
        $cic = Stream::where('code', Stream::CODE_CIC)->first();

        // 1. Invalid sum: 40 + 40 = 80% (fails)
        $failResponse = $this->actingAs($admin)->post("/admin/streams/{$cic->id}/scoring-parameters", [
            'stage' => 'verification',
            'parameters' => [
                ['name' => 'Param 1', 'rubric' => 'Rubrik 1', 'weight' => 40],
                ['name' => 'Param 2', 'rubric' => 'Rubrik 2', 'weight' => 40],
            ],
        ]);
        $failResponse->assertSessionHas('error');

        // 2. Valid sum: 40 + 60 = 100% (succeeds)
        $successResponse = $this->actingAs($admin)->post("/admin/streams/{$cic->id}/scoring-parameters", [
            'stage' => 'verification',
            'parameters' => [
                ['name' => 'Param A', 'rubric' => 'Rubrik A', 'weight' => 40],
                ['name' => 'Param B', 'rubric' => 'Rubrik B', 'weight' => 60],
            ],
        ]);
        $successResponse->assertSessionHas('success');

        $this->assertDatabaseHas('scoring_parameters', [
            'stream_id' => $cic->id,
            'stage' => 'verification',
            'name' => 'Param A',
            'weight' => 40,
        ]);
    }

    public function test_admin_can_assign_evaluator_to_stream(): void
    {
        $admin = Employee::where('employee_index', 'ADMIN001')->first()->user;
        $verifier = Employee::where('employee_index', 'EMP1002')->first()->user;
        $cic = Stream::where('code', Stream::CODE_CIC)->first();

        $response = $this->actingAs($admin)->post('/admin/assignments', [
            'user_id' => $verifier->id,
            'stream_id' => $cic->id,
            'stage' => 'verification',
        ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('assignments', [
            'user_id' => $verifier->id,
            'stream_id' => $cic->id,
            'stage' => 'verification',
        ]);
    }

    public function test_phase_middleware_blocks_access_when_phase_is_closed(): void
    {
        $participant = Employee::where('employee_index', 'EMP1007')->first()->user;
        $cic = Stream::where('code', Stream::CODE_CIC)->first();

        // Lock registration phase for test
        $regPhase = $cic->phases()->where('phase_type', Phase::REGISTRATION)->first();
        $regPhase->update(['is_locked' => true]);

        // A dummy route protected by phase middleware
        Route::middleware(['web', 'auth', 'phase:registration'])->get('/test-reg-phase', function (Request $request) {
            return response()->json(['status' => 'open']);
        });

        // Request with stream_id parameter
        $response = $this->actingAs($participant)->getJson("/test-reg-phase?stream_id={$cic->id}");

        $response->assertStatus(403);
        $this->assertStringContainsString('tidak sedang aktif', $response->json('message'));
    }

    public function test_admin_can_add_new_stream_to_event(): void
    {
        $admin = Employee::where('employee_index', 'ADMIN001')->first()->user;
        $event = Event::where('status', Event::STATUS_ACTIVE)->first();

        $response = $this->actingAs($admin)->post("/admin/events/{$event->id}/streams", [
            'name' => 'TPM Inovasi Mesin',
            'code' => 'TPM2',
            'code_pattern' => 'TPM2-{NNN}',
            'team_min' => 2,
            'team_max' => 5,
            'max_projects_per_employee' => 1,
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('streams', [
            'event_id' => $event->id,
            'code' => 'TPM2',
            'name' => 'TPM Inovasi Mesin',
        ]);
    }
}
