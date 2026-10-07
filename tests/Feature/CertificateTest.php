<?php

namespace Tests\Feature;

use App\Models\Certificate;
use App\Models\Employee;
use App\Models\Event;
use App\Models\FinalResult;
use App\Models\Project;
use App\Models\Role;
use App\Models\Setting;
use App\Models\Stream;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\CertificateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class CertificateTest extends TestCase
{
    use RefreshDatabase;

    protected User $participantUser;
    protected Employee $participantEmployee;
    protected User $memberUser;
    protected Employee $memberEmployee;
    protected User $adminUser;
    protected Event $event;
    protected Stream $stream;
    protected Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        $participantRole = Role::firstOrCreate(['code' => 'participant'], ['name' => 'Participant']);
        $adminRole = Role::firstOrCreate(['code' => 'admin'], ['name' => 'Admin']);

        // Leader
        $this->participantEmployee = Employee::create([
            'employee_index' => 'EMP-LEADER-01',
            'full_name' => 'Budi Santoso (Ketua)',
            'email' => 'budi.leader@example.com',
            'unit' => 'PG 1',
            'division' => 'Plantation',
            'position' => 'Supervisor',
            'is_active' => true,
        ]);
        $this->participantUser = User::create([
            'employee_id' => $this->participantEmployee->id,
            'password' => bcrypt('password123'),
            'must_change_password' => false,
        ]);
        $this->participantUser->roles()->attach($participantRole);

        // Member
        $this->memberEmployee = Employee::create([
            'employee_index' => 'EMP-MEMBER-02',
            'full_name' => 'Siti Rahma (Anggota)',
            'email' => 'siti.member@example.com',
            'unit' => 'PG 1',
            'division' => 'Plantation',
            'position' => 'Staff',
            'is_active' => true,
        ]);
        $this->memberUser = User::create([
            'employee_id' => $this->memberEmployee->id,
            'password' => bcrypt('password123'),
            'must_change_password' => false,
        ]);
        $this->memberUser->roles()->attach($participantRole);

        // Admin
        $adminEmployee = Employee::create([
            'employee_index' => 'EMP-ADMIN-99',
            'full_name' => 'Admin Mutu GGF',
            'email' => 'admin.mutu@example.com',
            'unit' => 'HO',
            'division' => 'Corporate Quality',
            'position' => 'Quality Head',
            'is_active' => true,
        ]);
        $this->adminUser = User::create([
            'employee_id' => $adminEmployee->id,
            'password' => bcrypt('password123'),
            'must_change_password' => false,
        ]);
        $this->adminUser->roles()->attach($adminRole);

        // Event & Stream
        $this->event = Event::create([
            'name' => 'Bulan Mutu GGF 2027',
            'year' => 2027,
            'status' => 'active',
            'final_weight_verification' => 40,
            'final_weight_judging' => 60,
        ]);

        $this->stream = Stream::create([
            'event_id' => $this->event->id,
            'name' => 'Continuous Improvement Convention (CIC)',
            'code' => 'CIC',
            'registration_code_pattern' => 'CIC-2027-{NNN}',
            'is_active' => true,
        ]);

        // Project
        $this->project = Project::create([
            'event_id' => $this->event->id,
            'stream_id' => $this->stream->id,
            'leader_employee_id' => $this->participantEmployee->id,
            'title' => 'Optimalisasi Pengurangan Waste Nanas di Canning Line 3',
            'registration_code' => 'CIC-2027-001',
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        TeamMember::create([
            'project_id' => $this->project->id,
            'employee_id' => $this->memberEmployee->id,
            'role' => 'Anggota Tim',
        ]);
    }

    public function test_participant_cannot_download_certificate_when_not_published(): void
    {
        Setting::set('certificate_published', '0');

        $response = $this->actingAs($this->participantUser)
            ->get(route('participant.projects.certificate.download', $this->project));

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }

    public function test_participant_can_download_personalized_certificate_when_published(): void
    {
        Setting::set('certificate_published', '1');

        $response = $this->actingAs($this->participantUser)
            ->get(route('participant.projects.certificate.download', $this->project));

        $response->assertOk();
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));

        // Verify Certificate DB record was generated
        $cert = Certificate::where('project_id', $this->project->id)
            ->where('employee_id', $this->participantEmployee->id)
            ->first();

        $this->assertNotNull($cert);
        $this->assertEquals('Ketua Tim', $cert->role_in_team);
        $this->assertStringContainsString('BMG/2027/CERT-PAR/', $cert->certificate_number);
        $this->assertNotNull($cert->verify_code);
    }

    public function test_member_can_download_personalized_certificate_with_member_role(): void
    {
        Setting::set('certificate_published', '1');

        $response = $this->actingAs($this->memberUser)
            ->get(route('participant.projects.certificate.download', $this->project));

        $response->assertOk();
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));

        $cert = Certificate::where('project_id', $this->project->id)
            ->where('employee_id', $this->memberEmployee->id)
            ->first();

        $this->assertNotNull($cert);
        $this->assertEquals('Anggota Tim', $cert->role_in_team);
    }

    public function test_non_member_cannot_download_project_certificate(): void
    {
        Setting::set('certificate_published', '1');

        $outsiderEmployee = Employee::create([
            'employee_index' => 'EMP-OUTSIDER-03',
            'full_name' => 'Orang Lain',
            'email' => 'outsider@example.com',
            'unit' => 'PG 2',
            'division' => 'Sales',
            'position' => 'Staff',
            'is_active' => true,
        ]);
        $outsiderUser = User::create([
            'employee_id' => $outsiderEmployee->id,
            'password' => bcrypt('password123'),
            'must_change_password' => false,
        ]);

        $response = $this->actingAs($outsiderUser)
            ->get(route('participant.projects.certificate.download', $this->project));

        $response->assertForbidden();
    }

    public function test_public_verification_endpoint_validates_valid_certificate(): void
    {
        $service = app(CertificateService::class);
        $cert = $service->generateForProjectMember(
            $this->project,
            $this->participantEmployee,
            'Ketua Tim',
            'participation'
        );

        $response = $this->get(route('certificates.verify', $cert->verify_code));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Viewer/VerifyCertificate')
            ->where('isValid', true)
            ->where('certificate.certificate_number', $cert->certificate_number)
            ->where('certificate.recipient_name', $this->participantEmployee->full_name)
            ->where('certificate.category.code', 'participation')
        );
    }

    public function test_public_verification_endpoint_rejects_invalid_code(): void
    {
        $response = $this->get(route('certificates.verify', 'NON-EXISTENT-CODE-12345'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Viewer/VerifyCertificate')
            ->where('isValid', false)
            ->where('certificate', null)
        );
    }

    public function test_admin_can_toggle_certificate_publish_and_update_signatory(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->post(route('admin.certificates.toggle-publish'), [
                'published' => true,
            ]);

        $response->assertRedirect();
        $this->assertEquals('1', Setting::get('certificate_published'));

        // Signatory update for 2 officials
        $sigResponse = $this->actingAs($this->adminUser)
            ->post(route('admin.certificates.signatory'), [
                'signatory1_name' => 'Tommy Wattimena',
                'signatory1_title' => 'Managing Director Great Giant Foods',
                'signatory2_name' => 'Ir. Hendra Kusuma',
                'signatory2_title' => 'Head of Corporate Quality & CI',
            ]);

        $sigResponse->assertRedirect();
        $this->assertEquals('Tommy Wattimena', Setting::get('certificate_signatory1_name'));
        $this->assertEquals('Managing Director Great Giant Foods', Setting::get('certificate_signatory1_title'));
        $this->assertEquals('Ir. Hendra Kusuma', Setting::get('certificate_signatory2_name'));
        $this->assertEquals('Head of Corporate Quality & CI', Setting::get('certificate_signatory2_title'));
    }

    public function test_admin_can_upload_custom_certificate_template(): void
    {
        $file = UploadedFile::fake()->image('custom_certificate_template.png', 1920, 1080);

        $response = $this->actingAs($this->adminUser)
            ->post(route('admin.certificates.template.upload'), [
                'template_image' => $file,
            ]);

        $response->assertRedirect();
        $savedPath = Setting::get('certificate_template_image');
        $this->assertNotEmpty($savedPath);
        $this->assertStringStartsWith('/images/certificates/cert-template-', $savedPath);

        // Cleanup created file
        $filePath = public_path(ltrim($savedPath, '/'));
        if (file_exists($filePath)) {
            unlink($filePath);
        }
    }

    public function test_admin_can_reset_certificate_template(): void
    {
        Setting::set('certificate_template_image', '/images/certificates/custom.png');

        $response = $this->actingAs($this->adminUser)
            ->post(route('admin.certificates.template.reset'));

        $response->assertRedirect();
        $this->assertEmpty(Setting::get('certificate_template_image'));
    }

    public function test_admin_can_preview_sample_certificate(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->get(route('admin.certificates.preview'));

        $response->assertOk();
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
    }

    public function test_certificate_category_winner_for_project_with_judging_award(): void
    {
        Setting::set('certificate_published', '1');

        FinalResult::create([
            'project_id' => $this->project->id,
            'verification_score' => 88.5,
            'judging_score' => 92.0,
            'verification_weight' => 40,
            'judging_weight' => 60,
            'final_score' => 90.6,
            'rank_in_category' => 1,
            'award_title' => 'Juara 1 Stream CIC',
        ]);

        $response = $this->actingAs($this->participantUser)
            ->get(route('participant.projects.certificate.download', $this->project));

        $response->assertOk();
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));

        $cert = Certificate::where('project_id', $this->project->id)
            ->where('employee_id', $this->participantEmployee->id)
            ->first();

        $this->assertNotNull($cert);
        $this->assertEquals('winner', $cert->type);
        $this->assertEquals('Juara 1 Stream CIC', $cert->award_title);
        $this->assertStringContainsString('CERT-WIN', $cert->certificate_number);
    }

    public function test_certificate_category_finalist_for_qualified_convention_project(): void
    {
        Setting::set('certificate_published', '1');

        $this->project->update(['status' => 'qualified']);

        $response = $this->actingAs($this->participantUser)
            ->get(route('participant.projects.certificate.download', $this->project));

        $response->assertOk();

        $cert = Certificate::where('project_id', $this->project->id)
            ->where('employee_id', $this->participantEmployee->id)
            ->first();

        $this->assertNotNull($cert);
        $this->assertEquals('finalist', $cert->type);
        $this->assertStringContainsString('CERT-FIN', $cert->certificate_number);
    }
}
