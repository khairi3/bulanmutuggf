<?php

namespace Tests\Unit;

use App\Models\Employee;
use App\Models\Project;
use App\Models\ScoreSheet;
use App\Models\ScoringParameter;
use App\Models\Stream;
use App\Models\User;
use App\Services\ScoringService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ScoringServiceTest extends TestCase
{
    use RefreshDatabase;

    protected ScoringService $service;

    protected Project $project;

    protected User $verifier1;

    protected User $verifier2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->service = app(ScoringService::class);

        $cic = Stream::where('code', Stream::CODE_CIC)->first();
        $leader = Employee::where('employee_index', 'EMP1007')->first()->user;

        $this->project = Project::create([
            'stream_id' => $cic->id,
            'title' => 'Project Uji Scoring CIC',
            'registration_code' => 'BMECHPG1-888',
            'status' => Project::STATUS_IN_VERIFICATION,
            'leader_employee_id' => $leader->employee->id,
        ]);

        $this->verifier1 = Employee::where('employee_index', 'EMP1002')->first()->user;
        $this->verifier2 = Employee::where('employee_index', 'EMP1003')->first()->user;
    }

    public function test_computes_weighted_score_correctly(): void
    {
        $params = $this->project->stream->scoringParameters()
            ->where('stage', ScoringParameter::STAGE_VERIFICATION)
            ->get();

        // Let's assume params have weights 30, 40, 30
        $items = [];
        foreach ($params as $p) {
            $items[$p->id] = ['score' => 80.0, 'note' => 'Bagus'];
        }

        $sheet = $this->service->saveSheet($this->project, $this->verifier1, ScoringParameter::STAGE_VERIFICATION, $items, false);

        $this->assertEquals(ScoreSheet::STATUS_DRAFT, $sheet->status);
        // If all 80 and weights sum to 100, weighted total should be 80.0
        $this->assertEquals(80.0, $sheet->total_weighted);
    }

    public function test_aggregates_multiple_verifiers_scores_by_average(): void
    {
        $params = $this->project->stream->scoringParameters()
            ->where('stage', ScoringParameter::STAGE_VERIFICATION)
            ->get();

        // Verifier 1 scores 80
        $items1 = [];
        foreach ($params as $p) {
            $items1[$p->id] = ['score' => 80.0];
        }
        $this->service->saveSheet($this->project, $this->verifier1, ScoringParameter::STAGE_VERIFICATION, $items1, true);

        // Verifier 2 scores 90
        $items2 = [];
        foreach ($params as $p) {
            $items2[$p->id] = ['score' => 90.0];
        }
        $this->service->saveSheet($this->project, $this->verifier2, ScoringParameter::STAGE_VERIFICATION, $items2, true);

        // Average should be (80 + 90) / 2 = 85.0
        $avgScore = $this->service->verificationScore($this->project);
        $this->assertEquals(85.0, $avgScore);
    }

    public function test_validates_score_bounds_between_0_and_100(): void
    {
        $params = $this->project->stream->scoringParameters()
            ->where('stage', ScoringParameter::STAGE_VERIFICATION)
            ->get();

        $items = [];
        foreach ($params as $p) {
            $items[$p->id] = ['score' => 150.0]; // Out of bounds > 100
        }

        $this->expectException(ValidationException::class);
        $this->service->saveSheet($this->project, $this->verifier1, ScoringParameter::STAGE_VERIFICATION, $items, false);
    }

    public function test_locks_score_sheet_upon_final_submit(): void
    {
        $params = $this->project->stream->scoringParameters()
            ->where('stage', ScoringParameter::STAGE_VERIFICATION)
            ->get();

        $items = [];
        foreach ($params as $p) {
            $items[$p->id] = ['score' => 85.0];
        }

        // Final submit
        $sheet = $this->service->saveSheet($this->project, $this->verifier1, ScoringParameter::STAGE_VERIFICATION, $items, true);

        $this->assertEquals(ScoreSheet::STATUS_SUBMITTED, $sheet->status);
        $this->assertNotNull($sheet->submitted_at);

        // Project status transitions to verified
        $this->assertEquals(Project::STATUS_VERIFIED, $this->project->fresh()->status);

        // Attempting to edit while locked throws ValidationException
        $this->expectException(ValidationException::class);
        $this->service->saveSheet($this->project, $this->verifier1, ScoringParameter::STAGE_VERIFICATION, $items, false);
    }

    public function test_admin_can_unlock_score_sheet_with_audit_log(): void
    {
        $admin = User::whereHas('roles', fn ($q) => $q->where('code', 'admin'))->first();

        $params = $this->project->stream->scoringParameters()
            ->where('stage', ScoringParameter::STAGE_VERIFICATION)
            ->get();

        $items = [];
        foreach ($params as $p) {
            $items[$p->id] = ['score' => 85.0];
        }

        $sheet = $this->service->saveSheet($this->project, $this->verifier1, ScoringParameter::STAGE_VERIFICATION, $items, true);

        // Admin unlocks
        $this->service->unlockSheet($sheet, $admin, 'Revisi penilaian visit ulang');

        $sheet->refresh();
        $this->assertEquals(ScoreSheet::STATUS_DRAFT, $sheet->status);
        $this->assertNull($sheet->submitted_at);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'UNLOCK_SCORE_SHEET',
            'entity_type' => 'ScoreSheet',
            'entity_id' => $sheet->id,
            'reason' => 'Revisi penilaian visit ulang',
        ]);
    }
}
