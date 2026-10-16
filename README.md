# philip-management-web
Sistem web aplikasi manajemen properti untuk internal perusahaan Philip Real Estate

## Menjalankan aplikasi lokal

1. Nyalakan MySQL di Laragon. Database aplikasi adalah `db_prems`.
2. Atur `philip-backend/.env`: `DB_HOST=localhost`, `DB_PORT=3306`, `DB_NAME=db_prems`, serta `DB_USER` dan `DB_PASSWORD` sesuai MySQL lokal. Isi `JWT_SECRET` minimal 32 karakter, `PORT=5000`, dan `CLIENT_URL=http://localhost:5173`.
3. Dari folder `philip-backend`, jalankan `npm install` jika dependensi belum tersedia, lalu `npm run dev`. Migrasi database berjalan otomatis saat backend dimulai.
4. Atur `philip-app/.env` dengan `VITE_API_URL=http://localhost:5000/api`. Contoh tersedia di `philip-app/.env.example`.
5. Dari folder `philip-app`, jalankan `npm install` jika perlu, lalu `npm run dev -- --port 5173 --strictPort`. Buka **http://localhost:5173** dan masuk dengan akun aktif di database lokal.

Setelah mengubah `.env`, restart server terkait. Jangan gunakan URL API Railway untuk login ke database lokal. Respons `http://localhost:5000/` menunjukkan backend hidup; pengujian koneksi database dan login tetap perlu dilakukan melalui API.

Untuk build production, tentukan `VITE_API_URL` sesuai backend hosting sebelum menjalankan `npm run build`. Lihat [panduan deployment](docs/deployment.md).
