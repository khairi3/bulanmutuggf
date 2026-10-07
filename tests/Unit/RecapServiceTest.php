<?php

namespace Tests\Unit;

use App\Models\CategoryOption;
use App\Models\Employee;
use App\Models\FinalResult;
use App\Models\Notification;
use App\Models\Project;
use App\Models\ScoreSheet;
use App\Models\ScoringParameter;
use App\Models\Stream;
use App\Models\User;
use App\Services\RecapService;
use Carbon\Carbon;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecapServiceTest extends TestCase
{
    use RefreshDatabase;

    protected RecapService $recapService;

    protected Stream $stream;

    protected User $verifierUser;

    protected User $judgeUser;

    protected User $adminUser;

    protected CategoryOption $option;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->recapService = app(RecapService::class);
        $this->stream = Stream::where('code', Stream::CODE_CIC)->first();
        $this->stream->update([
            'verification_weight' => 30,
            'judging_weight' => 70,
            'results_published_at' => null,
        ]);

        $dimension = $this->stream->rankingDimension();
        $this->option = $dimension->options()->first();

        $this->adminUser = User::whereHas('roles', fn ($q) => $q->where('code', 'admin'))->first();
        $this->verifierUser = Employee::where('employee_index', 'EMP1002')->first()->user;
        $this->judgeUser = Employee::where('employee_index', 'EMP1004')->first()->user;
    }

    public function test_it_calculates_weighted_scores_correctly(): void
    {
        $employee = Employee::where('employee_index', 'EMP1007')->first();

        // Project A
        $projectA = Project::create([
            'stream_id' => $this->stream->id,
            'title' => 'Project A',
            'registration_code' => 'CIC-TEST-A',
            'status' => Project::STATUS_FINALISED,
            'leader_employee_id' => $employee->id,
            'finalised_at' => Carbon::now()->subHours(2),
        ]);
        $projectA->categories()->attach($this->option->id);

        // Verifier score sheet for Project A: score = 80
        ScoreSheet::create([
            'project_id' => $projectA->id,
            'scorer_user_id' => $this->verifierUser->id,
            'stage' => ScoringParameter::STAGE_VERIFICATION,
            'status' => ScoreSheet::STATUS_SUBMITTED,
            'total_weighted' => 80.00,
            'submitted_at' => Carbon::now()->subDays(1),
        ]);

        // Judge score sheet for Project A: score = 90
        ScoreSheet::create([
            'project_id' => $projectA->id,
            'scorer_user_id' => $this->judgeUser->id,
            'stage' => ScoringParameter::STAGE_JUDGING,
            'status' => ScoreSheet::STATUS_SUBMITTED,
            'total_weighted' => 90.00,
            'submitted_at' => Carbon::now()->subDays(1),
        ]);

        $grouped = $this->recapService->recomputeRecap($this->stream);

        // Find the group corresponding to this option
        $group = $grouped->firstWhere('option.id', $this->option->id);
        $this->assertNotNull($group);
        $projects = $group['projects'];
        $this->assertCount(1, $projects);

        $row = $projects->first();

        // Expected: final_score = 90.0 (murni dari nilai juri)
        $this->assertEquals(80.0, (float) $row['verification_score']);
        $this->assertEquals(90.0, (float) $row['judging_score']);
        $this->assertEquals(90.0, (float) $row['final_score']);
        $this->assertEquals(1, $row['rank']);
        $this->assertEquals('Juara 1', $row['award_title']);

        // Check that final_results table was updated
        $fr = FinalResult::where('project_id', $projectA->id)->first();
        $this->assertNotNull($fr);
        $this->assertEquals(90.0, (float) $fr->final_score);
        $this->assertEquals(1, $fr->rank_in_category);
    }

    public function test_it_breaks_ties_according_to_rep_01(): void
    {
        $employee = Employee::where('employee_index', 'EMP1007')->first();

        // Stream weight: 50% ver, 50% jud
        $this->stream->update([
            'verification_weight' => 50,
            'judging_weight' => 50,
        ]);

        // Project 1: Ver=90, Jud=70 -> Combined = 80
        $project1 = Project::create([
            'stream_id' => $this->stream->id,
            'title' => 'Project 1',
            'registration_code' => 'CIC-TEST-1',
            'status' => Project::STATUS_FINALISED,
            'leader_employee_id' => $employee->id,
            'finalised_at' => Carbon::now()->subHours(5),
            'submitted_at' => Carbon::now()->subDays(5),
        ]);
        $project1->categories()->attach($this->option->id);

        ScoreSheet::create([
            'project_id' => $project1->id,
            'scorer_user_id' => $this->verifierUser->id,
            'stage' => ScoringParameter::STAGE_VERIFICATION,
            'status' => ScoreSheet::STATUS_SUBMITTED,
            'total_weighted' => 90.00,
            'submitted_at' => Carbon::now(),
        ]);

        ScoreSheet::create([
            'project_id' => $project1->id,
            'scorer_user_id' => $this->judgeUser->id,
            'stage' => ScoringParameter::STAGE_JUDGING,
            'status' => ScoreSheet::STATUS_SUBMITTED,
            'total_weighted' => 70.00,
            'submitted_at' => Carbon::now(),
        ]);

        // Project 2: Ver=70, Jud=90 -> Combined = 80 (Tied final score, but higher judging score)
        $project2 = Project::create([
            'stream_id' => $this->stream->id,
            'title' => 'Project 2',
            'registration_code' => 'CIC-TEST-2',
            'status' => Project::STATUS_FINALISED,
            'leader_employee_id' => $employee->id,
            'finalised_at' => Carbon::now()->subHours(2),
            'submitted_at' => Carbon::now()->subDays(2),
        ]);
        $project2->categories()->attach($this->option->id);

        ScoreSheet::create([
            'project_id' => $project2->id,
            'scorer_user_id' => $this->verifierUser->id,
            'stage' => ScoringParameter::STAGE_VERIFICATION,
            'status' => ScoreSheet::STATUS_SUBMITTED,
            'total_weighted' => 70.00,
            'submitted_at' => Carbon::now(),
        ]);

        ScoreSheet::create([
            'project_id' => $project2->id,
            'scorer_user_id' => $this->judgeUser->id,
            'stage' => ScoringParameter::STAGE_JUDGING,
            'status' => ScoreSheet::STATUS_SUBMITTED,
            'total_weighted' => 90.00,
            'submitted_at' => Carbon::now(),
        ]);

        $grouped = $this->recapService->recomputeRecap($this->stream);
        $group = $grouped->firstWhere('option.id', $this->option->id);
        $this->assertNotNull($group);
        $projects = $group['projects'];

        $this->assertCount(2, $projects);

        // Project 2 must rank #1 because judging_score (90) > project 1 judging_score (70)
        $rank1 = $projects->firstWhere('rank', 1);
        $rank2 = $projects->firstWhere('rank', 2);

        $this->assertEquals($project2->id, $rank1['project_id']);
        $this->assertEquals($project1->id, $rank2['project_id']);
    }

    public function test_it_publishes_winners_and_transitions_project_status(): void
    {
        $employee = Employee::where('employee_index', 'EMP1007')->first();

        $project = Project::create([
            'stream_id' => $this->stream->id,
            'title' => 'Project Winner',
            'registration_code' => 'CIC-WINNER-001',
            'status' => Project::STATUS_FINALISED,
            'leader_employee_id' => $employee->id,
            'finalised_at' => Carbon::now(),
        ]);
        $project->categories()->attach($this->option->id);

        $finalResult = FinalResult::create([
            'project_id' => $project->id,
            'stream_id' => $this->stream->id,
            'ranking_option_id' => $this->option->id,
            'verification_score' => 85.00,
            'judging_score' => 95.00,
            'verification_weight' => 30,
            'judging_weight' => 70,
            'final_score' => 92.00,
            'rank_in_category' => 1,
            'award_title' => 'Juara 1',
        ]);

        $result = $this->recapService->publishWinners($this->stream, $this->adminUser);

        $this->assertEquals(1, $result['total_winners']);
        $this->assertEquals(1, $result['total_projects']);

        $finalResult->refresh();
        $this->assertNotNull($finalResult->published_at);

        $project->refresh();
        $this->assertEquals(Project::STATUS_ANNOUNCED, $project->status);

        // Notification should have been sent to leader
        $notif = Notification::where('user_id', $employee->user->id)
            ->where('type', 'winner_announcement')
            ->first();

        $this->assertNotNull($notif);
        $this->assertStringContainsString('Juara 1', $notif->message);
    }
}
