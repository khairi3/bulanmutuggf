<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\CategoryDimension;
use App\Models\CategoryOption;
use App\Models\Employee;
use App\Models\Project;
use App\Models\ScoringParameter;
use App\Models\SelectionDecision;
use App\Models\Stream;
use App\Models\TeamMember;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SelectionAndJudgingTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected User $verifierUser;

    protected User $judgeUser;

    protected User $participantUser;

    protected Stream $stream;

    protected CategoryOption $option;

    protected Project $qualifiedProject;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        Storage::fake('local');

        $this->adminUser = User::whereHas('roles', fn ($q) => $q->where('code', 'admin'))->first();
        $this->adminUser->update(['must_change_password' => false]);

        $this->verifierUser = Employee::where('employee_index', 'EMP1002')->first()->user;
        $this->verifierUser->update(['must_change_password' => false]);

        $this->judgeUser = Employee::where('employee_index', 'EMP1004')->first()->user;
        $this->judgeUser->update(['must_change_password' => false]);

        $this->participantUser = Employee::where('employee_index', 'EMP1007')->first()->user;
        $this->participantUser->update(['must_change_password' => false]);

        $this->stream = Stream::where('code', Stream::CODE_CIC)->first();

        // Assign judge to CIC stream for judging
        Assignment::create([
            'user_id' => $this->judgeUser->id,
            'stream_id' => $this->stream->id,
            'stage' => 'judging',
        ]);

        // Category option
        $dimension = CategoryDimension::where('stream_id', $this->stream->id)->first();
        $this->option = CategoryOption::where('dimension_id', $dimension->id)->first();

        // Create test project
        $this->qualifiedProject = Project::create([
            'stream_id' => $this->stream->id,
            'title' => 'Project Otomasi Sortir Buah',
            'registration_code' => 'CIC-SORT-001',
            'status' => Project::STATUS_QUALIFIED,
            'leader_employee_id' => $this->participantUser->employee->id,
        ]);

        $this->qualifiedProject->categories()->attach($this->option->id);
    }

    public function test_admin_and_verifier_can_access_selection_index(): void
    {
        $responseAdmin = $this->actingAs($this->adminUser)
            ->withSession(['active_role' => 'admin'])
            ->get('/admin/selection');
        $responseAdmin->assertOk();

        $responseVerifier = $this->actingAs($this->verifierUser)
            ->withSession(['active_role' => 'verifier'])
            ->get('/verifier/selection');
        $responseVerifier->assertOk();

        $responseParticipant = $this->actingAs($this->participantUser)
            ->withSession(['active_role' => 'participant'])
            ->get('/admin/selection');
        $responseParticipant->assertForbidden();
    }

    public function test_admin_can_publish_selection_results(): void
    {
        // Unverified project turning into qualified
        $project = Project::create([
            'stream_id' => $this->stream->id,
            'title' => 'Project Pending Selection',
            'registration_code' => 'CIC-SEL-002',
            'status' => Project::STATUS_VERIFIED,
            'leader_employee_id' => $this->participantUser->employee->id,
        ]);

        SelectionDecision::create([
            'project_id' => $project->id,
            'decision' => SelectionDecision::QUALIFIED,
            'decided_by' => $this->adminUser->id,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->withSession(['active_role' => 'admin'])
            ->post("/admin/streams/{$this->stream->id}/selection/publish");

        $response->assertRedirect();
        $this->stream->refresh();
        $this->assertTrue($this->stream->isSelectionPublished());

        $project->refresh();
        $this->assertEquals(Project::STATUS_QUALIFIED, $project->status);
    }

    public function test_verifier_cannot_publish_selection(): void
    {
        $response = $this->actingAs($this->verifierUser)
            ->withSession(['active_role' => 'verifier'])
            ->post("/admin/streams/{$this->stream->id}/selection/publish");

        $response->assertForbidden();
    }

    public function test_participant_finalise_validation_checks(): void
    {
        // 1. Fails without confirmation code matching registration code
        $responseWrongCode = $this->actingAs($this->participantUser)
            ->withSession(['active_role' => 'participant'])
            ->post("/participant/projects/{$this->qualifiedProject->id}/finalise", [
                'confirmation_code' => 'WRONG-CODE',
            ]);
        $responseWrongCode->assertSessionHasErrors('confirmation_code');

        // 2. Fails without final presentation PDF uploaded
        $responseNoFile = $this->actingAs($this->participantUser)
            ->withSession(['active_role' => 'participant'])
            ->post("/participant/projects/{$this->qualifiedProject->id}/finalise", [
                'confirmation_code' => $this->qualifiedProject->registration_code,
            ]);
        $responseNoFile->assertSessionHasErrors('files');

        // Upload presentation PDF
        $file = UploadedFile::fake()->create('presentasi_final.pdf', 1024, 'application/pdf');
        $this->actingAs($this->participantUser)
            ->withSession(['active_role' => 'participant'])
            ->post("/participant/projects/{$this->qualifiedProject->id}/files", [
                'file' => $file,
                'file_category' => 'final_presentation',
            ]);

        // 3. Succeeds with correct code and presentation file
        $responseSuccess = $this->actingAs($this->participantUser)
            ->withSession(['active_role' => 'participant'])
            ->post("/participant/projects/{$this->qualifiedProject->id}/finalise", [
                'confirmation_code' => $this->qualifiedProject->registration_code,
            ]);

        $responseSuccess->assertRedirect();
        $this->qualifiedProject->refresh();
        $this->assertEquals(Project::STATUS_FINALISED, $this->qualifiedProject->status);
        $this->assertTrue((bool) $this->qualifiedProject->is_locked);
        $this->assertNotNull($this->qualifiedProject->finalised_at);
    }

    public function test_judge_dashboard_and_conflict_of_interest_isolation(): void
    {
        // Mark selection as published
        $this->stream->update(['selection_published_at' => now()]);

        // Project 1: Neutral project (Judge should see this)
        $project1 = Project::create([
            'stream_id' => $this->stream->id,
            'title' => 'Project Neutral Finalis',
            'registration_code' => 'CIC-JUR-001',
            'status' => Project::STATUS_FINALISED,
            'leader_employee_id' => $this->participantUser->employee->id,
        ]);

        // Project 2: Conflict project (Judge is team member -> must be HIDDEN)
        $projectConflict = Project::create([
            'stream_id' => $this->stream->id,
            'title' => 'Project Conflict of Interest',
            'registration_code' => 'CIC-JUR-002',
            'status' => Project::STATUS_FINALISED,
            'leader_employee_id' => $this->participantUser->employee->id,
        ]);
        TeamMember::create([
            'project_id' => $projectConflict->id,
            'employee_id' => $this->judgeUser->employee->id,
            'role_in_team' => 'Anggota',
        ]);

        $response = $this->actingAs($this->judgeUser)
            ->withSession(['active_role' => 'judge'])
            ->get('/judge/dashboard');

        $response->assertOk();
        $response->assertSee('CIC-JUR-001');
        $response->assertDontSee('CIC-JUR-002');
    }

    public function test_judge_can_access_cockpit_and_submit_scores(): void
    {
        $this->stream->update(['selection_published_at' => now()]);

        $this->qualifiedProject->update(['status' => Project::STATUS_FINALISED]);

        // Judge views cockpit
        $responseView = $this->actingAs($this->judgeUser)
            ->withSession(['active_role' => 'judge'])
            ->get("/judge/projects/{$this->qualifiedProject->id}");
        $responseView->assertOk();

        // Parameters for judging stage
        $judgingParams = ScoringParameter::where('stream_id', $this->stream->id)
            ->where('stage', ScoringParameter::STAGE_JUDGING)
            ->get();

        $this->assertNotEmpty($judgingParams);

        $scoresPayload = $judgingParams->map(fn ($p) => [
            'scoring_parameter_id' => $p->id,
            'score' => 88.5,
            'notes' => 'Pemaparan sangat meyakinkan',
        ])->all();

        // Submit final scores
        $responseSubmit = $this->actingAs($this->judgeUser)
            ->withSession(['active_role' => 'judge'])
            ->post("/judge/projects/{$this->qualifiedProject->id}/score", [
                'scores' => $scoresPayload,
                'submit' => true,
            ]);

        $responseSubmit->assertRedirect();

        $this->assertDatabaseHas('score_sheets', [
            'project_id' => $this->qualifiedProject->id,
            'scorer_user_id' => $this->judgeUser->id,
            'stage' => ScoringParameter::STAGE_JUDGING,
            'status' => 'submitted',
        ]);
    }
}
