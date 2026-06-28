# Analisis Project Philip Management Web

Tanggal analisis: 2026-06-22

## Ringkasan

Repository ini adalah aplikasi frontend React + Vite untuk dashboard manajemen properti Philip Real Estate. UI utama sudah terbentuk untuk login, dashboard listing properti, detail properti, staff, laporan, dan pengaturan. Namun sebagian besar fitur bisnis masih menggunakan data dummy/hardcoded, role masih disimulasikan lewat konstanta `CURRENT_ROLE`, dan autentikasi masih memakai `dummyjson.com` + `localStorage`, belum Supabase.

Tidak ditemukan integrasi database, Supabase client, environment variable, API service internal, migration SQL, atau state management global untuk user/session.

## Struktur Project Saat Ini

```text
.
|-- index.html
|-- philip-web.html
|-- package.json
|-- package-lock.json
|-- vite.config.js
|-- eslint.config.js
|-- README.md
|-- public/
|   |-- favicon.svg
|   `-- icons.svg
|-- src/
|   |-- App.jsx
|   |-- main.jsx
|   |-- App.css
|   |-- index.css
|   |-- assets/
|   |   |-- tailwind.css
|   |   |-- hero.png
|   |   |-- react.svg
|   |   `-- vite.svg
|   |-- components/
|   |   |-- Header.jsx
|   |   |-- Loading.jsx
|   |   |-- PageHeader.jsx
|   |   |-- ProtectedRoute.jsx
|   |   `-- Sidebar.jsx
|   |-- layouts/
|   |   |-- AuthLayout.jsx
|   |   `-- MainLayout.jsx
|   `-- pages/
|       |-- Dashboard.jsx
|       |-- NotFound.jsx
|       |-- Property.jsx
|       |-- PropertyDetail.jsx
|       |-- Reports.jsx
|       |-- Settings.jsx
|       |-- Staff.jsx
|       `-- auth/
|           |-- Forgot.jsx
|           |-- Login.jsx
|           `-- Register.jsx
`-- dist/
```

Catatan struktur:

- `node_modules/` sudah ada, tetapi bukan bagian source.
- `dist/` berisi hasil build dan sebaiknya tidak dijadikan sumber utama pengembangan.
- `src/assets/tailwind.css` adalah CSS yang aktif di `App.jsx`.
- `src/index.css` dan `src/App.css` tampak sebagai sisa template Vite dan tidak terlihat di-import oleh entry app saat ini.
- `ProtectedRoute.jsx` ada, tetapi routing di `App.jsx` tidak memakai komponen ini secara langsung. Proteksi route dilakukan inline di `App.jsx`.

## Teknologi dan Dependency

- Framework frontend: React 19.
- Bundler/dev server: Vite 8.
- Routing: `react-router-dom` 7.
- Styling: Tailwind CSS 4 via `@tailwindcss/vite` dan DaisyUI 5.
- Icon: `react-icons`, `lucide`, `lucide-react`.
- HTTP client: `axios`.
- Linting: ESLint flat config.

Belum ada:

- `@supabase/supabase-js`.
- TypeScript.
- Test runner.
- Form validation library.
- Charting/reporting/PDF generation library.
- Centralized API/service layer.

## Halaman yang Sudah Ada

### Auth

1. `/login`
   - File: `src/pages/auth/Login.jsx`
   - Form login dengan input email/username dan password.
   - Menggunakan `axios.post("https://dummyjson.com/auth/login")`.
   - Jika berhasil, response disimpan ke `localStorage` key `user`.
   - Belum memakai Supabase Auth.

2. `/register`
   - File: `src/pages/auth/Register.jsx`
   - Form UI untuk email, password, confirm password.
   - Belum ada submit handler, validasi, atau integrasi backend.

3. `/forgot`
   - File: `src/pages/auth/Forgot.jsx`
   - Form UI reset password.
   - Belum ada submit handler atau integrasi reset password.

### Main App

1. `/dashboard`
   - File: `src/pages/Dashboard.jsx`
   - Halaman listing properti dengan hero, statistik, search, filter, card properti, tombol detail, tombol share/copy.
   - Data properti masih hardcoded dalam array `properties`.

2. `/property`
   - File: `src/pages/Property.jsx`
   - Masih placeholder.
   - Mengarahkan user untuk kembali ke dashboard dan membuka detail dari card properti.

3. `/property/:id`
   - File: `src/pages/PropertyDetail.jsx`
   - Detail properti dengan gallery foto, spesifikasi, vendor/pemilik, status operasional, maps placeholder, tombol share, flyer, edit, hapus.
   - Parameter `id` dibaca, tetapi data yang ditampilkan selalu `dummyProperty`.

4. `/staff`
   - File: `src/pages/Staff.jsx`
   - Direktori staff dengan search, filter role, filter status, statistik staff, modal tambah staff, dan modal nonaktifkan akun.
   - Data staff masih hardcoded.
   - Tambah/edit belum menyimpan data.
   - Nonaktifkan akun hanya mengubah state lokal.

5. `/reports`
   - File: `src/pages/Reports.jsx`
   - Statistik dan laporan dengan card metrik, chart manual sederhana, generate PDF mock, dan riwayat laporan.
   - Data laporan masih hardcoded.
   - Generate PDF hanya simulasi loading 2 detik, belum membuat file.

6. `/settings`
   - File: `src/pages/Settings.jsx`
   - Tab Perusahaan, Profil Saya, dan Keamanan.
   - Form bisa diubah di state lokal.
   - Simpan hanya menampilkan status sementara, belum persist ke database.

7. `*`
   - File: `src/pages/NotFound.jsx`
   - Halaman 404 dengan tombol kembali.

## Komponen yang Sudah Ada

1. `Sidebar.jsx`
   - Sidebar desktop dan drawer mobile.
   - Menu: Utama, Property, Staff, Reports, Settings.
   - User footer masih hardcoded: Lorenza Esrada, Admin.

2. `PageHeader.jsx`
   - Header dengan breadcrumb statis "Utama", notifikasi dummy, dropdown profil dummy, dan logout.
   - Logout menghapus `localStorage.user` lalu redirect ke `/login`.

3. `Header.jsx`
   - Wrapper tipis yang hanya merender `PageHeader`.

4. `Loading.jsx`
   - Loading spinner untuk React Suspense.

5. `ProtectedRoute.jsx`
   - Mengecek `localStorage.user`.
   - Mengarahkan ke `/login` jika tidak ada user.
   - Belum dipakai di `App.jsx`.

6. Layout:
   - `MainLayout.jsx`: membungkus sidebar, header, dan outlet halaman utama.
   - `AuthLayout.jsx`: layout auth dengan branding Philip.

## Routing yang Sudah Ada

Routing didefinisikan di `src/App.jsx`.

```text
/               -> redirect ke /dashboard jika login, selain itu /login
/login          -> Login, redirect ke /dashboard jika sudah login
/register       -> Register
/forgot         -> Forgot
/dashboard      -> Dashboard, hanya jika localStorage.user ada
/property       -> Property, hanya jika localStorage.user ada
/property/:id   -> PropertyDetail, hanya jika localStorage.user ada
/staff          -> Staff, hanya jika localStorage.user ada
/reports        -> Reports, hanya jika localStorage.user ada
/settings       -> Settings, hanya jika localStorage.user ada
*               -> NotFound
```

Catatan routing:

- Proteksi route masih berbasis `localStorage`, bukan session Supabase.
- Tidak ada nested route untuk add/edit property, staff detail, atau laporan detail.
- Tidak ada role-based route guard. Role hanya digunakan lokal di beberapa file lewat `CURRENT_ROLE`.
- `/property` masih placeholder, padahal menu sidebar mengarah ke route ini.

## Fitur yang Sudah Selesai

Yang dapat dianggap selesai pada level UI/prototype:

- Layout aplikasi utama dengan sidebar responsif.
- Layout halaman auth.
- Login UI dan proses login dummy menggunakan `dummyjson.com`.
- Redirect dasar login/non-login.
- Logout lokal.
- Dashboard listing properti dengan search dan filter lokal.
- Card properti dengan badge status, harga, spesifikasi ringkas, detail link, dan share copy text.
- Detail properti dengan galeri foto, spesifikasi, vendor, operasional, maps placeholder, dan modal hapus.
- Direktori staff dengan search/filter, statistik, modal tambah, dan modal nonaktifkan.
- Halaman laporan/statistik dengan chart visual sederhana dan riwayat laporan dummy.
- Halaman pengaturan perusahaan/profil/password pada level form UI.
- Halaman 404.
- Lazy loading halaman memakai `React.lazy` dan `Suspense`.

## Fitur yang Belum Selesai untuk Sistem Manajemen Properti

### Fondasi Sistem

- Integrasi Supabase Auth.
- Integrasi Supabase Database.
- Supabase Storage untuk foto properti, logo, avatar, dan file laporan.
- Environment config seperti `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
- Service layer untuk auth, profiles, properties, staff, reports, storage.
- Error handling dan loading state berbasis request asli.
- Validasi form.
- Audit log aktivitas user.

### Autentikasi dan User

- Login memakai Supabase email/password.
- Register sebaiknya dibatasi untuk admin, bukan publik bebas.
- Forgot/reset password belum jalan.
- Session restore belum memakai Supabase session.
- Profile user belum terhubung ke database.
- Role user belum diambil dari database.
- Aktivasi/nonaktivasi akun belum memengaruhi akses login.

### Properti

- CRUD properti belum ada.
- `/property` belum menjadi halaman manajemen properti penuh.
- Detail properti belum mengambil data berdasarkan `id`.
- Upload banyak foto properti belum ada.
- Hapus foto/properti belum terhubung ke storage/database.
- Status properti belum tersimpan: tersedia, negosiasi, terjual, tersewa.
- Data vendor/pemilik belum dikelola terpisah.
- Data lokasi/maps belum validasi.
- Nomor folder/listing belum otomatis.
- Filter masih lokal dan terbatas pada data dummy.
- Belum ada pagination, sorting, atau server-side search.
- Belum ada histori perubahan harga/status.
- Belum ada tracking aktivitas marketing: share, follow up, spanduk, feed, kunci.
- Belum ada workflow approval jika direktur/admin perlu menyetujui data.

### Staff dan Role

- CRUD staff belum persist.
- Edit staff belum tersedia.
- Re-activate staff belum tersedia.
- Role permission belum enforce di route/database.
- User list belum terhubung ke Supabase Auth/profiles.

### Marketing

- Belum ada dashboard khusus marketing.
- Belum ada assignment listing ke marketing.
- Belum ada pipeline leads/prospek.
- Belum ada catatan follow-up customer.
- Belum ada share tracking per properti/per marketing.
- Belum ada target dan performa marketing.

### Direktur

- Laporan masih hardcoded.
- Belum ada aggregasi transaksi aktual.
- Belum ada export PDF/Excel asli.
- Belum ada dashboard komisi dan performa per marketing.
- Belum ada laporan stok properti, penjualan, penyewaan, listing baru, listing expired.

### Transaksi dan Keuangan

- Belum ada modul transaksi jual/sewa.
- Belum ada data customer/buyer/tenant.
- Belum ada nilai closing, tanggal transaksi, komisi, pembagian komisi.
- Belum ada bukti pembayaran/dokumen.
- Belum ada status pembayaran komisi.

### Dokumen dan Media

- Belum ada penyimpanan dokumen sertifikat, surat kuasa, KTP, atau dokumen pendukung.
- Belum ada generate flyer asli.
- Belum ada template flyer.
- Belum ada optimasi/compression foto.

### Kualitas Teknis

- Belum ada test.
- Belum ada typing/TypeScript.
- Belum ada aksesibilitas dan validasi UI menyeluruh.
- Ada beberapa teks yang tampak mojibake/encoding rusak, terutama karakter copyright, emoji, checkmark, dan simbol meter persegi.

## Rekomendasi Database Supabase

### Tabel Utama

#### `profiles`

Menyimpan data user aplikasi yang melengkapi `auth.users`.

Kolom rekomendasi:

- `id uuid primary key references auth.users(id)`
- `full_name text not null`
- `email text not null unique`
- `phone text`
- `role text not null check (role in ('admin', 'marketing', 'direktur'))`
- `avatar_url text`
- `is_active boolean default true`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

#### `properties`

Data inti listing properti.

Kolom rekomendasi:

- `id uuid primary key default gen_random_uuid()`
- `folder_no text unique not null`
- `title text`
- `offer_type text check (offer_type in ('jual', 'sewa', 'jual_sewa'))`
- `property_type text not null`
- `property_subtype text`
- `unit_status text check (unit_status in ('tersedia', 'negosiasi', 'terjual', 'tersewa', 'arsip'))`
- `address text not null`
- `city text`
- `area text`
- `latitude numeric`
- `longitude numeric`
- `gmaps_url text`
- `sell_price numeric`
- `rent_price numeric`
- `land_area numeric`
- `building_area numeric`
- `bedrooms int`
- `bathrooms int`
- `carport text`
- `electricity text`
- `water_source text`
- `road_access text`
- `certificate text`
- `security text`
- `bonus text`
- `nearby_facilities text`
- `description text`
- `listed_by uuid references profiles(id)`
- `owner_id uuid references property_owners(id)`
- `listed_at date`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

#### `property_owners`

Data vendor/pemilik properti.

Kolom rekomendasi:

- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `phone text`
- `email text`
- `address text`
- `notes text`
- `created_at timestamptz default now()`

#### `property_photos`

Foto properti yang disimpan di Supabase Storage.

Kolom rekomendasi:

- `id uuid primary key default gen_random_uuid()`
- `property_id uuid references properties(id) on delete cascade`
- `storage_path text not null`
- `public_url text`
- `sort_order int default 0`
- `is_cover boolean default false`
- `created_at timestamptz default now()`

#### `property_operations`

Status operasional properti.

Kolom rekomendasi:

- `property_id uuid primary key references properties(id) on delete cascade`
- `banner_installed boolean default false`
- `key_deposited boolean default false`
- `feed_created boolean default false`
- `shared boolean default false`
- `updated_by uuid references profiles(id)`
- `updated_at timestamptz default now()`

#### `leads`

Prospek pembeli/penyewa.

Kolom rekomendasi:

- `id uuid primary key default gen_random_uuid()`
- `property_id uuid references properties(id)`
- `assigned_to uuid references profiles(id)`
- `customer_name text not null`
- `customer_phone text`
- `interest_type text check (interest_type in ('beli', 'sewa'))`
- `status text check (status in ('baru', 'follow_up', 'survey', 'negosiasi', 'closing', 'gagal'))`
- `notes text`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

#### `transactions`

Transaksi jual/sewa.

Kolom rekomendasi:

- `id uuid primary key default gen_random_uuid()`
- `property_id uuid references properties(id)`
- `lead_id uuid references leads(id)`
- `marketing_id uuid references profiles(id)`
- `transaction_type text check (transaction_type in ('jual', 'sewa'))`
- `final_price numeric not null`
- `commission_amount numeric default 0`
- `company_commission numeric default 0`
- `marketing_commission numeric default 0`
- `closed_at date not null`
- `status text check (status in ('draft', 'confirmed', 'cancelled'))`
- `created_at timestamptz default now()`

#### `reports`

Metadata laporan yang pernah dibuat.

Kolom rekomendasi:

- `id uuid primary key default gen_random_uuid()`
- `title text not null`
- `report_type text check (report_type in ('penjualan', 'stok', 'statistik', 'komisi'))`
- `period_start date`
- `period_end date`
- `storage_path text`
- `created_by uuid references profiles(id)`
- `created_at timestamptz default now()`

#### `activity_logs`

Audit trail.

Kolom rekomendasi:

- `id uuid primary key default gen_random_uuid()`
- `actor_id uuid references profiles(id)`
- `entity_type text not null`
- `entity_id uuid`
- `action text not null`
- `metadata jsonb`
- `created_at timestamptz default now()`

### Storage Bucket

Rekomendasi bucket:

- `property-photos`
- `profile-avatars`
- `company-assets`
- `property-documents`
- `generated-reports`
- `generated-flyers`

### RLS Policy Umum

Aktifkan Row Level Security untuk semua tabel bisnis.

Rekomendasi permission:

- Admin: full access ke semua data operasional.
- Marketing: read property yang aktif/tersedia, update aktivitas marketing miliknya, manage leads miliknya, read transaksi miliknya.
- Direktur: read semua data, generate/read laporan, tidak perlu write operasional harian kecuali diminta.

Gunakan helper function SQL seperti:

```sql
create or replace function public.current_role()
returns text
language sql
security definer
as $$
  select role from public.profiles where id = auth.uid()
$$;
```

## Rekomendasi Implementasi Role

### Admin

Hak akses:

- Kelola seluruh properti: create, read, update, delete.
- Kelola foto dan dokumen properti.
- Kelola staff/user dan status aktif.
- Kelola vendor/pemilik.
- Kelola konfigurasi perusahaan.
- Melihat laporan.
- Membuat/mengunduh flyer.

Implementasi frontend:

- Sidebar menampilkan semua menu.
- Tombol tambah/edit/hapus properti aktif.
- Halaman staff dapat tambah/edit/nonaktifkan user.
- Settings perusahaan bisa diedit.

### Marketing

Hak akses:

- Melihat listing properti aktif.
- Melihat detail properti yang boleh dipasarkan.
- Share/copy materi properti.
- Update status aktivitas marketing seperti sudah share, follow-up, lead, survey.
- Kelola leads/prospek miliknya.
- Tidak boleh hapus properti.
- Tidak boleh melihat data sensitif tertentu jika diperlukan, misalnya data pemilik/vendor dapat dibatasi.

Implementasi frontend:

- Sidebar minimal: Dashboard/Property, Leads, mungkin Reports personal.
- Sembunyikan tombol edit/hapus properti.
- Tampilkan tombol share/flyer.
- Batasi akses `/staff`, sebagian `/settings`, dan laporan global.

### Direktur

Hak akses:

- Read-only semua data properti, transaksi, staff, dan laporan.
- Melihat dashboard performa perusahaan.
- Generate dan download laporan.
- Melihat komisi/performa marketing.
- Tidak perlu melakukan CRUD operasional harian kecuali kebijakan bisnis mengizinkan.

Implementasi frontend:

- Sidebar: Dashboard, Property, Staff read-only, Reports, Settings profil.
- Tombol tambah/edit/hapus disembunyikan atau disabled.
- Halaman reports menjadi pusat analitik.

### Implementasi Teknis Role

1. Simpan role di `profiles.role`.
2. Buat `AuthProvider`/context untuk menyimpan `session`, `user`, dan `profile`.
3. Buat route guard:
   - `RequireAuth`
   - `RequireRole`
4. Buat helper permission frontend, misalnya:
   - `canManageProperties(role)`
   - `canDeleteProperty(role)`
   - `canManageStaff(role)`
   - `canViewReports(role)`
5. Tetap enforce izin di Supabase RLS, bukan hanya sembunyikan tombol di frontend.

## Urutan Pengerjaan Selanjutnya

1. Bersihkan fondasi auth.
   - Tambahkan Supabase client.
   - Buat `.env` untuk URL dan anon key.
   - Ganti login dummyjson menjadi Supabase Auth.
   - Buat session listener dan auth context.
   - Redirect berdasarkan session Supabase.

2. Buat schema database awal.
   - `profiles`
   - `property_owners`
   - `properties`
   - `property_photos`
   - `property_operations`
   - `activity_logs`
   - RLS dasar untuk Admin, Marketing, Direktur.

3. Implementasi role nyata.
   - Ambil profile dari Supabase setelah login.
   - Ganti semua `CURRENT_ROLE` dengan role dari auth context.
   - Terapkan route guard per menu.
   - Sembunyikan/disable action sesuai permission.

4. Selesaikan modul properti.
   - Ubah `/property` menjadi halaman daftar properti utama.
   - Pindahkan data hardcoded menjadi query Supabase.
   - Tambah form create/edit properti.
   - Implementasi detail berdasarkan `property/:id`.
   - Implementasi upload foto ke Supabase Storage.
   - Implementasi delete/archive properti.

5. Selesaikan modul staff.
   - Hubungkan staff ke `profiles`.
   - Buat flow invite/create user.
   - Implementasi edit profile staff, ubah role, nonaktif/aktifkan.
   - Pastikan user nonaktif tidak bisa memakai aplikasi.

6. Tambahkan modul leads dan follow-up marketing.
   - Buat tabel `leads`.
   - Tambahkan halaman leads.
   - Hubungkan leads dengan properti dan marketing.
   - Catat histori follow-up.

7. Tambahkan modul transaksi.
   - Buat tabel `transactions`.
   - Update status properti otomatis saat closing.
   - Hitung komisi.
   - Hubungkan transaksi dengan laporan.

8. Selesaikan laporan direktur.
   - Query statistik dari database.
   - Filter periode.
   - Laporan stok, penjualan, penyewaan, komisi, performa marketing.
   - Export PDF/Excel.
   - Simpan metadata/file laporan ke Supabase Storage.

9. Selesaikan settings.
   - Buat tabel `company_settings`.
   - Simpan logo ke `company-assets`.
   - Hubungkan profil user ke `profiles`.
   - Ganti password memakai Supabase Auth.

10. Hardening dan kualitas.
    - Tambahkan validasi form.
    - Tambahkan loading/error/empty state dari request asli.
    - Perbaiki encoding karakter rusak.
    - Tambahkan test minimal untuk auth guard dan permission.
    - Pertimbangkan TypeScript jika aplikasi akan berkembang.

## Prioritas MVP yang Disarankan

Untuk MVP sistem manajemen properti, fokus minimal:

1. Supabase Auth + profiles + role.
2. CRUD properti + upload foto.
3. Role guard Admin/Marketing/Direktur.
4. Staff management dasar.
5. Reports dasar dari data properti/transaksi.
6. Transaksi closing sederhana.

Setelah itu baru lanjut ke fitur tambahan seperti flyer otomatis, lead pipeline, audit log rinci, export PDF/Excel lengkap, dan analytics performa marketing.
