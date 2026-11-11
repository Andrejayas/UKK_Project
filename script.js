/**
 * @file script.js
 * @description SchoolTask – Manajemen Tugas Sekolah
 *              Aplikasi To-Do List berbasis web untuk siswa SMK.
 *              Data tersimpan di localStorage; tidak memerlukan server.
 * @author Andrean Rayhan Wijaya
 * @version 1.0.0
 */

/* ============================================================
   SECTION 1: STATE & DATA STRUCTURES
   ============================================================ */

/** Daftar mata pelajaran bawaan */
const DEFAULT_SUBJECTS = [
  "Matematika", "B. Indonesia", "B. Inggris", "Informatika",
  "IPAS", "PJOK", "Seni Budaya", "PKn", "Sejarah",
  "Fisika", "Kimia", "Biologi",
];

/** Kunci penyimpanan localStorage */
const KEYS = {
  TASKS:    "schooltask_tasks",
  USER:     "schooltask_user",
  SUBJECTS: "schooltask_subjects",
  SESSION:  "schooltask_session",
  SUPABASE: "schooltask_supabase_config",
};

/**
 * Konfigurasi bawaan Supabase Cloud PostgreSQL
 * Terhubung otomatis ke project Supabase tanpa konfigurasi manual dari user.
 */
const DEFAULT_SUPABASE_CONFIG = {
  url: "https://qlvflsqbhkqsuyqvvbbm.supabase.co",
  key: "sb_publishable_49djRHFJZxoJJ2Q_FJGjKQ_anvt5QvW",
};

/** State Klien Supabase (PostgreSQL Cloud) */
let supabaseClient = null;
let isSupabaseConnected = false;

/**
 * Pasangan warna untuk badge mata pelajaran (rotating palette).
 * Setiap elemen: [backgroundColor, textColor]
 * @type {string[][]}
 */
const SUBJECT_COLORS = [
  ["#fef3c7", "#92400e"],
  ["#dbeafe", "#1e40af"],
  ["#dcfce7", "#166534"],
  ["#fce7f3", "#9d174d"],
  ["#ede9fe", "#5b21b6"],
  ["#ffedd5", "#9a3412"],
  ["#cffafe", "#164e63"],
  ["#fef9c3", "#713f12"],
  ["#f0fdf4", "#14532d"],
  ["#fff1f2", "#881337"],
  ["#fdf4ff", "#6b21a8"],
  ["#ecfeff", "#155e75"],
];

/** Semua tugas yang ada */
let tasks = [];

/** Filter aktif pada daftar tugas */
let currentFilter = {
  status:  "all",
  subject: "all",
  search:  "",
  sort:    "newest",
};

/** Data user yang sedang login */
let currentUser = null;

/** Daftar mata pelajaran kustom yang ditambahkan pengguna */
let customSubjects = [];

/** Nama view yang sedang aktif */
let currentView = "dashboard";

/* ============================================================
   SECTION 2: AUTH FUNCTIONS
   ============================================================ */

/**
 * Membuat objek user default jika belum ada di localStorage.
 * @returns {void}
 */
function initDefaultUser() {
  try {
    const stored = localStorage.getItem(KEYS.USER);
    if (!stored) {
      const defaultUser = {
        username:  "siswa",
        fullName:  "Andrean Rayhan",
        kelas:     "XII RPL",
        jurusan:   "Rekayasa Perangkat Lunak",
        avatar:    null,
        rawAvatar: null,
      };
      localStorage.setItem(KEYS.USER, JSON.stringify(defaultUser));
    }
  } catch (err) {
    console.error("initDefaultUser error:", err);
  }
}

/**
 * Memuat data user dari localStorage.
 * @returns {Object|null} Objek user atau null jika tidak ada.
 */
function loadProfile() {
  try {
    const raw = localStorage.getItem(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Menyimpan data profil user ke localStorage.
 * @param {Object} data - Data profil yang diperbarui.
 * @returns {void}
 */
function saveProfile(data) {
  try {
    currentUser = { ...currentUser, ...data };
    localStorage.setItem(KEYS.USER, JSON.stringify(currentUser));
  } catch (err) {
    console.error("saveProfile error:", err);
  }
}

/**
 * Menampilkan app shell, memuat data, dan merender antarmuka.
 * @returns {void}
 */
function showApp() {
  const appShell = document.getElementById("appShell");
  if (appShell) { appShell.classList.remove("hidden"); }
  loadSubjects();
  loadTasks();
  updateSubjectSelects();
  renderMetricCards();
  applyFilters();
  renderSubjectProgress();
  renderDonutChart();
  renderWeeklyChart();
  updateAvatarDisplays();
  renderProfileDropdown();
  initClock();
}

/* ============================================================
   SECTION 3: SUPABASE (POSTGRESQL) & TASK CRUD
   ============================================================ */

/**
 * Mengonversi objek task JavaScript ke format baris tabel Supabase (PostgreSQL).
 * @param {Object} t - Objek task lokal.
 * @returns {Object} Objek baris database.
 */
function toDbTask(t) {
  return {
    id:         t.id,
    title:      t.title,
    subject:    t.subject,
    due_date:   t.dueDate || "",
    due_time:   t.dueTime || "",
    priority:   t.priority || "medium",
    status:     t.status || "todo",
    created_at: t.createdAt || Date.now(),
  };
}

/**
 * Mengonversi baris tabel database Supabase ke format objek task JavaScript.
 * @param {Object} row - Baris data dari Supabase.
 * @returns {Object} Objek task lokal.
 */
function fromDbTask(row) {
  return {
    id:        Number(row.id),
    title:     row.title || "",
    subject:   row.subject || "",
    dueDate:   row.due_date ?? row.dueDate ?? "",
    dueTime:   row.due_time ?? row.dueTime ?? "",
    priority:  row.priority || "medium",
    status:    row.status || "todo",
    createdAt: Number(row.created_at ?? row.createdAt ?? Date.now()),
  };
}

/**
 * Mengonversi objek perubahan ke format kolom database Supabase.
 * @param {Object} changes - Perubahan lokal.
 * @returns {Object} Objek perubahan kolom database.
 */
function toDbChanges(changes) {
  const db = {};
  if (changes.title !== undefined) { db.title = changes.title; }
  if (changes.subject !== undefined) { db.subject = changes.subject; }
  if (changes.dueDate !== undefined) { db.due_date = changes.dueDate; }
  if (changes.dueTime !== undefined) { db.due_time = changes.dueTime; }
  if (changes.priority !== undefined) { db.priority = changes.priority; }
  if (changes.status !== undefined) { db.status = changes.status; }
  return db;
}

/**
 * Memperbarui tampilan indikator basis data di topbar dan halaman pengaturan.
 * @param {boolean} isConnected - Apakah Supabase terhubung.
 * @returns {void}
 */
function updateDbUI(isConnected) {
  const topbarBadge = document.getElementById("topbarDbBadge");
  const badgeText = document.getElementById("dbBadgeText");
  const settingsBadge = document.getElementById("supabaseStatusBadge");

  if (isConnected) {
    if (topbarBadge) {
      topbarBadge.classList.add("db-badge-supabase");
      topbarBadge.classList.remove("db-badge-local");
      topbarBadge.title = "Status Sistem: Sinkronisasi Cloud (Online)";
    }
    if (badgeText) {
      badgeText.innerHTML = '<span class="db-text-full">Cloud Sync (Online)</span><span class="db-text-short">Online</span>';
    }
    if (settingsBadge) {
      settingsBadge.textContent = "🟢 Terhubung ke Cloud";
      settingsBadge.classList.add("connected");
    }
  } else {
    if (topbarBadge) {
      topbarBadge.classList.remove("db-badge-supabase");
      topbarBadge.classList.add("db-badge-local");
      topbarBadge.title = "Status Sistem: Mode Offline Cadangan (Lokal)";
    }
    if (badgeText) {
      badgeText.innerHTML = '<span class="db-text-full">Mode Offline</span><span class="db-text-short">Offline</span>';
    }
    if (settingsBadge) {
      settingsBadge.textContent = "📦 Mode: Offline";
      settingsBadge.classList.remove("connected");
    }
  }
}

/**
 * Menginisialisasi koneksi ke Supabase jika konfigurasi tersedia.
 * Mengutamakan DEFAULT_SUPABASE_CONFIG, dapat di-override atau dinonaktifkan via localStorage.
 * @returns {Promise<boolean>}
 */
async function initSupabase() {
  try {
    let config = { ...DEFAULT_SUPABASE_CONFIG };
    const raw = localStorage.getItem(KEYS.SUPABASE);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.disabled) {
          // Pengguna sengaja memilih mode LocalStorage
          config = null;
        } else if (parsed.url && parsed.key && typeof parsed.url === "string" && parsed.url.startsWith("http")) {
          config = parsed;
        }
      } catch {
        // Abaikan parse error, gunakan config default
      }
    }

    if (!config || !config.url || !config.key) {
      supabaseClient = null;
      isSupabaseConnected = false;
      updateDbUI(false);
      return false;
    }

    // Pastikan library Supabase CDN terpasang
    if (typeof window.supabase === "undefined" || typeof window.supabase.createClient !== "function") {
      console.warn("Library Supabase CDN belum termuat atau koneksi offline.");
      isSupabaseConnected = false;
      updateDbUI(false);
      return false;
    }

    supabaseClient = window.supabase.createClient(config.url, config.key);

    // Uji koneksi ringan ke tabel tasks
    const { error } = await supabaseClient.from("tasks").select("id").limit(1);
    if (error) {
      console.warn("Koneksi Supabase gagal diuji:", error.message);
      isSupabaseConnected = false;
      updateDbUI(false);
      return false;
    }

    isSupabaseConnected = true;
    updateDbUI(true);
    return true;
  } catch (err) {
    console.warn("initSupabase error, otomatis beralih ke localStorage:", err);
    isSupabaseConnected = false;
    updateDbUI(false);
    return false;
  }
}

/**
 * Memuat daftar tugas dari localStorage dan menyinkronkan dengan Supabase (jika aktif).
 * @returns {Promise<void>}
 */
async function loadTasks() {
  // 1. Muat data lokal secara instan (agar tampilan cepat dan aman jika offline)
  try {
    const raw = localStorage.getItem(KEYS.TASKS);
    tasks = raw ? JSON.parse(raw) : [];
  } catch {
    tasks = [];
  }

  // 2. Jika Supabase aktif, muat dan sinkronkan data cloud terbaru
  if (supabaseClient && isSupabaseConnected) {
    try {
      const { data, error } = await supabaseClient
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        tasks = data.map(fromDbTask);
        saveTasksLocally();
        applyFilters();
        renderMetricCards();
        renderSubjectProgress();
        renderDonutChart();
        renderWeeklyChart();
      }
    } catch (err) {
      console.warn("Gagal memuat tugas dari Supabase:", err);
    }
  }
}

/**
 * Menyimpan daftar tugas ke localStorage browser (offline backup).
 * @returns {void}
 */
function saveTasksLocally() {
  try {
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
  } catch (err) {
    console.error("saveTasksLocally error:", err);
  }
}

/**
 * Menyimpan daftar tugas ke media penyimpanan.
 * @returns {void}
 */
function saveTasks() {
  saveTasksLocally();
}

/**
 * Menambahkan tugas baru (tersimpan ke state, localStorage, dan Supabase jika terhubung).
 * @param {{title: string, subject: string, dueDate: string, dueTime?: string, priority: string}} data
 * @returns {Object} Objek tugas yang baru dibuat.
 */
function addTask(data) {
  const task = {
    id:        Date.now(),
    title:     data.title.trim(),
    subject:   data.subject.trim(),
    dueDate:   data.dueDate || "",
    dueTime:   data.dueTime || "",
    priority:  data.priority || "medium",
    status:    "todo",
    createdAt: Date.now(),
  };

  tasks.unshift(task);
  saveTasks();

  // Kirim secara asynchronous ke Supabase jika aktif
  if (supabaseClient && isSupabaseConnected) {
    supabaseClient.from("tasks").insert([toDbTask(task)]).then(({ error }) => {
      if (error) {
        console.warn("Gagal insert ke Supabase:", error.message);
      }
    });
  }

  return task;
}

/**
 * Memperbarui status tugas berdasarkan id (lokal + Supabase).
 * @param {number} id - ID tugas.
 * @param {string} status - Status baru: 'todo' | 'inprogress' | 'done'.
 * @returns {void}
 */
function updateStatus(id, status) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.status = status;
    saveTasks();
    applyFilters();
    renderMetricCards();
    renderSubjectProgress();
    renderDonutChart();
    renderWeeklyChart();

    // Perbarui ke Supabase jika aktif
    if (supabaseClient && isSupabaseConnected) {
      supabaseClient.from("tasks").update({ status }).eq("id", id).then(({ error }) => {
        if (error) {
          console.warn("Gagal update status di Supabase:", error.message);
        }
      });
    }
  }
}

/**
 * Memperbarui data tugas berdasarkan id (lokal + Supabase).
 * @param {number} id - ID tugas.
 * @param {Object} changes - Objek perubahan yang akan diterapkan.
 * @returns {void}
 */
function updateTask(id, changes) {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx !== -1) {
    tasks[idx] = { ...tasks[idx], ...changes };
    saveTasks();
    applyFilters();
    renderMetricCards();
    renderSubjectProgress();
    renderDonutChart();
    renderWeeklyChart();

    // Perbarui ke Supabase jika aktif
    if (supabaseClient && isSupabaseConnected) {
      const dbChanges = toDbChanges(changes);
      supabaseClient.from("tasks").update(dbChanges).eq("id", id).then(({ error }) => {
        if (error) {
          console.warn("Gagal update data di Supabase:", error.message);
        }
      });
    }
  }
}

/**
 * Menghapus tugas berdasarkan id (lokal + Supabase).
 * @param {number} id - ID tugas yang akan dihapus.
 * @returns {void}
 */
function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  applyFilters();
  renderMetricCards();
  renderSubjectProgress();
  renderDonutChart();
  renderWeeklyChart();

  // Hapus dari Supabase jika aktif
  if (supabaseClient && isSupabaseConnected) {
    supabaseClient.from("tasks").delete().eq("id", id).then(({ error }) => {
      if (error) {
        console.warn("Gagal delete dari Supabase:", error.message);
      }
    });
  }
}

/**
 * Sesuai Spesifikasi MUK Slide 15 & 19:
 * Memfilter tugas berdasarkan status.
 * @param {string} status - Filter status ('all', 'todo', 'inprogress', 'done').
 * @returns {Object[]} Daftar task hasil filter.
 */
function filterTasks(status) {
  return filterByStatus(tasks, status);
}

/* ============================================================
   SECTION 4: SUBJECT MANAGEMENT
   ============================================================ */

/**
 * Mendapatkan seluruh mata pelajaran (bawaan + kustom) tanpa duplikat.
 * @returns {string[]} Array nama mata pelajaran.
 */
function getAllSubjects() {
  const all = [...DEFAULT_SUBJECTS, ...customSubjects];
  return [...new Set(all)];
}

/**
 * Menambah mata pelajaran kustom baru.
 * @param {string} name - Nama mata pelajaran baru.
 * @returns {boolean} true jika berhasil ditambahkan.
 */
function addCustomSubject(name) {
  const trimmed = name.trim();
  if (!trimmed) { return false; }
  if (getAllSubjects().map((s) => s.toLowerCase()).includes(trimmed.toLowerCase())) {
    return false;
  }
  customSubjects.push(trimmed);
  saveSubjects();
  updateSubjectSelects();
  return true;
}

/**
 * Menghapus mata pelajaran kustom.
 * @param {string} name - Nama mata pelajaran yang dihapus.
 * @returns {void}
 */
function removeCustomSubject(name) {
  customSubjects = customSubjects.filter((s) => s !== name);
  saveSubjects();
  updateSubjectSelects();
  renderSettingsSubjects();
}

/**
 * Menyimpan daftar mata pelajaran kustom ke localStorage.
 * @returns {void}
 */
function saveSubjects() {
  try {
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(customSubjects));
  } catch (err) {
    console.error("saveSubjects error:", err);
  }
}

/**
 * Memuat daftar mata pelajaran kustom dari localStorage.
 * @returns {void}
 */
function loadSubjects() {
  try {
    const raw = localStorage.getItem(KEYS.SUBJECTS);
    customSubjects = raw ? JSON.parse(raw) : [];
  } catch {
    customSubjects = [];
  }
}

/* ============================================================
   SECTION 5: FILTER & SORT
   ============================================================ */

/**
 * Menerapkan filter dan sort aktif lalu merender daftar tugas.
 * @returns {void}
 */
function applyFilters() {
  let list = [...tasks];
  list = filterByStatus(list, currentFilter.status);
  list = filterBySubject(list, currentFilter.subject);
  list = filterBySearch(list, currentFilter.search);
  list = sortTasks(list, currentFilter.sort);
  renderTasks(list);
}

/**
 * Memfilter tugas berdasarkan status.
 * @param {Object[]} list - Array tugas.
 * @param {string} status - Status filter: 'all' | 'todo' | 'inprogress' | 'done'.
 * @returns {Object[]} Array tugas yang sudah difilter.
 */
function filterByStatus(list, status) {
  if (status === "all") { return list; }
  return list.filter((t) => t.status === status);
}

/**
 * Memfilter tugas berdasarkan mata pelajaran.
 * @param {Object[]} list - Array tugas.
 * @param {string} subject - Nama mapel atau 'all'.
 * @returns {Object[]} Array tugas yang sudah difilter.
 */
function filterBySubject(list, subject) {
  if (subject === "all") { return list; }
  return list.filter((t) => t.subject === subject);
}

/**
 * Memfilter tugas berdasarkan kata kunci judul (case-insensitive).
 * @param {Object[]} list - Array tugas.
 * @param {string} query - Kata kunci pencarian.
 * @returns {Object[]} Array tugas yang cocok.
 */
function filterBySearch(list, query) {
  if (!query) { return list; }
  const q = query.toLowerCase();
  return list.filter((t) => t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q));
}

/**
 * Mengurutkan tugas berdasarkan mode yang dipilih.
 * @param {Object[]} list - Array tugas.
 * @param {string} mode - Mode urutan: 'newest' | 'oldest' | 'due-asc' | 'title-az'.
 * @returns {Object[]} Array baru yang sudah diurutkan.
 */
function sortTasks(list, mode) {
  const copy = [...list];
  if (mode === "newest") {
    return copy.sort((a, b) => b.createdAt - a.createdAt);
  }
  if (mode === "oldest") {
    return copy.sort((a, b) => a.createdAt - b.createdAt);
  }
  if (mode === "due-asc") {
    return copy.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) { return 0; }
      if (!a.dueDate) { return 1; }
      if (!b.dueDate) { return -1; }
      return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
    });
  }
  if (mode === "title-az") {
    return copy.sort((a, b) => a.title.localeCompare(b.title));
  }
  return copy;
}

/* ============================================================
   SECTION 6: DUE DATE LOGIC & LIVE CLOCK
   ============================================================ */

/**
 * Mendapatkan waktu saat ini dalam format HH:MM lokal.
 * @returns {string} Waktu saat ini (contoh: "14:30").
 */
function getNowTimeString() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Memeriksa apakah suatu tugas sudah melewati tenggat waktu (terlambat).
 * Tugas dianggap terlambat hanya jika status BUKAN 'done' dan tanggal tenggat sudah lewat,
 * atau jika tenggat hari ini dan jam tenggat sudah lewat waktu lokal saat ini.
 * @param {Object} t - Objek tugas.
 * @returns {boolean} True jika tugas terlambat.
 */
function isTaskOverdue(t) {
  if (!t || t.status === "done" || !t.dueDate) { return false; }
  const today = getTodayString();
  if (t.dueDate < today) { return true; }
  if (t.dueDate === today && t.dueTime) {
    const nowTime = getNowTimeString();
    if (nowTime > t.dueTime) { return true; }
  }
  return false;
}

/**
 * Mendapatkan status keterlambatan berdasarkan tanggal tenggat, status tugas, dan jam.
 * @param {string} dueDate - Tanggal tenggat dalam format YYYY-MM-DD.
 * @param {string} status - Status tugas ('todo' | 'inprogress' | 'done').
 * @param {string} [dueTime] - Jam tenggat (opsional, contoh: "23:59").
 * @returns {'overdue'|'today'|'tomorrow'|null} Status tenggat.
 */
function getDueStatus(dueDate, status, dueTime = "") {
  if (!dueDate || status === "done") { return null; }
  const today    = getTodayString();
  const tomorrow = getTomorrowString();
  if (dueDate < today) { return "overdue"; }
  if (dueDate === today) {
    if (dueTime) {
      const nowTime = getNowTimeString();
      if (nowTime > dueTime) { return "overdue"; }
    }
    return "today";
  }
  if (dueDate === tomorrow) { return "tomorrow"; }
  return null;
}

/**
 * Mengonversi status tenggat ke label bahasa Indonesia.
 * @param {'overdue'|'today'|'tomorrow'|null} dueStatus
 * @returns {string} Label status.
 */
function getDueLabel(dueStatus) {
  if (dueStatus === "overdue")  { return "Terlambat"; }
  if (dueStatus === "today")    { return "Hari Ini"; }
  if (dueStatus === "tomorrow") { return "Besok"; }
  return "";
}

/**
 * Memformat string tanggal YYYY-MM-DD ke format "DD Mon YYYY" lokal.
 * @param {string} dateString - Tanggal dalam format YYYY-MM-DD.
 * @returns {string} Tanggal yang diformat.
 */
function formatDate(dateString) {
  if (!dateString) { return "—"; }
  const [y, m, d] = dateString.split("-").map(Number);
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  return `${d} ${months[m - 1]} ${y}`;
}

/**
 * Mendapatkan tanggal hari ini dalam format YYYY-MM-DD (lokal, bukan UTC).
 * @returns {string} Tanggal hari ini.
 */
function getTodayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Mendapatkan tanggal besok dalam format YYYY-MM-DD (lokal).
 * @returns {string} Tanggal besok.
 */
function getTomorrowString() {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Menginisialisasi dan memperbarui jam digital di topbar setiap detik secara real-time.
 * @returns {void}
 */
function initClock() {
  function updateClock() {
    const clockEl = document.getElementById("clockText");
    if (!clockEl) { return; }
    const now = new Date();
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const dayName = days[now.getDay()];
    const dateNum = now.getDate();
    const monthName = months[now.getMonth()];
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    clockEl.textContent = `${dayName}, ${dateNum} ${monthName} • ${hours}:${minutes}:${seconds} WIB`;
  }
  updateClock();
  setInterval(updateClock, 1000);
}

/* ============================================================
   SECTION 7: RENDER FUNCTIONS
   ============================================================ */

/**
 * Mengambil indeks warna badge untuk mapel tertentu (berdasarkan nama).
 * @param {string} subject - Nama mata pelajaran.
 * @returns {string[]} Array [backgroundColor, textColor].
 */
function getSubjectColors(subject) {
  const all = getAllSubjects();
  const idx = all.indexOf(subject);
  const colorIdx = idx === -1 ? 0 : idx % SUBJECT_COLORS.length;
  return SUBJECT_COLORS[colorIdx];
}

/**
 * Membuat elemen span badge mata pelajaran.
 * @param {string} subject - Nama mata pelajaran.
 * @returns {HTMLSpanElement}
 */
function createSubjectBadge(subject) {
  const [bg, fg] = getSubjectColors(subject);
  const span = document.createElement("span");
  span.className = "badge subject-badge";
  span.style.backgroundColor = bg;
  span.style.color = fg;
  span.textContent = subject;
  return span;
}

/**
 * Merender daftar tugas ke dalam tbody tabel.
 * @param {Object[]} list - Array tugas yang sudah difilter dan diurutkan.
 * @returns {void}
 */
function renderTasks(list) {
  const tbody = document.getElementById("taskTableBody");
  tbody.innerHTML = "";

  if (list.length === 0) {
    const tr = document.createElement("tr");
    tr.className = "empty-row";
    const td = document.createElement("td");
    td.setAttribute("colspan", "6");
    td.textContent = "📭 Tidak ada tugas yang sesuai.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  list.forEach((task) => {
    const tr = document.createElement("tr");

    /* --- Status select --- */
    const tdStatus = document.createElement("td");
    const statusSel = document.createElement("select");
    statusSel.className = "form-input status-select";
    statusSel.setAttribute("aria-label", `Status tugas ${task.title}`);
    [
      { value: "todo",       label: "⏳ To Do" },
      { value: "inprogress", label: "🚀 In Progress" },
      { value: "done",       label: "✅ Selesai" },
    ].forEach(({ value, label }) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      if (value === task.status) { opt.selected = true; }
      statusSel.appendChild(opt);
    });
    statusSel.addEventListener("change", () => {
      updateStatus(task.id, statusSel.value);
    });
    tdStatus.appendChild(statusSel);
    tr.appendChild(tdStatus);

    /* --- Title --- */
    const tdTitle = document.createElement("td");
    tdTitle.className = "task-title-cell";
    const titleSpan = document.createElement("span");
    titleSpan.textContent = task.title;
    if (task.status === "done") { titleSpan.classList.add("task-title-done"); }
    tdTitle.appendChild(titleSpan);
    tr.appendChild(tdTitle);

    /* --- Subject badge --- */
    const tdSubject = document.createElement("td");
    tdSubject.appendChild(createSubjectBadge(task.subject));
    tr.appendChild(tdSubject);

    /* --- Due date --- */
    const tdDue = document.createElement("td");
    const dueStatus = getDueStatus(task.dueDate, task.status, task.dueTime);
    const dateText = document.createElement("span");
    if (task.dueDate) {
      const formatted = formatDate(task.dueDate);
      dateText.textContent = task.dueTime ? `${formatted} • 🕒 ${task.dueTime}` : formatted;
    } else {
      dateText.textContent = "—";
    }
    dateText.style.display = "block";
    dateText.style.fontSize = "0.82rem";
    tdDue.appendChild(dateText);
    if (dueStatus) {
      const dueBadge = document.createElement("span");
      dueBadge.className = `badge due-${dueStatus}`;
      dueBadge.textContent = getDueLabel(dueStatus);
      tdDue.appendChild(dueBadge);
    }
    tr.appendChild(tdDue);

    /* --- Priority badge --- */
    const tdPriority = document.createElement("td");
    const priBadge = document.createElement("span");
    const priMap = { high: ["priority-high", "🔴 High"], medium: ["priority-medium", "🟡 Medium"], low: ["priority-low", "🟢 Low"] };
    const [priClass, priLabel] = priMap[task.priority] || priMap["medium"];
    priBadge.className = `badge ${priClass}`;
    priBadge.textContent = priLabel;
    tdPriority.appendChild(priBadge);
    tr.appendChild(tdPriority);

    /* --- Actions --- */
    const tdActions = document.createElement("td");
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "action-btns";

    const editBtn = document.createElement("button");
    editBtn.className = "btn-icon";
    editBtn.setAttribute("aria-label", `Edit tugas ${task.title}`);
    editBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    editBtn.addEventListener("click", () => { openEditModal(task.id); });

    const delBtn = document.createElement("button");
    delBtn.className = "btn-icon btn-icon-danger";
    delBtn.setAttribute("aria-label", `Hapus tugas ${task.title}`);
    delBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
    delBtn.addEventListener("click", () => {
      if (confirm(`Hapus tugas "${task.title}"?`)) {
        deleteTask(task.id);
        showToast("Tugas dihapus.", "success");
      }
    });

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(delBtn);
    tdActions.appendChild(actionsDiv);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });
}

/**
 * Memperbarui angka pada kartu metrik dashboard.
 * @returns {void}
 */
function renderMetricCards() {
  const total    = tasks.length;
  const todo     = tasks.filter((t) => t.status === "todo").length;
  const progress = tasks.filter((t) => t.status === "inprogress").length;
  const done     = tasks.filter((t) => t.status === "done").length;
  const overdue  = tasks.filter(isTaskOverdue).length;

  document.getElementById("metricTotal").textContent    = total;
  document.getElementById("metricTodo").textContent     = todo;
  document.getElementById("metricProgress").textContent = progress;
  document.getElementById("metricDone").textContent     = done;
  document.getElementById("metricOverdue").textContent  = overdue;
}

/**
 * Merender progress bar per mata pelajaran di dashboard.
 * @returns {void}
 */
function renderSubjectProgress() {
  const container = document.getElementById("subjectProgressContainer");
  const subjects  = [...new Set(tasks.map((t) => t.subject))].filter(Boolean);

  if (subjects.length === 0) {
    container.innerHTML = `<p class="empty-state-sm">Belum ada tugas.</p>`;
    return;
  }

  container.innerHTML = "";
  subjects.forEach((subj) => {
    const subjTasks = tasks.filter((t) => t.subject === subj);
    const done = subjTasks.filter((t) => t.status === "done").length;
    const pct  = subjTasks.length === 0 ? 0 : Math.round((done / subjTasks.length) * 100);

    const item = document.createElement("div");
    item.className = "subject-progress-item";

    const header = document.createElement("div");
    header.className = "subject-progress-header";

    const nameEl = document.createElement("span");
    nameEl.className = "subject-progress-name";
    nameEl.textContent = subj;

    const pctEl = document.createElement("span");
    pctEl.className = "subject-progress-pct";
    pctEl.textContent = `${pct}%`;

    header.appendChild(nameEl);
    header.appendChild(pctEl);

    const bg   = document.createElement("div");
    bg.className = "progress-bar-bg";
    const fill = document.createElement("div");
    fill.className = "progress-bar-fill";
    fill.style.width = `${pct}%`;
    bg.appendChild(fill);

    item.appendChild(header);
    item.appendChild(bg);
    container.appendChild(item);
  });
}

/**
 * Menggambar donut chart distribusi status tugas menggunakan Canvas 2D API.
 * Serta merender keterangan (legend) di elemen HTML agar tidak saling tumpang tindih.
 * @returns {void}
 */
function renderDonutChart() {
  const canvas = document.getElementById("donutChart");
  if (!canvas) { return; }

  const wrapper = canvas.parentElement;
  const size    = Math.min(wrapper.clientWidth || 240, 240);
  canvas.width  = size;
  canvas.height = 190;

  const ctx   = canvas.getContext("2d");
  const total = tasks.length;

  /* Kategori saling eksklusif (mutually exclusive) sehingga total persentase selalu tepat 100% */
  const countDone     = tasks.filter((t) => t.status === "done").length;
  const countOverdue  = tasks.filter(isTaskOverdue).length;
  const countProgress = tasks.filter((t) => t.status === "inprogress" && !isTaskOverdue(t)).length;
  const countTodo     = tasks.filter((t) => t.status === "todo" && !isTaskOverdue(t)).length;

  ctx.clearRect(0, 0, size, 190);

  const cx     = size / 2;
  const cy     = 95;
  const outerR = 72;
  const innerR = 46;

  if (total === 0) {
    ctx.fillStyle = "#374151";
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = "#1f2937";
    ctx.fill();

    ctx.fillStyle = "#9ca3af";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Belum ada", cx, cy - 8);
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText("tugas", cx, cy + 10);
  } else {
    const slices = [
      { count: countTodo,     color: "#eab308", label: "To Do" },
      { count: countProgress, color: "#3b82f6", label: "In Progress" },
      { count: countDone,     color: "#22c55e", label: "Selesai" },
      { count: countOverdue,  color: "#ef4444", label: "Terlambat" },
    ].filter((s) => s.count > 0);

    let startAngle = -Math.PI / 2;
    slices.forEach((slice) => {
      const angle = (slice.count / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, startAngle, startAngle + angle);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
      startAngle += angle;
    });

    /* Donut Hole */
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = "#1f2937";
    ctx.fill();

    /* Center text */
    ctx.fillStyle = "#f9fafb";
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(total), cx, cy - 8);
    ctx.fillStyle = "#9ca3af";
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText("Tugas", cx, cy + 12);
  }

  /* Render keterangan (legend) di HTML agar tidak saling tabrakan */
  const legendEl = document.getElementById("donutLegend");
  if (legendEl) {
    legendEl.innerHTML = `
      <span class="legend-chip" title="Belum selesai & tepat waktu"><span class="legend-dot" style="background:#eab308"></span>To Do <span class="legend-count">${countTodo}</span></span>
      <span class="legend-chip" title="Sedang dikerjakan & tepat waktu"><span class="legend-dot" style="background:#3b82f6"></span>Progress <span class="legend-count">${countProgress}</span></span>
      <span class="legend-chip" title="Tugas selesai"><span class="legend-dot" style="background:#22c55e"></span>Selesai <span class="legend-count">${countDone}</span></span>
      <span class="legend-chip" title="Tugas belum selesai yang lewat tenggat"><span class="legend-dot" style="background:#ef4444"></span>Terlambat <span class="legend-count">${countOverdue}</span></span>
    `;
  }
}

/**
 * Menggambar bar chart aktivitas mingguan menggunakan Canvas 2D API.
 * Menampilkan jumlah tugas yang diperbarui per hari dalam minggu ini.
 * @returns {void}
 */
function renderWeeklyChart() {
  const canvas = document.getElementById("weeklyChart");
  if (!canvas) { return; }

  const wrapper = canvas.parentElement;
  const W       = wrapper.clientWidth || 400;
  const H       = 220;
  canvas.width  = W;
  canvas.height = H;

  const ctx    = canvas.getContext("2d");
  const days   = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const counts = getWeeklyTaskCounts();
  const maxVal = Math.max(...counts, 1);

  ctx.clearRect(0, 0, W, H);

  const padL = 32;
  const padR = 16;
  const padT = 20;
  const padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const barW   = Math.floor(chartW / days.length * 0.5);
  const gap    = chartW / days.length;

  /* Y grid lines */
  const gridLines = 4;
  ctx.strokeStyle = "rgba(55,65,81,0.6)";
  ctx.lineWidth   = 1;
  for (let i = 0; i <= gridLines; i++) {
    const y = padT + chartH - (i / gridLines) * chartH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + chartW, y);
    ctx.stroke();
    ctx.fillStyle = "#6b7280";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(Math.round((i / gridLines) * maxVal), padL - 4, y + 4);
  }

  /* Bars */
  counts.forEach((val, i) => {
    const barH = chartH * (val / maxVal);
    const x    = padL + i * gap + gap / 2 - barW / 2;
    const y    = padT + chartH - barH;

    const grad = ctx.createLinearGradient(0, y, 0, padT + chartH);
    grad.addColorStop(0, "#f97316");
    grad.addColorStop(1, "#ea580c");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
    ctx.fill();

    /* Value label on bar */
    if (val > 0) {
      ctx.fillStyle = "#f9fafb";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(val, x + barW / 2, y - 5);
    }

    /* Day label */
    ctx.fillStyle = "#9ca3af";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(days[i], x + barW / 2, H - padB + 16);
  });
}

/**
 * Menghitung jumlah tugas yang dibuat atau diselesaikan per hari dalam minggu ini (Sen-Min).
 * @returns {number[]} Array 7 angka (Senin–Minggu).
 */
function getWeeklyTaskCounts() {
  const now        = new Date();
  const dayOfWeek  = now.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday     = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const counts = [0, 0, 0, 0, 0, 0, 0];
  tasks.forEach((task) => {
    const created = new Date(task.createdAt);
    const diff    = Math.floor((created - monday) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < 7) {
      counts[diff] += 1;
    }
  });
  return counts;
}

/**
 * Memperbarui semua elemen <select> yang menampilkan pilihan mapel.
 * @returns {void}
 */
function updateSubjectSelects() {
  const subjects = getAllSubjects();
  const selects  = document.querySelectorAll(".subject-select");

  selects.forEach((sel) => {
    const isFilter = sel.id === "filterSubject";
    const current  = sel.value;

    sel.innerHTML = "";

    if (isFilter) {
      const all = document.createElement("option");
      all.value = "all";
      all.textContent = "Semua Mapel";
      sel.appendChild(all);
    } else {
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "-- Pilih Mapel --";
      sel.appendChild(placeholder);
    }

    subjects.forEach((subj) => {
      const opt = document.createElement("option");
      opt.value = subj;
      opt.textContent = subj;
      sel.appendChild(opt);
    });

    if (!isFilter) {
      const addNew = document.createElement("option");
      addNew.value = "__new__";
      addNew.textContent = "+ Tambah Mata Pelajaran Baru";
      sel.appendChild(addNew);
    }

    /* Restore selection if still valid */
    if (current && [...sel.options].some((o) => o.value === current)) {
      sel.value = current;
    }
  });

  /* Sync filter subject dropdown */
  const fSubj = document.getElementById("filterSubject");
  if (fSubj) { fSubj.value = currentFilter.subject; }
}

/**
 * Merender daftar mapel kustom di halaman pengaturan.
 * @returns {void}
 */
function renderSettingsSubjects() {
  const container = document.getElementById("customSubjectsList");
  container.innerHTML = "";

  const allSubj = getAllSubjects();

  if (allSubj.length === 0) {
    container.innerHTML = `<p class="empty-state-sm">Belum ada mata pelajaran.</p>`;
    return;
  }

  allSubj.forEach((subj) => {
    const isBuiltin = DEFAULT_SUBJECTS.includes(subj);
    const item = document.createElement("div");
    item.className = "subject-list-item";

    const nameWrap = document.createElement("span");
    if (isBuiltin) {
      nameWrap.innerHTML = `<span class="subject-name">${subj}</span> <span class="subject-builtin">(bawaan)</span>`;
    } else {
      nameWrap.innerHTML = `<span class="subject-name">${subj}</span>`;
    }

    item.appendChild(nameWrap);

    if (!isBuiltin) {
      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-danger btn-sm";
      delBtn.setAttribute("aria-label", `Hapus mapel ${subj}`);
      delBtn.textContent = "Hapus";
      delBtn.addEventListener("click", () => {
        if (confirm(`Hapus mata pelajaran "${subj}"?`)) {
          removeCustomSubject(subj);
          showToast(`Mapel "${subj}" dihapus.`, "success");
        }
      });
      item.appendChild(delBtn);
    }

    container.appendChild(item);
  });
}

/**
 * Memperbarui semua elemen img avatar di DOM berdasarkan currentUser.
 * Jika tidak ada avatar, tampilkan SVG inisial.
 * @returns {void}
 */
function updateAvatarDisplays() {
  const avatarEls = document.querySelectorAll(".userAvatar");
  const name = currentUser && currentUser.fullName ? currentUser.fullName : "Andrean Rayhan";
  const src = currentUser && currentUser.avatar
    ? currentUser.avatar
    : generateAvatarDataUrl(name);

  avatarEls.forEach((el) => {
    el.src = src;
    el.style.objectPosition = "center center";
  });
}

/**
 * Menghasilkan data URL SVG dengan inisial nama sebagai avatar default.
 * @param {string} name - Nama yang akan diambil inisialnya.
 * @returns {string} Data URL SVG.
 */
function generateAvatarDataUrl(name) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="#f97316"/><text x="40" y="40" dy=".35em" text-anchor="middle" font-family="Inter,sans-serif" font-size="28" font-weight="bold" fill="#fff">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Memperbarui konten profile dropdown (nama, produktivitas).
 * @returns {void}
 */
function renderProfileDropdown() {
  if (!currentUser) { return; }

  const fullName = currentUser.fullName || "Andrean Rayhan";
  const firstName = fullName.trim().split(/\s+/)[0] || fullName;
  document.getElementById("dropdownName").textContent = fullName;
  document.getElementById("topbarUsername").textContent = firstName;

  const done  = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

  document.getElementById("dropdownProdBar").style.width = `${pct}%`;
  document.getElementById("dropdownProdPct").textContent = `${pct}%`;
}

/**
 * Merender halaman Analytics dengan statistik, tabel performa, dan daftar terlambat.
 * @returns {void}
 */
function renderAnalytics() {
  const total   = tasks.length;
  const done    = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter(isTaskOverdue).length;

  const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);
  const overdueRate    = total === 0 ? 0 : Math.round((overdue / total) * 100);

  /* Weekly avg: tasks created within last 4 weeks / 4 */
  const fourWeeksAgo = Date.now() - 28 * 24 * 60 * 60 * 1000;
  const recentTasks  = tasks.filter((t) => t.createdAt >= fourWeeksAgo).length;
  const avgPerWeek   = Math.round(recentTasks / 4);

  document.getElementById("analyticsCompletionRate").textContent = `${completionRate}%`;
  document.getElementById("analyticsAvgPerWeek").textContent     = avgPerWeek;
  document.getElementById("analyticsOverdueRate").textContent    = `${overdueRate}%`;

  /* Subject performance table */
  const subjects    = [...new Set(tasks.map((t) => t.subject))].filter(Boolean);
  const perfBody    = document.getElementById("subjectPerformanceBody");
  perfBody.innerHTML = "";

  if (subjects.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.setAttribute("colspan", "6");
    td.className = "empty-state-sm";
    td.textContent = "Belum ada data.";
    tr.appendChild(td);
    perfBody.appendChild(tr);
  } else {
    subjects.forEach((subj) => {
      const st  = tasks.filter((t) => t.subject === subj);
      const doneC = st.filter((t) => t.status === "done").length;
      const progC = st.filter((t) => t.status === "inprogress" && !isTaskOverdue(t)).length;
      const todoC = st.filter((t) => t.status === "todo" && !isTaskOverdue(t)).length;
      const ovC   = st.filter(isTaskOverdue).length;
      const tr    = document.createElement("tr");
      [subj, st.length, doneC, progC, todoC, ovC].forEach((val, i) => {
        const td = document.createElement("td");
        td.textContent = val;
        if (i === 0) {
          td.innerHTML = "";
          td.appendChild(createSubjectBadge(subj));
        }
        tr.appendChild(td);
      });
      perfBody.appendChild(tr);
    });
  }

  /* Overdue list */
  const overdueList = document.getElementById("overdueList");
  const overdueTasks = tasks.filter(isTaskOverdue);
  overdueList.innerHTML = "";

  if (overdueTasks.length === 0) {
    overdueList.innerHTML = `<p class="empty-state-sm">Tidak ada tugas terlambat. 🎉</p>`;
  } else {
    overdueTasks.forEach((task) => {
      const item = document.createElement("div");
      item.className = "overdue-item";

      const left = document.createElement("div");
      const title = document.createElement("p");
      title.className = "overdue-item-title";
      title.textContent = task.title;
      const meta = document.createElement("div");
      meta.className = "overdue-item-meta";
      meta.appendChild(createSubjectBadge(task.subject));
      left.appendChild(title);
      left.appendChild(meta);

      const right = document.createElement("div");
      right.style.textAlign = "right";
      const dueBadge = document.createElement("span");
      dueBadge.className = "badge due-overdue";
      dueBadge.textContent = task.dueTime ? `${formatDate(task.dueDate)} • ${task.dueTime}` : formatDate(task.dueDate);
      right.appendChild(dueBadge);

      item.appendChild(left);
      item.appendChild(right);
      overdueList.appendChild(item);
    });
  }

  /* Analytics weekly chart */
  renderAnalyticsWeeklyChart();
}

/**
 * Menggambar bar chart tren produktivitas di halaman Analytics.
 * @returns {void}
 */
function renderAnalyticsWeeklyChart() {
  const canvas = document.getElementById("analyticsWeeklyChart");
  if (!canvas) { return; }

  const wrapper = canvas.parentElement;
  const W       = wrapper.clientWidth || 600;
  const H       = 260;
  canvas.width  = W;
  canvas.height = H;

  const ctx    = canvas.getContext("2d");
  const days   = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const counts = getWeeklyTaskCounts();
  const maxVal = Math.max(...counts, 1);

  ctx.clearRect(0, 0, W, H);

  const padL = 36;
  const padR = 16;
  const padT = 24;
  const padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const barW   = Math.floor(chartW / days.length * 0.5);
  const gap    = chartW / days.length;

  const gridLines = 4;
  ctx.strokeStyle = "rgba(55,65,81,0.6)";
  ctx.lineWidth   = 1;
  for (let i = 0; i <= gridLines; i++) {
    const y = padT + chartH - (i / gridLines) * chartH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + chartW, y);
    ctx.stroke();
    ctx.fillStyle = "#6b7280";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(Math.round((i / gridLines) * maxVal), padL - 4, y + 4);
  }

  counts.forEach((val, i) => {
    const barH = chartH * (val / maxVal);
    const x    = padL + i * gap + gap / 2 - barW / 2;
    const y    = padT + chartH - barH;

    const grad = ctx.createLinearGradient(0, y, 0, padT + chartH);
    grad.addColorStop(0, "#f97316");
    grad.addColorStop(1, "#ea580c");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
    ctx.fill();

    if (val > 0) {
      ctx.fillStyle = "#f9fafb";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(val, x + barW / 2, y - 6);
    }

    ctx.fillStyle = "#9ca3af";
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(days[i], x + barW / 2, H - padB + 18);
  });
}

/* ============================================================
   SECTION 8: PROFILE FUNCTIONS
   ============================================================ */

/**
 * Menangani proses unggah avatar.
 * Membuka editor crop gaya Discord untuk mengatur posisi & zoom.
 * @param {File} file - File gambar yang diunggah.
 * @returns {void}
 */
function handleAvatarUpload(file) {
  const errorEl = document.getElementById("avatarError");
  if (errorEl) { errorEl.textContent = ""; }

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    if (errorEl) { errorEl.textContent = "Format file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP."; }
    return;
  }

  const maxSize = 10 * 1024 * 1024; /* 10MB */
  if (file.size > maxSize) {
    if (errorEl) { errorEl.textContent = "Ukuran file terlalu besar. Maksimal 10MB."; }
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const rawDataUrl = e.target.result;
    initCropperWithImage(rawDataUrl);
  };
  reader.readAsDataURL(file);
}

/* ============================================================
   SECTION 8.5: DISCORD-STYLE AVATAR CROPPER
   ============================================================ */

const cropperState = {
  img: null,
  imgNaturalW: 0,
  imgNaturalH: 0,
  circleD: 220,
  scale: 1,
  baseScale: 1,
  zoomFactor: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  initialOffsetX: 0,
  initialOffsetY: 0,
  sourceDataUrl: "",
};

/**
 * Membuka modal crop gaya Discord dengan data URL gambar yang diberikan.
 * @param {string} dataUrl - Gambar dalam format data URL.
 * @returns {void}
 */
function initCropperWithImage(dataUrl) {
  cropperState.sourceDataUrl = dataUrl;
  const image = new Image();
  image.onload = () => {
    cropperState.img = image;
    cropperState.imgNaturalW = image.naturalWidth;
    cropperState.imgNaturalH = image.naturalHeight;

    const ringEl = document.querySelector(".crop-mask-ring");
    const D = ringEl && ringEl.offsetWidth > 0 ? ringEl.offsetWidth : 220;
    cropperState.circleD = D;

    const minDim = Math.min(image.naturalWidth, image.naturalHeight);
    cropperState.baseScale = D / minDim;
    cropperState.zoomFactor = 1.0;
    cropperState.scale = cropperState.baseScale * cropperState.zoomFactor;

    cropperState.offsetX = 0;
    cropperState.offsetY = 0;

    const cropImgEl = document.getElementById("cropImage");
    if (cropImgEl) {
      cropImgEl.src = dataUrl;
    }

    const zoomSlider = document.getElementById("cropZoomSlider");
    if (zoomSlider) {
      zoomSlider.value = 100;
    }
    updateCropZoomBadge(100);

    applyCropTransform();

    const cropModal = document.getElementById("avatarCropModal");
    if (cropModal) {
      cropModal.classList.remove("hidden");
    }
  };
  image.src = dataUrl;
}

/**
 * Menerapkan posisi transform (translate & scale) pada gambar di viewport crop.
 * Memastikan area lingkaran selalu tertutup penuh oleh gambar.
 * @returns {void}
 */
function applyCropTransform() {
  const cropImgEl = document.getElementById("cropImage");
  if (!cropImgEl || !cropperState.img) { return; }

  const dispW = Math.round(cropperState.imgNaturalW * cropperState.scale);
  const dispH = Math.round(cropperState.imgNaturalH * cropperState.scale);
  const D = cropperState.circleD;

  const maxOffsetX = Math.max(0, (dispW - D) / 2);
  const maxOffsetY = Math.max(0, (dispH - D) / 2);

  cropperState.offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, cropperState.offsetX));
  cropperState.offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, cropperState.offsetY));

  cropImgEl.style.width = `${dispW}px`;
  cropImgEl.style.height = `${dispH}px`;
  cropImgEl.style.transform = `translate(calc(-50% + ${cropperState.offsetX}px), calc(-50% + ${cropperState.offsetY}px))`;
}

/**
 * Mengatur zoom level pada cropper (100% sampai 300%).
 * @param {number} val - Nilai persentase zoom (100 - 300).
 * @returns {void}
 */
function setCropZoom(val) {
  const clampedVal = Math.max(100, Math.min(300, Math.round(val)));
  cropperState.zoomFactor = clampedVal / 100;
  cropperState.scale = cropperState.baseScale * cropperState.zoomFactor;

  const slider = document.getElementById("cropZoomSlider");
  if (slider) { slider.value = clampedVal; }
  updateCropZoomBadge(clampedVal);

  applyCropTransform();
}

/**
 * Memperbarui teks badge persentase zoom.
 * @param {number} val - Nilai persentase.
 * @returns {void}
 */
function updateCropZoomBadge(val) {
  const badge = document.getElementById("cropZoomBadge");
  if (badge) { badge.textContent = `${val}%`; }
}

/**
 * Memulai aksi drag / pan foto.
 * @param {number} clientX - Posisi X kursor / sentuhan.
 * @param {number} clientY - Posisi Y kursor / sentuhan.
 * @returns {void}
 */
function onCropDragStart(clientX, clientY) {
  if (!cropperState.img) { return; }
  cropperState.isDragging = true;
  cropperState.dragStartX = clientX;
  cropperState.dragStartY = clientY;
  cropperState.initialOffsetX = cropperState.offsetX;
  cropperState.initialOffsetY = cropperState.offsetY;
}

/**
 * Memperbarui posisi pan saat kursor / jari bergerak.
 * @param {number} clientX - Posisi X kursor / sentuhan.
 * @param {number} clientY - Posisi Y kursor / sentuhan.
 * @returns {void}
 */
function onCropDragMove(clientX, clientY) {
  if (!cropperState.isDragging) { return; }
  const dx = clientX - cropperState.dragStartX;
  const dy = clientY - cropperState.dragStartY;
  cropperState.offsetX = cropperState.initialOffsetX + dx;
  cropperState.offsetY = cropperState.initialOffsetY + dy;
  applyCropTransform();
}

/**
 * Mengakhiri aksi drag / pan foto.
 * @returns {void}
 */
function onCropDragEnd() {
  cropperState.isDragging = false;
}

/**
 * Menutup modal crop.
 * @returns {void}
 */
function closeCropModal() {
  const modal = document.getElementById("avatarCropModal");
  if (modal) { modal.classList.add("hidden"); }
  cropperState.isDragging = false;
}

/**
 * Merender hasil crop ke canvas 256x256, menyimpannya sebagai avatar user,
 * dan memperbarui seluruh tampilan antarmuka.
 * @returns {void}
 */
function applyAvatarCrop() {
  if (!cropperState.img) { return; }

  const targetSize = 256;
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) { return; }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const D = cropperState.circleD || 220;
  const k = targetSize / D;

  const dispW = cropperState.imgNaturalW * cropperState.scale;
  const dispH = cropperState.imgNaturalH * cropperState.scale;

  const imgCenterCanvasX = (targetSize / 2) + (cropperState.offsetX * k);
  const imgCenterCanvasY = (targetSize / 2) + (cropperState.offsetY * k);

  const drawW = dispW * k;
  const drawH = dispH * k;
  const drawX = imgCenterCanvasX - (drawW / 2);
  const drawY = imgCenterCanvasY - (drawH / 2);

  ctx.drawImage(cropperState.img, drawX, drawY, drawW, drawH);

  const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.92);

  saveProfile({
    avatar: croppedDataUrl,
    rawAvatar: cropperState.sourceDataUrl,
  });

  updateAvatarDisplays();
  renderProfileDropdown();
  closeCropModal();
  showToast("Foto profil berhasil disesuaikan! ✨", "success");
}

/* ============================================================
   SECTION 9: MODAL HANDLERS
   ============================================================ */

/**
 * Membuka modal edit tugas dan mengisi form dengan data tugas yang dipilih.
 * @param {number} id - ID tugas yang akan diedit.
 * @returns {void}
 */
function openEditModal(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) { return; }

  document.getElementById("editTaskId").value     = id;
  document.getElementById("editTitle").value      = task.title;
  document.getElementById("editDueDate").value    = task.dueDate || "";
  document.getElementById("editDueTime").value    = task.dueTime || "";
  document.getElementById("editPriority").value   = task.priority;
  document.getElementById("editStatus").value     = task.status;

  /* Populate subject dropdown */
  const sel = document.getElementById("editSubject");
  updateSubjectSelects();
  sel.value = task.subject;

  document.getElementById("editTaskModal").classList.remove("hidden");
}

/**
 * Menutup modal edit tugas.
 * @returns {void}
 */
function closeEditModal() {
  document.getElementById("editTaskModal").classList.add("hidden");
}

/**
 * Membuka modal profil dan mengisi form dengan data user.
 * @returns {void}
 */
function openProfileModal() {
  if (!currentUser) { return; }
  document.getElementById("profileFullName").value = currentUser.fullName || "";
  document.getElementById("profileKelas").value    = currentUser.kelas || "";
  document.getElementById("profileJurusan").value  = currentUser.jurusan || "";
  const errEl = document.getElementById("avatarError");
  if (errEl) { errEl.textContent = ""; }

  updateAvatarDisplays();
  document.getElementById("profileModal").classList.remove("hidden");
}

/**
 * Menutup modal profil.
 * @returns {void}
 */
function closeProfileModal() {
  document.getElementById("profileModal").classList.add("hidden");
}

/* ============================================================
   SECTION 10: TOAST NOTIFICATIONS
   ============================================================ */

/**
 * Menampilkan notifikasi toast di pojok kanan bawah.
 * Menggunakan styling glassmorphism modern dengan badge ikon vektor SVG.
 * @param {string} message - Pesan yang ditampilkan.
 * @param {'success'|'error'|'warning'} [type='success'] - Tipe toast.
 * @returns {void}
 */
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) { return; }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "polite");

  let iconSvg = "";
  if (type === "success") {
    iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>`;
  } else if (type === "error") {
    iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  } else {
    iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  }

  const iconBadge = document.createElement("div");
  iconBadge.className = `toast-icon-badge toast-badge-${type}`;
  iconBadge.innerHTML = iconSvg;

  const msgSpan = document.createElement("span");
  msgSpan.className = "toast-message";
  msgSpan.textContent = message;

  toast.appendChild(iconBadge);
  toast.appendChild(msgSpan);
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("removing");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, 3200);
}

/* ============================================================
   SECTION 11: VIEW NAVIGATION
   ============================================================ */

/**
 * Beralih ke view tertentu dan memperbarui state navigasi.
 * @param {string} viewName - Nama view: 'dashboard' | 'analytics' | 'settings'.
 * @returns {void}
 */
function switchView(viewName) {
  currentView = viewName;

  /* Hide all views */
  document.querySelectorAll(".view").forEach((v) => {
    v.classList.remove("active");
    v.classList.add("hidden");
  });

  /* Show target */
  const target = document.getElementById(`view${capitalize(viewName)}`);
  if (target) {
    target.classList.remove("hidden");
    target.classList.add("active");
  }

  /* Update breadcrumb */
  const labels = { dashboard: "Dashboard", analytics: "Analytics", settings: "Pengaturan" };
  document.getElementById("breadcrumb").textContent = labels[viewName] || viewName;

  /* Update nav active state */
  document.querySelectorAll(".nav-item[data-view]").forEach((btn) => {
    const isActive = btn.dataset.view === viewName;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-current", isActive ? "page" : "false");
  });

  /* Trigger view-specific renders */
  if (viewName === "analytics") {
    renderAnalytics();
  } else if (viewName === "settings") {
    renderSettingsSubjects();
  } else if (viewName === "dashboard") {
    renderMetricCards();
    renderSubjectProgress();
    renderDonutChart();
    renderWeeklyChart();
  }
}

/**
 * Mengkapitalisasi huruf pertama string.
 * @param {string} str - String input.
 * @returns {string} String dengan huruf kapital di awal.
 */
function capitalize(str) {
  if (!str) { return ""; }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ============================================================
   SECTION 12: FORM VALIDATION
   ============================================================ */

/**
 * Memvalidasi judul tugas.
 * @param {string} title - Judul tugas.
 * @returns {string} Pesan error, atau string kosong jika valid.
 */
function validateTitle(title) {
  if (!title || title.trim().length === 0) { return "Judul tugas tidak boleh kosong."; }
  if (title.trim().length > 200) { return "Judul terlalu panjang (maks. 200 karakter)."; }
  return "";
}

/**
 * Memvalidasi mata pelajaran yang dipilih.
 * @param {string} subject - Nama mata pelajaran.
 * @returns {string} Pesan error, atau string kosong jika valid.
 */
function validateSubject(subject) {
  if (!subject || subject.trim().length === 0) { return "Pilih atau masukkan mata pelajaran."; }
  return "";
}

/* ============================================================
   SECTION 13: SIDEBAR TOGGLE (RESPONSIVE)
   ============================================================ */

/** @type {boolean} Apakah sidebar sedang collapsed */
let sidebarCollapsed = false;

/** @type {boolean} Apakah sidebar mobile sedang terbuka */
let mobileSidebarOpen = false;

/**
 * Toggle sidebar desktop (collapsed / expanded).
 * @returns {void}
 */
function toggleSidebar() {
  if (window.innerWidth <= 768) {
    toggleMobileSidebar();
    return;
  }
  sidebarCollapsed = !sidebarCollapsed;
  const sidebar     = document.getElementById("sidebar");
  const mainContent = document.getElementById("mainContent");
  sidebar.classList.toggle("sidebar-collapsed", sidebarCollapsed);
  mainContent.classList.toggle("sidebar-collapsed-shift", sidebarCollapsed);
}

/**
 * Toggle sidebar pada tampilan mobile.
 * @returns {void}
 */
function toggleMobileSidebar() {
  mobileSidebarOpen = !mobileSidebarOpen;
  document.getElementById("sidebar").classList.toggle("mobile-open", mobileSidebarOpen);
  document.getElementById("sidebarBackdrop").classList.toggle("active", mobileSidebarOpen);
}

/**
 * Menutup sidebar mobile.
 * @returns {void}
 */
function closeMobileSidebar() {
  mobileSidebarOpen = false;
  document.getElementById("sidebar").classList.remove("mobile-open");
  document.getElementById("sidebarBackdrop").classList.remove("active");
}

/* ============================================================
   SECTION 14: EVENT LISTENERS SETUP
   ============================================================ */

/**
 * Menginisialisasi semua event listener aplikasi.
 * @returns {void}
 */
function setupEventListeners() {

  /* ----- SIDEBAR TOGGLE ----- */
  document.getElementById("sidebarToggle").addEventListener("click", toggleSidebar);
  document.getElementById("topbarToggle").addEventListener("click", toggleSidebar);

  /* Sidebar backdrop (mobile) */
  const backdrop = document.getElementById("sidebarBackdrop");
  backdrop.addEventListener("click", closeMobileSidebar);

  /* ----- NAV ITEMS ----- */
  document.querySelectorAll(".nav-item[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchView(btn.dataset.view);
      if (window.innerWidth <= 768) { closeMobileSidebar(); }
    });
  });

  /* ----- PROFILE DROPDOWN ----- */
  document.getElementById("avatarBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById("profileDropdown");
    const isOpen   = !dropdown.classList.contains("hidden");
    dropdown.classList.toggle("hidden", isOpen);
    document.getElementById("avatarBtn").setAttribute("aria-expanded", String(!isOpen));
    if (!isOpen) { renderProfileDropdown(); }
  });

  document.addEventListener("click", (e) => {
    const dropdown  = document.getElementById("profileDropdown");
    const avatarBtn = document.getElementById("avatarBtn");
    if (!dropdown.classList.contains("hidden") && !avatarBtn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add("hidden");
      avatarBtn.setAttribute("aria-expanded", "false");
    }
  });

  /* ----- TOPBAR SEARCH (syncs with filter) ----- */
  document.getElementById("topbarSearch").addEventListener("input", (e) => {
    if (currentView === "dashboard") {
      currentFilter.search = e.target.value;
      document.getElementById("filterSearch").value = e.target.value;
      applyFilters();
    }
  });

  /* ----- FILTER TOOLBAR ----- */
  document.getElementById("filterSearch").addEventListener("input", (e) => {
    currentFilter.search = e.target.value;
    document.getElementById("topbarSearch").value = e.target.value;
    applyFilters();
  });

  document.getElementById("filterStatus").addEventListener("change", (e) => {
    currentFilter.status = e.target.value;
    applyFilters();
  });

  document.getElementById("filterSubject").addEventListener("change", (e) => {
    currentFilter.subject = e.target.value;
    applyFilters();
  });

  document.getElementById("filterSort").addEventListener("change", (e) => {
    currentFilter.sort = e.target.value;
    applyFilters();
  });

  /* ----- QUICK ADD FORM ----- */
  const qaSubject = document.getElementById("qaSubject");
  qaSubject.addEventListener("change", () => {
    const wrapper = document.getElementById("qaCustomSubjectWrapper");
    wrapper.classList.toggle("hidden", qaSubject.value !== "__new__");
  });

  document.getElementById("quickAddForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const titleEl   = document.getElementById("qaTitle");
    const subjectEl = document.getElementById("qaSubject");
    const dueDateEl = document.getElementById("qaDueDate");
    const dueTimeEl = document.getElementById("qaDueTime");
    const priorityEl = document.getElementById("qaPriority");
    const customSubjEl = document.getElementById("qaCustomSubject");

    const titleErr = validateTitle(titleEl.value);
    if (titleErr) { showToast(titleErr, "error"); titleEl.focus(); return; }

    let subject = subjectEl.value;
    if (subject === "__new__") {
      subject = customSubjEl.value.trim();
    }
    const subjErr = validateSubject(subject);
    if (subjErr) { showToast(subjErr, "error"); return; }

    /* Auto-add to custom subjects if not in list */
    if (!getAllSubjects().includes(subject)) {
      addCustomSubject(subject);
    }

    addTask({
      title:    titleEl.value.trim(),
      subject,
      dueDate:  dueDateEl.value,
      dueTime:  dueTimeEl ? dueTimeEl.value : "",
      priority: priorityEl.value,
    });

    applyFilters();
    renderMetricCards();
    renderSubjectProgress();
    renderDonutChart();
    renderWeeklyChart();

    /* Reset form */
    document.getElementById("quickAddForm").reset();
    document.getElementById("qaCustomSubjectWrapper").classList.add("hidden");
    updateSubjectSelects();

    showToast("Tugas berhasil ditambahkan! 🎉", "success");
  });

  /* ----- PROFILE MODAL ----- */
  document.getElementById("sidebarProfileBtn").addEventListener("click", () => {
    openProfileModal();
    if (window.innerWidth <= 768) { closeMobileSidebar(); }
  });

  document.getElementById("dropdownEditProfileBtn").addEventListener("click", () => {
    document.getElementById("profileDropdown").classList.add("hidden");
    openProfileModal();
  });

  document.getElementById("profileModalClose").addEventListener("click", closeProfileModal);

  document.getElementById("profileModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("profileModal")) { closeProfileModal(); }
  });

  /* Profile form submission */
  document.getElementById("profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    saveProfile({
      fullName: document.getElementById("profileFullName").value.trim(),
      kelas:    document.getElementById("profileKelas").value.trim(),
      jurusan:  document.getElementById("profileJurusan").value.trim(),
    });
    updateAvatarDisplays();
    renderProfileDropdown();
    closeProfileModal();
    showToast("Profil disimpan.", "success");
  });

  /* ----- AVATAR UPLOAD & CROPPER CONTROLS ----- */
  const avatarFileInput = document.getElementById("avatarFileInput");
  if (avatarFileInput) {
    avatarFileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) { handleAvatarUpload(file); }
      e.target.value = "";
    });
  }

  const btnUploadAvatar = document.getElementById("btnUploadAvatar");
  if (btnUploadAvatar) {
    btnUploadAvatar.addEventListener("click", () => {
      if (avatarFileInput) { avatarFileInput.click(); }
    });
  }

  const btnOpenCropper = document.getElementById("btnOpenCropper");
  if (btnOpenCropper) {
    btnOpenCropper.addEventListener("click", () => {
      const currentSrc = (currentUser && (currentUser.rawAvatar || currentUser.avatar));
      if (currentSrc && !currentSrc.startsWith("data:image/svg+xml")) {
        initCropperWithImage(currentSrc);
      } else if (avatarFileInput) {
        avatarFileInput.click();
      }
    });
  }

  const avatarUploadArea = document.getElementById("avatarUploadArea");
  if (avatarUploadArea) {
    avatarUploadArea.addEventListener("click", () => {
      const currentSrc = (currentUser && (currentUser.rawAvatar || currentUser.avatar));
      if (currentSrc && !currentSrc.startsWith("data:image/svg+xml")) {
        initCropperWithImage(currentSrc);
      } else if (avatarFileInput) {
        avatarFileInput.click();
      }
    });
    avatarUploadArea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (avatarFileInput) { avatarFileInput.click(); }
      }
    });
  }

  /* Cropper Modal Close */
  const cropModalClose = document.getElementById("cropModalClose");
  if (cropModalClose) { cropModalClose.addEventListener("click", closeCropModal); }

  const cropCancelBtn = document.getElementById("cropCancelBtn");
  if (cropCancelBtn) { cropCancelBtn.addEventListener("click", closeCropModal); }

  const avatarCropModal = document.getElementById("avatarCropModal");
  if (avatarCropModal) {
    avatarCropModal.addEventListener("click", (e) => {
      if (e.target === avatarCropModal) { closeCropModal(); }
    });
  }

  /* Cropper Dragging (Mouse & Touch) */
  const cropVp = document.getElementById("cropViewport");
  if (cropVp) {
    cropVp.addEventListener("mousedown", (e) => {
      e.preventDefault();
      onCropDragStart(e.clientX, e.clientY);
    });

    cropVp.addEventListener("touchstart", (e) => {
      if (e.touches && e.touches.length === 1) {
        onCropDragStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    cropVp.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 12 : -12;
      setCropZoom((cropperState.zoomFactor * 100) + delta);
    }, { passive: false });
  }

  window.addEventListener("mousemove", (e) => {
    if (cropperState.isDragging) {
      onCropDragMove(e.clientX, e.clientY);
    }
  });

  window.addEventListener("touchmove", (e) => {
    if (cropperState.isDragging && e.touches && e.touches.length === 1) {
      onCropDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener("mouseup", () => {
    if (cropperState.isDragging) {
      onCropDragEnd();
    }
  });

  window.addEventListener("touchend", () => {
    if (cropperState.isDragging) {
      onCropDragEnd();
    }
  });

  /* Cropper Zoom Controls */
  const cropZoomSlider = document.getElementById("cropZoomSlider");
  if (cropZoomSlider) {
    cropZoomSlider.addEventListener("input", (e) => {
      setCropZoom(Number(e.target.value));
    });
  }

  const cropZoomOutBtn = document.getElementById("cropZoomOutBtn");
  if (cropZoomOutBtn) {
    cropZoomOutBtn.addEventListener("click", () => {
      setCropZoom((cropperState.zoomFactor * 100) - 15);
    });
  }

  const cropZoomInBtn = document.getElementById("cropZoomInBtn");
  if (cropZoomInBtn) {
    cropZoomInBtn.addEventListener("click", () => {
      setCropZoom((cropperState.zoomFactor * 100) + 15);
    });
  }

  /* Cropper Presets */
  const cropPresetCenter = document.getElementById("cropPresetCenter");
  if (cropPresetCenter) {
    cropPresetCenter.addEventListener("click", () => {
      cropperState.offsetX = 0;
      cropperState.offsetY = 0;
      applyCropTransform();
    });
  }

  const cropPresetFace = document.getElementById("cropPresetFace");
  if (cropPresetFace) {
    cropPresetFace.addEventListener("click", () => {
      setCropZoom(140);
      cropperState.offsetX = 0;
      const dispH = cropperState.imgNaturalH * cropperState.scale;
      const maxOffsetY = Math.max(0, (dispH - cropperState.circleD) / 2);
      cropperState.offsetY = Math.round(maxOffsetY * 0.7);
      applyCropTransform();
    });
  }

  const cropPresetReset = document.getElementById("cropPresetReset");
  if (cropPresetReset) {
    cropPresetReset.addEventListener("click", () => {
      setCropZoom(100);
      cropperState.offsetX = 0;
      cropperState.offsetY = 0;
      applyCropTransform();
    });
  }

  /* Cropper Apply */
  const cropApplyBtn = document.getElementById("cropApplyBtn");
  if (cropApplyBtn) {
    cropApplyBtn.addEventListener("click", applyAvatarCrop);
  }

  /* ----- EDIT TASK MODAL ----- */
  document.getElementById("editTaskModalClose").addEventListener("click", closeEditModal);

  document.getElementById("editTaskModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("editTaskModal")) { closeEditModal(); }
  });

  document.getElementById("editTaskForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = Number(document.getElementById("editTaskId").value);

    const titleVal = document.getElementById("editTitle").value.trim();
    const titleErr = validateTitle(titleVal);
    if (titleErr) { showToast(titleErr, "error"); return; }

    const subjectVal = document.getElementById("editSubject").value;
    const subjectErr = validateSubject(subjectVal);
    if (subjectErr) { showToast(subjectErr, "error"); return; }

    updateTask(id, {
      title:    titleVal,
      subject:  subjectVal,
      dueDate:  document.getElementById("editDueDate").value,
      dueTime:  document.getElementById("editDueTime").value,
      priority: document.getElementById("editPriority").value,
      status:   document.getElementById("editStatus").value,
    });

    closeEditModal();
    showToast("Tugas diperbarui.", "success");
  });

  /* ----- SETTINGS: ADD SUBJECT ----- */
  document.getElementById("addSubjectForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const inp  = document.getElementById("newSubjectInput");
    const name = inp.value.trim();
    if (!name) { showToast("Nama mapel tidak boleh kosong.", "error"); return; }
    const added = addCustomSubject(name);
    if (added) {
      showToast(`Mapel "${name}" ditambahkan.`, "success");
      inp.value = "";
      renderSettingsSubjects();
    } else {
      showToast("Mapel sudah ada atau tidak valid.", "warning");
    }
  });

  /* ----- SETTINGS: EXPORT DATA ----- */
  document.getElementById("exportDataBtn").addEventListener("click", () => {
    const data = {
      exportedAt: new Date().toISOString(),
      tasks,
      customSubjects,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `schooltask-export-${getTodayString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Data berhasil diekspor.", "success");
  });

  /* ----- SETTINGS: RESET DATA ----- */
  document.getElementById("resetDataBtn").addEventListener("click", () => {
    if (confirm("Yakin ingin menghapus SEMUA data tugas dan pengaturan? Tindakan ini tidak dapat dibatalkan.")) {
      tasks = [];
      customSubjects = [];
      saveTasks();
      saveSubjects();
      applyFilters();
      renderMetricCards();
      renderSubjectProgress();
      renderDonutChart();
      renderWeeklyChart();
      renderSettingsSubjects();
      updateSubjectSelects();
      showToast("Semua data telah direset.", "warning");
    }
  });

  /* ----- TOPBAR DATABASE BADGE: Menampilkan status koneksi ----- */
  const topbarDbBadge = document.getElementById("topbarDbBadge");
  if (topbarDbBadge) {
    topbarDbBadge.addEventListener("click", () => {
      showToast(
        isSupabaseConnected
          ? "Basis Data: Terhubung ke PostgreSQL Cloud (Supabase) 🟢"
          : "Basis Data: Mode Offline Cadangan (LocalStorage) 📦",
        "info"
      );
    });
  }

  /* ----- TOPBAR SCROLL ELEVATION (Persis gaya PT Artha Haridra Cipta) ----- */
  const mainTopbar = document.getElementById("mainTopbar");
  if (mainTopbar) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 15) {
        mainTopbar.classList.add("topbar-scrolled");
      } else {
        mainTopbar.classList.remove("topbar-scrolled");
      }
    }, { passive: true });
  }

  /* ----- WINDOW RESIZE: Redraw charts ----- */
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderDonutChart();
      renderWeeklyChart();
      if (currentView === "analytics") { renderAnalyticsWeeklyChart(); }
    }, 150);
  });
}

/* ============================================================
   SECTION 15: INIT APP
   ============================================================ */

/**
 * Menginisialisasi seluruh aplikasi SchoolTask.
 * Dipanggil saat halaman selesai dimuat.
 * @returns {void}
 */
function initApp() {
  /* 1. Pastikan user default ada */
  initDefaultUser();
  currentUser = loadProfile() || {
    username: "siswa",
    fullName: "Andrean Rayhan",
    kelas:    "XII RPL",
    jurusan:  "Rekayasa Perangkat Lunak",
    avatar:   null,
  };

  /* 2. Coba inisialisasi koneksi Supabase di latar belakang */
  initSupabase().then((connected) => {
    if (connected) {
      loadTasks();
    }
  });

  /* 3. Tambahkan sidebar backdrop untuk mobile */
  const backdrop = document.createElement("div");
  backdrop.id = "sidebarBackdrop";
  backdrop.className = "sidebar-backdrop";
  document.body.appendChild(backdrop);

  /* 4. Pasang event listeners */
  setupEventListeners();

  /* 5. Tampilkan app dan render UI langsung */
  showApp();

  /* 6. Set view awal */
  switchView("dashboard");

  /* 7. Expose ke window untuk keperluan penilaian UKK & pengujian */
  window._schoolTask = {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    updateStatus,
    filterTasks,
    getAllSubjects,
    addCustomSubject,
    removeCustomSubject,
    applyFilters,
    sortTasks,
    getDueStatus,
    formatDate,
    getTodayString,
    showToast,
    initSupabase,
    supabaseClient: () => supabaseClient,
    isSupabaseConnected: () => isSupabaseConnected,
    currentUser: () => currentUser,
  };
}

/* Jalankan aplikasi setelah DOM siap */
document.addEventListener("DOMContentLoaded", initApp);
