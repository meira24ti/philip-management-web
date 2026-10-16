# Domain dan pembaruan properti

Domain tujuan: **philiprealestate.com** (alias **www.philiprealestate.com**).

## Menjalankan pembaruan

1. Jalankan `npm ci` pada `philip-backend` dan `philip-app`.
2. Jalankan `npm run migrate` pada backend, lalu restart backend. Migrasi juga dijalankan otomatis sebelum server menerima request. Migrasi membuat nomor folder nullable serta menambahkan kolom dua jenis kombinasi dan versi watermark. Data lama tetap dipertahankan.
3. Jalankan `npm run build` pada frontend dan gunakan hasil `dist`.
4. Unggah **gambar kedua dari referensi pengguna**, logo lengkap PHILIP REAL ESTATE beserta tagline, melalui **Settings → Logo Perusahaan**, lalu simpan. Flyer mengambil gambar logo tersebut; nama perusahaan tidak digambar ulang sebagai teks. Aset bawaan repositori saat ini hanya simbol P.

Foto baru disimpan sebagai JPG dengan watermark P. transparan di tengah. Crop persegi dilakukan sebelum upload. Foto lama juga diberi watermark saat diunduh atau dipakai pada flyer; file foto lama tidak ditimpa. Jika memilih beberapa foto, hasil unduhan berupa ZIP.

Pembaruan keamanan juga membuat tabel `auth_sessions`. Setelah restart, pengguna perlu login ulang karena token lama tidak lagi diterima. Lihat [catatan audit keamanan dan UI](security-ui-audit.md) untuk batas pengujian, penanganan data MySQL yang sebelumnya masuk Git, dan konfigurasi proxy/Chromium.

## Pengujian

- Backend dan utilitas foto/flyer: `npm test` pada `philip-backend`.
- Frontend: `npm run build` dan `npm run lint` pada `philip-app`.
- Uji browser: jalankan frontend di port 5173, lalu `node tests/browser-property-smoke.cjs` pada backend. Chrome/Puppeteer harus tersedia. API diuji dengan data tiruan, termasuk pemilihan foto dan isi ZIP. Hasil render disimpan di `philip-backend/.test-artifacts`.

Kategori kombinasi memerlukan dua jenis berbeda saat ditambahkan/diedit. Data kombinasi lama perlu dilengkapi lewat form edit agar kedua jenis dapat ditampilkan. Flyer menampilkan enam poin, termasuk LT/LB; nilai luas yang kosong diberi keterangan “Info menyusul”.

## Hosting domain

Konfigurasi DNS dan sertifikat HTTPS memerlukan akses registrar/hosting. Domain belum didaftarkan atau dihubungkan oleh perubahan kode ini.

- Arahkan DNS domain dan www ke hosting yang menjalankan aplikasi.
- Gunakan `CLIENT_URL=https://philiprealestate.com,https://www.philiprealestate.com` pada backend.
- Untuk satu domain, gunakan `VITE_API_URL=/api` pada frontend. Proxy `/api/` dan `/uploads/` ke backend, serta layani frontend dengan fallback ke `index.html` untuk route aplikasi.
- Izinkan body upload minimal 55MB pada reverse proxy (hingga 10 foto, 5MB per foto). Sesuaikan timeout untuk pemrosesan foto.
- Aktifkan HTTPS dan arahkan www ke domain utama. Jangan membuka port database ke internet.

Contoh lokasi Nginx di server HTTPS yang sertifikatnya sudah dikonfigurasi:

```nginx
server_name philiprealestate.com www.philiprealestate.com;
root /var/www/philip-app/dist;
client_max_body_size 55m;

location /api/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_read_timeout 120s;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;
}
location /uploads/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
}
location / {
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    try_files $uri $uri/ /index.html;
}
```
