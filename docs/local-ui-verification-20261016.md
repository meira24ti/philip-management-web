# Perbaikan UI dan verifikasi lokal ? 16 Oktober 2026

## Perubahan

- Crop persegi yang sama untuk foto properti, profil sendiri, dan foto staff: geser, zoom, reset, batal, crop ulang, dan preview sebelum simpan. Foto profil tidak diberi watermark.
- Pemulihan layout label/form-control yang tidak disediakan DaisyUI 5; ukuran input dan tombol seragam, label terpisah, formulir properti satu area scroll, footer tindakan tetap terlihat, dialog mengikuti tinggi layar.
- Preview profil setelah disimpan mengikuti respons database; avatar memakai hasil crop tanpa padding.
- Kontras harga sewa diperbaiki, label filter ditambahkan, badge penawaran merah dan status terjual/tersewa tetap kuning.
- Logo lengkap asli dari gambar kedua ditemukan sebagai `D:/Temporary Download/WhatsApp Image 2026-04-02 at 15.09.36.jpeg`, disalin tanpa digambar ulang ke `philip-app/public/brand/company-logo.jpeg`. Flyer menggunakan gambar lengkap jika pengaturan masih kosong atau menunjuk simbol P. bawaan lama. Logo kustom tetap didahulukan.
- Hero dashboard mengikuti pengaturan perusahaan. Sidebar memperbarui identitas saat pengaturan disimpan.
- Pengaturan yang belum memiliki baris di database kini dapat disimpan, termasuk logo. Update beberapa pengaturan memakai transaksi.
- Perubahan nomor HP pemilik pada properti tidak lagi diam-diam menggunakan nomor lama; pemilik dicocokkan menurut nama dan nomor HP.
- Migrasi `20261016_align_form_columns` menyelaraskan kolom opsional (area, luas bangunan, sertifikat), panjang email/telepon dan judul laporan. Migrasi sudah dijalankan pada database lokal.
- Vite menyediakan proxy lokal `/api` dan `/uploads` ke port 5000. `.env.development.local` memilih `/api`; tidak memerlukan Railway.

## Hasil yang terverifikasi

- `npm.cmd test` di backend: **31 lulus**, mencakup peran, sesi/token, pembatasan upload, validasi input, watermark, kombinasi jenis, enam poin flyer, alamat panjang, transaksi dan pengurutan foto.
- `node tests/local-acceptance.cjs --api-only`: **35 pemeriksaan lulus** menggunakan HTTP dan **MySQL 8 sungguhan**, dengan skema disalin (tanpa data asli) ke database sementara yang dihapus setelah pengujian.
- Integrasi lokal mencakup login tiga peran, admin hanya membuat marketing, properti tanpa nomor folder/luas bangunan, kombinasi Rumah + Ruko, update pemilik, upload/download foto ber-watermark, upload dan simpan profil, pembacaan ulang foto dari database, pengaturan baru, statistik, batas akses laporan, transaksi, penolakan transaksi berulang, dan logout.
- Frontend: **lint lulus dan build lulus**.
- Pemeriksaan browser desktop sudah melewati dashboard, daftar dan formulir properti, detail, staff, pengaturan perusahaan, profil, dan dialog crop. Kontras harga sewa yang ditemukan pada pemeriksaan awal sudah diperbaiki.

## Batas pengujian

Rangkaian browser lengkap belum dinyatakan lulus: eksekusi awal berhenti pada penantian alur simpan profil; percobaan browser dalam sandbox mengalami timeout dan izin menjalankan ulang di luar sandbox ditolak. Jangan menganggap pemeriksaan desktop parsial sebagai bukti semua tampilan mobile atau semua interaksi telah lulus. Upload dan simpan profil melalui API lokal sudah lulus. Regresi PDF dan rendering flyer penuh setelah perubahan terbaru belum selesai diuji di browser.

Pengiriman email reset password nyata, pemasangan domain `philiprealestate.com`, dan deployment belum diuji/dilakukan. Pengujian lokal bukan jaminan bebas semua bug atau semua risiko keamanan.

## Menjalankan lokal

1. Jalankan MySQL lokal sesuai `philip-backend/.env`.
2. Di `philip-backend`: `npm.cmd run migrate`, lalu `npm.cmd run dev`.
3. Di `philip-app`: `npm.cmd run dev`, lalu buka `http://localhost:5173`.
4. Muat ulang penuh browser setelah memperbarui aplikasi. Saat memilih foto profil di Pengaturan ? Profil Saya, editor crop terbuka terlebih dahulu. Klik **Gunakan foto**, lalu **Simpan Profil**.

Database utama dicadangkan ke file SQL lokal yang diabaikan Git: `philip-backend/.test-artifacts/local-backup-1792126620299.sql`. Data asli tidak dipakai sebagai fixture atau dihapus oleh tes. Jangan commit file backup ini.

Untuk deployment, tentukan `VITE_API_URL` sesuai server produksi saat build; konfigurasi localhost saat ini khusus penggunaan lokal. Rujuk `docs/deployment.md` untuk pengaturan produksi.
