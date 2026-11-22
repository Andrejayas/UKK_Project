# 📋 PRODUCT REQUIREMENTS DOCUMENT (PRD) & SPESIFIKASI TEKNIS MASTER
## Proyek: SchoolTask – Sistem Manajemen Tugas & Evaluasi Belajar Siswa
**Uji Kompetensi Keahlian (UKK) Rekayasa Perangkat Lunak (RPL)**  
**Okupasi: Junior Assistant Programmer**  
*Versi Dokumen: 3.0 (Master Production)*  
*Terakhir Diperbarui: 23 November 2026*  
*Pengembang: Andrean Rayhan Wijaya (Sukim)*

---

## 📌 1. EXECUTIVE SUMMARY & IDENTITAS PROYEK

### 1.1 Deskripsi Produk
**SchoolTask** adalah aplikasi berbasis web (*Single Page Application*) yang dirancang khusus untuk membantu siswa (terutama jenjang SMK Rekayasa Perangkat Lunak) mengelola jadwal, prioritas, kemajuan pengerjaan, dan evaluasi hasil belajar tugas sekolah secara terstruktur, interaktif, dan tepat waktu.

Aplikasi dibangun murni menggunakan **Vanilla Web Standards (HTML5, CSS3, ES6+ JavaScript)** tanpa ketergantungan pada *framework* eksternal (seperti React, Vue, jQuery) atau CDN luar. Hal ini menjamin aplikasi dapat berjalan 100% *offline*, sangat ringan, responsif, dan memenuhi standar pengujian Uji Kompetensi Keahlian (UKK) BNSP.

### 1.2 Informasi Repositori & Environment
* **Repository Git**: `https://github.com/Andrejayas/UKK_Project.git`
* **Default Branch**: `main`
* **Local Web Server**: Port `5500` (`http://127.0.0.1:5500/`)
* **Penyimpanan Data**: `localStorage` peramban (Zero Backend Server, Client-side persistence)
* **Sintaks Engine**: ES6+ didukung penuh oleh Node.js (`node -c js/*.js`)

---

## 🏗️ 2. STRUKTUR DIREKTORI & ARSITEKTUR KODE

```text
To-Do List Website/
├── index.html                   # Halaman tunggal utama aplikasi (App Shell, Dashboard, Analytics, Settings, Modals)
├── style.css                    # Entry point CSS (mengimpor token variabel warna, tema dark, & modul CSS)
├── css/
│   ├── variables.css            # Desain token (palet warna Dark Theme, typography, radius, shadow)
│   ├── layout.css               # Grid sistem 2 kolom, shell container, topbar, & sidebar
│   ├── components.css           # Tombol, badge status, form input, textarea, card, task table, modal
│   ├── charts.css               # Canvas wrapper, gauge ring, analytics hero grid, difficulty bars
│   ├── picker.css               # Frosted glass custom date picker & time stepper popups
│   └── responsive.css           # Media queries responsif untuk tablet & smartphone
├── js/
│   ├── config.js                # Kunci LocalStorage, mata pelajaran default, daftar hari libur nasional
│   ├── tasks.js                 # Logika bisnis CRUD tugas, filter, sorting, deadline calculations, proteksi overdue
│   ├── ui.js                    # Render tabel, metrik dashboard, subject accordion, jam digital, modal router
│   ├── charts.js                # Canvas 2D (Donut Chart & Weekly Bar), visualisasi Analytics & Smart Insights
│   ├── notifications.js         # Web Audio API sintetis (chime), Web Notification API, dropdown lonceng
│   ├── picker.js                # Custom Date Picker kalender & Custom Time Stepper (ketik angka langsung)
│   ├── calendar.js              # Kalender interaktif gaya Linux topbar + tracking hari libur nasional
│   ├── cropper.js               # Discord-style circular avatar cropper (drag X/Y, zoom slider, preset)
│   └── app.js                   # Application bootstrap, setup event listeners, integrasi form
└── PRD/
    ├── PRD_MASTER_PROJECT_UKK.md # DOKUMEN INI (Panduan lengkap arsitektur untuk developer & AI Agent)
    ├── PRD UKK To-Do List Website.pdf
    └── PRD UKK v2 To-Do List Tugas Sekolah (Tanggal, Mapel, Filter) (1).pdf
```

---

## 💾 3. MODEL DATA & LOCALSTORAGE SCHEMA

Aplikasi menyimpan seluruh state secara persisten di `localStorage`. Berikut adalah struktur data yang digunakan:

### 3.1 Task Object (`schoolTask_tasks_v1`)
Setiap tugas disimpan sebagai objek JSON dengan properti berikut:
```typescript
interface Task {
  id: number;                // Unique Timestamp (misal: 1795378590653)
  title: string;             // Judul tugas (wajib diisi, maks 200 karakter)
  description: string;       // Catatan / instruksi pengerjaan tugas (opsional, teks luas)
  subject: string;           // Nama mata pelajaran (misal: "Matematika", "B. Indonesia")
  dueDate: string;           // Format "YYYY-MM-DD" (wajib diisi)
  dueTime: string;           // Format "HH:MM" (default: "23:59")
  priority: "high" | "medium" | "low"; // Tingkat kesulitan / urgensi
  status: "todo" | "inprogress" | "done"; // Status pengerjaan
  progress: number;          // Persentase pengerjaan 0 - 100% (khusus inprogress & done)
  completedAt: number | null;// Timestamp ms saat tugas ditandai selesai (untuk analitik)
  createdAt: number;         // Timestamp ms saat tugas dibuat
}
```

### 3.2 Subject List (`schoolTask_subjects_v1`)
Array string berisi mata pelajaran tambahan/kustom buatan pengguna:
```json
["Basis Data", "Pemrograman Web", "Cloud Computing"]
```
*Mata pelajaran bawaan*: `Matematika`, `B. Indonesia`, `B. Inggris`, `Informatika`, `Produktif RPL`, `IPAS`, `PJOK`, `PKn`, `Sejarah`, `Seni Budaya`.

### 3.3 User Profile (`schoolTask_user_v1`)
```json
{
  "username": "andrean",
  "fullName": "Andrean Rayhan Wijaya",
  "kelas": "XII RPL 1",
  "jurusan": "Rekayasa Perangkat Lunak",
  "avatar": "data:image/png;base64,...",
  "rawAvatar": "data:image/png;base64,..."
}
```

### 3.4 Notification Settings (`schoolTask_notif_sound_v1`)
Nilai boolean (`"true"` / `"false"`) untuk status aktif nada dering Web Audio API.

---

## 🚀 4. DETAIL FITUR & LOGIKA BISNIS

### 4.1 Dashboard Utama
1. **Kartu Metrik Ringkasan (Top Counter Cards)**:
   - Total Tugas, To Do, In Progress, Selesai, dan Terlambat.
2. **Baris Tengah (Row 2 - Symmetrical & Functional)**:
   - **Kiri**: *Tambah Tugas Cepat*
     - Input Judul Tugas (`#qaTitle`).
     - Input Textarea Deskripsi Luas (`#qaDescription`) untuk menulis detail soal / instruksi tugas.
     - Pilihan Mata Pelajaran (`#qaSubject`) + opsi tambah mapel baru.
     - Frosted Glass Custom Date Picker (`#qaDueDate`).
     - Custom Time Stepper (`#qaDueTime`) dengan dukungan mengetik angka langsung via keyboard.
     - Pilihan Prioritas / Kesulitan (`#qaPriority`).
   - **Kanan**: *Progress per Mapel*
     - Menghitung rata-rata progres riil (kombinasi tugas selesai 100% + tugas in-progress).
     - **Accordion Interaktif**: Saat baris mapel diklik, kartu membuka daftar rincian tugas yang **belum selesai** pada mapel tersebut, lengkap dengan judul tugas, status badge, tenggat waktu, instruksi deskripsi tugas, dan tombol cepat *"Saring Tabel 🔍"*.
3. **Baris Bawah (Row 3 - Visual Charts Row)**:
   - **Kiri**: *Aktivitas Minggu Ini* (Canvas 2D Bar Chart tugas aktif Senin–Minggu).
   - **Kanan**: *Task Distribution* (Canvas 2D Donut Chart dengan persentase & chip legend HTML).
4. **Tabel Daftar Tugas Utama**:
   - Kolom Status, Judul Tugas + Sub-teks Deskripsi Instruksi, Mapel Badge, Tenggat + Label Waktu, Prioritas Badge, dan Aksi.
   - **Filter & Sorting**: Pencarian teks judul/mapel, filter status, filter mapel, dan urutan (Terbaru, Terlama, Deadline Terdekat, Judul A-Z).
   - **Inline In-Progress Slider**: Saat tugas berstatus *In Progress*, muncul slider 5%–100% di dalam sel status tabel yang bisa digeser langsung. Jika digeser ke 100%, tugas otomatis ditandai *Selesai*.

---

### 4.2 Sistem Penguncian Tugas Terlambat (Overdue Auto-Lock 🔒)
Sesuai aturan kedisiplinan tenggat waktu:
1. **Kondisi Terkunci**: Tugas dianggap *Overdue* jika `task.status !== 'done'` dan selisih waktu `(dueDate + dueTime) < waktu_sekarang`.
2. **Perilaku di Antarmuka**:
   - Kolom status tidak menampilkan dropdown `<select>`, melainkan badge statis **`🔒 Terkunci (Terlambat)`**.
   - Slider kemajuan progres dihilangkan.
   - Tombol edit pensil (✏️) dinonaktifkan (`disabled`) dengan kursor *not-allowed* dan icon gembok.
   - Tombol hapus sampah (🗑️) **tetap aktif** agar siswa dapat membersihkan tugas lama jika diinginkan.
3. **Proteksi Backend / State**:
   - Fungsi `updateStatus()`, `updateTaskProgress()`, `updateTask()`, dan `openEditModal()` memiliki *guard check*. Jika tugas terlambat dicoba dimodifikasi, sistem membatalkan perintah dan menampilkan toast peringatan.

---

### 4.3 Sistem Peringatan Deadline Real-time & Notifikasi
1. **Banner Peringatan Mendesak (`#urgentDeadlineBanner`)**:
   - Muncul otomatis di dashboard jika ada tugas aktif dengan sisa waktu $\le 60\text{ menit}$.
   - Menampilkan countdown menit real-time (`⚠️ X Menit Lagi!`) dan tombol *"Selesaikan Sekarang"*.
2. **Web Audio API Chime**:
   - Menggunakan osilator sintetis bawaan browser (Dual Tone frekuensi 587Hz & 880Hz harmonik sinusoidal).
   - Tidak memerlukan berkas eksternal mp3/wav sehingga dijamin tidak pernah error 404.
3. **Web Notification API**:
   - Push notification browser saat deadline berada di ambang 30m, 15m, 5m, 1m, dan saat lewat batas waktu.
4. **Dropdown Lonceng Topbar**:
   - Menampilkan riwayat notifikasi tenggat waktu dengan badge merah beranimasi getar (*shake*).

---

### 4.4 Halaman Analytics & Evaluasi Belajar Siswa (Versi 3.0)
Halaman Analytics telah dirombak total dari sekadar tabel data mentah menjadi **Pusat Evaluasi Diri Siswa**:
1. **Skor Produktivitas Belajar (Student Productivity Score)**:
   - Gauge melingkar (*Circular Progress Ring 0–100*) dengan gradien warna dinamis:
     - $\ge 80$: Emerald (`#10b981`) • 🏆 *Sangat Disiplin & Produktif*
     - $\ge 60$: Biru (`#3b82f6`) • 🌟 *Berkinerja Baik*
     - $\ge 40$: Amber (`#f59e0b`) • 👍 *Cukup Aktif*
     - $< 40$: Merah (`#ef4444`) • ⚠️ *Perlu Peningkatan Disiplin*
2. **Tiga Kartu Metrik Visual**:
   - *Tingkat Ketuntasan*: Persentase tugas selesai disertai mini progress bar hijau.
   - *Kedisiplinan Waktu*: Persentase tugas yang tidak melewati tenggat waktu disertai bar biru.
   - *Tingkat Keterlambatan*: Rasio keterlambatan tugas disertai bar merah.
3. **Wawasan Belajar Cerdas (Smart Study Insights)**:
   - Tiga kartu analisis cerdas otomatis:
     - 💡 *Hari Paling Aktif*: Mendeteksi hari di mana siswa paling banyak mencatat/menyelesaikan tugas.
     - 🎯 *Kepatuhan Tenggat*: Evaluasi apakah siswa disiplin atau sering terlambat.
     - 📚 *Fokus Mapel*: Mengidentifikasi mata pelajaran dengan beban tugas terbanyak.
4. **Distribusi Beban Tingkat Kesulitan**:
   - Visual progress bar untuk kategori Tinggi (Sulit) 🔴, Sedang (Normal) 🟡, dan Rendah (Mudah) 🟢.
5. **Evaluasi Performa per Mata Pelajaran**:
   - Tabel visual interaktif yang menampilkan nama mapel, progress bar ketuntasan %, rincian status chip (`✅`, `🚀`, `⏳`, `⚠️`), serta predikat evaluasi (`🏆 Tuntas 100%`, `⚠️ Ada Terlambat`, dll).
6. **Daftar Tugas Terlambat**:
   - Panel khusus yang mendata tugas yang telah melewati deadline beserta waktu dan status kuncinya.

---

### 4.5 Fitur Pendukung Lainnya
* **Frosted Glass Custom Date & Time Picker**: Kalender kustom tanpa datepicker default browser yang kaku. Jam mendukung *stepper* naik-turun dan pengetikan langsung lewat keyboard.
* **Linux Desktop Topbar Calendar Widget**: Menampilkan jam digital real-time WIB dan hari libur nasional Indonesia terdekat (2026–2027).
* **Discord-Style Avatar Cropper**: Crop foto profil lingkaran dengan bebas geser X/Y, zoom slider 100%–300%, mouse wheel zoom, preset *Pusatkan*, *Fokus Wajah*, dan *Reset*.
* **Backup & Restore**: Export seluruh riwayat tugas, mapel, dan profil ke dalam berkas cadangan JSON.

---

## 🧪 5. PANDUAN PENGUJIAN & VERIFIKASI (UNTUK AGENT / DEVELOPER)

Jika Anda melanjutkan proyek ini di perangkat lain atau sesi agent baru:
1. **Verifikasi Sintaks**:
   Jalankan perintah berikut di root folder project:
   ```bash
   node -c js/*.js
   ```
   *Hasil harus exit code 0 tanpa error sintaks.*
2. **Jalankan Live Server**:
   ```bash
   python3 -m http.server 5500
   ```
   Buka di peramban: `http://127.0.0.1:5500/`.
3. **Pengujian Fungsional Cepat (Console Browser)**:
   Aplikasi mengekspos API pengujian publik di `window._schoolTask`:
   - `window._schoolTask.getTasks()`: Melihat seluruh array tugas.
   - `window._schoolTask.addTask(data)`: Menambahkan tugas programmatic.
   - `window._schoolTask.updateStatus(id, status)`: Mengubah status.
   - `window._schoolTask.resetAll()`: Menguji reset data pabrik.

---

## 📌 6. RINGKASAN KOMITEN KODE TERAKHIR
* Commit `cf88de9`: Kunci tugas terlambat (overdue lock), accordion detail tugas belum selesai di progress mapel, deskripsi tugas & penataan kartu.
* Commit `3bb9850`: Susunan dashboard simetris (progress mapel di atas, 2 chart berdampingan di bawah) & perbaikan rendering ikon SVG alert triangle.
* Commit terbaru: Rombak total view Analytics (Skor Produktivitas, Gauge Ring, Smart Insights, Evaluasi Mapel visual) & integrasi dokumen PRD Master ini.

*Dokumen ini dirancang agar setiap AI Agent atau Developer dapat langsung memahami 100% arsitektur proyek dalam sekali baca.*
