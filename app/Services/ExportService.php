<?php

namespace App\Services;

use App\Models\Project;
use App\Models\ScoreSheet;
use App\Models\ScoringParameter;
use App\Models\Stream;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Service Export Data Excel / CSV (ADM-06, VER-11).
 */
class ExportService
{
    /**
     * Download CSV Stream dengan UTF-8 BOM agar kompatibel dengan Excel.
     */
    public function export(string $type, ?int $streamId = null): StreamedResponse
    {
        $filename = match ($type) {
            'registration' => 'rekap_registrasi_bmg_'.date('Ymd_His').'.csv',
            'verification' => 'rekap_nilai_verifikasi_'.date('Ymd_His').'.csv',
            'judging' => 'rekap_nilai_juri_'.date('Ymd_His').'.csv',
            'final_ranking' => 'rekap_pemenang_leaderboard_'.date('Ymd_His').'.csv',
            default => 'export_bmg_'.date('Ymd_His').'.csv',
        };

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($type, $streamId) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM for Microsoft Excel
            fwrite($handle, "\xEF\xBB\xBF");

            match ($type) {
                'registration' => $this->writeRegistrationCsv($handle, $streamId),
                'verification' => $this->writeEvaluationCsv($handle, ScoringParameter::STAGE_VERIFICATION, $streamId),
                'judging' => $this->writeEvaluationCsv($handle, ScoringParameter::STAGE_JUDGING, $streamId),
                'final_ranking' => $this->writeFinalRankingCsv($handle, $streamId),
                default => null,
            };

            fclose($handle);
        }, 200, $headers);
    }

    protected function writeRegistrationCsv($handle, ?int $streamId): void
    {
        fputcsv($handle, [
            'Kode Registrasi',
            'Judul Project',
            'Stream',
            'Kategori',
            'Status',
            'Nama Ketua Tim',
            'Employee ID Ketua',
            'Unit / Plant',
            'Jumlah Anggota',
            'Waktu Pendaftaran',
            'Waktu Finalisasi',
        ]);

        $query = Project::with(['stream', 'categories.dimension', 'leader', 'teamMembers']);
        if ($streamId) {
            $query->where('stream_id', $streamId);
        }

        $query->chunk(100, function ($projects) use ($handle) {
            foreach ($projects as $p) {
                fputcsv($handle, [
                    $p->registration_code,
                    $p->title,
                    $p->stream?->name,
                    $p->categoryLabel(),
                    $p->status_label,
                    $p->leader?->full_name,
                    $p->leader?->employee_index,
                    $p->leader?->unit,
                    $p->teamMembers->count(),
                    $p->submitted_at ? $p->submitted_at->format('Y-m-d H:i:s') : '-',
                    $p->finalised_at ? $p->finalised_at->format('Y-m-d H:i:s') : '-',
                ]);
            }
        });
    }

    protected function writeEvaluationCsv($handle, string $stage, ?int $streamId): void
    {
        $roleName = $stage === ScoringParameter::STAGE_VERIFICATION ? 'Verifikator' : 'Juri';

        fputcsv($handle, [
            'Kode Registrasi',
            'Judul Project',
            'Stream',
            'Nama '.$roleName,
            'Status Lembar Nilai',
            'Parameter Penilaian',
            'Bobot Parameter (%)',
            'Nilai (0-100)',
            'Nilai Tertimbang',
            'Catatan '.$roleName,
            'Waktu Submit',
        ]);

        $query = ScoreSheet::with(['project.stream', 'scorer.employee', 'items.parameter'])
            ->where('stage', $stage);

        if ($streamId) {
            $query->whereHas('project', fn ($q) => $q->where('stream_id', $streamId));
        }

        $query->chunk(100, function ($sheets) use ($handle) {
            foreach ($sheets as $sheet) {
                foreach ($sheet->items as $item) {
                    $weight = $item->parameter?->weight ?? 0;
                    $score = $item->score ?? 0;
                    $weighted = round(($score * $weight) / 100, 2);

                    fputcsv($handle, [
                        $sheet->project?->registration_code,
                        $sheet->project?->title,
                        $sheet->project?->stream?->name,
                        $sheet->scorer?->employee?->full_name ?? $sheet->scorer?->name,
                        $sheet->status === 'submitted' ? 'Disubmit' : 'Draf',
                        $item->parameter?->name,
                        "{$weight}%",
                        $score,
                        $weighted,
                        $item->note ?? '-',
                        $sheet->submitted_at ? $sheet->submitted_at->format('Y-m-d H:i:s') : '-',
                    ]);
                }
            }
        });
    }

    protected function writeFinalRankingCsv($handle, ?int $streamId): void
    {
        fputcsv($handle, [
            'Peringkat',
            'Gelar Pemenang',
            'Kode Registrasi',
            'Judul Project',
            'Stream',
            'Kategori',
            'Ketua Tim',
            'Unit / Plant',
            'Rata-rata Verifikasi',
            'Bobot Verifikasi',
            'Rata-rata Juri',
            'Bobot Juri',
            'Nilai Akhir BMG',
            'Waktu Finalisasi',
        ]);

        $query = Project::with(['stream', 'categories.dimension', 'leader', 'finalResult.rankingOption'])
            ->whereNotNull('status')
            ->whereHas('finalResult');

        if ($streamId) {
            $query->where('stream_id', $streamId);
        }

        $projects = $query->get()->sortBy(fn ($p) => $p->finalResult?->rank_in_category ?? 999);

        foreach ($projects as $p) {
            $fr = $p->finalResult;
            fputcsv($handle, [
                $fr?->rank_in_category ?? '-',
                $fr?->award_title ?? '-',
                $p->registration_code,
                $p->title,
                $p->stream?->name,
                $fr?->rankingOption?->name ?? $p->categoryLabel(),
                $p->leader?->full_name,
                $p->leader?->unit,
                $fr?->verification_score !== null ? $fr->verification_score : '-',
                "{$fr?->verification_weight}%",
                $fr?->judging_score !== null ? $fr->judging_score : '-',
                "{$fr?->judging_weight}%",
                $fr?->final_score !== null ? $fr->final_score : '-',
                $p->finalised_at ? $p->finalised_at->format('Y-m-d H:i:s') : '-',
            ]);
        }
    }
}
