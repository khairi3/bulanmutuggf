<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\Employee;
use App\Models\Feedback;
use App\Models\Project;
use App\Models\ScoreSheet;
use App\Models\ScoringParameter;
use App\Models\Stream;
use App\Models\TeamMember;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VerifierEvaluationTest extends TestCase
{
    use RefreshDatabase;

    protected User $verifierUser;

    protected Stream $cicStream;

    protected Stream $k3Stream;

    protected Project $cicProject;

    protected Project $k3Project;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->cicStream = Stream::where('code', Stream::CODE_CIC)->first();
        $this->k3Stream = Stream::where('code', Stream::CODE_K3)->first();

        // EMP1002 is assigned to CIC verification
        $this->verifierUser = Employee::where('employee_index', 'EMP1002')->first()->user;
        $this->verifierUser->update(['must_change_password' => false]);

        Assignment::create([
            'user_id' => $this->verifierUser->id,
            'stream_id' => $this->cicStream->id,
            'stage' => 'verification',
        ]);

        // Leader for projects
        $leader = Employee::where('employee_index', 'EMP1007')->first()->user;

        // CIC Project
        $this->cicProject = Project::create([
            'stream_id' => $this->cicStream->id,
            'title' => 'Project CIC Automasi Pompa',
            'registration_code' => 'BMECHPG1-010',
            'status' => Project::STATUS_SUBMITTED,
            'leader_employee_id' => $leader->employee->id,
            'submitted_at' => now(),
        ]);

        // K3 Project
        $this->k3Project = Project::create([
            'stream_id' => $this->k3Stream->id,
            'title' => 'Project K3 Safety Harness',
            'registration_code' => 'SIGAP-010',
            'status' => Project::STATUS_SUBMITTED,
            'leader_employee_id' => $leader->employee->id,
            'submitted_at' => now(),
        ]);
    }

    public function test_verifier_can_access_dashboard_and_only_sees_assigned_stream_projects(): void
    {
        $response = $this->actingAs($this->verifierUser)->get('/verifier/dashboard');
        $response->assertStatus(200);

        // Should see CIC project but NOT K3 project (since verifier is only assigned to CIC)
        $response->assertSee('BMECHPG1-010');
        $response->assertDontSee('SIGAP-010');
    }

    public function test_verifier_cannot_see_projects_with_conflict_of_interest(): void
    {
        // Add the verifier as a team member of cicProject
        TeamMember::create([
            'project_id' => $this->cicProject->id,
            'employee_id' => $this->verifierUser->employee->id,
            'member_role' => 'member',
            'can_edit' => false,
        ]);

        $response = $this->actingAs($this->verifierUser)->get('/verifier/dashboard');
        $response->assertStatus(200);

        // Project should be blocked from dashboard due to conflict of interest
        $response->assertDontSee('BMECHPG1-010');

        // Direct show access should be 403 Forbidden
        $showResponse = $this->actingAs($this->verifierUser)->get("/verifier/projects/{$this->cicProject->id}");
        $showResponse->assertStatus(403);
    }

    public function test_status_auto_transitions_from_submitted_to_in_verification_when_viewed(): void
    {
        $this->assertEquals(Project::STATUS_SUBMITTED, $this->cicProject->status);

        $response = $this->actingAs($this->verifierUser)->get("/verifier/projects/{$this->cicProject->id}");
        $response->assertStatus(200);

        $this->cicProject->refresh();
        $this->assertEquals(Project::STATUS_IN_VERIFICATION, $this->cicProject->status);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'START_VERIFICATION',
            'entity_type' => 'Project',
            'entity_id' => $this->cicProject->id,
        ]);
    }

    public function test_verifier_can_save_draft_and_send_feedback_with_unread_badge(): void
    {
        // Save draft feedback
        $this->actingAs($this->verifierUser)->post("/verifier/projects/{$this->cicProject->id}/feedback", [
            'charter_section' => 'problem_statement',
            'body' => 'Draf catatan awal perlu dicek ulang data baseline-nya.',
            'status' => 'draft',
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('feedbacks', [
            'project_id' => $this->cicProject->id,
            'status' => 'draft',
            'charter_section' => 'problem_statement',
        ]);

        // Send feedback to participant
        $this->actingAs($this->verifierUser)->post("/verifier/projects/{$this->cicProject->id}/feedback", [
            'charter_section' => 'goal_statement',
            'body' => 'Mohon tambahkan target penghematan energi spesifik dalam kWh.',
            'status' => 'sent',
        ])->assertSessionHas('success');

        $sentFeedback = Feedback::where('project_id', $this->cicProject->id)->where('status', 'sent')->first();
        $this->assertNotNull($sentFeedback);
        $this->assertNull($sentFeedback->read_at);

        // In-app notification should be created for team leader
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->cicProject->leader->user->id,
            'type' => 'feedback_received',
        ]);
    }

    public function test_participant_can_mark_feedback_as_read(): void
    {
        $leader = $this->cicProject->leader->user;
        $leader->update(['must_change_password' => false]);

        $feedback = Feedback::create([
            'project_id' => $this->cicProject->id,
            'author_user_id' => $this->verifierUser->id,
            'charter_section' => 'problem_statement',
            'body' => 'Catatan revisi',
            'status' => 'sent',
            'sent_at' => now(),
            'read_at' => null,
        ]);

        $response = $this->actingAs($leader)->postJson("/participant/feedback/{$feedback->id}/read");
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        $feedback->refresh();
        $this->assertNotNull($feedback->read_at);
    }

    public function test_verifier_can_record_site_visit_log_with_photos(): void
    {
        Storage::fake('local');

        $file1 = UploadedFile::fake()->image('visit1.jpg');
        $file2 = UploadedFile::fake()->image('visit2.png');

        $response = $this->actingAs($this->verifierUser)->post("/verifier/projects/{$this->cicProject->id}/visits", [
            'visit_date' => '2026-10-10',
            'location' => 'Pabrik PG1 Area Pengolahan',
            'notes' => 'Observasi mesin berjalan baik, SOP dipatuhi seluruh operator.',
            'photos' => [$file1, $file2],
        ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('verification_visits', [
            'project_id' => $this->cicProject->id,
            'location' => 'Pabrik PG1 Area Pengolahan',
        ]);

        $this->assertDatabaseHas('project_files', [
            'project_id' => $this->cicProject->id,
            'file_category' => 'visit_photo',
        ]);
    }

    public function test_verifier_can_save_draft_score_and_submit_final_score_locking_project_to_verified(): void
    {
        $params = $this->cicStream->scoringParameters()
            ->where('stage', ScoringParameter::STAGE_VERIFICATION)
            ->get();

        $scores = [];
        foreach ($params as $p) {
            $scores[$p->id] = ['score' => 88.0, 'note' => 'Implementasi solid'];
        }

        // 1. Save Draft
        $this->actingAs($this->verifierUser)->post("/verifier/projects/{$this->cicProject->id}/score", [
            'scores' => $scores,
            'submit' => false,
        ])->assertSessionHas('success');

        $sheet = ScoreSheet::where('project_id', $this->cicProject->id)
            ->where('scorer_user_id', $this->verifierUser->id)
            ->first();

        $this->assertEquals(ScoreSheet::STATUS_DRAFT, $sheet->status);
        $this->assertEquals(88.0, $sheet->total_weighted);

        // 2. Submit Final
        $this->actingAs($this->verifierUser)->post("/verifier/projects/{$this->cicProject->id}/score", [
            'scores' => $scores,
            'submit' => true,
        ])->assertSessionHas('success');

        $sheet->refresh();
        $this->assertEquals(ScoreSheet::STATUS_SUBMITTED, $sheet->status);
        $this->assertNotNull($sheet->submitted_at);

        // Project status transitions to verified
        $this->cicProject->refresh();
        $this->assertEquals(Project::STATUS_VERIFIED, $this->cicProject->status);
    }

    public function test_verifier_can_save_and_submit_quantified_scores_pass_5_followup_3_notpass_1(): void
    {
        $params = $this->cicStream->scoringParameters()
            ->where('stage', ScoringParameter::STAGE_VERIFICATION)
            ->orderBy('sort_order')
            ->get();

        $this->assertNotEmpty($params);

        // Assign quantified scores: Pass = 5, Need Follow Up = 3, Not Pass = 1
        $scores = [];
        $values = [5.0, 3.0, 1.0, 5.0, 3.0, 5.0];
        foreach ($params as $idx => $p) {
            $scoreVal = $values[$idx % count($values)];
            $scores[$p->id] = ['score' => $scoreVal, 'note' => "Observasi skor {$scoreVal}"];
        }

        $response = $this->actingAs($this->verifierUser)->post("/verifier/projects/{$this->cicProject->id}/score", [
            'scores' => $scores,
            'submit' => true,
        ]);

        $response->assertSessionHas('success');

        $sheet = ScoreSheet::where('project_id', $this->cicProject->id)
            ->where('scorer_user_id', $this->verifierUser->id)
            ->first();

        $this->assertEquals(ScoreSheet::STATUS_SUBMITTED, $sheet->status);
        $this->assertGreaterThan(0, $sheet->total_weighted);
        $this->assertLessThanOrEqual(5.0, $sheet->total_weighted);

        // Verify each item score in DB
        foreach ($sheet->items as $item) {
            $this->assertContains((float) $item->score, [1.0, 3.0, 5.0]);
        }
    }

    public function test_unauthorized_user_cannot_access_verifier_project(): void
    {
        // Participant trying to access verifier show page should get 403
        $participant = Employee::where('employee_index', 'EMP1008')->first()->user;
        $participant->update(['must_change_password' => false]);

        $response = $this->actingAs($participant)->get("/verifier/projects/{$this->cicProject->id}");
        $response->assertStatus(403);
    }

    public function test_verifier_can_delete_submitted_project_with_reason(): void
    {
        $reason = 'Project ini teridentifikasi sebagai duplikasi pendaftaran sebelumnya.';

        $response = $this->actingAs($this->verifierUser)->delete("/verifier/projects/{$this->cicProject->id}", [
            'reason' => $reason,
        ]);

        $response->assertRedirect('/verifier/dashboard');
        $response->assertSessionHas('success');

        // Check project is soft deleted and reason is recorded
        $this->assertSoftDeleted('projects', [
            'id' => $this->cicProject->id,
            'deletion_reason' => $reason,
            'deleted_by' => $this->verifierUser->id,
        ]);

        // Check AuditLog
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'DELETE_PROJECT_BY_VERIFIER',
            'entity_id' => $this->cicProject->id,
        ]);

        // Check Notification created for team/leader
        $this->assertDatabaseHas('notifications', [
            'type' => 'project_deleted',
        ]);
    }

    public function test_delete_project_requires_valid_reason(): void
    {
        // Empty reason
        $response = $this->actingAs($this->verifierUser)->delete("/verifier/projects/{$this->cicProject->id}", [
            'reason' => '',
        ]);
        $response->assertSessionHasErrors('reason');

        // Too short reason (< 5 chars)
        $response2 = $this->actingAs($this->verifierUser)->delete("/verifier/projects/{$this->cicProject->id}", [
            'reason' => 'abc',
        ]);
        $response2->assertSessionHasErrors('reason');

        // Ensure project was not deleted
        $this->assertDatabaseHas('projects', [
            'id' => $this->cicProject->id,
            'deleted_at' => null,
        ]);
    }

    public function test_verifier_cannot_delete_unassigned_project(): void
    {
        $response = $this->actingAs($this->verifierUser)->delete("/verifier/projects/{$this->k3Project->id}", [
            'reason' => 'Alasan yang cukup panjang untuk dihapus',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('projects', [
            'id' => $this->k3Project->id,
            'deleted_at' => null,
        ]);
    }

    public function test_verifier_cannot_delete_locked_or_convention_project(): void
    {
        $this->cicProject->update(['status' => Project::STATUS_FINALISED, 'is_locked' => true]);

        $response = $this->actingAs($this->verifierUser)->delete("/verifier/projects/{$this->cicProject->id}", [
            'reason' => 'Alasan yang cukup panjang untuk dihapus',
        ]);

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('projects', [
            'id' => $this->cicProject->id,
            'deleted_at' => null,
        ]);
    }

    public function test_emi_parameters_have_configured_score_ranges_and_verifier_can_score_within_range(): void
    {
        $energyStream = Stream::where('code', Stream::CODE_ENERGY)->first();
        $this->assertNotNull($energyStream);

        // Assign verifier to energy stream
        Assignment::create([
            'user_id' => $this->verifierUser->id,
            'stream_id' => $energyStream->id,
            'stage' => 'verification',
        ]);

        $leader = Employee::where('employee_index', 'EMP1007')->first()->user;
        $energyProject = Project::create([
            'stream_id' => $energyStream->id,
            'title' => 'Project Energy Boiler Efficiency',
            'registration_code' => 'ENRG-010',
            'status' => Project::STATUS_SUBMITTED,
            'leader_employee_id' => $leader->employee->id,
            'submitted_at' => now(),
        ]);

        // Verify parameters have ranges 1-15
        $params = ScoringParameter::where('stream_id', $energyStream->id)
            ->where('stage', 'verification')
            ->get();
        $this->assertGreaterThan(0, $params->count());

        foreach ($params as $param) {
            $this->assertEquals(15, (int) $param->max_score);
            $this->assertEquals(1, (int) $param->not_pass_min);
            $this->assertEquals(5, (int) $param->not_pass_max);
            $this->assertEquals(6, (int) $param->follow_up_min);
            $this->assertEquals(10, (int) $param->follow_up_max);
            $this->assertEquals(11, (int) $param->pass_min);
            $this->assertEquals(15, (int) $param->pass_max);
        }

        // Verifier submits scores with 1-15 range values (e.g. 13, 8, 4)
        $scoresPayload = [];
        foreach ($params as $idx => $param) {
            $scoreVal = ($idx % 3 === 0) ? 14 : (($idx % 3 === 1) ? 8 : 4);
            $scoresPayload[$param->id] = [
                'score' => $scoreVal,
                'note' => "Observasi kriteria {$param->name}",
            ];
        }

        $response = $this->actingAs($this->verifierUser)->post("/verifier/projects/{$energyProject->id}/score", [
            'scores' => $scoresPayload,
            'submit' => true,
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('score_sheets', [
            'project_id' => $energyProject->id,
            'scorer_user_id' => $this->verifierUser->id,
            'stage' => 'verification',
            'status' => 'submitted',
        ]);

        $sheet = ScoreSheet::where('project_id', $energyProject->id)
            ->where('scorer_user_id', $this->verifierUser->id)
            ->first();
        $this->assertGreaterThan(5.0, (float) $sheet->total_weighted);
    }

    public function test_admin_can_update_parameter_score_ranges(): void
    {
        $adminUser = User::whereHas('roles', fn ($q) => $q->where('code', \App\Models\Role::ADMIN))->first();
        $this->assertNotNull($adminUser);
        $adminUser->update(['must_change_password' => false]);
        $energyStream = Stream::where('code', Stream::CODE_ENERGY)->first();

        $param = ScoringParameter::where('stream_id', $energyStream->id)
            ->where('stage', 'verification')
            ->first();

        $response = $this->actingAs($adminUser)->post("/admin/streams/{$energyStream->id}/scoring-parameters", [
            'stage' => 'verification',
            'parameters' => [
                [
                    'id' => $param->id,
                    'name' => $param->name,
                    'group_name' => $param->group_name,
                    'weight' => 100.00,
                    'order' => $param->order,
                    'rubric' => $param->rubric,
                    'min_score' => 1,
                    'max_score' => 20,
                    'not_pass_min' => 1,
                    'not_pass_max' => 7,
                    'follow_up_min' => 8,
                    'follow_up_max' => 14,
                    'pass_min' => 15,
                    'pass_max' => 20,
                ],
            ],
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('scoring_parameters', [
            'stream_id' => $energyStream->id,
            'stage' => 'verification',
            'name' => $param->name,
            'max_score' => 20,
            'not_pass_min' => 1,
            'not_pass_max' => 7,
            'follow_up_min' => 8,
            'follow_up_max' => 14,
            'pass_min' => 15,
            'pass_max' => 20,
        ]);
    }
}

