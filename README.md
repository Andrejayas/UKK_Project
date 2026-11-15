# SchoolTask – To-Do List Website Tugas Sekolah

**Skema Sertifikasi**: Asisten Pemrogram Junior (LSP Telematika / BNSP)  
**Sekolah**: SMK Telkom Purwokerto  
**Penulis**: Andrean Rayhan Wijaya  
**Teknologi**: HTML5 Semantik, CSS3 Modular, Vanilla JavaScript (ES6+), LocalStorage Browser  

---

## 📋 Daftar Isi
1. [Ringkasan Project](#ringkasan-project)
2. [Struktur Folder & Arsitektur Kode](#struktur-folder--arsitektur-kode)
3. [Fitur Lengkap (Inti & Nilai Tambah)](#fitur-lengkap)
4. [Arsitektur Penyimpanan Data (LocalStorage)](#arsitektur-penyimpanan-data)
5. [Panduan Lengkap Menghadapi Asesor & Guru Penguji](#panduan-lengkap-menghadapi-asesor--guru-penguji)

---

## 1. Ringkasan Project
**SchoolTask** adalah aplikasi manajemen tugas sekolah interaktif berbasis web yang dibangun untuk memenuhi standar **Uji Kompetensi Keahlian (UKK)** skema **Asisten Pemrogram Junior**.

Aplikasi ini dirancang dengan prinsip **100% Offline-First**, bersih tanpa dependensi eksternal (`node_modules`), berbobot ringan, serta memanfaatkan penyimpanan browser **LocalStorage** yang persisten. Aplikasi mendukung pencatatan tugas sekolah berdasarkan mata pelajaran, tenggat waktu (deadline), tingkat prioritas, status progres, analitik produktivitas visual (Canvas 2D), editor foto profil interaktif (pan, zoom, crop), dan responsif penuh pada desktop maupun mobile.

---

## 2. Struktur Folder & Arsitektur Kode

Kode program dipisahkan secara modular mengikuti prinsip **Separation of Concerns** (pemisahan tanggung jawab kode) agar terstruktur rapi, mudah dibaca, dan mudah dipresentasikan saat uji kompetensi:

```text
To-Do List Website/
├── css/                               # Styling Modular CSS3
│   ├── base.css                       # Variabel warna (design tokens), reset, dan tipografi dasar
│   ├── layout.css                     # Struktur grid/flex: Sidebar, Topbar, dan Kontainer Utama
│   ├── components.css                 # Form input, tombol, kartu metrik, dan tabel tugas
│   ├── charts.css                     # Wadah canvas grafik dan legenda status
│   ├── calendar.css                   # Widget Kalender & Jadwal Hari Libur (Frosted Glassmorphism Linux style)
│   ├── modals.css                     # Dialog pop-up (Modal Edit, Profil, dan Onboarding Sambutan)
│   ├── cropper.css                    # Editor foto profil gaya Discord (lingkaran pratinjau & slider zoom)
│   ├── toast.css                      # Sistem notifikasi melayang (glassmorphism toast)
│   └── responsive.css                 # Media queries breakpoint tablet (<1024px) dan mobile (<768px)
├── js/                                # Logika Modular JavaScript (ES6+)
│   ├── config.js                      # State global, kunci LocalStorage, konfigurasi mapel, profil
│   ├── tasks.js                       # Logika CRUD tugas, filter, sorting, validasi, dan overdue check
│   ├── charts.js                      # Visualisasi grafik donat & diagram batang (HTML5 Canvas 2D)
│   ├── calendar.js                    # Kalender interaktif Linux desktop, data Hari Libur 2026-2027 & countdown
│   ├── cropper.js                     # Logika crop avatar (drag/pan kursor, zoom 100%-300%, render canvas)
│   ├── ui.js                          # Render tabel DOM, update kartu metrik, jam digital, modal, navigasi
│   └── app.js                         # Inisialisasi aplikasi (DOM ready), event listeners, expose window API
├── PRD/                               # Panduan Persyaratan Produk (Spesifikasi MUK)
│   ├── PRD UKK To-Do List Website.pdf
│   └── PRD UKK v2 To-Do List Tugas Sekolah (Tanggal, Mapel, Filter) (1).pdf
├── .vscode/                           # Konfigurasi editor
│   └── settings.json                  # Standar indentasi 2 spasi & format otomatis
├── .gitignore                         # Mengabaikan file log / OS cache
├── index.html                         # Dokumen HTML5 semantik utama
├── style.css                          # Master stylesheet (mengimpor 9 file modular dari folder css/)
└── README.md                          # Dokumentasi teknis & panduan asesor
```

---

## 3. Fitur Lengkap

### A. Fitur Inti MUK (Kriteria Wajib UKK)
* **F1 (Create)**: Menambahkan tugas baru dengan judul, mata pelajaran, tenggat waktu, dan prioritas. ID tugas menggunakan timestamp unik (`Date.now()`).
* **F2 (Read)**: Menampilkan seluruh tugas dalam tabel rapi lengkap dengan badge warna mata pelajaran dan indikator status.
* **F3 (Update)**: Memperbarui status tugas secara instan lewat dropdown tabel (`To Do` ➔ `In Progress` ➔ `Selesai`) atau mengubah detail tugas lewat modal edit.
* **F4 (Delete)**: Menghapus tugas disertai dialog konfirmasi keamanan agar tidak terhapus secara tidak sengaja.
* **F5 (Filter & Search)**: Memfilter tugas berdasarkan status (`All`, `To Do`, `In Progress`, `Done`), mata pelajaran, serta pencarian judul secara real-time.
* **F6 (Validasi Form)**: Validasi input wajib diisi, pencegahan spasi kosong (`trim()`), batas panjang judul, serta konsol browser bersih (`0 Error`).
* **F7 (Lingkungan Pengembangan)**: Kode rapi, terindentasi standar 2 spasi, dan memiliki dokumentasi komentar JSDoc yang jelas di setiap fungsi.

### B. Fitur Tambahan (Nilai Plus UKK)
* **Kategori Mata Pelajaran Fleksibel**: Menyediakan mata pelajaran umum SMK bawaan + kemampuan menambah/menghapus mata pelajaran kustom di menu Pengaturan.
* **Deteksi Keterlambatan Otomatis (Overdue Detection)**: Mendeteksi keterlambatan secara cerdas berdasarkan jam dan tanggal lokal saat ini (`WIB`).
* **Visualisasi Grafik Canvas 2D**:
  - *Donut Chart*: Menampilkan persentase proporsi tugas (To Do, In Progress, Selesai, Terlambat).
  - *Weekly Bar Chart*: Diagram batang aktivitas pembuatan/penyelesaian tugas mingguan (Senin–Minggu).
* **Widget Kalender & Jadwal Libur Linux Desktop Style**: Tombol tanggal di topbar menampilkan tanggal hari ini serta badge hari libur terdekat. Saat kursor mouse mendekat (hover) atau diklik, kartu kalender pop-up bergaya modern Linux Desktop Shell (frosted glass) terbuka otomatis:
  - Pratinjau grid tanggal 7 kolom lengkap dengan penanda lingkaran cerah tanggal hari ini dan dot indikator hari libur.
  - Panel info tanggal terpilih (hari efektif vs libur nasional/cuti bersama) serta daftar tugas sekolah pada tanggal tersebut.
  - Database Hari Libur Nasional & Cuti Bersama 2026 – 2027: Tanggal libur ditandai dengan dot indikator merah pada grid, dan badge kapsul topbar otomatis menghitung mundur ke hari libur terdekat berikutnya secara dinamis (otomatis berganti ke agenda libur berikutnya saat tanggal sudah lewat).
* **Editor Avatar Gaya Discord**: Siswa dapat mengunggah foto, menggeser posisi (pan), memperbesar (zoom 100%–300%), dan memotongnya dalam lingkaran sempurna beresolusi tinggi.
* **Ekspor Data Cadangan**: Mendukung ekspor data seluruh tugas ke format JSON yang dapat disimpan siswa.
* **Jam Digital Real-Time**: Topbar menampilkan hari, tanggal, bulan, serta jam digital yang berdetik setiap detik.

---

## 4. Arsitektur Penyimpanan Data (LocalStorage)

Seluruh data disimpan secara persisten di penyimpanan browser pengguna:

### Skema Struktur Tugas (`schooltask_tasks`):
```json
[
  {
    "id": 1731664800000,
    "title": "Laporan Praktikum Basis Data",
    "subject": "Informatika",
    "dueDate": "2026-11-20",
    "dueTime": "23:59",
    "priority": "high",
    "status": "todo",
    "createdAt": 1731664800000
  }
]
```

### Skema Profil Siswa (`schooltask_user`):
```json
{
  "username": "andre",
  "fullName": "Andrean Rayhan Wijaya",
  "avatar": "data:image/jpeg;base64,...",
  "rawAvatar": "data:image/jpeg;base64,..."
}
```

---

## 5. Panduan Lengkap Menghadapi Asesor & Guru Penguji

Bagian ini dirancang untuk membantu Anda menjawab pertanyaan teknis penguji dengan percaya diri dan tepat:

### Pertanyaan 1: "Aplikasi ini menyimpan datanya di mana?"
> **Jawaban:**  
> *"Aplikasi ini menggunakan teknologi **Web Storage API (LocalStorage)** browser. Data tugas, profil siswa, dan mata pelajaran kustom dikonversi menjadi format JSON string menggunakan `JSON.stringify()` saat disimpan, dan diuraikan kembali dengan `JSON.parse()` saat halaman dibuka. Dengan LocalStorage, aplikasi bersifat 100% offline-first, tidak memerlukan server internet di lab sekolah, dan data siswa tetap tersimpan bahkan ketika tab browser ditutup atau komputer direstart."*

---

### Pertanyaan 2: "Mengapa kode JavaScript dan CSS dipisah menjadi banyak file di dalam folder js/ dan css/?"
> **Jawaban:**  
> *"Saya menerapkan prinsip arsitektur **Clean Code** dan **Separation of Concerns (Pemisahan Tanggung Jawab)**:*
> - *Folder `css/` memisahkan styling per modul: dasar (`base.css`), tata letak (`layout.css`), komponen form & tabel (`components.css`), modal (`modals.css`), grafik (`charts.css`), dan responsif (`responsive.css`).*
> - *Folder `js/` memisahkan logika: konfigurasi & storage (`config.js`), operasi data CRUD (`tasks.js`), visualisasi grafik canvas (`charts.js`), pengolah foto avatar (`cropper.js`), manipulasi DOM tampilan (`ui.js`), dan pintu masuk event listener (`app.js`).*
> *Hal ini memudahkan perawatan kode (maintainability) serta mencegah satu file menjadi terlalu panjang dan sulit dibaca."*

---

### Pertanyaan 3: "Tunjukkan contoh Sequence, Selection, dan Iteration pada kode Anda!"
> **Jawaban:**  
> - **Sequence (Urutan Langkah)**: Terlihat pada fungsi `initApp()` di `js/app.js` yang mengeksekusi langkah secara berurutan: memuat data pengguna (`initDefaultUser`), menyiapkan tampilan (`showApp`), memasang pendengar aksi (`setupEventListeners`), lalu menampilkan halaman utama.
> - **Selection (Percabangan Logika)**: Terlihat pada fungsi validasi `validateTitle()` di `js/tasks.js`:
>   ```javascript
>   if (!title || title.trim().length === 0) {
>     return "Judul tugas tidak boleh kosong.";
>   }
>   ```
> - **Iteration (Perulangan Data)**: Terlihat pada fungsi `renderTasks()` di `js/ui.js` yang menggunakan method `list.forEach((task) => { ... })` untuk menelusuri setiap objek tugas di dalam array dan merendernya menjadi baris tabel (`<tr>`) di layar.

---

### Pertanyaan 4: "Bagaimana cara kerja fitur deteksi tugas terlambat (Overdue)?"
> **Jawaban:**  
> *"Fitur ini ditangani oleh fungsi `isTaskOverdue(t)` di `js/tasks.js`. Logikanya:*
> 1. *Jika tugas sudah berstatus `'done'` atau tidak memiliki tanggal batas, maka tugas **tidak terlambat**.*
> 2. *Jika tanggal tenggat (`dueDate`) lebih kecil dari tanggal hari ini (`getTodayString()`), maka tugas **terlambat**.*
> 3. *Jika tenggatnya jatuh pada hari ini dan memiliki input jam (`dueTime`), aplikasi membandingkan jam tenggat dengan waktu lokal saat ini (`getNowTimeString()`). Jika jam sekarang sudah melebihi jam tenggat, tugas otomatis ditandai **terlambat**."*

---

### Pertanyaan 5: "Bagaimana cara kerja grafik Donut dan Diagram Batang? Apakah memakai library eksternal?"
> **Jawaban:**  
> *"Saya tidak menggunakan library eksternal sama sekali. Grafik digambar secara murni menggunakan **HTML5 Canvas 2D API** (`getContext('2d')`) di file `js/charts.js`:*
> - *Grafik donat digambar dengan metode `ctx.arc()` yang menghitung sudut lingkaran (`angle = (count / total) * Math.PI * 2`) untuk masing-masing porsi status, lalu membuat lubang tengah di radius dalam.*
> - *Diagram batang dihitung dengan mencari nilai tertinggi (`maxVal`), lalu menggambar batang vertikal proporsional dengan `ctx.roundRect()` dan gradien warna `ctx.createLinearGradient()`."*
