<?php

namespace App\Services;

use App\Models\Project;
use App\Models\ScoreSheet;
use App\Models\ScoringParameter;
use App\Models\Stream;
use Illuminate\Support\Collection;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\XLSX\Writer;

/**
 * Export Excel (ADM-06, VER-11): registrasi, nilai verifikasi per parameter,
 * nilai juri per juri per parameter, dan ranking akhir.
 */
class ExportService
{
    public function __construct(
        protected ScoringService $scoring,
        protected RecapService $recap,
    ) {}

    /**
     * Tulis workbook ke file sementara dan kembalikan path-nya.
     *
     * @param  Collection<int, Stream>  $streams
     * @param  array<int, string>  $sheets  registrations|verification|judging|ranking
     */
    public function workbook(Collection $streams, array $sheets, ?Collection $projectIds = null): string
    {
        $path = tempnam(sys_get_temp_dir(), 'bmg_export_').'.xlsx';

        $writer = new Writer;
        $writer->openToFile($path);
        $writer->setCreator('Sistem Web BMG - GGF Learning Center');

        $header = new Style(fontBold: true, fontColor: 'FFFFFF', backgroundColor: '0F5132');
        $first = true;

        foreach ($sheets as $sheetKey) {
            if (! $first) {
                $writer->addNewSheetAndMakeItCurrent();
            }
            $first = false;

            [$title, $rows] = match ($sheetKey) {
                'registrations' => ['Registrasi', $this->registrationRows($streams, $projectIds)],
                'verification' => ['Nilai Verifikasi', $this->scoreRows($streams, ScoringParameter::STAGE_VERIFICATION, $projectIds)],
                'judging' => ['Nilai Juri', $this->scoreRows($streams, ScoringParameter::STAGE_JUDGING, $projectIds)],
                'ranking' => ['Ranking Akhir', $this->rankingRows($streams)],
            };

            $writer->getCurrentSheet()->setName($title);

            foreach ($rows as $idx => $values) {
                $writer->addRow($idx === 0
                    ? Row::fromValuesWithStyle($values, $header)
                    : Row::fromValues($values));
            }
        }

        $writer->close();

        return $path;
    }

    protected function registrationRows(Collection $streams, ?Collection $projectIds): array
    {
        $rows = [[
            'Stream', 'Kode Registrasi', 'Judul Project', 'Status', 'Kategori',
            'Ketua (Index)', 'Ketua (Nama)', 'Unit Ketua', 'Jumlah Anggota', 'Anggota Tim',
            'Versi Charter', 'Tanggal Submit', 'Tanggal Finalise',
        ]];

        $projects = $this->baseQuery($streams, $projectIds)
            ->with(['stream', 'leader', 'categories.dimension', 'teamMembers.employee', 'currentVersion'])
            ->where('status', '!=', Project::STATUS_DRAFT)
            ->orderBy('stream_id')->orderBy('registration_code')
            ->get();

        foreach ($projects as $p) {
            $rows[] = [
                $p->stream->name,
                $p->registration_code,
                $p->title,
                $p->status_label,
                $p->categoryLabel(),
                $p->leader?->employee_index,
                $p->leader?->full_name,
                $p->leader?->unit,
                $p->teamMembers->count(),
                $p->teamMembers->map(fn ($tm) => "{$tm->employee?->full_name} ({$tm->employee?->employee_index})")->implode('; '),
                'v'.($p->currentVersion?->version_no ?? 1),
                $p->submitted_at?->format('Y-m-d H:i'),
                $p->finalised_at?->format('Y-m-d H:i'),
            ];
        }

        return $rows;
    }

    protected function scoreRows(Collection $streams, string $stage, ?Collection $projectIds): array
    {
        $parameterNames = ScoringParameter::whereIn('stream_id', $streams->pluck('id'))
            ->where('stage', $stage)
            ->orderBy('stream_id')->orderBy('sort_order')
            ->get();

        $rows = [array_merge(
            ['Stream', 'Kode Registrasi', 'Judul Project', $stage === 'judging' ? 'Juri' : 'Verifikator', 'Status Nilai'],
            $parameterNames->map(fn ($p) => "{$p->name} ({$p->weight}%)")->all(),
            ['Total Tertimbang', 'Waktu Submit'],
        )];

        $sheets = ScoreSheet::with(['project.stream', 'scorer.employee', 'items'])
            ->where('stage', $stage)
            ->whereHas('project', function ($q) use ($streams, $projectIds) {
                $q->whereIn('stream_id', $streams->pluck('id'));
                if ($projectIds !== null) {
                    $q->whereIn('id', $projectIds);
                }
            })
            ->get()
            ->sortBy(fn ($s) => [$s->project->stream_id, $s->project->registration_code]);

        foreach ($sheets as $sheet) {
            $scores = $sheet->items->pluck('score', 'parameter_id');

            $rows[] = array_merge(
                [
                    $sheet->project->stream->name,
                    $sheet->project->registration_code,
                    $sheet->project->title,
                    $sheet->scorer?->employee?->full_name,
                    $sheet->isSubmitted() ? 'Submitted' : 'Draft',
                ],
                $parameterNames->map(fn ($p) => $p->stream_id === $sheet->project->stream_id ? ($scores[$p->id] ?? null) : null)->all(),
                [$sheet->total_weighted, $sheet->submitted_at?->format('Y-m-d H:i')],
            );
        }

        return $rows;
    }

    protected function rankingRows(Collection $streams): array
    {
        $rows = [[
            'Stream', 'Kategori Ranking', 'Peringkat', 'Kode Registrasi', 'Judul Project', 'Ketua', 'Unit',
            'Nilai Verifikasi', 'Nilai Juri (rata-rata)', 'Nilai Akhir', 'Status',
        ]];

        foreach ($streams as $stream) {
            foreach ($this->recap->results($stream) as $group) {
                foreach ($group['results'] as $r) {
                    $rows[] = [
                        $stream->name,
                        $group['option']['name'] ?? '-',
                        $r['rank'],
                        $r['registration_code'],
                        $r['title'],
                        $r['leader']['full_name'] ?? null,
                        $r['leader']['unit'] ?? null,
                        $r['verification_score'],
                        $r['judging_score'],
                        $r['final_score'],
                        $r['published_at'] ? 'Diumumkan' : 'Belum diumumkan',
                    ];
                }
            }
        }

        return $rows;
    }

    protected function baseQuery(Collection $streams, ?Collection $projectIds)
    {
        $query = Project::whereIn('stream_id', $streams->pluck('id'));

        if ($projectIds !== null) {
            $query->whereIn('id', $projectIds);
        }

        return $query;
    }
}
