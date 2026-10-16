> Pembaruan 16 Oktober 2026: lihat [verifikasi lokal terbaru](local-ui-verification-20261016.md). Hasil dan batas pengujian terbaru mengutamakan laporan tersebut.

# Pemeriksaan UI dan keamanan — 20 September 2026

## Perubahan

- Admin hanya bisa membuat akun marketing, baik melalui API maupun halaman Staff/Register. Direktur tetap dapat membuat semua role.
- Token akses memiliki issuer, audience, tujuan, masa berlaku, dan sesi server. Token reset tidak dapat dipakai sebagai token login. Setiap request memeriksa akun aktif, role terkini, serta versi password. Logout mencabut sesi terkait; perubahan/reset password mencabut seluruh sesi. Reset menggunakan pembaruan bersyarat untuk menolak pemakaian ulang.
- Multer diperbarui ke versi 2. Unggahan memiliki batas ukuran/jumlah; isi JPG/PNG/WEBP didekode dan ditulis ulang, metadata/payload tambahan dibuang. File sementara tidak dilayani publik. PDF laporan memerlukan autentikasi dan role admin/direktur.
- Input harga, komisi, tanggal, koordinat, panjang teks, ID properti, dan tautan Maps divalidasi. Transaksi mengunci baris properti untuk menolak pencatatan ulang pada status terjual/tersewa. Komisi 0 tetap dihormati.
- Penghapusan properti mempertahankan riwayat audit dan menolak properti yang memiliki transaksi. Penghapusan foto dilakukan setelah commit. Urutan foto memerlukan seluruh ID milik properti dan menghasilkan satu cover.
- CORS memakai daftar origin eksplisit, respons API tidak di-cache, error internal tidak dikirim ke klien. Limiter memiliki penghitung terpisah dan batas memori. Koneksi database memiliki batas antrean. PDF membatasi proses bersamaan, menonaktifkan JavaScript/jaringan, dan membatasi jalur unduh.
- Build frontend memasang Content Security Policy. Data sesi localStorage yang rusak ditangani, gangguan koneksi menampilkan pilihan mencoba lagi, dan request API memiliki timeout. Hasil pencarian lama tidak menimpa pencarian terbaru.
- Label kontrol, kontras, navigasi keyboard modal, menu ponsel, dan notifikasi aksesibel diperbaiki. Pemilihan cover benar-benar memindahkan foto pertama; tombol panah mendukung ponsel. Toggle operasional menyimpan perubahan. Password otomatis staff ditampilkan setelah pembuatan.
- Font Poppins hanya memuat subset Latin, gambar daftar dimuat secara lazy, unduhan foto dibatasi dua request bersamaan, dan flyer memakai skala 2 (2160 × 3840) untuk mengurangi penggunaan memori canvas.

## Bukti pengujian lokal

- `npm test` pada backend: 31 pengujian lulus, termasuk request HTTP nyata ke Express dengan database tiruan untuk skenario autentikasi, role, upload, validasi, transaksi, dan foto.
- `npm run build` dan `npm run lint` pada frontend: lulus.
- `npm audit --json` pada kedua proyek: 0 kerentanan yang dilaporkan, termasuk dependensi pengembangan.
- `node tests/browser-ui-audit.cjs --collect`: 58 kondisi halaman pada desktop 1440 px dan ponsel 390 px, dengan data API tiruan untuk guest/admin/marketing/direktur. Hasil akhir: 0 pelanggaran Axe WCAG A/AA yang terdeteksi, 0 overflow halaman, 0 error JavaScript. Hasil rinci dan screenshot tersimpan di `.test-artifacts/ui-audit.json` dan `.test-artifacts/ui-*.png` (tidak masuk Git).
- `node tests/browser-property-smoke.cjs`: lulus untuk crop/zoom persegi, nomor folder opsional, pilihan kombinasi, tanggal tanpa waktu, pemilihan foto ZIP, dan render flyer beralamat panjang. API diintersep agar tidak mengubah data aktual.
- `node tests/browser-security-smoke.cjs`: lulus terhadap build produksi melalui `npm run preview -- --host 127.0.0.1` pada port 4173. Memeriksa pilihan role, fokus Tab/Escape pada modal, menu ponsel, pemulihan sesi rusak, dan penolakan script inline oleh CSP. Chromium benar-benar membuat PDF dari data SQL tiruan; permintaan PDF bersamaan ditolak. Hasil PDF: `.test-artifacts/report-smoke.pdf`.

## Temuan repositori dan batas verifikasi

Folder `mysql-8/` yang berisi data database, log, dan kunci privat TLS ditemukan tercatat di Git. Folder tersebut dan konfigurasi lokal frontend telah dikeluarkan dari indeks Git; aturan ignore juga telah ditambahkan. Salinan lokal tetap ada, tetapi tindakan ini **tidak menghapus salinan dari commit lama**. Jika repositori pernah dibagikan, perlakukan data dan kunci tersebut sebagai terpapar: rotasi kunci/kredensial yang terkait dan tangani riwayat repositori secara terkoordinasi. Pemeriksaan ini tidak melakukan penulisan ulang riwayat atau perubahan kredensial server.

Database yang dikonfigurasi menolak koneksi (`ECONNREFUSED`). Karena itu migrasi dan perilaku SQL terhadap MySQL aktual belum diverifikasi. Pengiriman SMTP, DNS, sertifikat hosting, beban produksi, dan pengujian penetrasi server live juga belum dilakukan. Hasil Axe hanya mencakup pemeriksaan otomatis pada keadaan yang diuji, bukan sertifikasi aksesibilitas. Hasil npm audit bukan jaminan seluruh aplikasi bebas kerentanan.

## Saat penerapan

1. Gunakan `npm ci` di kedua proyek; backup database sebelum menjalankan migrasi.
2. Jalankan migrasi backend yang menambahkan `auth_sessions`, lalu restart backend. Semua token format lama tidak berlaku: pengguna harus login kembali.
3. Gunakan `JWT_SECRET` acak minimal 32 karakter dan `CLIENT_URL` yang sesuai domain. Atur `TRUST_PROXY` hanya sesuai jumlah/alamat proxy yang benar-benar tepercaya. Limiter saat ini per proses; untuk beberapa instance, gunakan pembatasan bersama di reverse proxy atau penyimpanan bersama.
4. Build frontend dengan `VITE_API_URL` yang benar agar CSP mengizinkan origin API. Tambahkan header `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, dan HSTS pada hosting frontend HTTPS.
5. Chromium menggunakan sandbox secara default. `PUPPETEER_NO_SANDBOX=true` hanya untuk deployment dengan isolasi container yang memang memerlukannya.
6. Ulangi uji integrasi pada database staging, pengiriman email, dan alur laporan sebelum menerapkan ke produksi.
