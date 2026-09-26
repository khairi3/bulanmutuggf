# PRD — Sistem Web Bulan Mutu GGF (BMG)
**Tanggal**: Sep 26, 2026 · @GGF Learning Center

---

## 1. Overview & Objectives

Sistem web BMG adalah satu portal terpusat untuk mengelola seluruh siklus lomba Bulan Mutu GGF: registrasi tim, verifikasi lapangan, seleksi, hingga penjurian Convention Day. Satu engine dipakai untuk semua stream, dan tiap stream dikonfigurasi lewat data (kategori, format kode, parameter penilaian), bukan hard-code.

### 1.1 Latar belakang
Saat ini pendaftaran, pengumpulan project charter, feedback verifikator, dan rekap nilai juri tersebar di email, spreadsheet, dan grup chat. Akibatnya versi dokumen sering tidak sinkron, status project sulit dipantau, dan rekap nilai rawan salah hitung.

### 1.2 Stream yang dinaungi

| Stream | Kategori | Contoh kode registrasi | Status spesifikasi |
|---|---|---|---|
| Continuous Improvement Convention (CIC) | Level x Improvement x Group Area | BMECHPG1-001 | Lengkap |
| Bulan K3 | SIGAP (Safety Improvement) | SIGAP-001 | Lengkap |
| Energy Management Implementation | Belum didefinisikan | Belum didefinisikan | Diasumsikan mengikuti pola K3 (lihat Bagian 8) |

### 1.3 Tujuan produk
1. **Satu sumber kebenaran**: semua project charter, lampiran, feedback, dan nilai tersimpan di satu tempat dengan riwayat versi.
2. **Transparansi status**: peserta tahu posisi project-nya kapan saja tanpa bertanya ke panitia.
3. **Penilaian cepat dan akurat**: verifikator dan juri menilai langsung di sistem; rekap dan ranking dihitung otomatis.
4. **Mudah untuk semua level**: karyawan operasional di estate/pabrik bisa mendaftar dari HP dalam kurang dari 10 menit.
5. **Reusable tiap tahun**: event baru cukup dibuat dari menu Admin tanpa ubah kode.

### 1.4 KPI keberhasilan

| KPI | Target |
|---|---|
| Waktu rata-rata registrasi + isi charter (tanpa upload) | < 10 menit |
| Project yang terdaftar via sistem (bukan manual) | 100% |
| Waktu rekap nilai & ranking pasca Convention Day | < 5 menit (otomatis) |
| Verifikator yang memberi feedback tertulis per project | 100% |
| Keluhan terkait akses/login selama event | < 5% pengguna |

### 1.5 Scope
- **In scope (MVP)**: autentikasi berbasis index karyawan, master data karyawan, registrasi tim, project charter dengan versi, upload file, auto-generate kode, dashboard & penilaian verifikator, seleksi ke Convention Day, dashboard & split-screen penilaian juri, rekap/ranking, notifikasi email, panel Admin/Panitia.
- **Out of scope (MVP)**: aplikasi mobile native, integrasi SSO korporat (disiapkan untuk fase berikutnya), live streaming Convention Day, voting publik, sertifikat otomatis (masuk backlog Phase 8).

---

## 2. User Roles & Permissions

Sistem memakai 6 role. Satu user bisa punya lebih dari satu role, tetapi assignment verifikator dan juri selalu per stream (dan opsional per kategori), sehingga seorang verifikator K3 tidak bisa melihat project CIC.

### 2.1 Definisi role
- **Peserta (Ketua Tim)**: Karyawan yang mendaftarkan tim. Registrasi, isi & update charter, upload file, revisi, Finalise Project.
- **Anggota Tim**: Karyawan yang didaftarkan ketua. Melihat project timnya (read-only); opsional bisa diberi hak edit oleh ketua.
- **Verifikator**: Tim expert per stream. Review project, visit lapangan, feedback, nilai 0-100, seleksi ke Convention Day.
- **Juri**: Penilai Convention Day per stream/kategori. Review materi final, nilai 0-100 per parameter.
- **Admin / Panitia (L&D)**: Tim L&D. Kelola event, jadwal fase, master data, parameter penilaian, assignment, rekap & export.
- **Viewer Manajemen**: BOD, GM, Head of Dept. Dashboard read-only: statistik, progres, leaderboard.

### 2.2 Matriks permission
Keterangan: C = Create, R = Read, U = Update, D = Delete, — = tidak ada akses.

| Aksi | Peserta | Anggota | Verifikator | Juri | Admin | Viewer |
|---|---|---|---|---|---|---|
| Registrasi tim & project | C | — | — | — | C (atas nama peserta) | — |
| Edit charter & lampiran (sebelum final) | U (project sendiri) | R / U jika diizinkan | — | — | U | — |
| Lihat detail project | R (sendiri) | R (sendiri) | R (stream di-assign) | R (hanya yang lolos, di-assign) | R (semua) | R (ringkasan) |
| Tulis feedback verifikasi | — | — | C/U | — | R | — |
| Beri nilai verifikasi | — | — | C/U (sebelum dikunci) | — | R, buka kunci | — |
| Seleksi lolos Convention Day | — | — | U | — | U, override | — |
| Finalise Project | U (sekali, irreversible) | — | — | — | U, buka kunci (dengan alasan) | — |
| Beri nilai juri | — | — | — | C/U (sebelum submit) | R, buka kunci | — |
| Lihat nilai & ranking | Setelah diumumkan | Setelah diumumkan | Nilai verifikasi | Nilai sendiri | Semua | Setelah diumumkan |
| Kelola event, fase, master data | — | — | — | — | CRUD | — |
| Export laporan | — | — | Stream sendiri | — | Semua | Ringkasan |

### 2.3 Aturan akses penting
- **Konflik kepentingan**: verifikator atau juri tidak boleh menilai project di mana ia terdaftar sebagai anggota tim, atau (opsional) dari unit kerjanya sendiri. Sistem memblokir otomatis.
- **Blind scoring**: juri tidak melihat nilai verifikator maupun nilai juri lain sampai Admin mengumumkan hasil.
- **Row-level security**: setiap query project difilter berdasarkan role + assignment di sisi server, bukan hanya disembunyikan di UI.
- **Aksi Admin tercatat**: setiap buka kunci, override seleksi, atau edit nilai wajib mengisi alasan dan masuk audit log.

---

## 3. Siklus Fase, Status Project & Kode Registrasi

Setiap project bergerak lewat 10 status yang sama di semua stream; yang berbeda antar stream hanya kategori, format kode, dan parameter penilaian. Perpindahan status dikendalikan server dan tanggal fase yang diatur Admin.

### 3.1 Fase event
| Fase | Status yang aktif | Aktor utama | Dikunci oleh |
|---|---|---|---|
| 1. Registrasi | Draft, Submitted | Peserta | Tanggal tutup registrasi (setting Admin) |
| 2. Verifikasi | Dalam Verifikasi, Terverifikasi | Verifikator, Peserta (revisi) | Verifikator submit nilai final |
| 3. Seleksi | Lolos Convention / Tidak Lolos | Verifikator, Admin | Admin publish hasil seleksi |
| 4. Convention Day | Finalised, Dinilai Juri | Peserta (final upload), Juri | Deadline finalise + juri submit |
| 5. Pengumuman | Hasil Diumumkan | Admin | Admin publish hasil |

### 3.2 Aturan transisi status
| Dari | Ke | Trigger | Siapa |
|---|---|---|---|
| Draft | Submitted | Klik Submit, field wajib lengkap, kode registrasi terbit | Peserta |
| Submitted | Dalam Verifikasi | Verifikator membuka/mulai menilai, atau fase Verifikasi dimulai | Otomatis / Verifikator |
| Dalam Verifikasi | Terverifikasi | Verifikator submit nilai final (semua parameter terisi) | Verifikator |
| Terverifikasi | Lolos Convention / Tidak Lolos | Keputusan seleksi dipublish | Verifikator + Admin |
| Lolos Convention | Finalised | Klik Finalise Project, final PPT/Video terunggah | Peserta |
| Finalised | Dinilai Juri | Semua juri yang di-assign submit nilai | Otomatis |
| Dinilai Juri | Hasil Diumumkan | Admin publish ranking | Admin |
| Finalised | Lolos Convention | Buka kunci (wajib alasan) | Admin |

Jika peserta tidak Finalise sampai deadline, sistem otomatis Finalise dengan versi terakhir dan mengirim notifikasi (dapat dimatikan per event).

### 3.3 Format kode registrasi
Kode terbit saat Submit, unik per event, dan tidak pernah berubah. Nomor urut dibuat dalam transaksi database dengan row lock agar tidak ada duplikat saat banyak peserta submit bersamaan.

| Stream | Pola | Contoh |
|---|---|---|
| CIC | {Level}{Improvement}{Area}-{NNN} | Beginner + Mechanization + Estate PG1 = BMECHPG1-001 |
| Bulan K3 | SIGAP-{NNN} | SIGAP-001 |
| Energy Management | {prefix}-{NNN} (asumsi) | ENRG-001 |

---

## 4. Functional Requirements

### 4.1 Module Auth & Akun (AUTH)
- **AUTH-01** (P0): Login memakai index karyawan + password. Akun dibuat otomatis dari master data karyawan.
- **AUTH-02** (P0): Login pertama wajib ganti password default; opsi aktivasi via OTP email bila email tersedia.
- **AUTH-03** (P0): Lupa password: reset via email, atau reset oleh Admin untuk karyawan tanpa email.
- **AUTH-04** (P0): User dengan lebih dari satu role memiliki role switcher di header (misal Peserta dan Verifikator).
- **AUTH-05** (P0): Session timeout 8 jam; rate limit 5 kali gagal login per 15 menit per index.
- **AUTH-06** (P2): Siap integrasi SSO korporat (abstraksi auth provider).

### 4.2 Module Master Data Karyawan (EMP)
- **EMP-01** (P0): Admin import karyawan dari Excel/CSV: index, nama lengkap, level employee, jabatan, unit/estate, divisi, email, no HP.
- **EMP-02** (P0): Validasi import: index duplikat, kolom wajib kosong, preview sebelum commit, laporan baris gagal.
- **EMP-03** (P0): Komponen autocomplete: ketik index atau nama, minimal 3 karakter, lalu nama & level terisi otomatis dan tidak bisa diedit manual.
- **EMP-04** (P1): Karyawan nonaktif/resign tidak muncul di autocomplete tetapi tetap tampil di project lama.
- **EMP-05** (P2): Sinkronisasi terjadwal dari API HRIS (bila tersedia).

### 4.3 Module Event & Konfigurasi (CFG) — Admin
- **CFG-01** (P0): Buat event (misal BMG 2026) dengan status Draft / Aktif / Selesai; hanya satu event aktif.
- **CFG-02** (P0): Aktifkan stream per event: CIC, Bulan K3, Energy Management.
- **CFG-03** (P0): Atur tanggal buka/tutup tiap fase per stream (Registrasi, Verifikasi, Seleksi, Finalisasi, Convention Day, Pengumuman).
- **CFG-04** (P0): Kelola kategori per stream (Level, Improvement, Group Area, SIGAP) beserta singkatan kode.
- **CFG-05** (P0): Kelola parameter penilaian per stream dan per tahap (verifikasi / juri): nama, deskripsi rubrik, bobot %, total bobot harus 100%.
- **CFG-06** (P1): Atur aturan tim: jumlah anggota min/maks, maks project per karyawan per stream.
- **CFG-07** (P1): Atur kuota lolos Convention Day per kategori (angka atau top-N).
- **CFG-08** (P1): Atur bobot nilai akhir: % verifikasi vs % juri.
- **CFG-09** (P2): Duplikasi konfigurasi dari event tahun lalu.

### 4.4 Module Peserta (PAR)
- **PAR-01** (P0): Wizard registrasi sesuai 6 langkah, mobile-first.
- **PAR-02** (P0): Autosave draft tiap 30 detik dan saat pindah langkah.
- **PAR-03** (P0): Submit menerbitkan kode registrasi unik, tampil di layar sukses dan dikirim via email.
- **PAR-04** (P0): Upload: PPT/PPTX, PDF, XLS/XLSX, JPG/PNG, MP4. Batas default 20 MB per dokumen, 10 file per project.
- **PAR-05** (P0): Video besar: selain upload MP4 (maks 100 MB), peserta bisa menempelkan link (Google Drive / OneDrive / YouTube unlisted).
- **PAR-06** (P0): Setelah Submit, charter dan lampiran tetap bisa diupdate sampai Finalise; setiap simpan membuat versi baru (v1, v2, dst) dengan catatan perubahan.
- **PAR-07** (P0): Dashboard "Project Saya": kartu per project berisi kode, judul, stream, status stepper, deadline berikutnya.
- **PAR-08** (P0): Tab Feedback: daftar catatan verifikator (tanggal, nama verifikator, isi, bagian charter terkait), badge untuk feedback belum dibaca.
- **PAR-09** (P1): Peserta bisa membalas feedback (thread) dan menandai "sudah ditindaklanjuti".
- **PAR-10** (P1): Menu Convention Day (muncul hanya jika Lolos): slot khusus Final Presentation (PDF wajib + PPTX opsional) dan Final Video (file atau link).
- **PAR-11** (P1): Tombol Finalise Project: checklist kelengkapan, modal konfirmasi dengan mengetik kode project, lalu semua field terkunci (read-only) dan tampil badge Final.
- **PAR-12** (P2): Lihat perbandingan antar versi charter (diff sederhana per field).

### 4.5 Module Verifikator (VER)
- **VER-01** (P0): Dashboard: kartu ringkasan (total project, belum dinilai, sudah dinilai) + tabel project stream yang di-assign.
- **VER-02** (P0): Filter tabel: stream, level, improvement, group area, status; pencarian kode/judul; sort per kolom.
- **VER-03** (P0): Klik kode atau judul membuka halaman detail: tim, kategori, charter versi terbaru, lampiran dengan preview, riwayat versi.
- **VER-04** (P1): Log visit lapangan: tanggal visit, lokasi, foto bukti (upload dari HP), catatan.
- **VER-05** (P0): Tulis feedback per project, opsional ditautkan ke bagian charter tertentu; simpan sebagai draft atau kirim ke peserta.
- **VER-06** (P0): Form penilaian: setiap parameter tampil dengan deskripsi rubrik, input 0-100 (slider + angka), bobot, total tertimbang otomatis.
- **VER-07** (P0): Simpan draft nilai; Submit Final mengunci nilai dan mengubah status project menjadi Terverifikasi.
- **VER-08** (P0): Jika satu project dinilai lebih dari satu verifikator, nilai verifikasi = rata-rata.
- **VER-09** (P0): Halaman Seleksi: ranking per kategori berdasarkan nilai verifikasi, checkbox "Lolos", indikator kuota, lalu Submit Seleksi.
- **VER-10** (P0): Setelah Admin publish seleksi, project Lolos otomatis muncul di dashboard juri yang di-assign dan peserta mendapat notifikasi.
- **VER-11** (P1): Export daftar project dan nilai stream sendiri ke Excel.

### 4.6 Module Juri (JUR)
- **JUR-01** (P1): Dashboard: list project Lolos dikelompokkan per kategori improvement (CIC) atau SIGAP (K3), dengan status Belum / Draft / Sudah dinilai dan progress bar.
- **JUR-02** (P1): Halaman detail project (tim, kategori, charter final) bisa dibuka dari dashboard.
- **JUR-03** (P1): Layar penilaian split screen: kiri viewer materi (PDF viewer halaman per halaman, tab Video, tab Charter), kanan form penilaian sticky.
- **JUR-04** (P1): Divider kiri-kanan bisa digeser (default 65:35), tombol fullscreen materi, dan di tablet/HP tampilan ditumpuk atas-bawah.
- **JUR-05** (P1): Form: parameter + rubrik, input 0-100, catatan per parameter opsional, total tertimbang live, autosave.
- **JUR-06** (P1): Submit nilai mengunci form; tombol "Project berikutnya" untuk berpindah cepat.
- **JUR-07** (P1): Blind scoring: juri tidak melihat nilai verifikator dan juri lain.
- **JUR-08** (P1): Validasi konflik kepentingan: project dari tim yang memuat juri tersebut tidak tampil.

### 4.7 Module Admin / Panitia (ADM)
- **ADM-01** (P0): Kelola user & role; assign verifikator dan juri ke stream (dan opsional kategori).
- **ADM-02** (P0): Monitoring semua project: tabel lintas stream dengan filter, dan bisa membuka detail.
- **ADM-03** (P0): Publish hasil seleksi dan override (tambah/hapus project lolos) dengan alasan.
- **ADM-04** (P1): Buka kunci project Finalised, nilai verifikator, atau nilai juri, wajib alasan.
- **ADM-05** (P1): Rekap nilai & ranking per kategori, lalu publish pengumuman pemenang.
- **ADM-06** (P1): Export Excel: registrasi, nilai verifikasi per parameter, nilai juri per juri per parameter, ranking akhir.
- **ADM-07** (P1): Audit log: siapa, kapan, aksi apa, nilai sebelum dan sesudah.
- **ADM-08** (P2): Broadcast pengumuman (banner di dashboard + email) per stream atau semua.

### 4.8 Module Notifikasi (NOT)
- **NOT-01** (P0): Submit registrasi (berisi kode) $\rightarrow$ Ketua + anggota via Email + in-app.
- **NOT-02** (P0): Feedback baru dikirim $\rightarrow$ Ketua + anggota via Email + in-app.
- **NOT-03** (P0): Status project berubah $\rightarrow$ Ketua via In-app.
- **NOT-04** (P1): Pengingat deadline H-3 dan H-1 $\rightarrow$ Peserta yang belum menyelesaikan via Email.
- **NOT-05** (P0): Hasil seleksi Lolos / Tidak Lolos $\rightarrow$ Ketua + anggota via Email + in-app.
- **NOT-06** (P1): Project di-assign / siap dinilai $\rightarrow$ Verifikator, juri via Email.
- **NOT-07** (P1): Pengumuman pemenang $\rightarrow$ Semua peserta via Email + in-app.

### 4.9 Module Rekap, Leaderboard & Dashboard Manajemen (REP)
- **REP-01** (P1): Ranking otomatis per kategori; tie-breaker: nilai juri lebih tinggi, lalu waktu Finalise lebih awal.
- **REP-02** (P1): Dashboard manajemen: jumlah project per stream, area, kategori; funnel Submitted ke Lolos ke Finalised; partisipasi per unit.
- **REP-03** (P2): Leaderboard publik setelah pengumuman (juara per kategori).
- **REP-04** (P2): Generate e-sertifikat PDF peserta dan pemenang.

---

## 7. Development Task List

Pengerjaan dibagi 9 phase berurutan; Phase 0 sampai 4 membentuk MVP yang harus live sebelum registrasi dibuka, Phase 5 dan 6 harus live sebelum Convention Day. Setiap phase ditutup dengan Definition of Done (DoD) yang bisa diuji.

### 7.1 Ringkasan Phase

| Phase | Fokus | Prioritas | Bergantung pada | Wajib live sebelum | Status Saat Ini |
|---|---|---|---|---|---|
| **Phase 0** | Persiapan & keputusan | P0 | — | Mulai coding | **Selesai** |
| **Phase 1** | Setup project, auth & RBAC | P0 | Phase 0 | Registrasi dibuka | **Selesai** |
| **Phase 2** | Master data & konfigurasi event | P0 | Phase 1 | Registrasi dibuka | **Selesai** |
| **Phase 3** | Module Peserta: registrasi & charter | P0 | Phase 2 | Registrasi dibuka | **Selesai** |
| **Phase 4** | Module Verifikator: review, feedback, nilai | P0 | Phase 3 | Fase Verifikasi | **Selesai** |
| **Phase 5** | Seleksi, Convention prep & Module Juri | P1 | Phase 4 | Convention Day | **Selesai** |
| **Phase 6** | Rekap, notifikasi lanjutan & dashboard manajemen | P1 | Phase 5 | Pengumuman | **Berikutnya (Next)** |
| **Phase 7** | QA, UAT & deployment Hostinger | P0 | Tiap phase | Setiap rilis | Menunggu |
| **Phase 8** | Backlog pasca-launch (P2) | P2 | Phase 6 | — | Backlog |

---

### Detail Task per Phase

#### Phase 0 — Persiapan & Keputusan (Selesai)
- [x] 0.1 Jawab open questions di Bagian 8 (terutama singkatan kode, bobot nilai, parameter penilaian).
- [x] 0.2 Tentukan paket Hostinger dan tech stack (Opsi A: Laravel 11 + Inertia React).
- [x] 0.3 Siapkan domain/subdomain + SSL.
- [x] 0.4 Minta export data karyawan dari HR (format kolom sesuai EMP-01).
- [x] 0.5 Buat wireframe 6 layar kunci: wizard registrasi, dashboard peserta, detail project, dashboard verifikator, form nilai, split screen juri.
- [x] 0.6 Buat repo Git, branching `main` / `develop` / `feature/*`.

#### Phase 1 — Setup Project, Auth & RBAC (Selesai)
- [x] 1.1 Inisialisasi project (Laravel + Inertia + React + Tailwind), linting, formatter.
- [x] 1.2 Konfigurasi `.env` lokal, staging, production; koneksi DB.
- [x] 1.3 Buat design system dasar: token warna, font, spacing, komponen Button, Input, Card, Badge status, Table, Modal, Toast, Stepper.
- [x] 1.4 Layout shell: sidebar desktop, bottom nav mobile, header dengan role switcher.
- [x] 1.5 Migrasi tabel identitas: `employees`, `users`, `roles`, `user_roles`, `assignments`, `audit_logs`.
- [x] 1.6 Login dengan index + password, paksa ganti password pertama kali, lupa password (AUTH-01 sampai 05).
- [x] 1.7 Middleware RBAC + policy per resource; helper cek assignment stream.
- [x] 1.8 Seeder: 5 role, 1 akun Admin, 20 karyawan dummy.
- [x] 1.9 Konfigurasi deployment & pipeline test.

#### Phase 2 — Master Data & Konfigurasi Event (Selesai)
- [x] 2.1 Import karyawan Excel/CSV dengan preview dan laporan error (EMP-01, EMP-02).
- [x] 2.2 API + komponen autocomplete karyawan (EMP-03).
- [x] 2.3 Migrasi tabel konfigurasi: `events`, `streams`, `phases`, `category_dimensions`, `category_options`, `scoring_parameters`, `registration_sequences`.
- [x] 2.4 CRUD event dan aktivasi stream (CFG-01, CFG-02).
- [x] 2.5 Pengaturan tanggal fase + middleware buka/tutup fitur berdasarkan fase (CFG-03).
- [x] 2.6 CRUD kategori + singkatan kode (CFG-04); seed data CIC dan K3 sesuai Bagian 3.3.
- [x] 2.7 CRUD parameter penilaian dengan validasi total bobot 100% (CFG-05).
- [x] 2.8 Aturan tim dan kuota (CFG-06, CFG-07).
- [x] 2.9 Manajemen user & assignment verifikator/juri (ADM-01).

#### Phase 3 — Module Peserta: Registrasi & Charter (Selesai)
- [x] 3.1 Migrasi tabel project: `projects`, `project_categories`, `team_members`, `charter_versions`, `project_files`.
- [x] 3.2 Wizard registrasi 6 langkah (PAR-01) dengan validasi per langkah.
- [x] 3.3 Form Project Charter: rich text sederhana, tabel dinamis Key Milestone, list Initiatives, tabel Results.
- [x] 3.4 Autosave draft (PAR-02).
- [x] 3.5 Service generate kode registrasi dengan transaksi + row lock; unit test 50 submit paralel tanpa duplikat (PAR-03).
- [x] 3.6 Upload file: dropzone, chunked upload, validasi MIME/ukuran, input link video (PAR-04, PAR-05).
- [x] 3.7 File privat: disimpan di luar public, diunduh via signed URL + cek policy.
- [x] 3.8 Update setelah submit + versioning otomatis dengan catatan perubahan (PAR-06).
- [x] 3.9 Dashboard "Project Saya" dengan stepper status (PAR-07).
- [x] 3.10 Email konfirmasi submit berisi kode (NOT-01) + notifikasi in-app dasar.
- [x] 3.11 Uji mobile responsif di viewport layar sentuh 4G.

#### Phase 4 — Module Verifikator: Review, Feedback, Nilai (Selesai)
- [x] 4.1 Migrasi: `feedbacks`, `verification_visits`, `score_sheets`, `score_items`.
- [x] 4.2 Dashboard verifikator: kartu ringkasan + tabel dengan filter, search, sort, pagination (VER-01, VER-02).
- [x] 4.3 Halaman detail project: charter terbaru, riwayat versi, preview lampiran (VER-03).
- [x] 4.4 Feedback: tulis, simpan draft, kirim ke peserta; tab Feedback + badge belum dibaca di sisi peserta (VER-05, PAR-08, NOT-02).
- [x] 4.5 Log visit + upload foto dari HP (VER-04).
- [x] 4.6 Form penilaian dinamis dari `scoring_parameters`, slider + input angka, total tertimbang live (VER-06).
- [x] 4.7 Draft vs Submit Final, kunci nilai, ubah status ke Terverifikasi (VER-07).
- [x] 4.8 Service perhitungan skor (rata-rata multi verifikator) + unit test (VER-08).
- [x] 4.9 Transisi status otomatis Submitted ke Dalam Verifikasi.

#### Phase 5 — Seleksi, Convention Prep & Module Juri
- [x] 5.1 Migrasi: `selection_decisions`.
- [x] 5.2 Halaman seleksi: ranking per kategori, checkbox Lolos, indikator kuota (VER-09).
- [x] 5.3 Admin publish seleksi + override dengan alasan (ADM-03); notifikasi Lolos/Tidak Lolos (NOT-05).
- [x] 5.4 Routing otomatis project Lolos ke dashboard juri sesuai assignment (VER-10).
- [x] 5.5 Menu Convention Day peserta: slot Final Presentation (PDF wajib) dan Final Video (PAR-10).
- [x] 5.6 Finalise Project: checklist, modal ketik kode, lock semua field; auto-finalise saat deadline (PAR-11).
- [x] 5.7 Dashboard juri per kategori + progress (JUR-01, JUR-02).
- [x] 5.8 Split screen: PDF viewer (pdf.js), tab Video, tab Charter; divider resizable 65:35; fullscreen; stack di tablet (JUR-03, JUR-04).
- [x] 5.9 Form nilai juri sticky + autosave + submit lock + tombol project berikutnya (JUR-05, JUR-06).
- [x] 5.10 Blind scoring dan filter konflik kepentingan (JUR-07, JUR-08).
- [x] 5.11 Uji split screen di laptop 1366 px dan tablet 10 inci.

#### Phase 6 — Rekap, Notifikasi Lanjutan & Dashboard Manajemen
- [ ] 6.1 Service rekap nilai akhir + ranking + tie-breaker; tabel `final_results` (REP-01, CFG-08).
- [ ] 6.2 Publish pengumuman pemenang (ADM-05, NOT-07).
- [ ] 6.3 Export Excel: registrasi, nilai verifikasi, nilai juri, ranking (ADM-06, VER-11).
- [ ] 6.4 Buka kunci project/nilai dengan alasan + tampilan audit log (ADM-04, ADM-07).
- [ ] 6.5 Pengingat deadline H-3 dan H-1 via scheduler (NOT-04); email assignment (NOT-06).
- [ ] 6.6 Dashboard manajemen: KPI, funnel status, partisipasi per area (REP-02).
- [ ] 6.7 Thread balasan feedback + tandai ditindaklanjuti (PAR-09).

#### Phase 7 — QA, UAT & Deployment Hostinger
- [ ] 7.1 Automated test: unit test service kode registrasi, skor, transisi status; feature test RBAC.
- [ ] 7.2 Security check: akses silang antar role, upload file berbahaya, IDOR pada URL project/file.
- [ ] 7.3 Load test sederhana: 300 user bersamaan membuka dashboard dan submit.
- [ ] 7.4 UAT dengan 5 peserta lapangan, 2 verifikator, 2 juri, 1 Admin; catat dan perbaiki temuan.
- [ ] 7.5 Konfigurasi production: HTTPS, `APP_DEBUG=false`, cron queue + scheduler, SMTP, batas upload PHP.
- [ ] 7.6 Backup otomatis harian + uji restore.
- [ ] 7.7 Import data karyawan production, buat akun verifikator/juri, konfigurasi event nyata.
- [ ] 7.8 Panduan singkat per role (PDF 1-2 halaman atau video 3 menit) dan FAQ di halaman login.
- [ ] 7.9 Go-live + monitoring error log selama minggu pertama registrasi.

#### Phase 8 — Backlog Pasca-Launch (P2)
- [ ] 8.1 Stream Energy Management dikonfigurasi penuh setelah spesifikasinya final.
- [ ] 8.2 Diff antar versi charter (PAR-12).
- [ ] 8.3 Leaderboard publik dan e-sertifikat PDF (REP-03, REP-04).
- [ ] 8.4 Broadcast pengumuman (ADM-08).
- [ ] 8.5 Duplikasi konfigurasi event tahun lalu (CFG-09).
- [ ] 8.6 Integrasi SSO dan sinkron HRIS (AUTH-06, EMP-05).
- [ ] 8.7 Dark mode.
