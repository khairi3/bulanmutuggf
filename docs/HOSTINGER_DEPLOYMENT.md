# Panduan Deployment Staging & Production Hostinger (Task 1.9)
**Sistem Web Bulan Mutu GGF (BMG)**

Dokumen ini memandu deployment sistem BMG ke hosting Hostinger (Business/Cloud Hosting atau VPS).

---

## 1. Persiapan di Hostinger hPanel

1. **Buat Database MySQL**:
   - Buka menu **Databases** di hPanel.
   - Buat database baru (misal: `u123456789_bmg_staging`).
   - Buat user dan catat password kuat.
2. **Setup Git Repository**:
   - Buka menu **Advanced > Git** di hPanel.
   - Sambungkan ke repository Git BMG (branch `develop` untuk staging, branch `main` untuk production).
   - Tentukan direktori target instalasi (misal: `domains/staging-bmg.domain.com/public_html`).
3. **Konfigurasi .env**:
   - Salin isi `.env.staging` ke file `.env` di server.
   - Masukkan kredensial database dan SMTP Hostinger.
   - Jalankan `php artisan key:generate`.

---

## 2. Menjalankan Deployment

Jalankan perintah deployment via SSH atau via fitur Git webhook / auto-deploy:
```bash
bash deploy.sh
```

Perintah di atas secara otomatis:
- Menarik commit terbaru dari Git
- Menginstall dependency Composer tanpa dev packages
- Mengompilasi asset frontend Vite + Tailwind
- Menjalankan migrasi database (`php artisan migrate --force`)
- Mengoptimalkan cache config, routes, dan views

---

## 3. Konfigurasi Cron Scheduler Hostinger

Agar notifikasi, scheduler fase, dan background jobs berjalan otomatis, tambahkan Cron Job di **Advanced > Cron Jobs**:

- **Tipe**: Custom
- **Command**:
  ```bash
  * * * * * cd /home/u123456789/domains/staging-bmg.domain.com/public_html && php artisan schedule:run >> /dev/null 2>&1
  ```
- **Interval**: Setiap 1 Menit (`* * * * *`)

Untuk queue worker (jika memproses background job email):
```bash
* * * * * cd /home/u123456789/domains/staging-bmg.domain.com/public_html && php artisan queue:work --stop-when-empty >> /dev/null 2>&1
```
