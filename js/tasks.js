/**
 * @file js/tasks.js
 * @description Manajemen data tugas (CRUD), kategori mata pelajaran, logika filter & sort,
 *              perhitungan batas waktu (due date), dan validasi form input.
 *              Menggunakan LocalStorage browser secara mandiri tanpa ketergantungan eksternal.
 * @author Andrean Rayhan Wijaya
 */

/* ============================================================
   SECTION 1: TASK CRUD (LOCALSTORAGE)
   ============================================================ */

/**
 * Memuat daftar tugas dari localStorage.
 * @returns {void}
 */
function loadTasks() {
  try {
    const raw = localStorage.getItem(KEYS.TASKS);
    tasks = raw ? JSON.parse(raw) : [];
  } catch {
    tasks = [];
  }
}

/**
 * Menyimpan daftar tugas ke localStorage browser.
 * @returns {void}
 */
function saveTasks() {
  try {
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
  } catch (err) {
    console.error("saveTasks error:", err);
  }
}

/**
 * Menambahkan tugas baru ke dalam state dan menyimpannya ke LocalStorage.
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
  return task;
}

/**
 * Memperbarui status tugas berdasarkan id.
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
    if (typeof renderCalendar === "function" && typeof calendarState !== "undefined") {
      renderCalendar(calendarState.viewYear, calendarState.viewMonth);
    }
    if (typeof renderCalendar === "function" && typeof calendarState !== "undefined") {
      renderCalendar(calendarState.viewYear, calendarState.viewMonth);
    }
    if (typeof renderCalendar === "function" && typeof calendarState !== "undefined") {
      renderCalendar(calendarState.viewYear, calendarState.viewMonth);
    }
  }
}

/**
 * Memperbarui data tugas berdasarkan id.
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
    if (typeof renderCalendar === "function" && typeof calendarState !== "undefined") {
      renderCalendar(calendarState.viewYear, calendarState.viewMonth);
    }
    if (typeof renderCalendar === "function" && typeof calendarState !== "undefined") {
      renderCalendar(calendarState.viewYear, calendarState.viewMonth);
    }
    if (typeof renderCalendar === "function" && typeof calendarState !== "undefined") {
      renderCalendar(calendarState.viewYear, calendarState.viewMonth);
    }
  }
}

/**
 * Menghapus tugas berdasarkan id.
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
  if (typeof renderCalendar === "function" && typeof calendarState !== "undefined") {
    renderCalendar(calendarState.viewYear, calendarState.viewMonth);
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
   SECTION 2: SUBJECT MANAGEMENT
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
   SECTION 3: FILTER & SORT
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
      const dateCmp = a.dueDate.localeCompare(b.dueDate);
      if (dateCmp !== 0) { return dateCmp; }
      return (a.dueTime || "23:59").localeCompare(b.dueTime || "23:59");
    });
  }
  if (mode === "title-az") {
    return copy.sort((a, b) => a.title.localeCompare(b.title));
  }
  return copy;
}

/* ============================================================
   SECTION 4: LOGIKA TENGGAT WAKTU & FORMAT TANGGAL
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

/* ============================================================
   SECTION 5: VALIDASI FORM INPUT
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
  if (!subject || subject.trim().length === 0 || subject === "__new__") { return "Pilih atau masukkan mata pelajaran."; }
  return "";
}
