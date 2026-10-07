<?php

use App\Models\ScoringParameter;
use App\Models\Stream;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $stream = Stream::where('code', Stream::CODE_ENERGY)->first();

        if (! $stream) {
            return;
        }

        // Update stream display name if needed
        $stream->update([
            'name' => 'Energy Management Implementation (EMI Award)',
        ]);

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

        // Delete existing parameters for EMI Award stream across both stages
        $stream->scoringParameters()->delete();

        // Populate parameters for both verification & judging stages
        foreach ([ScoringParameter::STAGE_VERIFICATION, ScoringParameter::STAGE_JUDGING] as $stage) {
            foreach ($parameters as $param) {
                ScoringParameter::create([
                    'stream_id' => $stream->id,
                    'stage' => $stage,
                    'name' => $param['name'],
                    'rubric' => $param['rubric'],
                    'weight' => $param['weight'],
                    'sort_order' => $param['sort_order'],
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op or restore defaults
    }
};
