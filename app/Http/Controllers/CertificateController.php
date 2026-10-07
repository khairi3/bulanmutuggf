<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\Event;
use App\Models\Project;
use App\Models\Setting;
use App\Services\CertificateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class CertificateController extends Controller
{
    public function __construct(
        protected CertificateService $certificateService
    ) {}

    /**
     * Download certificate for the authenticated user for a specific project.
     */
    public function download(Request $request, Project $project): HttpResponse|RedirectResponse
    {
        $user = $request->user();
        $employee = $user?->employee;

        if (! $employee) {
            abort(SymfonyResponse::HTTP_FORBIDDEN, 'Profil karyawan tidak ditemukan.');
        }

        // Check if user is a member or leader, or admin
        $isLeader = $project->leader_employee_id === $employee->id;
        $isMember = $project->teamMembers()->where('employee_id', $employee->id)->exists();
        $isAdmin = $user->hasRole('admin');

        if (! $isLeader && ! $isMember && ! $isAdmin) {
            abort(SymfonyResponse::HTTP_FORBIDDEN, 'Anda bukan anggota tim dari project ini.');
        }

        // Check publication status
        if (! $this->certificateService->isPublished() && ! $isAdmin) {
            return redirect()->back()->with('error', 'Sertifikat peserta belum dipublikasikan oleh Panitia Bulan Mutu GGF.');
        }

        // Determine target employee for certificate
        $targetEmployee = $employee;
        $roleInTeam = $isLeader ? 'Ketua Tim' : 'Anggota Tim';

        // Admin might specify target employee_id
        if ($isAdmin && $request->query('employee_id')) {
            $targetEmployee = \App\Models\Employee::findOrFail($request->query('employee_id'));
            $roleInTeam = ($project->leader_employee_id === $targetEmployee->id) ? 'Ketua Tim' : 'Anggota Tim';
        }

        $category = $this->certificateService->resolveCategory($project);

        $certificate = $this->certificateService->generateForProjectMember(
            $project,
            $targetEmployee,
            $roleInTeam,
            $category['type'],
            $category['award_title']
        );

        $pdf = $this->certificateService->renderPdf($certificate);

        $safeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $targetEmployee->full_name);
        $filename = "Sertifikat_BMG_{$project->registration_code}_{$safeName}.pdf";

        return $pdf->download($filename);
    }

    /**
     * Public verification endpoint (scanned via QR Code).
     */
    public function verify(string $verify_code): Response
    {
        $certificate = Certificate::with(['project.stream', 'project.event', 'employee'])
            ->where('verify_code', $verify_code)
            ->first();

        $category = match ($certificate?->type) {
            'winner' => [
                'code' => 'winner',
                'name' => 'Juara',
                'label' => '🏆 Juara (Pemenang Penilaian Juri)',
                'badge_class' => 'bg-amber-100 text-amber-900 border-amber-300',
                'description' => 'Pemenang berdasarkan hasil penilaian resmi Dewan Juri',
            ],
            'finalist' => [
                'code' => 'finalist',
                'name' => 'Finalis',
                'label' => '⭐ Finalis Convention Day',
                'badge_class' => 'bg-emerald-100 text-emerald-900 border-emerald-300',
                'description' => 'Peserta yang berhasil lolos ke tahap Convention Day',
            ],
            default => [
                'code' => 'participation',
                'name' => 'Participant',
                'label' => '🎖️ Participant (Peserta Partisipasi)',
                'badge_class' => 'bg-slate-100 text-slate-800 border-slate-300',
                'description' => 'Peserta yang ikut berpartisipasi dalam event Bulan Mutu GGF',
            ],
        };

        return Inertia::render('Viewer/VerifyCertificate', [
            'isValid' => $certificate !== null,
            'certificate' => $certificate ? [
                'certificate_number' => $certificate->certificate_number,
                'type' => $certificate->type,
                'category' => $category,
                'role_in_team' => $certificate->role_in_team,
                'award_title' => $certificate->award_title,
                'issued_at' => $certificate->issued_at?->format('d F Y'),
                'recipient_name' => $certificate->employee?->full_name,
                'employee_index' => $certificate->employee?->employee_index,
                'unit' => $certificate->employee?->unit ?? 'Great Giant Foods',
                'project_title' => $certificate->project?->title,
                'registration_code' => $certificate->project?->registration_code,
                'stream_name' => $certificate->project?->stream?->name,
                'event_name' => $certificate->project?->event?->name ?? 'Bulan Mutu Great Giant Foods 2027',
            ] : null,
        ]);
    }

    /**
     * Admin: Toggle publication status of certificates.
     */
    public function togglePublish(Request $request): RedirectResponse
    {
        $request->validate([
            'published' => 'required|boolean',
        ]);

        $published = $request->boolean('published');
        $this->certificateService->setPublished($published);

        // If published, ensure batch generation for active event
        if ($published) {
            $activeEvent = Event::active();
            if ($activeEvent) {
                $count = $this->certificateService->generateBatchForEvent($activeEvent);
                return redirect()->back()->with('success', "Sertifikat berhasil dipublikasikan! {$count} e-sertifikat peserta siap diunduh.");
            }
        }

        return redirect()->back()->with('success', $published ? 'Sertifikat berhasil dipublikasikan.' : 'Publikasi sertifikat telah dinonaktifkan.');
    }

    /**
     * Admin: Update signatory settings.
     */
    public function updateSignatory(Request $request): RedirectResponse
    {
        $request->validate([
            'signatory1_name' => 'nullable|string|max:255',
            'signatory1_title' => 'nullable|string|max:255',
            'signatory2_name' => 'nullable|string|max:255',
            'signatory2_title' => 'nullable|string|max:255',
            'signatory_name' => 'nullable|string|max:255',
            'signatory_title' => 'nullable|string|max:255',
        ]);

        $sig1Name = $request->input('signatory1_name', $request->input('signatory_name'));
        $sig1Title = $request->input('signatory1_title', $request->input('signatory_title'));
        $sig2Name = $request->input('signatory2_name', 'Steering Committee Chairman');
        $sig2Title = $request->input('signatory2_title', 'Head of Corporate Quality & CI');

        if ($sig1Name) {
            Setting::set('certificate_signatory1_name', $sig1Name);
            Setting::set('certificate_signatory_name', $sig1Name);
        }
        if ($sig1Title) {
            Setting::set('certificate_signatory1_title', $sig1Title);
            Setting::set('certificate_signatory_title', $sig1Title);
        }
        if ($sig2Name) {
            Setting::set('certificate_signatory2_name', $sig2Name);
        }
        if ($sig2Title) {
            Setting::set('certificate_signatory2_title', $sig2Title);
        }

        return redirect()->back()->with('success', 'Konfigurasi 2 penandatangan sertifikat berhasil diperbarui.');
    }

    /**
     * Admin: Upload custom background image for certificate template.
     */
    public function uploadTemplate(Request $request): RedirectResponse
    {
        $request->validate([
            'template_image' => 'required|file|mimes:jpeg,png,jpg,webp|max:15360',
        ]);

        $file = $request->file('template_image');
        $extension = $file->getClientOriginalExtension();
        $filename = 'cert-template-' . time() . '.' . $extension;
        $destinationPath = public_path('images/certificates');

        if (! file_exists($destinationPath)) {
            mkdir($destinationPath, 0755, true);
        }

        $file->move($destinationPath, $filename);
        $publicUrl = '/images/certificates/' . $filename;

        Setting::set('certificate_template_image', $publicUrl);

        return redirect()->back()->with('success', 'Template sertifikat kustom berhasil diunggah dan diaktifkan.');
    }

    /**
     * Admin: Reset certificate template to default built-in design.
     */
    public function resetTemplate(): RedirectResponse
    {
        Setting::set('certificate_template_image', '');

        return redirect()->back()->with('success', 'Template sertifikat berhasil di-reset ke desain bawaan sistem.');
    }

    /**
     * Admin: Update certificate template layout settings.
     */
    public function updateTemplateSettings(Request $request): RedirectResponse
    {
        $request->validate([
            'show_system_title' => 'required|boolean',
            'recipient_name_top' => 'required|integer|min:50|max:160',
        ]);

        Setting::set('certificate_show_system_title', $request->boolean('show_system_title') ? '1' : '0');
        Setting::set('certificate_recipient_name_top', (string) $request->integer('recipient_name_top', 107));

        return redirect()->back()->with('success', 'Pengaturan tata letak template sertifikat berhasil disimpan.');
    }

    /**
     * Admin: Preview sample certificate with current template & signatories.
     */
    public function previewSample(Request $request, ?Project $project = null): HttpResponse
    {
        $user = $request->user();
        if (! $user || ! $user->hasRole('admin')) {
            abort(SymfonyResponse::HTTP_FORBIDDEN);
        }

        $targetProject = $project ?? Project::with(['stream.event', 'leader'])->first();

        if (! $targetProject) {
            $employee = new \App\Models\Employee([
                'employee_index' => 'SAMPLE-001',
                'full_name' => 'Nama Peserta Contoh',
                'unit' => 'PG 1 - Plantation',
            ]);
            $stream = new \App\Models\Stream(['name' => 'Continuous Improvement Convention (CIC)']);
            $event = new Event(['name' => 'Bulan Mutu Great Giant Foods 2027', 'year' => 2027]);
            $stream->setRelation('event', $event);

            $targetProject = new Project([
                'title' => 'Inisiatif Pengurangan Reject Produk & Efisiensi Energi',
                'registration_code' => 'BMG-2027-SAMPLE',
            ]);
            $targetProject->setRelation('stream', $stream);
            $targetProject->setRelation('leader', $employee);
        }

        $targetEmployee = $targetProject->leader ?? $user->employee ?? new \App\Models\Employee([
            'employee_index' => 'EMP-001',
            'full_name' => $user->name ?? 'Peserta Inovasi',
            'unit' => 'Great Giant Foods',
        ]);

        $sampleType = $request->query('category', $request->query('type', 'winner'));
        $awardTitle = match ($sampleType) {
            'winner' => $request->query('award_title', 'Juara 1 Stream CIC'),
            default => null,
        };

        $typeCode = match ($sampleType) {
            'winner' => 'WIN',
            'finalist' => 'FIN',
            default => 'PAR',
        };

        $certificate = new Certificate([
            'certificate_number' => 'BMG/' . date('Y') . '/CERT-' . $typeCode . '/SAMPLE',
            'type' => $sampleType,
            'role_in_team' => 'Ketua Tim',
            'award_title' => $awardTitle,
            'issued_at' => now(),
            'verify_code' => 'SAMPLE-VERIFY-CODE',
        ]);
        $certificate->setRelation('project', $targetProject);
        $certificate->setRelation('employee', $targetEmployee);

        $pdf = $this->certificateService->renderPdf($certificate);

        return $pdf->stream('Pratinjau_Template_Sertifikat.pdf');
    }
}
