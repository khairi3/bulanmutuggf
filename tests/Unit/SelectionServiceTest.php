<?php

namespace Tests\Unit;

use App\Models\CategoryOption;
use App\Models\Employee;
use App\Models\Project;
use App\Models\ScoreSheet;
use App\Models\ScoringParameter;
use App\Models\SelectionDecision;
use App\Models\Stream;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\ProjectAccessService;
use App\Services\ScoringService;
use App\Services\SelectionService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SelectionServiceTest extends TestCase
{
    use RefreshDatabase;

    protected SelectionService $service;

    protected Stream $stream;

    protected CategoryOption $optionMech;

    protected CategoryOption $optionElec;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $scoring = app(ScoringService::class);
        $access = app(ProjectAccessService::class);
        $notifier = app(NotificationService::class);
        $this->service = new SelectionService($scoring, $access, $notifier);

        $this->stream = Stream::where('code', Stream::CODE_CIC)->first();

        // Admin User
        $this->adminUser = User::whereHas('roles', fn ($q) => $q->where('code', 'admin'))->first();

        // Category options
        $dimension = $this->stream->rankingDimension();
        $this->optionMech = $dimension->options->first();
        $this->optionElec = $dimension->options->skip(1)->first();

        $this->optionMech->update(['quota' => 1]);
        $this->optionElec->update(['quota' => 2]);
    }

    public function test_ranking_orders_projects_by_verification_score_descending(): void
    {
        $leader = Employee::where('employee_index', 'EMP1007')->first()->user;

        // Project A with score 85
        $projectA = Project::create([
            'stream_id' => $this->stream->id,
            'title' => 'Project A',
            'registration_code' => 'CIC-TEST-001',
            'status' => Project::STATUS_VERIFIED,
            'leader_employee_id' => $leader->employee->id,
        ]);
        $projectA->categories()->attach($this->optionMech->id);

        // Project B with score 92
        $projectB = Project::create([
            'stream_id' => $this->stream->id,
            'title' => 'Project B',
            'registration_code' => 'CIC-TEST-002',
            'status' => Project::STATUS_VERIFIED,
            'leader_employee_id' => $leader->employee->id,
        ]);
        $projectB->categories()->attach($this->optionMech->id);

        // Add scores
        $param = ScoringParameter::where('stream_id', $this->stream->id)
            ->where('stage', ScoringParameter::STAGE_VERIFICATION)
            ->first();

        $sheetA = ScoreSheet::create([
            'project_id' => $projectA->id,
            'scorer_user_id' => $this->adminUser->id,
            'stage' => ScoringParameter::STAGE_VERIFICATION,
            'status' => 'submitted',
            'total_weighted' => 85.0,
            'submitted_at' => now(),
        ]);
        $sheetA->items()->create([
            'parameter_id' => $param->id,
            'score' => 85.0,
        ]);

        $sheetB = ScoreSheet::create([
            'project_id' => $projectB->id,
            'scorer_user_id' => $this->adminUser->id,
            'stage' => ScoringParameter::STAGE_VERIFICATION,
            'status' => 'submitted',
            'total_weighted' => 92.0,
            'submitted_at' => now(),
        ]);
        $sheetB->items()->create([
            'parameter_id' => $param->id,
            'score' => 92.0,
        ]);

        $rankings = $this->service->ranking($this->stream);
        $mechGroup = $rankings->firstWhere('option.id', $this->optionMech->id);

        $this->assertNotNull($mechGroup);
        $this->assertEquals(1, $mechGroup['quota']);
        $this->assertCount(2, $mechGroup['projects']);

        // Rank 1 must be Project B (score 92), Rank 2 Project A (score 85)
        $this->assertEquals($projectB->id, $mechGroup['projects'][0]['id']);
        $this->assertEquals(92.0, $mechGroup['projects'][0]['verification_score']);
        $this->assertEquals($projectA->id, $mechGroup['projects'][1]['id']);
        $this->assertEquals(85.0, $mechGroup['projects'][1]['verification_score']);
    }

    public function test_save_decisions_saves_draft(): void
    {
        $leader = Employee::where('employee_index', 'EMP1007')->first()->user;

        $project = Project::create([
            'stream_id' => $this->stream->id,
            'title' => 'Project Draft Decision',
            'registration_code' => 'CIC-TEST-003',
            'status' => Project::STATUS_VERIFIED,
            'leader_employee_id' => $leader->employee->id,
        ]);

        $this->service->saveDecisions(
            stream: $this->stream,
            projectIds: [$project->id],
            qualifiedIds: [$project->id],
            actor: $this->adminUser
        );

        $decision = SelectionDecision::where('project_id', $project->id)->first();
        $this->assertNotNull($decision);
        $this->assertEquals(SelectionDecision::QUALIFIED, $decision->decision);
        $this->assertEquals($this->adminUser->id, $decision->decided_by);
    }

    public function test_publish_locks_stream_and_updates_project_statuses(): void
    {
        $leader = Employee::where('employee_index', 'EMP1007')->first()->user;

        $projectQualified = Project::create([
            'stream_id' => $this->stream->id,
            'title' => 'Project Qualified',
            'registration_code' => 'CIC-TEST-QUAL',
            'status' => Project::STATUS_VERIFIED,
            'leader_employee_id' => $leader->employee->id,
        ]);

        $projectUnqualified = Project::create([
            'stream_id' => $this->stream->id,
            'title' => 'Project Unqualified',
            'registration_code' => 'CIC-TEST-UNQUAL',
            'status' => Project::STATUS_VERIFIED,
            'leader_employee_id' => $leader->employee->id,
        ]);

        SelectionDecision::create([
            'project_id' => $projectQualified->id,
            'decision' => SelectionDecision::QUALIFIED,
            'decided_by' => $this->adminUser->id,
        ]);

        SelectionDecision::create([
            'project_id' => $projectUnqualified->id,
            'decision' => SelectionDecision::NOT_QUALIFIED,
            'decided_by' => $this->adminUser->id,
        ]);

        $result = $this->service->publish($this->stream, $this->adminUser);

        $this->assertEquals(1, $result['qualified']);
        $this->assertEquals(1, $result['unqualified']);

        $this->stream->refresh();
        $this->assertTrue($this->stream->isSelectionPublished());

        $projectQualified->refresh();
        $projectUnqualified->refresh();

        $this->assertEquals(Project::STATUS_QUALIFIED, $projectQualified->status);
        $this->assertEquals(Project::STATUS_UNQUALIFIED, $projectUnqualified->status);
    }

    public function test_override_decision_records_audit_log_and_switches_status(): void
    {
        $this->stream->update(['selection_published_at' => now()]);
        $leader = Employee::where('employee_index', 'EMP1007')->first()->user;

        $project = Project::create([
            'stream_id' => $this->stream->id,
            'title' => 'Project to Override',
            'registration_code' => 'CIC-TEST-OVR',
            'status' => Project::STATUS_UNQUALIFIED,
            'leader_employee_id' => $leader->employee->id,
        ]);

        $this->service->override(
            project: $project,
            decision: 'qualified',
            admin: $this->adminUser,
            reason: 'Penetapan kuota wild card divisi agribisnis'
        );

        $project->refresh();
        $this->assertEquals(Project::STATUS_QUALIFIED, $project->status);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'OVERRIDE_SELECTION',
            'entity_type' => 'Project',
            'entity_id' => $project->id,
            'user_id' => $this->adminUser->id,
        ]);
    }
}
