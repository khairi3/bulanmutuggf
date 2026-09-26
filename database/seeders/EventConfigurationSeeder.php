<?php

namespace Database\Seeders;

use App\Models\CategoryDimension;
use App\Models\CategoryOption;
use App\Models\Event;
use App\Models\Phase;
use App\Models\ScoringParameter;
use App\Models\Stream;
use Illuminate\Database\Seeder;

class EventConfigurationSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Active Event for BMG 2026
        $event = Event::firstOrCreate(
            ['year' => 2026],
            [
                'name' => 'Bulan Mutu GGF 2026',
                'status' => Event::STATUS_ACTIVE,
                'final_weight_verification' => 40.00,
                'final_weight_judging' => 60.00,
            ]
        );

        // 2. Stream CIC
        $cic = Stream::firstOrCreate(
            ['event_id' => $event->id, 'code' => Stream::CODE_CIC],
            [
                'name' => 'Continuous Improvement Convention (CIC)',
                'code_pattern' => '{LEVEL}{IMPROVEMENT}{AREA}-{NNN}',
                'team_min' => 3,
                'team_max' => 7,
                'max_projects_per_employee' => 2,
                'is_active' => true,
            ]
        );

        // Dimensions for CIC
        $levelDim = CategoryDimension::firstOrCreate(
            ['stream_id' => $cic->id, 'code' => 'LEVEL'],
            ['name' => 'Level Kemahiran', 'code_order' => 1, 'is_required' => true]
        );
        CategoryOption::firstOrCreate(['dimension_id' => $levelDim->id, 'abbreviation' => 'B'], ['name' => 'Beginner', 'sort_order' => 1, 'quota' => 10]);
        CategoryOption::firstOrCreate(['dimension_id' => $levelDim->id, 'abbreviation' => 'M'], ['name' => 'Middle', 'sort_order' => 2, 'quota' => 10]);
        CategoryOption::firstOrCreate(['dimension_id' => $levelDim->id, 'abbreviation' => 'A'], ['name' => 'Advance', 'sort_order' => 3, 'quota' => 5]);

        $impDim = CategoryDimension::firstOrCreate(
            ['stream_id' => $cic->id, 'code' => 'IMPROVEMENT'],
            ['name' => 'Kategori Improvement', 'code_order' => 2, 'is_required' => true]
        );
        CategoryOption::firstOrCreate(['dimension_id' => $impDim->id, 'abbreviation' => 'AUTO'], ['name' => 'Autonomous', 'sort_order' => 1]);
        CategoryOption::firstOrCreate(['dimension_id' => $impDim->id, 'abbreviation' => 'MECH'], ['name' => 'Mechanization', 'sort_order' => 2]);
        CategoryOption::firstOrCreate(['dimension_id' => $impDim->id, 'abbreviation' => 'SYST'], ['name' => 'System', 'sort_order' => 3]);

        $areaDim = CategoryDimension::firstOrCreate(
            ['stream_id' => $cic->id, 'code' => 'AREA'],
            ['name' => 'Group Area Operasional', 'code_order' => 3, 'is_required' => true]
        );
        $areas = [
            ['name' => 'Estate PG1', 'abbr' => 'PG1'],
            ['name' => 'Estate PG2', 'abbr' => 'PG2'],
            ['name' => 'Estate PG3', 'abbr' => 'PG3'],
            ['name' => 'Estate PG4', 'abbr' => 'PG4'],
            ['name' => 'Fresh Fruit Produce', 'abbr' => 'FFP'],
            ['name' => 'Protein & Plant Product', 'abbr' => 'PPP'],
            ['name' => 'Farming Services & Transport Logistic', 'abbr' => 'FSTL'],
            ['name' => 'Manufacture', 'abbr' => 'MFG'],
            ['name' => 'Umum', 'abbr' => 'UMM'],
        ];
        foreach ($areas as $idx => $area) {
            CategoryOption::firstOrCreate(
                ['dimension_id' => $areaDim->id, 'abbreviation' => $area['abbr']],
                ['name' => $area['name'], 'sort_order' => $idx + 1]
            );
        }

        // Scoring Parameters CIC (Verification total: 100%)
        ScoringParameter::firstOrCreate(
            ['stream_id' => $cic->id, 'stage' => ScoringParameter::STAGE_VERIFICATION, 'name' => 'Problem Statement & Baseline Data'],
            ['rubric' => 'Kejelasan latar belakang masalah, ketepatan penetapan KPI dasar, dan dampak terhadap operasional.', 'weight' => 25.00, 'sort_order' => 1]
        );
        ScoringParameter::firstOrCreate(
            ['stream_id' => $cic->id, 'stage' => ScoringParameter::STAGE_VERIFICATION, 'name' => 'Analisis Akar Penyebab (Root Cause)'],
            ['rubric' => 'Kedalaman analisis menggunakan 5-Why, Fishbone, atau metodologi CI yang tepat.', 'weight' => 25.00, 'sort_order' => 2]
        );
        ScoringParameter::firstOrCreate(
            ['stream_id' => $cic->id, 'stage' => ScoringParameter::STAGE_VERIFICATION, 'name' => 'Eksekusi & Efektivitas Solusi'],
            ['rubric' => 'Kesesuaian solusi dengan akar masalah, implementasi di lapangan, dan partisipasi tim.', 'weight' => 30.00, 'sort_order' => 3]
        );
        ScoringParameter::firstOrCreate(
            ['stream_id' => $cic->id, 'stage' => ScoringParameter::STAGE_VERIFICATION, 'name' => 'Hasil (Result) & Standardisasi SOP'],
            ['rubric' => 'Pencapaian target metrik, pencegahan rekurensi, dan pembaruan SOP operasional.', 'weight' => 20.00, 'sort_order' => 4]
        );

        // Scoring Parameters CIC (Judging total: 100%)
        ScoringParameter::firstOrCreate(
            ['stream_id' => $cic->id, 'stage' => ScoringParameter::STAGE_JUDGING, 'name' => 'Penyampaian & Kualitas Presentasi'],
            ['rubric' => 'Kemampuan membawakan materi, kejelasan alur cerita, dan kepatuhan durasi waktu.', 'weight' => 25.00, 'sort_order' => 1]
        );
        ScoringParameter::firstOrCreate(
            ['stream_id' => $cic->id, 'stage' => ScoringParameter::STAGE_JUDGING, 'name' => 'Dampak Finansial & Nilai Tambah'],
            ['rubric' => 'Efisiensi biaya, peningkatan produktivitas, dan ROI perbaikan.', 'weight' => 30.00, 'sort_order' => 2]
        );
        ScoringParameter::firstOrCreate(
            ['stream_id' => $cic->id, 'stage' => ScoringParameter::STAGE_JUDGING, 'name' => 'Orisinalitas & Potensi Replikasi'],
            ['rubric' => 'Keunikan terobosan solusi dan kemudahan penerapan di area/unit kerja lain.', 'weight' => 25.00, 'sort_order' => 3]
        );
        ScoringParameter::firstOrCreate(
            ['stream_id' => $cic->id, 'stage' => ScoringParameter::STAGE_JUDGING, 'name' => 'Tanya Jawab & Penguasaan Masalah'],
            ['rubric' => 'Ketepatan dan ketangkasan tim dalam menjawab pertanyaan kritis dewan juri.', 'weight' => 20.00, 'sort_order' => 4]
        );

        // Phases for CIC
        $phasesData = [
            ['type' => Phase::REGISTRATION, 'start' => '2026-09-01 00:00:00', 'end' => '2026-10-31 23:59:59'],
            ['type' => Phase::VERIFICATION, 'start' => '2026-11-01 00:00:00', 'end' => '2026-11-20 23:59:59'],
            ['type' => Phase::SELECTION, 'start' => '2026-11-21 00:00:00', 'end' => '2026-11-25 23:59:59'],
            ['type' => Phase::FINALISATION, 'start' => '2026-11-26 00:00:00', 'end' => '2026-12-05 23:59:59'],
            ['type' => Phase::JUDGING, 'start' => '2026-12-06 00:00:00', 'end' => '2026-12-10 23:59:59'],
            ['type' => Phase::ANNOUNCEMENT, 'start' => '2026-12-11 00:00:00', 'end' => '2026-12-31 23:59:59'],
        ];
        foreach ($phasesData as $p) {
            Phase::firstOrCreate(
                ['stream_id' => $cic->id, 'phase_type' => $p['type']],
                ['start_at' => $p['start'], 'end_at' => $p['end'], 'is_locked' => false]
            );
        }

        // 3. Stream Bulan K3
        $k3 = Stream::firstOrCreate(
            ['event_id' => $event->id, 'code' => Stream::CODE_K3],
            [
                'name' => 'Bulan K3 (Keselamatan & Kesehatan Kerja)',
                'code_pattern' => 'SIGAP-{NNN}',
                'team_min' => 2,
                'team_max' => 5,
                'max_projects_per_employee' => 1,
                'is_active' => true,
            ]
        );
        $sigapDim = CategoryDimension::firstOrCreate(
            ['stream_id' => $k3->id, 'code' => 'SIGAP'],
            ['name' => 'Safety Improvement', 'code_order' => 1, 'is_required' => true]
        );
        CategoryOption::firstOrCreate(
            ['dimension_id' => $sigapDim->id, 'abbreviation' => 'SIGAP'],
            ['name' => 'Safety Improvement Action Plan', 'sort_order' => 1, 'quota' => 10]
        );

        // K3 Verification Parameters (total 100%)
        ScoringParameter::firstOrCreate(
            ['stream_id' => $k3->id, 'stage' => ScoringParameter::STAGE_VERIFICATION, 'name' => 'Identifikasi Bahaya & Penilaian Risiko'],
            ['rubric' => 'Akurasi pemetaan potensi bahaya K3 dan tingkat keparahan risiko operasional.', 'weight' => 30.00, 'sort_order' => 1]
        );
        ScoringParameter::firstOrCreate(
            ['stream_id' => $k3->id, 'stage' => ScoringParameter::STAGE_VERIFICATION, 'name' => 'Inovasi Mitigasi & Eliminasi Bahaya'],
            ['rubric' => 'Tingkat efektivitas kontrol bahaya berdasarkan hierarki pengendalian risiko K3.', 'weight' => 40.00, 'sort_order' => 2]
        );
        ScoringParameter::firstOrCreate(
            ['stream_id' => $k3->id, 'stage' => ScoringParameter::STAGE_VERIFICATION, 'name' => 'Pembentukan Budaya K3 & Standar Kerja'],
            ['rubric' => 'Keterlibatan tim kerja dan pembentukan kesadaran keselamatan.', 'weight' => 30.00, 'sort_order' => 3]
        );

        // K3 Judging Parameters (total 100%)
        ScoringParameter::firstOrCreate(
            ['stream_id' => $k3->id, 'stage' => ScoringParameter::STAGE_JUDGING, 'name' => 'Dampak Pencegahan Insiden & Near Miss'],
            ['rubric' => 'Penurunan angka insiden nyata dan peningkatan pelaporan bahaya preventif.', 'weight' => 40.00, 'sort_order' => 1]
        );
        ScoringParameter::firstOrCreate(
            ['stream_id' => $k3->id, 'stage' => ScoringParameter::STAGE_JUDGING, 'name' => 'Kemudahan Replikasi Safety Guard'],
            ['rubric' => 'Potensi alat bantu atau sistem diadopsi di departemen lain.', 'weight' => 30.00, 'sort_order' => 2]
        );
        ScoringParameter::firstOrCreate(
            ['stream_id' => $k3->id, 'stage' => ScoringParameter::STAGE_JUDGING, 'name' => 'Kualitas Pemaparan Presentasi'],
            ['rubric' => 'Penyampaian data yang objektif dan visualisasi video/foto bukti di lapangan.', 'weight' => 30.00, 'sort_order' => 3]
        );

        foreach ($phasesData as $p) {
            Phase::firstOrCreate(
                ['stream_id' => $k3->id, 'phase_type' => $p['type']],
                ['start_at' => $p['start'], 'end_at' => $p['end'], 'is_locked' => false]
            );
        }

        // 4. Stream Energy Management
        $energy = Stream::firstOrCreate(
            ['event_id' => $event->id, 'code' => Stream::CODE_ENERGY],
            [
                'name' => 'Energy Management Implementation',
                'code_pattern' => 'ENRG-{NNN}',
                'team_min' => 2,
                'team_max' => 5,
                'max_projects_per_employee' => 1,
                'is_active' => true,
            ]
        );
        $enrgDim = CategoryDimension::firstOrCreate(
            ['stream_id' => $energy->id, 'code' => 'ENERGY'],
            ['name' => 'Energy Saving Innovation', 'code_order' => 1, 'is_required' => true]
        );
        CategoryOption::firstOrCreate(
            ['dimension_id' => $enrgDim->id, 'abbreviation' => 'ENRG'],
            ['name' => 'Energy Efficiency Implementation', 'sort_order' => 1, 'quota' => 5]
        );

        ScoringParameter::firstOrCreate(
            ['stream_id' => $energy->id, 'stage' => ScoringParameter::STAGE_VERIFICATION, 'name' => 'Baseline Konsumsi Energi & Identifikasi Peluang'],
            ['rubric' => 'Ketepatan audit energi dan data konsumsi listrik/bahan bakar sebelum implementasi.', 'weight' => 40.00, 'sort_order' => 1]
        );
        ScoringParameter::firstOrCreate(
            ['stream_id' => $energy->id, 'stage' => ScoringParameter::STAGE_VERIFICATION, 'name' => 'Penghematan Energi Nyata & Efisiensi'],
            ['rubric' => 'Persentase reduksi kWh / liter solar / emisi karbon yang berhasil dihemat.', 'weight' => 60.00, 'sort_order' => 2]
        );

        ScoringParameter::firstOrCreate(
            ['stream_id' => $energy->id, 'stage' => ScoringParameter::STAGE_JUDGING, 'name' => 'Dampak Penghematan Biaya & Efisiensi Energi'],
            ['rubric' => 'Nilai rupiah yang dihemat dan keberlanjutan solusi inovasi energi.', 'weight' => 60.00, 'sort_order' => 1]
        );
        ScoringParameter::firstOrCreate(
            ['stream_id' => $energy->id, 'stage' => ScoringParameter::STAGE_JUDGING, 'name' => 'Pemaparan Presentasi & Standardisasi'],
            ['rubric' => 'Kualitas presentasi dan kelengkapan dokumen data logger energi.', 'weight' => 40.00, 'sort_order' => 2]
        );

        foreach ($phasesData as $p) {
            Phase::firstOrCreate(
                ['stream_id' => $energy->id, 'phase_type' => $p['type']],
                ['start_at' => $p['start'], 'end_at' => $p['end'], 'is_locked' => false]
            );
        }
    }
}
