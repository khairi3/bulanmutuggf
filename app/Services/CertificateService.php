<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\Employee;
use App\Models\Event;
use App\Models\Project;
use App\Models\Setting;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;

class CertificateService
{
    /**
     * Check if certificates have been published by Admin.
     */
    public function isPublished(): bool
    {
        return Setting::get('certificate_published', '0') === '1';
    }

    /**
     * Publish or unpublish certificates.
     */
    public function setPublished(bool $published): void
    {
        Setting::set('certificate_published', $published ? '1' : '0');
    }

    /**
     * Generate or retrieve a certificate for an individual project member.
     */
    public function generateForProjectMember(
        Project $project,
        Employee $employee,
        string $roleInTeam = 'Anggota Tim',
        string $type = 'participation',
        ?string $awardTitle = null
    ): Certificate {
        $certificate = Certificate::where('project_id', $project->id)
            ->where('employee_id', $employee->id)
            ->first();

        if ($certificate) {
            // Update type and award_title if category has changed (e.g. upgraded to winner)
            if ($certificate->type !== $type || $certificate->award_title !== $awardTitle) {
                $certificate->update([
                    'type' => $type,
                    'award_title' => $awardTitle,
                ]);
            }
            return $certificate;
        }

        $year = $project->event?->year ?? date('Y');
        $typeCode = match ($type) {
            'winner' => 'WIN',
            'finalist' => 'FIN',
            default => 'PAR',
        };

        // Generate sequential unique number for the year
        $count = Certificate::whereYear('issued_at', $year)->count() + 1;
        $certNumber = sprintf('BMG/%s/CERT-%s/%05d', $year, $typeCode, $count);

        return Certificate::create([
            'project_id' => $project->id,
            'employee_id' => $employee->id,
            'certificate_number' => $certNumber,
            'type' => $type,
            'role_in_team' => $roleInTeam,
            'award_title' => $awardTitle,
            'issued_at' => now(),
            'verify_code' => Str::random(24),
        ]);
    }

    /**
     * Resolve certificate category, type, and award title for a project.
     *
     * Categories:
     * - 'winner': Juara (pemenang berdasarkan penilaian juri / final_results)
     * - 'finalist': Finalis (peserta yang lolos ke convention day)
     * - 'participation': Participants (peserta yang ikut berpartisipasi)
     *
     * @return array{type: string, award_title: ?string, label: string, category_description: string}
     */
    public function resolveCategory(Project $project): array
    {
        $project->loadMissing(['finalResult']);

        // 1. Juara: Pemenang berdasarkan penilaian juri (memiliki award_title atau masuk rank 1-3)
        if ($project->finalResult && ($project->finalResult->award_title || ($project->finalResult->rank_in_category && $project->finalResult->rank_in_category <= 3))) {
            $awardTitle = $project->finalResult->award_title ?: ('Juara ' . $project->finalResult->rank_in_category);
            return [
                'type' => 'winner',
                'award_title' => $awardTitle,
                'label' => 'Juara',
                'category_description' => 'Pemenang Berdasarkan Penilaian Juri',
            ];
        }

        // 2. Finalis: Peserta yang lolos ke convention day
        if (in_array($project->status, [Project::STATUS_QUALIFIED, Project::STATUS_JUDGING, Project::STATUS_FINALISED, Project::STATUS_ANNOUNCED], true)
            || ($project->finalResult !== null)) {
            return [
                'type' => 'finalist',
                'award_title' => null,
                'label' => 'Finalis',
                'category_description' => 'Peserta yang Lolos ke Convention Day',
            ];
        }

        // 3. Participants: Peserta yang ikut berpartisipasi
        return [
            'type' => 'participation',
            'award_title' => null,
            'label' => 'Participant',
            'category_description' => 'Peserta yang Ikut Berpartisipasi',
        ];
    }

    /**
     * Generate certificates in batch for all participants in an event.
     */
    public function generateBatchForEvent(Event $event): int
    {
        $projects = Project::where('event_id', $event->id)
            ->whereIn('status', ['submitted', 'in_verification', 'verified', 'qualified', 'finalised', 'judging', 'announced'])
            ->with(['leader', 'teamMembers.employee', 'finalResult'])
            ->get();

        $generated = 0;

        foreach ($projects as $project) {
            $category = $this->resolveCategory($project);

            // Leader
            if ($project->leader) {
                $this->generateForProjectMember($project, $project->leader, 'Ketua Tim', $category['type'], $category['award_title']);
                $generated++;
            }

            // Team Members
            foreach ($project->teamMembers as $member) {
                if ($member->employee && $member->employee_id !== $project->leader_employee_id) {
                    $this->generateForProjectMember($project, $member->employee, 'Anggota Tim', $category['type'], $category['award_title']);
                    $generated++;
                }
            }
        }

        return $generated;
    }

    /**
     * Generate SVG QR Code for verification link.
     */
    public function generateQrCodeSvg(string $url): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle(90, 0),
            new SvgImageBackEnd()
        );
        $writer = new Writer($renderer);
        $svg = $writer->writeString($url);

        // Strip xml declaration if present for clean inline embedding
        return preg_replace('/<\?xml[^>]*\?>/i', '', $svg);
    }

    /**
     * Render Certificate as DomPDF instance.
     */
    public function renderPdf(Certificate $certificate): \Barryvdh\DomPDF\PDF
    {
        $certificate->loadMissing(['project.stream', 'project.event', 'employee']);

        $verificationUrl = route('certificates.verify', ['verify_code' => $certificate->verify_code]);
        $qrCodeSvg = $this->generateQrCodeSvg($verificationUrl);
        $qrCodeBase64 = 'data:image/svg+xml;base64,' . base64_encode($qrCodeSvg);

        $signatory1Name = Setting::get('certificate_signatory1_name', Setting::get('certificate_signatory_name', 'Tommy Wattimena'));
        $signatory1Title = Setting::get('certificate_signatory1_title', Setting::get('certificate_signatory_title', 'Managing Director Great Giant Foods'));
        $signatory2Name = Setting::get('certificate_signatory2_name', 'Steering Committee Chairman');
        $signatory2Title = Setting::get('certificate_signatory2_title', 'Head of Corporate Quality & CI');
        $eventName = $certificate->project->event?->name ?? 'Bulan Mutu Great Giant Foods 2027';

        $templateImage = Setting::get('certificate_template_image', null);
        $templateMode = Setting::get('certificate_template_mode', 'canva_overlay');
        $recipientNameTop = (int) Setting::get('certificate_recipient_name_top', '107');
        $showSystemTitle = Setting::get('certificate_show_system_title', '0') === '1';

        $templateImageBase64 = null;
        if (! empty($templateImage)) {
            $localPath = public_path(ltrim($templateImage, '/'));
            if (file_exists($localPath)) {
                $mime = mime_content_type($localPath) ?: 'image/jpeg';
                $data = file_get_contents($localPath);
                $templateImageBase64 = 'data:' . $mime . ';base64,' . base64_encode($data);
            }
        }

        $pdf = Pdf::loadView('certificates.template', [
            'certificate' => $certificate,
            'project' => $certificate->project,
            'employee' => $certificate->employee,
            'eventName' => $eventName,
            'signatory1Name' => $signatory1Name,
            'signatory1Title' => $signatory1Title,
            'signatory2Name' => $signatory2Name,
            'signatory2Title' => $signatory2Title,
            'qrCodeSvg' => $qrCodeSvg,
            'qrCodeBase64' => $qrCodeBase64,
            'templateImageBase64' => $templateImageBase64,
            'templateMode' => $templateMode,
            'recipientNameTop' => $recipientNameTop,
            'showSystemTitle' => $showSystemTitle,
        ]);

        $pdf->setPaper('a4', 'landscape');
        $pdf->setOption('isHtml5ParserEnabled', true);

        return $pdf;
    }
}
