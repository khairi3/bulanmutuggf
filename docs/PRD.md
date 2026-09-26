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
| Aksi | Peserta | Anggota | Verifikator | Juri | Admin | Viewer |
|---|---|---|---|---|---|---|
| Registrasi tim & project | C | — | — | — | C (atas nama peserta) | — |
| Edit charter & lampiran (sebelum final) | U (project sendiri) | R / U jika diizinkan | — | — | U | — |
| Lihat detail project | R (sendiri) | R (sendiri) | R (stream di-assign) | R (lolos, di-assign) | R (semua) | R (ringkasan) |
| Tulis feedback verifikasi | — | — | C/U | — | R | — |
| Beri nilai verifikasi | — | — | C/U (sebelum kunci) | — | R, buka kunci | — |
| Seleksi lolos Convention Day | — | — | U | — | U, override | — |
| Finalise Project | U (sekali, irreversible) | — | — | — | U, buka kunci (alasan) | — |
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
10 status:
1. `Draft` -> 2. `Submitted` -> 3. `Dalam Verifikasi` -> 4. `Terverifikasi` -> 5. `Lolos Convention` / `Tidak Lolos` -> 6. `Finalised` -> 7. `Dinilai Juri` -> 8. `Hasil Diumumkan`.

### 3.1 Fase event
1. Registrasi (Draft, Submitted)
2. Verifikasi (Dalam Verifikasi, Terverifikasi)
3. Seleksi (Lolos Convention / Tidak Lolos)
4. Convention Day (Finalised, Dinilai Juri)
5. Pengumuman (Hasil Diumumkan)

### 3.3 Format kode registrasi
- **CIC**: `{Level}{Improvement}{Area}-{NNN}` contoh `BMECHPG1-001`
- **Bulan K3**: `SIGAP-{NNN}` contoh `SIGAP-001`
- **Energy Management**: `{prefix}-{NNN}` contoh `ENRG-001`

---

## 4. Functional Requirements
- **AUTH-01**: Login memakai index karyawan + password.
- **AUTH-02**: Login pertama wajib ganti password default; opsi aktivasi OTP email.
- **AUTH-03**: Lupa password: reset via email atau reset Admin untuk karyawan tanpa email.
- **AUTH-04**: Role switcher di header untuk user multi-role.
- **AUTH-05**: Session timeout 8 jam; rate limit 5 kali gagal login per 15 menit per index.
- **AUTH-06**: Siap integrasi SSO korporat.

---

## 5. Non-Functional Requirements & Design Tokens
- Font: Plus Jakarta Sans / Inter, minimum 16px body.
- Spacing: 4px multiples.
- Radius: 8px (input, button), 12px (card).
- Colors: GGF brand primary; status badges:
  - Draft: Gray
  - Submitted: Blue
  - Dalam Verifikasi: Amber
  - Terverifikasi: Purple
  - Lolos: Green
  - Tidak Lolos: Soft Red
  - Finalised: Dark green + lock icon
  - Dinilai Juri / Hasil Diumumkan: Teal
- Minimum touch target: 44x44px.
