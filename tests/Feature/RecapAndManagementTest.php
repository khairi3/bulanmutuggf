<?php

namespace Tests\Feature;

use App\Console\Commands\SendDeadlineReminders;
use App\Models\CategoryOption;
use App\Models\Employee;
use App\Models\Feedback;
use App\Models\FinalResult;
use App\Models\Phase;
use App\Models\Project;
use App\Models\Role;
use App\Models\ScoreSheet;
use App\Models\ScoringParameter;
use App\Models\Stream;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Console\OutputStyle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\NullOutput;
use Tests\TestCase;

class RecapAndManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected User $verifierUser;

    protected User $judgeUser;

    protected User $participantUser;

    protected User $viewerUser;

    protected Stream $stream;

    protected CategoryOption $option;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->adminUser = User::whereHas('roles', fn ($q) => $q->where('code', 'admin'))->first();
        $this->adminUser->update(['must_change_password' => false]);

        $this->verifierUser = Employee::where('employee_index', 'EMP1002')->first()->user;
        $this->verifierUser->update(['must_change_password' => false]);

        $this->judgeUser = Employee::where('employee_index', 'EMP1004')->first()->user;
        $this->judgeUser->update(['must_change_password' => false]);

        $this->participantUser = Employee::where('employee_index', 'EMP1007')->first()->user;
        $this->participantUser->update(['must_change_password' => false]);

        $this->viewerUser = Employee::where('employee_index', 'EMP1001')->first()->user;
        $this->viewerUser->roles()->syncWithoutDetaching(
            Role::where('code', 'viewer')->pluck('id')
        );
        $this->viewerUser->update(['must_change_password' => false]);

        $this->stream = Stream::where('code', Stream::CODE_CIC)->first();
        $this->stream->update([
            'verification_weight' => 30,
            'judging_weight' => 70,
            'results_published_at' => null,
        ]);

        $dimension = $this->stream->rankingDimension();
        $this->option = $dimension->options()->first();
    }

    public function test_admin_can_access_recap_and_update_awards(): void
    {
        $project = Project::create([
            'stream_id' => $this->stream->id,
            'title' => 'Project Inovasi A',
            'registration_code' => 'CIC-TEST-001',
            'status' => Project::STATUS_FINALISED,
            'leader_employee_id' => $this->participantUser->employee->id,
        ]);
        $project->categories()->attach($this->option->id);

        FinalResult::create([
            'project_id' => $project->id,
            'stream_id' => $this->stream->id,
            'ranking_option_id' => $this->option->id,
            'verification_score' => 88.00,
            'judging_score' => 92.00,
            'verification_weight' => 30,
            'judging_weight' => 70,
            'final_score' => 90.80,
            'rank_in_category' => 1,
            'award_title' => 'Juara 1',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->withSession(['active_role' => 'admin'])
            ->get("/admin/recap?stream_id={$this->stream->id}");

        $response->assertOk();

        // Update award title to 'Best Innovation 2026'
        $postResponse = $this->actingAs($this->adminUser)
            ->withSession(['active_role' => 'admin'])
            ->post("/admin/streams/{$this->stream->id}/recap/awards", [
                'awards' => [
                    $project->id => 'Best Innovation 2026',
                ],
            ]);

        $postResponse->assertRedirect();

        $fr = FinalResult::where('project_id', $project->id)->first();
        $this->assertEquals('Best Innovation 2026', $fr->award_title);

        // Audit log created
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'UPDATE_AWARDS',
            'user_id' => $this->adminUser->id,
        ]);
    }

    public function test_admin_can_publish_winners_and_cannot_republish(): void
    {
        $project = Project::create([
            'stream_id' => $this->stream->id,
            'title' => 'Project Juara',
            'registration_code' => 'CIC-TEST-002',
            'status' => Project::STATUS_FINALISED,
            'leader_employee_id' => $this->participantUser->employee->id,
        ]);
        $project->categories()->attach($this->option->id);

        FinalResult::create([
            'project_id' => $project->id,
            'stream_id' => $this->stream->id,
            'ranking_option_id' => $this->option->id,
            'verification_score' => 90.00,
            'judging_score' => 95.00,
            'verification_weight' => 30,
            'judging_weight' => 70,
            'final_score' => 93.50,
            'rank_in_category' => 1,
            'award_title' => 'Juara 1',
        ]);

        // Publish winners
        $response = $this->actingAs($this->adminUser)
            ->withSession(['active_role' => 'admin'])
            ->post("/admin/streams/{$this->stream->id}/recap/publish");

        $response->assertRedirect();

        $this->stream->refresh();
        $this->assertTrue($this->stream->isResultsPublished());

        $project->refresh();
        $this->assertEquals(Project::STATUS_ANNOUNCED, $project->status);

        // Second attempt to publish should fail with validation error
        $republishResponse = $this->actingAs($this->adminUser)
            ->withSession(['active_role' => 'admin'])
            ->post("/admin/streams/{$this->stream->id}/recap/publish");

        $republishResponse->assertSessionHasErrors('publish');
    }

    public function test_admin_can_export_all_reports_as_csv(): void
    {
        $types = ['registration', 'verification', 'judging', 'final_ranking'];

        foreach ($types as $type) {
            $response = $this->actingAs($this->adminUser)
                ->withSession(['active_role' => 'admin'])
                ->get("/admin/export?type={$type}&stream_id={$this->stream->id}");

            $response->assertOk();
            $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
            $this->assertStringContainsString('attachment; filename=', $response->headers->get('Content-Disposition'));
            $this->assertStringContainsString('.csv', $response->headers->get('Content-Disposition'));
        }
    }

    public function test_admin_unlock_project_requires_reason_and_logs_audit(): void
    {
        $project = Project::create([
            'stream_id' => $this->stream->id,
            'title' => 'Finalised Project to Unlock',
            'registration_code' => 'CIC-LOCK-001',
            'status' => Project::STATUS_FINALISED,
            'leader_employee_id' => $this->participantUser->employee->id,
        ]);

        // Reason < 5 characters must fail validation
        $failResponse = $this->actingAs($this->adminUser)
            ->withSession(['active_role' => 'admin'])
            ->post("/admin/projects/{$project->id}/unlock", [
                'reason' => 'Fix',
            ]);

        $failResponse->assertSessionHasErrors('reason');

        // Valid reason succeeds
        $passResponse = $this->actingAs($this->adminUser)
            ->withSession(['active_role' => 'admin'])
            ->post("/admin/projects/{$project->id}/unlock", [
                'reason' => 'Permintaan perbaikan video presentasi oleh juri',
            ]);

        $passResponse->assertRedirect();

        $project->refresh();
        $this->assertEquals(Project::STATUS_QUALIFIED, $project->status);

        // Audit log created
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'UNLOCK_PROJECT',
            'entity_type' => 'Project',
            'entity_id' => $project->id,
            'user_id' => $this->adminUser->id,
            'reason' => 'Permintaan perbaikan video presentasi oleh juri',
        ]);
    }

    public function test_admin_unlock_score_sheet_requires_reason_and_recalculates(): void
    {
        $project = Project::create([
            'stream_id' => $this->stream->id,
            'title' => 'Project with Sheet',
            'registration_code' => 'CIC-SHEET-001',
            'status' => Project::STATUS_FINALISED,
            'leader_employee_id' => $this->participantUser->employee->id,
        ]);

        $sheet = ScoreSheet::create([
            'project_id' => $project->id,
            'scorer_user_id' => $this->judgeUser->id,
            'stage' => ScoringParameter::STAGE_JUDGING,
            'status' => ScoreSheet::STATUS_SUBMITTED,
            'total_weighted' => 85.00,
            'submitted_at' => Carbon::now(),
        ]);

        // Reason < 5 chars fails
        $failResponse = $this->actingAs($this->adminUser)
            ->withSession(['active_role' => 'admin'])
            ->post("/admin/score-sheets/{$sheet->id}/unlock", [
                'reason' => 'abc',
            ]);
        $failResponse->assertSessionHasErrors('reason');

        // Valid reason succeeds
        $passResponse = $this->actingAs($this->adminUser)
            ->withSession(['active_role' => 'admin'])
            ->post("/admin/score-sheets/{$sheet->id}/unlock", [
                'reason' => 'Juri keliru menginput skor kriteria standardisasi SOP',
            ]);

        $passResponse->assertRedirect();

        $sheet->refresh();
        $this->assertEquals(ScoreSheet::STATUS_DRAFT, $sheet->status);
        $this->assertNull($sheet->submitted_at);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'UNLOCK_SCORE_SHEET',
            'entity_type' => 'ScoreSheet',
            'entity_id' => $sheet->id,
            'user_id' => $this->adminUser->id,
        ]);
    }

    public function test_participant_can_reply_and_resolve_feedback(): void
    {
        $project = Project::create([
            'stream_id' => $this->stream->id,
            'title' => 'Project Feedback Test',
            'registration_code' => 'CIC-FDBK-001',
            'status' => Project::STATUS_IN_VERIFICATION,
            'leader_employee_id' => $this->participantUser->employee->id,
        ]);

        $feedback = Feedback::create([
            'project_id' => $project->id,
            'author_user_id' => $this->verifierUser->id,
            'charter_section' => 'target',
            'body' => 'Mohon perjelas baseline data sebelum perbaikan.',
            'status' => Feedback::STATUS_SENT,
        ]);

        // Participant replies to feedback
        $replyResponse = $this->actingAs($this->participantUser)
            ->withSession(['active_role' => 'participant'])
            ->post("/participant/feedback/{$feedback->id}/reply", [
                'body' => 'Baseline data sudah kami lampirkan di dokumen revisi.',
            ]);

        $replyResponse->assertRedirect();

        $this->assertDatabaseHas('feedbacks', [
            'project_id' => $project->id,
            'parent_id' => $feedback->id,
            'author_user_id' => $this->participantUser->id,
            'body' => 'Baseline data sudah kami lampirkan di dokumen revisi.',
        ]);

        // Participant resolves feedback
        $resolveResponse = $this->actingAs($this->participantUser)
            ->withSession(['active_role' => 'participant'])
            ->post("/participant/feedback/{$feedback->id}/resolve");

        $resolveResponse->assertRedirect();

        $feedback->refresh();
        $this->assertTrue($feedback->isResolved());
        $this->assertEquals($this->participantUser->id, $feedback->resolved_by);
    }

    public function test_send_deadline_reminders_command(): void
    {
        // Update existing phase ending in 3 days
        $phase = Phase::where('stream_id', $this->stream->id)
            ->where('phase_type', Phase::VERIFICATION)
            ->firstOrFail();

        $phase->update([
            'end_at' => Carbon::now()->addDays(3)->startOfDay(),
            'is_locked' => false,
        ]);

        $command = new SendDeadlineReminders;
        $input = new ArrayInput([]);
        $output = new OutputStyle($input, new NullOutput);
        $command->setOutput($output);
        $exitCode = $command->handle();

        $this->assertEquals(0, $exitCode);
    }

    public function test_viewer_can_access_executive_dashboard(): void
    {
        $response = $this->actingAs($this->viewerUser)
            ->withSession(['active_role' => 'viewer'])
            ->get('/viewer/dashboard');

        $response->assertOk();
    }
}
