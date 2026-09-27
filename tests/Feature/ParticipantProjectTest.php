<?php

namespace Tests\Feature;

use App\Models\CategoryOption;
use App\Models\CharterVersion;
use App\Models\Employee;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\Stream;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ParticipantProjectTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        Storage::fake('local');
    }

    public function test_participant_can_save_draft_project(): void
    {
        $leader = Employee::where('employee_index', 'EMP1007')->first()->user;
        $cic = Stream::where('code', Stream::CODE_CIC)->first();

        $response = $this->actingAs($leader)->postJson('/participant/projects/draft', [
            'stream_id' => $cic->id,
            'title' => 'Otomasi Sortir Buah Nanas',
            'executive_summary' => 'Ringkasan draft',
            'milestones' => [['milestone' => 'Tahap 1', 'target_date' => '2026-10-01', 'pic' => 'Dedi', 'status' => 'Plan']],
        ]);

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertTrue($data['success']);
        $this->assertNotNull($data['project_id']);

        $this->assertDatabaseHas('projects', [
            'id' => $data['project_id'],
            'title' => 'Otomasi Sortir Buah Nanas',
            'status' => 'draft',
            'registration_code' => null,
        ]);
    }

    public function test_participant_can_submit_project_and_receives_unique_code(): void
    {
        $leader = Employee::where('employee_index', 'EMP1007')->first()->user;
        $member1 = Employee::where('employee_index', 'EMP1008')->first();
        $member2 = Employee::where('employee_index', 'EMP1009')->first();
        $cic = Stream::where('code', Stream::CODE_CIC)->first();

        $bOpt = CategoryOption::where('abbreviation', 'B')->first();
        $mechOpt = CategoryOption::where('abbreviation', 'MECH')->first();
        $pg1Opt = CategoryOption::where('abbreviation', 'PG1')->first();

        $response = $this->actingAs($leader)->post('/participant/projects/submit', [
            'stream_id' => $cic->id,
            'title' => 'Otomasi Mesin Pengering Hasil Panen',
            'executive_summary' => 'Executive summary inovasi mesin pengering',
            'problem_statement' => 'Biaya listrik pengering konvensional sangat tinggi',
            'goal_statement' => 'Menurunkan konsumsi daya listrik 25%',
            'category_option_ids' => [$bOpt->id, $mechOpt->id, $pg1Opt->id],
            'member_employee_ids' => [$member1->id, $member2->id], // 3 total members (meets min 3)
            'milestones' => [
                ['milestone' => 'Analisis Awal', 'target_date' => '2026-10-15', 'pic' => 'Dedi', 'status' => 'Done'],
            ],
            'initiatives' => [
                ['initiative' => 'Modifikasi Sensor Inverter', 'description' => 'Mengatur rpm motor otomatis'],
            ],
            'agree_originality' => true,
        ]);

        $project = Project::where('title', 'Otomasi Mesin Pengering Hasil Panen')->first();
        $this->assertNotNull($project);
        $this->assertEquals('submitted', $project->status);
        $this->assertEquals('BMECHPG1-001', $project->registration_code);
        $this->assertNotNull($project->submitted_at);

        // Assert redirect to show page
        $response->assertRedirect("/participant/projects/{$project->id}");

        // Assert v1 charter snapshot was created
        $this->assertDatabaseHas('charter_versions', [
            'project_id' => $project->id,
            'version_no' => 1,
            'title' => 'Otomasi Mesin Pengering Hasil Panen',
        ]);

        // Assert notifications were created for all team members (Task 3.10)
        $this->assertDatabaseHas('notifications', [
            'user_id' => $leader->id,
            'type' => 'project_submitted',
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $member1->user->id,
            'type' => 'project_submitted',
        ]);
    }

    public function test_participant_can_submit_project_with_supporting_files_and_video_url(): void
    {
        $leader = Employee::where('employee_index', 'EMP1007')->first()->user;
        $member1 = Employee::where('employee_index', 'EMP1008')->first();
        $member2 = Employee::where('employee_index', 'EMP1009')->first();
        $cic = Stream::where('code', Stream::CODE_CIC)->first();

        $bOpt = CategoryOption::where('abbreviation', 'B')->first();
        $mechOpt = CategoryOption::where('abbreviation', 'MECH')->first();
        $pg1Opt = CategoryOption::where('abbreviation', 'PG1')->first();

        $dummyPpt = UploadedFile::fake()->create('presentasi.pptx', 2048, 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        $dummyPdf = UploadedFile::fake()->create('lampiran_data.pdf', 1024, 'application/pdf');

        $response = $this->actingAs($leader)->post('/participant/projects/submit', [
            'stream_id' => $cic->id,
            'title' => 'Inovasi Panel Tenaga Surya Pabrik',
            'executive_summary' => 'Executive summary inovasi tenaga surya',
            'problem_statement' => 'Biaya energi listrik tinggi',
            'goal_statement' => 'Efisiensi energi 30%',
            'category_option_ids' => [$bOpt->id, $mechOpt->id, $pg1Opt->id],
            'member_employee_ids' => [$member1->id, $member2->id],
            'milestones' => [
                ['milestone' => 'Instalasi Inverter', 'target_date' => '2026-11-01', 'pic' => 'Dedi', 'status' => 'Plan'],
            ],
            'initiatives' => [
                ['initiative' => 'Pemasangan Solar Cell', 'description' => 'Pasang di atap gedung'],
            ],
            'files' => [$dummyPpt, $dummyPdf],
            'external_url' => 'https://youtu.be/dummyvideo123',
            'agree_originality' => true,
        ]);

        $project = Project::where('title', 'Inovasi Panel Tenaga Surya Pabrik')->first();
        $this->assertNotNull($project);
        $this->assertEquals('submitted', $project->status);
        $response->assertRedirect("/participant/projects/{$project->id}");

        // Assert supporting files stored
        $this->assertDatabaseHas('project_files', [
            'project_id' => $project->id,
            'original_name' => 'presentasi.pptx',
            'file_category' => 'supporting',
        ]);
        $this->assertDatabaseHas('project_files', [
            'project_id' => $project->id,
            'original_name' => 'lampiran_data.pdf',
            'file_category' => 'supporting',
        ]);

        // Assert video link stored
        $this->assertDatabaseHas('project_files', [
            'project_id' => $project->id,
            'external_url' => 'https://youtu.be/dummyvideo123',
            'file_category' => 'final_video',
        ]);
    }

    public function test_submit_validates_team_size_limits(): void
    {
        $leader = Employee::where('employee_index', 'EMP1007')->first()->user;
        $cic = Stream::where('code', Stream::CODE_CIC)->first(); // requires min 3 members

        $bOpt = CategoryOption::where('abbreviation', 'B')->first();

        // Submit with only 1 person (leader alone) -> should fail validation
        $response = $this->actingAs($leader)->post('/participant/projects/submit', [
            'stream_id' => $cic->id,
            'title' => 'Project Gagal Tim Kurang',
            'executive_summary' => 'Ringkasan',
            'problem_statement' => 'Masalah',
            'goal_statement' => 'Sasaran',
            'category_option_ids' => [$bOpt->id],
            'member_employee_ids' => [], // 1 person total < 3 min
            'milestones' => [['milestone' => 'M1']],
            'initiatives' => [['initiative' => 'I1']],
            'agree_originality' => '1',
        ]);

        $response->assertSessionHasErrors('member_employee_ids');
    }

    public function test_participant_can_update_charter_and_creates_version_two_snapshot(): void
    {
        $leader = Employee::where('employee_index', 'EMP1007')->first()->user;
        $cic = Stream::where('code', Stream::CODE_CIC)->first();

        // Create submitted project with v1
        $project = Project::create([
            'stream_id' => $cic->id,
            'title' => 'Project Awal v1',
            'status' => 'submitted',
            'registration_code' => 'BMECHPG1-002',
            'leader_employee_id' => $leader->employee_id,
        ]);

        $v1 = CharterVersion::create([
            'project_id' => $project->id,
            'version_no' => 1,
            'title' => 'Project Awal v1',
            'executive_summary' => 'Summary v1',
            'problem_statement' => 'Problem v1',
            'goal_statement' => 'Goal v1',
            'milestones' => [['milestone' => 'M1']],
            'initiatives' => [['initiative' => 'I1']],
            'change_note' => 'Initial',
            'created_by' => $leader->id,
        ]);
        $project->update(['current_version_id' => $v1->id]);

        // Submit update (v1 -> v2)
        $response = $this->actingAs($leader)->post("/participant/projects/{$project->id}/charter", [
            'title' => 'Project Terupdate v2',
            'executive_summary' => 'Summary v2 dengan data tambahan',
            'problem_statement' => 'Problem v2 diperjelas',
            'goal_statement' => 'Goal v2 terukur',
            'change_note' => 'Menambahkan data baseline metrik hasil verifikasi awal',
            'milestones' => [['milestone' => 'M1 Revised']],
            'initiatives' => [['initiative' => 'I1 Improved']],
        ]);

        $response->assertSessionHas('success');

        $project->refresh();
        $this->assertEquals('Project Terupdate v2', $project->title);

        // Verify v1 still exists
        $this->assertDatabaseHas('charter_versions', [
            'project_id' => $project->id,
            'version_no' => 1,
            'title' => 'Project Awal v1',
        ]);

        // Verify v2 exists and is current
        $this->assertDatabaseHas('charter_versions', [
            'project_id' => $project->id,
            'version_no' => 2,
            'title' => 'Project Terupdate v2',
            'change_note' => 'Menambahkan data baseline metrik hasil verifikasi awal',
        ]);
        $this->assertEquals(2, $project->currentVersion->version_no);
    }

    public function test_participant_can_upload_and_download_file(): void
    {
        $leader = Employee::where('employee_index', 'EMP1007')->first()->user;
        $cic = Stream::where('code', Stream::CODE_CIC)->first();

        $project = Project::create([
            'stream_id' => $cic->id,
            'title' => 'Project With Files',
            'status' => 'submitted',
            'registration_code' => 'BMECHPG1-003',
            'leader_employee_id' => $leader->employee_id,
        ]);

        $file = UploadedFile::fake()->create('charter_presentation.pdf', 1024, 'application/pdf');

        $uploadResponse = $this->actingAs($leader)->post("/participant/projects/{$project->id}/files", [
            'file' => $file,
            'file_category' => 'supporting',
        ]);

        $uploadResponse->assertSessionHas('success');

        $projectFile = ProjectFile::where('project_id', $project->id)->first();
        $this->assertNotNull($projectFile);
        $this->assertEquals('charter_presentation.pdf', $projectFile->original_name);

        // Leader can download file
        $downloadResponse = $this->actingAs($leader)->get("/participant/projects/{$project->id}/files/{$projectFile->id}/download");
        $downloadResponse->assertStatus(200);

        // Leader can preview file inline without forcing download
        $previewResponse = $this->actingAs($leader)->get("/participant/projects/{$project->id}/files/{$projectFile->id}/preview");
        $previewResponse->assertStatus(200);
        $previewResponse->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringContainsString('inline', $previewResponse->headers->get('Content-Disposition') ?? '');

        // Test ?inline=1 query parameter on download route
        $inlineDownloadResponse = $this->actingAs($leader)->get("/participant/projects/{$project->id}/files/{$projectFile->id}/download?inline=1");
        $inlineDownloadResponse->assertStatus(200);
        $this->assertStringContainsString('inline', $inlineDownloadResponse->headers->get('Content-Disposition') ?? '');

        // Unauthorized participant (EMP1010 not in team) is blocked with 403
        $otherParticipant = Employee::where('employee_index', 'EMP1010')->first()->user;
        $forbiddenResponse = $this->actingAs($otherParticipant)->get("/participant/projects/{$project->id}/files/{$projectFile->id}/download");
        $forbiddenResponse->assertStatus(403);
    }

    public function test_participant_can_view_draft_project(): void
    {
        $leader = Employee::where('employee_index', 'EMP1007')->first()->user;
        $cic = Stream::where('code', Stream::CODE_CIC)->first();

        $draft = Project::create([
            'stream_id' => $cic->id,
            'title' => 'Project Draft Pertanian',
            'status' => 'draft',
            'registration_code' => null,
            'leader_employee_id' => $leader->employee_id,
        ]);

        $response = $this->actingAs($leader)->get("/participant/projects/{$draft->id}");
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Participant/Projects/Show')
            ->where('project.id', $draft->id)
            ->where('project.status', 'draft')
        );
    }

    public function test_participant_can_load_wizard_with_existing_draft(): void
    {
        $leader = Employee::where('employee_index', 'EMP1007')->first()->user;
        $cic = Stream::where('code', Stream::CODE_CIC)->first();

        $draft = Project::create([
            'stream_id' => $cic->id,
            'title' => 'Draft Inovasi Baru',
            'status' => 'draft',
            'leader_employee_id' => $leader->employee_id,
        ]);

        $response = $this->actingAs($leader)->get("/participant/projects/create?draft_id={$draft->id}");
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Participant/Projects/RegisterWizard')
            ->where('draftProject.id', $draft->id)
            ->where('draftProject.title', 'Draft Inovasi Baru')
        );
    }
}
