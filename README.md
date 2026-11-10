# SchoolTask – To-Do List Website Tugas Sekolah

**Skema Sertifikasi**: Asisten Pemrogram Junior (LSP Telematika / BNSP)  
**Sekolah**: SMK Telkom Purwokerto  
**Penulis**: Andrean Rayhan Wijaya  
**Teknologi**: HTML5, CSS3, Vanilla JavaScript, Supabase (PostgreSQL Cloud) & LocalStorage (Offline Fallback)

---

## 📋 Daftar Isi
1. [Ringkasan Project](#ringkasan-project)
2. [Struktur Folder](#struktur-folder)
3. [Fitur Lengkap (Inti, Tambahan, & Database)](#fitur-lengkap)
4. [Arsitektur Basis Data (Supabase & LocalStorage Dual-Mode)](#arsitektur-basis-data)
5. [Cara Menghubungkan ke Supabase (3 Langkah Cepat)](#cara-menghubungkan-ke-supabase)
6. [Panduan Menghadapi Asesor & Pembimbing](#panduan-menghadapi-asesor--pembimbing)

---

## 1. Ringkasan Project
**SchoolTask** adalah aplikasi manajemen tugas sekolah interaktif berbasis web yang dibangun untuk memenuhi standar Uji Kompetensi Keahlian (UKK) skema **Asisten Pemrogram Junior**. Aplikasi ini mendukung pencatatan tugas sekolah berdasarkan mata pelajaran, tenggat waktu (deadline), tingkat prioritas, status progres, analitik produktivitas, serta integrasi **Database Cloud Relasional (Supabase PostgreSQL)** dengan sistem cadangan **LocalStorage** offline.

---

## 2. Struktur Folder
```text
To-Do List Website/
├── .vscode/
│   └── settings.json                  # Konfigurasi editor & auto-fix ESLint
├── PRD/
│   ├── PRD UKK To-Do List Website.pdf # PRD v1 (Spesifikasi Inti)
│   └── PRD UKK v2 To-Do List Tugas Sekolah (Tanggal, Mapel, Filter) (1).pdf # PRD v2
├── index.html                         # Markup semantik (Login, Dashboard, Analytics, Settings)
├── style.css                          # Desain antarmuka responsif & modern
├── script.js                          # Logika aplikasi (CRUD, Supabase client, offline sync)
├── supabase-schema.sql                # Skrip DDL SQL untuk tabel Supabase PostgreSQL
├── eslint.config.js                   # Konfigurasi ESLint Flat Config (0 error, 0 warning)
├── package.json                       # Konfigurasi npm & dependensi linter
└── README.md                          # Dokumentasi teknis & panduan asesor
```

---

## 3. Fitur Lengkap

### A. Fitur Inti MUK (Wajib)
* `F1` **Create (Tambah Task)**: Menambahkan tugas dengan ID unik timestamp (`Date.now()`) dan status awal `todo`.
* `F2` **Read (Tampilkan Daftar)**: Menampilkan tabel tugas dengan badge warna mata pelajaran dan status.
* `F3` **Update (Ubah Status)**: Memperbarui status tugas (`To Do` ➔ `In Progress` ➔ `Selesai`).
* `F4` **Delete (Hapus Task)**: Menghapus tugas dari data dan tampilan tabel.
* `F5` **Filter Status**: Memfilter tugas (`All`, `To Do`, `In Progress`, `Done`) via `filterTasks(status)`.
* `F6` **Validasi Input**: Validasi `trim()`, penolakan input kosong atau `< 3` karakter, console browser 0 error.
* `F7` **Setup Tools**: VS Code dan ESLint terkonfigurasi dengan `0 error` (`npm run lint`).

### B. Fitur Tambahan (Fase 2 & Nilai Plus)
* **Kategori Mata Pelajaran (Mapel)** dengan warna badge otomatis & dinamis.
* **Tenggat Waktu & Penanda Terlambat (Overdue Detection)**: Mendeteksi keterlambatan secara otomatis berdasarkan jam dan tanggal lokal saat ini.
* **Tingkat Prioritas**: *High*, *Medium*, dan *Low*.
* **Pencarian Real-Time & Pengurutan**: Berdasarkan deadline terdekat, terbaru, terlama, atau abjad A-Z.
* **Dashboard Analytics & Chart**: Diagram donat distribusi status tugas dan grafik tren aktivitas mingguan (HTML5 Canvas).
* **Ekspor Data JSON**: Cadangan riwayat tugas dan profil siswa.

### C. Fitur Basis Data (Supabase & Dual-Mode)
* **Cloud PostgreSQL**: Sinkronisasi data ke tabel cloud `tasks` di Supabase.
* **Offline Fallback**: Jika koneksi internet di lab mati atau kredensial belum diisi, aplikasi otomatis memakai **LocalStorage** sehingga aplikasi **tidak pernah crash**.
* **Indikator Status Real-Time**: Badge di topbar dan pengaturan menunjukkan status basis data secara langsung (`🟢 Supabase (PostgreSQL)` atau `📦 LocalStorage (Lokal)`).

---

## 4. Arsitektur Basis Data

Aplikasi menggunakan skema tabel relasional PostgreSQL:

```sql
CREATE TABLE tasks (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  due_date TEXT DEFAULT '',
  due_time TEXT DEFAULT '',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'todo',
  created_at BIGINT
);
```

### Alur Kerja Dual-Mode:
1. **Saat Aplikasi Dibuka**: Aplikasi memuat data lokal secara instan, lalu jika Supabase terhubung, mengambil data terbaru dari PostgreSQL.
2. **Saat Tambah/Ubah/Hapus**: Data diperbarui ke state memori dan LocalStorage seketika (tampilan responsif), lalu dikirim secara *asynchronous* ke Supabase.
3. **Jika Offline**: Operasi tetap berjalan 100% lancar di LocalStorage browser tanpa error.

---

## 5. Cara Menghubungkan ke Supabase (3 Langkah Cepat)

Jika Anda ingin mendemokan ke guru/pembimbing dengan database cloud aktif:

1. **Buat Proyek di Supabase**:
   * Buka [supabase.com](https://supabase.com) (gratis).
   * Klik **New Project** dan beri nama proyek (contoh: `SchoolTask-UKK`).
2. **Jalankan Skrip SQL**:
   * Buka menu **SQL Editor** di dashboard Supabase Anda.
   * Salin seluruh isi file [`supabase-schema.sql`](file:///home/andre/Documents/Coding/tugas%20sekolah/To-Do%20List%20Website/supabase-schema.sql) dan klik **Run**.
3. **Hubungkan di Aplikasi**:
   * Buka menu **Project Settings ➔ API** di Supabase untuk menyalin **Project URL** dan **Anon Key**.
   * Buka aplikasi SchoolTask di browser, masuk ke menu **Pengaturan**, masukkan URL dan Key pada form **Database Supabase**, lalu klik **Simpan & Hubungkan**.
   * Badge status di topbar akan otomatis berubah menjadi hijau: `🟢 Supabase (PostgreSQL)`.

---

## 6. Panduan Menghadapi Asesor & Pembimbing

### Pertanyaan 1: "Aplikasi ini pakai database apa?"
> **Jawaban:**  
> *"Saya menggunakan **Database Relasional PostgreSQL di Cloud melalui Supabase** dengan tabel bernama `tasks`. Selain itu, saya juga melengkapinya dengan sistem cadangan **LocalStorage**, sehingga jika koneksi internet di lab bermasalah, aplikasi tetap dapat beroperasi normal 100% secara offline."*

### Pertanyaan 2: "Bagaimana cara kerja CRUD-nya ke database?"
> **Jawaban:**  
> *"Saya menggunakan metode client-side query Supabase:*
> - *Create: `supabase.from('tasks').insert([data])`*
> - *Read: `supabase.from('tasks').select('*')`*
> - *Update: `supabase.from('tasks').update({ status }).eq('id', id)`*
> - *Delete: `supabase.from('tasks').delete().eq('id', id)`*  
> *Semua fungsi ini dipisahkan secara terstruktur di `script.js` sesuai prinsip satu fungsi satu tugas."*

### Pertanyaan 3: "Tunjukkan contoh Sequence, Selection, dan Iteration di kode Anda!"
> **Jawaban:**  
> - **Sequence**: Alur `initApp` yang memuat user, menginisialisasi database, lalu memuat tampilan dashboard.
> - **Selection**: Percabangan `if (!title || title.trim().length === 0)` pada fungsi `validateTitle`.
> - **Iteration**: Perulangan `list.forEach((task) => { ... })` di fungsi `renderTasks` saat membuat baris tabel DOM.
