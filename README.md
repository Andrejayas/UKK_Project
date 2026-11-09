# To-Do List Website (Project Latihan UKK SMK)

**Skema Sertifikasi**: Asisten Pemrogram Junior  
**Penulis**: Andrean Rayhan Wijaya  
**Teknologi**: HTML5, CSS3, JavaScript (Vanilla / Tanpa Framework)

---

## 📋 Daftar Isi
1. [Ringkasan Project](#ringkasan-project)
2. [Struktur Folder](#struktur-folder)
3. [Fitur-Fitur](#fitur-fitur)
4. [Cara Menjalankan Project](#cara-menjalankan-project)
5. [Spesifikasi Fungsi (Bagian 6 PRD)](#spesifikasi-fungsi-bagian-6-prd)
6. [Panduan Menghadapi Asesor (8 Unit Kompetensi)](#panduan-menghadapi-asesor-8-unit-kompetensi)

---

## 1. Ringkasan Project
Aplikasi web To-Do List interaktif yang dibuat untuk memenuhi standar penilaian **Uji Kompetensi Keahlian (UKK)** skema **Asisten Pemrogram Junior**. Aplikasi ini memungkinkan pengguna menambah, melihat, memfilter, mengedit, mengubah status, serta menghapus tugas dengan validasi input yang ketat dan bebas dari error di Console browser maupun linter.

---

## 2. Struktur Folder
```text
To-Do List Website/
├── .vscode/
│   └── settings.json          # Konfigurasi editor & auto-fix ESLint
├── PRD/
│   └── PRD UKK To-Do List Website.pdf  # Dokumen spesifikasi kebutuhan produk
├── index.html                 # Struktur markup semantik & aksesibel
├── style.css                  # Desain modern, clean, dan responsif
├── script.js                  # Logika aplikasi (1 fungsi 1 tugas, array of objects)
├── eslint.config.js           # Konfigurasi ESLint (Flat Config)
├── package.json               # Konfigurasi npm & dependensi linter
└── README.md                  # Dokumentasi & panduan teknis
```

---

## 3. Fitur-Fitur
- **Fitur Inti (Wajib)**:
  - `F1` **Tambah Task**: Menambahkan task baru dengan ID unik berbasis timestamp (`Date.now()`) dan status awal `todo`.
  - `F2` **Tampilkan Daftar**: Menampilkan daftar tugas dengan badge status warna yang sesuai.
  - `F3` **Ubah Status**: Memperbarui status tugas (`To Do` ➔ `In Progress` ➔ `Done`).
  - `F4` **Hapus Task**: Menghapus tugas dari data array dan tampilan halaman.
  - `F5` **Filter Status**: Memfilter tampilan tugas (`All`, `To Do`, `In Progress`, `Done`) dengan indikator tombol aktif.
  - `F6` **Validasi Input**: Menolak input kosong dan whitespace (`trim()`) dengan pesan error jelas di layar.
  - `F7` **Setup Tools**: ESLint dan VS Code terkonfigurasi dengan `0 error`.
- **Fitur Bonus**:
  - Penyimpanan persisten ke `localStorage` browser.
  - Konfirmasi pop-up sebelum menghapus tugas.
  - Fitur Edit judul tugas.
  - Counter badge otomatis untuk menghitung jumlah task per kategori status.

---

## 4. Cara Menjalankan Project

### A. Membuka Aplikasi
1. Buka file `index.html` langsung menggunakan browser (Google Chrome, Brave, Edge, Firefox), **ATAU**
2. Klik kanan file `index.html` di VS Code lalu pilih **Open with Live Server**.

### B. Menjalankan ESLint
Pastikan tidak ada error sintaks atau standar kode yang dilanggar:
```bash
npm run lint
```
Jika ingin memperbaiki masalah format otomatis:
```bash
npm run lint:fix
```

---

## 5. Spesifikasi Fungsi (Bagian 6 PRD)
| Nama Fungsi | Parameter | Nilai Kembalian | Tugas Utama |
| :--- | :--- | :--- | :--- |
| `validateTitle(title)` | `title: string` | `string` | Mengembalikan pesan error jika tidak valid, atau string kosong `""` jika lolos validasi. |
| `addTask(title)` | `title: string` | `void` | Membuat objek task baru `{ id, title, status }` dan menambahkannya ke array (`tasks.push()`). |
| `renderTasks(list)` | `list: Array` | `void` | Mengosongkan kontainer DOM lalu membuat elemen baris baru untuk setiap item (`list.forEach()`). |
| `updateStatus(id, status)`| `id: number, status: string` | `void` | Mencari task berdasarkan ID (`tasks.find()`) lalu mengganti nilai statusnya. |
| `deleteTask(id)` | `id: number` | `void` | Membuang task yang dipilih dari array (`tasks.filter()`). |
| `filterTasks(status)` | `status: string` | `Array` | Mengembalikan array baru sesuai status filter atau seluruh array jika status `'all'`. |

---

## 6. Panduan Menghadapi Asesor (8 Unit Kompetensi)

Ketika asesor menguji pemahaman Anda, berikut adalah jawaban dan penjelasannya:

1. **J.620100.004.02 - Menggunakan Struktur Data**
   - *Pertanyaan Asesor*: "Struktur data apa yang dipakai di aplikasi ini dan mengapa?"
   - *Jawaban*: "Saya menggunakan **Array of Objects** (`tasks = [{ id, title, status }, ...]`). Karena satu task memiliki beberapa atribut terkait (id bertipe number, title bertipe string, status bertipe string), objek adalah struktur terbaik untuk mengelompokkannya, sedangkan array memudahkan operasi penambahan (`push`), pencarian (`find`), dan penyaringan (`filter`)."

2. **J.620100.009.01 - Menggunakan Spesifikasi Program**
   - *Pertanyaan Asesor*: "Bagaimana Anda membagi kebutuhan menjadi kode program?"
   - *Jawaban*: "Saya menerapkan prinsip *Single Responsibility* (satu fungsi satu tugas) sesuai Bagian 6 PRD: fungsi validasi dipisah ke `validateTitle`, pembuatan task ke `addTask`, manipulasi DOM ke `renderTasks`, pembaruan ke `updateStatus`, dan penghapusan ke `deleteTask`."

3. **J.620100.010.01 - Menerapkan Perintah Eksekusi Bahasa Pemrograman**
   - *Pertanyaan Asesor*: "Bagaimana alur interaksi pengguna diproses oleh JavaScript?"
   - *Jawaban*: "Semua event ditangani dengan `addEventListener` (bukan inline onclick di HTML). Saat formulir disubmit atau dropdown status diubah, JavaScript menangkap event tersebut, memperbarui state array, lalu merender ulang tampilan DOM."

4. **J.620100.011.01 & J.620100.012.01 - Software Tools & Konfigurasi**
   - *Pertanyaan Asesor*: "Tools apa yang digunakan dan di mana konfigurasinya?"
   - *Jawaban*: "Saya menggunakan VS Code dengan ekstensi ESLint dan Live Server, Node.js + npm sebagai runtime/package manager. Konfigurasinya berada pada `.vscode/settings.json` (auto format & ESLint on save) dan `eslint.config.js` (flat config) dengan mendeklarasikan browser globals seperti `document`, `window`, `localStorage`."

5. **J.620100.016.01 - Guidelines dan Best Practices**
   - *Pertanyaan Asesor*: "Best practice apa saja yang Anda terapkan pada kode ini?"
   - *Jawaban*: "Saya menggunakan `const` dan `let` tanpa pernah menggunakan `var`, menggunakan operator perbandingan ketat `===` dan `!==`, indentasi konsisten 2 spasi, penamaan variabel yang deskriptif/semantik, dan dokumentasi fungsi menggunakan format JSDoc."

6. **J.620100.017.02 - Pemrograman Terstruktur**
   - *Pertanyaan Asesor*: "Tunjukkan contoh Sequence, Selection, dan Iteration di kode Anda!"
   - *Jawaban*:
     - **Sequence**: Alur inisialisasi di `initApp()` yang membaca data localStorage terlebih dahulu, lalu menerapkan filter, kemudian merender ke layar.
     - **Selection**: Penggunaan percabangan `if (validationResult !== "")` untuk mendeteksi error input sebelum memproses tugas.
     - **Iteration**: Penggunaan perulangan `list.forEach((task) => { ... })` di dalam fungsi `renderTasks` untuk menyusun elemen HTML setiap tugas.

7. **J.620100.025.02 - Debugging**
   - *Pertanyaan Asesor*: "Bagaimana Anda memastikan kode bebas bug?"
   - *Jawaban*: "Saya memeriksa Console browser untuk memastikan 0 error dan 0 unhandled promise/rejection. Saya juga memasang pencegah error seperti pemotongan spasi (`trim()`), penanganan `null` pada data kosong (empty state), validasi tipe data ID yang konsisten (`number`), dan memuat script dengan atribut `defer` agar elemen DOM siap sebelum dimanipulasi."
