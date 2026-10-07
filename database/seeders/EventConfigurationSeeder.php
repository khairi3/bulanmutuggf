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

        // Scoring Parameters CIC (Verification total: 100% - KRITERIA VERIFIKASI IMPROVEMENT BMG 2027)
        $this->seedStandardVerificationParameters($cic->id);

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

        // K3 Verification Parameters (total 100% - KRITERIA VERIFIKASI IMPROVEMENT BMG 2027)
        $this->seedStandardVerificationParameters($k3->id);

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

        // 4. Stream Energy Management (EMI Award)
        $energy = Stream::firstOrCreate(
            ['event_id' => $event->id, 'code' => Stream::CODE_ENERGY],
            [
                'name' => 'Energy Management Implementation (EMI Award)',
                'code_pattern' => 'ENRG-{NNN}',
                'team_min' => 2,
                'team_max' => 5,
                'max_projects_per_employee' => 1,
                'is_active' => true,
            ]
        );
        $energy->update(['name' => 'Energy Management Implementation (EMI Award)']);

        $enrgDim = CategoryDimension::firstOrCreate(
            ['stream_id' => $energy->id, 'code' => 'ENERGY'],
            ['name' => 'Energy Saving Innovation', 'code_order' => 1, 'is_required' => true]
        );
        CategoryOption::firstOrCreate(
            ['dimension_id' => $enrgDim->id, 'abbreviation' => 'ENRG'],
            ['name' => 'Energy Efficiency Implementation', 'sort_order' => 1, 'quota' => 5]
        );

        // Scoring Parameters Energy Management / EMI Award (Verification & Judging total: 100%)
        $this->seedEmiAwardParameters($energy->id);

        foreach ($phasesData as $p) {
            Phase::firstOrCreate(
                ['stream_id' => $energy->id, 'phase_type' => $p['type']],
                ['start_at' => $p['start'], 'end_at' => $p['end'], 'is_locked' => false]
            );
        }

        // 5. Stream Total Productive Maintenance (TPM)
        $tpm = Stream::firstOrCreate(
            ['event_id' => $event->id, 'code' => Stream::CODE_TPM],
            [
                'name' => 'Total Productive Maintenance (TPM)',
                'code_pattern' => 'TPM-{NNN}',
                'team_min' => 2,
                'team_max' => 5,
                'max_projects_per_employee' => 1,
                'is_active' => true,
            ]
        );

        $tpmDim = CategoryDimension::firstOrCreate(
            ['stream_id' => $tpm->id, 'code' => 'PILAR'],
            ['name' => 'Pilar TPM', 'code_order' => 1, 'is_required' => true]
        );

        $tpmOptions = [
            ['name' => 'Autonomous Maintenance (Jishu Hozen)', 'abbr' => 'JH', 'quota' => 10],
            ['name' => 'Planned Maintenance', 'abbr' => 'PM', 'quota' => 10],
            ['name' => 'Quality Maintenance', 'abbr' => 'QM', 'quota' => 5],
            ['name' => 'Kaizen / Focused Improvement', 'abbr' => 'KK', 'quota' => 5],
        ];

        foreach ($tpmOptions as $idx => $opt) {
            CategoryOption::firstOrCreate(
                ['dimension_id' => $tpmDim->id, 'abbreviation' => $opt['abbr']],
                ['name' => $opt['name'], 'sort_order' => $idx + 1, 'quota' => $opt['quota']]
            );
        }

        // TPM Scoring Parameters (Verification total: 100% - KRITERIA VERIFIKASI IMPROVEMENT BMG 2027)
        $this->seedStandardVerificationParameters($tpm->id);

        // TPM Scoring Parameters (Judging total: 100%)
        ScoringParameter::firstOrCreate(
            ['stream_id' => $tpm->id, 'stage' => ScoringParameter::STAGE_JUDGING, 'name' => 'Dampak Finansial, Efisiensi Biaya & Peningkatan OEE'],
            ['rubric' => 'Dampak efisiensi biaya maintenance, penurunan downtime, dan ROI perbaikan.', 'weight' => 35.00, 'sort_order' => 1]
        );
        ScoringParameter::firstOrCreate(
            ['stream_id' => $tpm->id, 'stage' => ScoringParameter::STAGE_JUDGING, 'name' => 'Keterlibatan Operator & Budaya Kerja TPM'],
            ['rubric' => 'Partisipasi aktif operator lini dan sinergi teknisi pemeliharaan.', 'weight' => 25.00, 'sort_order' => 2]
        );
        ScoringParameter::firstOrCreate(
            ['stream_id' => $tpm->id, 'stage' => ScoringParameter::STAGE_JUDGING, 'name' => 'Inovasi Solusi Preventif & Potensi Replikasi Mesin'],
            ['rubric' => 'Kaizen sederhana alat bantu dan replikasi standar mesin ke area lainnya.', 'weight' => 20.00, 'sort_order' => 3]
        );
        ScoringParameter::firstOrCreate(
            ['stream_id' => $tpm->id, 'stage' => ScoringParameter::STAGE_JUDGING, 'name' => 'Kualitas Presentasi & Penguasaan Tanya Jawab'],
            ['rubric' => 'Kejelasan sebelum-sesudah (before-after), video dokumentasi, dan respon pertanyaan juri.', 'weight' => 20.00, 'sort_order' => 4]
        );

        foreach ($phasesData as $p) {
            Phase::firstOrCreate(
                ['stream_id' => $tpm->id, 'phase_type' => $p['type']],
                ['start_at' => $p['start'], 'end_at' => $p['end'], 'is_locked' => false]
            );
        }
    }

    /**
     * Standard Verification Parameters (KRITERIA VERIFIKASI IMPROVEMENT BMG 2027)
     * Total Weight: 100% (internal system weighting)
     * Kategori Status:
     * - Pass
     * - Need Follow Up
     * - Not Pass
     */
    protected function seedStandardVerificationParameters(int $streamId): void
    {
        $parameters = [
            [
                'name' => 'Keberadaan Lokasi Project yang Sesungguhnya',
                'rubric' => "Bukti di Lapangan: Lokasi fisik, area kerja, layout proses sebelum–sesudah.\n• Pass: Lokasi/proses project dapat ditemukan dan kondisi aktual sesuai dengan lokasi yang dijelaskan dalam project. Implementasi dapat ditunjukkan secara langsung oleh peserta/operator.\n• Need Follow Up: Lokasi ada tetapi implementasi tidak dapat ditunjukkan secara lengkap, lokasi berubah, atau terdapat perbedaan antara dokumen dengan kondisi aktual yang masih dapat dijelaskan.\n• Not Pass: Lokasi/project tidak ditemukan, tidak ada aktivitas implementasi, atau lokasi yang ditunjukkan tidak sesuai dengan project yang diverifikasi.",
                'weight' => 15.00,
                'sort_order' => 1,
            ],
            [
                'name' => 'Bukti Perubahan (Before vs After)',
                'rubric' => "Bukti di Lapangan: Foto before–after, video implementasi, perubahan fisik yang terlihat.\n• Pass: Kondisi Before dan After dapat diverifikasi melalui observasi, foto, data, atau bukti lain. Perbedaan kondisi jelas dan relevan dengan solusi.\n• Need Follow Up: Perubahan terlihat tetapi bukti Before/After tidak lengkap, kualitas dokumentasi kurang kuat, atau perubahan belum dapat dikonfirmasi secara konsisten.\n• Not Pass: Tidak ditemukan perubahan yang sesuai dengan klaim project atau kondisi aktual bertentangan dengan Before–After yang dilaporkan.",
                'weight' => 20.00,
                'sort_order' => 2,
            ],
            [
                'name' => 'Implementasi Solusi Secara Nyata',
                'rubric' => "Bukti di Lapangan: Sejauh mana improvement sudah terimplementasi (apakah sudah masif, tahap pilot project, atau masih tahap desain).\n• Pass: Solusi telah diterapkan pada proses aktual dan dapat ditunjukkan secara langsung. Perubahan yang dilakukan sesuai dengan solusi yang dijelaskan dalam project.\n• Need Follow Up: Sebagian solusi telah diterapkan, tetapi implementasi belum lengkap atau masih dalam tahap trial/penerapan terbatas.\n• Not Pass: Solusi belum diterapkan atau hanya berupa rencana/dokumen/presentasi tanpa bukti implementasi nyata.",
                'weight' => 20.00,
                'sort_order' => 3,
            ],
            [
                'name' => 'Validitas Data Project',
                'rubric' => "Bukti di Lapangan: Sumber data yang digunakan dan referensi.\n• Pass: Data memiliki sumber yang jelas, periode pengambilan data jelas, metode pengukuran konsisten, dan data dapat ditelusuri ke sumber/original record.\n• Need Follow Up: Data tersedia tetapi terdapat keterbatasan seperti sample terbatas, periode pendek, metode pengukuran kurang jelas, atau sebagian data tidak dapat ditelusuri.\n• Not Pass: Data tidak dapat ditelusuri, sumber tidak jelas, metode pengukuran tidak valid/tidak konsisten, atau terdapat perbedaan signifikan antara data dengan kondisi aktual.",
                'weight' => 15.00,
                'sort_order' => 4,
            ],
            [
                'name' => 'Standarisasi & Control',
                'rubric' => "Bukti di Lapangan: SOP baru, OPL, visual control, perangkat baru, perubahan layout, engineering improvement.\n• Pass: Perubahan telah distandarkan melalui SOP/WI/standard parameter/check sheet/control mechanism atau mekanisme lain yang relevan dan digunakan dalam aktivitas normal.\n• Need Follow Up: Standardisasi sudah mulai dibuat tetapi belum lengkap, belum disosialisasikan, atau belum konsisten digunakan.\n• Not Pass: Tidak terdapat standardisasi dan control setelah improvement.",
                'weight' => 15.00,
                'sort_order' => 5,
            ],
            [
                'name' => 'Sustainability / Konsistensi Hasil',
                'rubric' => "Bukti di Lapangan: Mekanisme monitoring implementasi improvement.\n• Pass: Hasil improvement konsisten dalam periode tertentu dan terdapat mekanisme monitoring/control untuk mempertahankannya.\n• Need Follow Up: Hasil improvement masih terlihat tetapi periode monitoring relatif pendek, data belum konsisten, atau mekanisme sustain belum kuat.\n• Not Pass: Improvement hanya terjadi saat persiapan konvensi, atau tidak ada bukti bahwa hasil dipertahankan.",
                'weight' => 15.00,
                'sort_order' => 6,
            ],
        ];

        foreach ($parameters as $p) {
            ScoringParameter::updateOrCreate(
                ['stream_id' => $streamId, 'stage' => ScoringParameter::STAGE_VERIFICATION, 'name' => $p['name']],
                ['rubric' => $p['rubric'], 'weight' => $p['weight'], 'sort_order' => $p['sort_order']]
            );
        }
    }

    /**
     * Scoring Parameters for EMI Award (Energy Management Implementation)
     * Total Weight: 100% across 7 Criteria Groups (21 sub-parameters)
     * Configured for both Verification and Judging stages.
     */
    protected function seedEmiAwardParameters(int $streamId): void
    {
        $parameters = [
            [
                'name' => '1.1 Profile Departement',
                'rubric' => "Kelompok: 1. Pendahuluan (Maks 5%)\nKriteria: Profil Departemen",
                'weight' => 1.00,
                'sort_order' => 1,
            ],
            [
                'name' => '1.2 Latar Belakang',
                'rubric' => "Kelompok: 1. Pendahuluan (Maks 5%)\nKriteria: Latar Belakang Permasalahan & Urgensi Energi",
                'weight' => 2.00,
                'sort_order' => 2,
            ],
            [
                'name' => '1.3 Target',
                'rubric' => "Kelompok: 1. Pendahuluan (Maks 5%)\nKriteria: Sasaran & Target Penghematan Energi",
                'weight' => 2.00,
                'sort_order' => 3,
            ],
            [
                'name' => '2.1 Energy Review (Tinjauan Energi)',
                'rubric' => "Kelompok: 2. Rencana Kerja (Maks 15%)\nKriteria: Tinjauan Konsumsi & Karakteristik Penggunaan Energi",
                'weight' => 5.00,
                'sort_order' => 4,
            ],
            [
                'name' => '2.2 Baseline Energi',
                'rubric' => "Kelompok: 2. Rencana Kerja (Maks 15%)\nKriteria: Penetapan Garis Dasar (Baseline) Konsumsi Energi",
                'weight' => 2.00,
                'sort_order' => 5,
            ],
            [
                'name' => '2.3 Batasan Kegiatan',
                'rubric' => "Kelompok: 2. Rencana Kerja (Maks 15%)\nKriteria: Ruang Lingkup & Batasan Pelaksanaan Kegiatan",
                'weight' => 1.00,
                'sort_order' => 6,
            ],
            [
                'name' => '2.4 List Rencana Aksi',
                'rubric' => "Kelompok: 2. Rencana Kerja (Maks 15%)\nKriteria: Daftar Program Kerja & Rencana Aksi Konkret",
                'weight' => 5.00,
                'sort_order' => 7,
            ],
            [
                'name' => '2.5 Rincian Biaya',
                'rubric' => "Kelompok: 2. Rencana Kerja (Maks 15%)\nKriteria: Estimasi Anggaran & Rincian Biaya Investasi/Operasional",
                'weight' => 2.00,
                'sort_order' => 8,
            ],
            [
                'name' => '3.1 Penerapan Manajemen Energi',
                'rubric' => "Kelompok: 3. Implementasi Kegiatan (Maks 25%)\nKriteria: Penerapan Sistem & Prosedur Manajemen Energi",
                'weight' => 10.00,
                'sort_order' => 9,
            ],
            [
                'name' => '3.2 Penerapan Budaya Energy Conservation Behavior*',
                'rubric' => "Kelompok: 3. Implementasi Kegiatan (Maks 25%)\nKriteria: Penerapan Budaya Energy Conservation Behavior\n* Catatan: Melampirkan lembar assessment yang telah diberikan sebagai monitoring harian untuk penerapan penghematan energi di lingkup perkantoran.",
                'weight' => 15.00,
                'sort_order' => 10,
            ],
            [
                'name' => '4.1 Penghematan Energi (kWh/tahun, Liter solar/tahun, kg steam/tahun, dll)',
                'rubric' => "Kelompok: 4. Dampak (Maks 30%)\nKriteria: Kuantifikasi Nyata Penghematan Energi (kWh/tahun, Liter solar/tahun, kg steam/tahun, dll)",
                'weight' => 10.00,
                'sort_order' => 11,
            ],
            [
                'name' => '4.2 Pengaruh Terhadap Lingkungan',
                'rubric' => "Kelompok: 4. Dampak (Maks 30%)\nKriteria: Dampak Penurunan Emisi Gas Rumah Kaca & Keberlanjutan Lingkungan",
                'weight' => 10.00,
                'sort_order' => 12,
            ],
            [
                'name' => '4.3 Pengaruh Terhadap Ekonomi',
                'rubric' => "Kelompok: 4. Dampak (Maks 30%)\nKriteria: Efisiensi Biaya Finansial & Nilai Penghematan Rupiah",
                'weight' => 10.00,
                'sort_order' => 13,
            ],
            [
                'name' => '5.1 Komitmen Top Manajemen',
                'rubric' => "Kelompok: 5. Sustainability (Keberlanjutan) (Maks 15%)\nKriteria: Dukungan, Kebijakan & Komitmen Nyata Pimpinan",
                'weight' => 5.00,
                'sort_order' => 14,
            ],
            [
                'name' => '5.2 Organisasi',
                'rubric' => "Kelompok: 5. Sustainability (Keberlanjutan) (Maks 15%)\nKriteria: Struktur Tim Energi & Pembagian Peran Organisasi",
                'weight' => 3.00,
                'sort_order' => 15,
            ],
            [
                'name' => '5.3 Tingkat Partisipasi dan Keterlibatan',
                'rubric' => "Kelompok: 5. Sustainability (Keberlanjutan) (Maks 15%)\nKriteria: Keterlibatan Seluruh Karyawan dalam Konservasi Energi",
                'weight' => 2.00,
                'sort_order' => 16,
            ],
            [
                'name' => '5.4 Capacity Building',
                'rubric' => "Kelompok: 5. Sustainability (Keberlanjutan) (Maks 15%)\nKriteria: Program Pelatihan, Sosialisasi & Peningkatan Kompetensi",
                'weight' => 2.00,
                'sort_order' => 17,
            ],
            [
                'name' => '5.5 Rencana Jangka Pendek dan Jangka Panjang',
                'rubric' => "Kelompok: 5. Sustainability (Keberlanjutan) (Maks 15%)\nKriteria: Roadmap Keberlanjutan Rencana Jangka Pendek & Jangka Panjang",
                'weight' => 3.00,
                'sort_order' => 18,
            ],
            [
                'name' => '6.1 Kreatif dan Inovasi',
                'rubric' => "Kelompok: 6. Keaslian (Maks 5%)\nKriteria: Gagasan Baru, Kreativitas Solusi & Orisinalitas Inovasi",
                'weight' => 3.00,
                'sort_order' => 19,
            ],
            [
                'name' => '6.2 Lesson Learned',
                'rubric' => "Kelompok: 6. Keaslian (Maks 5%)\nKriteria: Leasson Learned / Pembelajaran yang Didapat Selama Pelaksanaan & Replikasi",
                'weight' => 2.00,
                'sort_order' => 20,
            ],
            [
                'name' => '7. Keseluruhan Tampilan Makalah',
                'rubric' => "Kelompok: 7. Keseluruhan Tampilan Makalah (Maks 5%)\nKriteria: Kerapian Format, Sistematika Penulisan, Visualisasi Data & Tata Bahasa",
                'weight' => 5.00,
                'sort_order' => 21,
            ],
        ];

        // Seed for both verification and judging stages
        foreach ([ScoringParameter::STAGE_VERIFICATION, ScoringParameter::STAGE_JUDGING] as $stage) {
            foreach ($parameters as $p) {
                ScoringParameter::updateOrCreate(
                    ['stream_id' => $streamId, 'stage' => $stage, 'name' => $p['name']],
                    ['rubric' => $p['rubric'], 'weight' => $p['weight'], 'sort_order' => $p['sort_order']]
                );
            }
        }
    }
}

