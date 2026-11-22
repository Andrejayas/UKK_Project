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

let taskIdCounter = 0;

/**
 * Menambahkan tugas baru ke dalam state dan menyimpannya ke LocalStorage.
 * Menggunakan ID unik berbasis milidetik + safe integer counter untuk mencegah duplikasi saat spam.
 * @param {{title: string, description?: string, subject: string, dueDate: string, dueTime?: string, priority: string, progress?: number}} data
 * @returns {Object} Objek tugas yang baru dibuat.
 */
function addTask(data) {
  taskIdCounter = (taskIdCounter + 1) % 1000;
  const uniqueId = Date.now() * 1000 + taskIdCounter;

  const task = {
    id:          uniqueId,
    title:       data.title.trim(),
    description: data.description ? data.description.trim() : "",
    subject:     data.subject.trim(),
    dueDate:     data.dueDate || "",
    dueTime:     data.dueTime || "",
    priority:    data.priority || "medium",
    status:      data.status || "todo",
    progress:    data.progress !== undefined ? data.progress : (data.status === "inprogress" ? 50 : 0),
    completedAt: null,
    createdAt:   Date.now(),
  };

  tasks.unshift(task);
  saveTasks();
  return task;
}

/**
 * Memperbarui status tugas berdasarkan id.
 * Menyimpan timestamp saat tugas ditandai selesai (done) untuk tracking riwayat.
 * Menolak perubahan jika tugas sudah melewati batas tenggat (terkunci otomatis).
 * @param {number} id - ID tugas.
 * @param {string} status - Status baru: 'todo' | 'inprogress' | 'done'.
 * @param {number} [customProgress] - Nilai progress opsional jika status inprogress.
 * @returns {void}
 */
function updateStatus(id, status, customProgress) {
  const task = tasks.find((t) => t.id === id);
  if (!task) { return; }

  /* Proteksi: Cegah perubahan jika tugas sudah melewati tenggat waktu (terkunci) */
  if (isTaskOverdue(task)) {
    if (typeof showToast === "function") {
      showToast("Tugas ini telah melewati tenggat waktu dan terkunci secara otomatis 🔒", "warning");
    }
    return;
  }

  task.status = status;
  if (status === "done") {
    task.completedAt = task.completedAt || Date.now();
    task.progress = 100;
  } else if (status === "todo") {
    task.completedAt = null;
    task.progress = 0;
  } else if (status === "inprogress") {
    task.completedAt = null;
    if (customProgress !== undefined) {
      task.progress = customProgress;
    } else if (!task.progress || task.progress === 0 || task.progress === 100) {
      task.progress = 50;
    }
  }
  saveTasks();
  applyFilters();
  renderMetricCards();
  renderSubjectProgress();
  renderDonutChart();
  renderWeeklyChart();
  if (typeof renderUrgentDeadlineBanner === "function") {
    renderUrgentDeadlineBanner();
  }
  if (typeof checkTaskDeadlinesNotification === "function") {
    checkTaskDeadlinesNotification();
  }
  if (typeof renderCalendar === "function" && typeof calendarState !== "undefined") {
    renderCalendar(calendarState.viewYear, calendarState.viewMonth);
  }
}

/**
 * Memperbarui nilai persentase progres tugas (khusus status inprogress).
 * Jika mencapai 100%, otomatis beralih ke status 'done'.
 * Menolak perubahan jika tugas sudah melewati batas tenggat (terkunci otomatis).
 * @param {number} id - ID tugas.
 * @param {number} progressVal - Nilai progress (0 - 100).
 * @returns {void}
 */
function updateTaskProgress(id, progressVal) {
  const task = tasks.find((t) => t.id === id);
  if (!task) { return; }

  /* Proteksi: Cegah perubahan progress jika tugas sudah melewati batas tenggat (terkunci) */
  if (isTaskOverdue(task)) {
    if (typeof showToast === "function") {
      showToast("Tugas ini telah melewati tenggat waktu dan terkunci secara otomatis 🔒", "warning");
    }
    return;
  }

  const num = Math.min(100, Math.max(0, Number(progressVal)));
  task.progress = num;

  if (num >= 100) {
    task.status = "done";
    task.completedAt = task.completedAt || Date.now();
    if (typeof showToast === "function") {
      showToast(`Tugas "${task.title}" mencapai 100% dan ditandai selesai! 🎉`, "success");
    }
  } else if (num <= 0) {
    task.status = "todo";
    task.completedAt = null;
  } else {
    task.status = "inprogress";
    task.completedAt = null;
  }

  saveTasks();
  applyFilters();
  renderMetricCards();
  renderSubjectProgress();
  renderDonutChart();
  renderWeeklyChart();
  if (typeof renderUrgentDeadlineBanner === "function") {
    renderUrgentDeadlineBanner();
  }
  if (typeof checkTaskDeadlinesNotification === "function") {
    checkTaskDeadlinesNotification();
  }
}

/**
 * Memperbarui data tugas berdasarkan id.
 * Menolak perubahan jika tugas sudah melewati batas tenggat (terkunci otomatis).
 * @param {number} id - ID tugas.
 * @param {Object} changes - Objek perubahan yang akan diterapkan.
 * @returns {void}
 */
function updateTask(id, changes) {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx !== -1) {
    /* Proteksi: Cegah pengeditan jika tugas sudah melewati batas tenggat (terkunci) */
    if (isTaskOverdue(tasks[idx])) {
      if (typeof showToast === "function") {
        showToast("Tugas ini telah melewati tenggat waktu dan tidak dapat diedit lagi 🔒", "warning");
      }
      return;
    }

    const oldStatus = tasks[idx].status;
    const newStatus = changes.status !== undefined ? changes.status : oldStatus;
    let completedAt = tasks[idx].completedAt;

    if (newStatus === "done") {
      completedAt = completedAt || changes.completedAt || Date.now();
    } else {
      completedAt = null;
    }

    if (changes.dueDate !== undefined || changes.dueTime !== undefined) {
      if (typeof clearTaskMilestones === "function") {
        clearTaskMilestones(id);
      }
    }

    tasks[idx] = { ...tasks[idx], ...changes, completedAt };
    saveTasks();
    applyFilters();
    renderMetricCards();
    renderSubjectProgress();
    renderDonutChart();
    renderWeeklyChart();
    if (typeof renderUrgentDeadlineBanner === "function") {
      renderUrgentDeadlineBanner();
    }
    if (typeof checkTaskDeadlinesNotification === "function") {
      checkTaskDeadlinesNotification();
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
  if (typeof clearTaskMilestones === "function") {
    clearTaskMilestones(id);
  }
  saveTasks();
  applyFilters();
  renderMetricCards();
  renderSubjectProgress();
  renderDonutChart();
  renderWeeklyChart();
  if (typeof renderUrgentDeadlineBanner === "function") {
    renderUrgentDeadlineBanner();
  }
  if (typeof checkTaskDeadlinesNotification === "function") {
    checkTaskDeadlinesNotification();
  }
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
 * Menghitung selisih milidetik antara tenggat waktu tugas dan waktu sekarang.
 * Jika jam ditentukan spesifik (misal 02:13), tenggat tepat pada 02:13:00.
 * Jika default akhir hari (23:59), tenggat berlaku hingga 23:59:59.
 * @param {string} dueDate - Format YYYY-MM-DD.
 * @param {string} [dueTime] - Format HH:MM (opsional, default: "23:59").
 * @returns {number|null} Selisih ms (positif: sisa waktu, negatif: terlambat), atau null jika tanpa tenggat.
 */
function getTaskDeadlineDiffMs(dueDate, dueTime) {
  if (!dueDate) { return null; }
  const timeStr = dueTime && dueTime.trim() ? dueTime.trim() : "23:59";
  const [y, m, d] = dueDate.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d) || isNaN(hh) || isNaN(mm)) { return null; }
  const isEndOfDay = timeStr === "23:59";
  const deadlineDate = new Date(y, m - 1, d, hh, mm, isEndOfDay ? 59 : 0, isEndOfDay ? 999 : 0);
  return deadlineDate.getTime() - Date.now();
}

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
 * Tugas dianggap terlambat hanya jika status BUKAN 'done' dan tenggat waktu telah lewat.
 * @param {Object} t - Objek tugas.
 * @returns {boolean} True jika tugas terlambat.
 */
function isTaskOverdue(t) {
  if (!t || t.status === "done" || !t.dueDate) { return false; }
  const diffMs = getTaskDeadlineDiffMs(t.dueDate, t.dueTime);
  return diffMs !== null && diffMs < 0;
}

/**
 * Mendapatkan status keterlambatan berdasarkan tanggal tenggat, status tugas, dan jam.
 * Mendeteksi status 'urgent' jika sisa waktu <= 60 menit menuju batas tenggat.
 * @param {string} dueDate - Tanggal tenggat dalam format YYYY-MM-DD.
 * @param {string} status - Status tugas ('todo' | 'inprogress' | 'done').
 * @param {string} [dueTime] - Jam tenggat (opsional, contoh: "23:59").
 * @returns {'overdue'|'urgent'|'today'|'tomorrow'|null} Status tenggat.
 */
function getDueStatus(dueDate, status, dueTime = "") {
  if (!dueDate || status === "done") { return null; }
  const diffMs = getTaskDeadlineDiffMs(dueDate, dueTime);
  if (diffMs !== null && diffMs < 0) {
    return "overdue";
  }
  // Jika dalam kurun waktu 60 menit ke depan (mendekati deadline)
  if (diffMs !== null && diffMs >= 0 && diffMs <= 60 * 60 * 1000) {
    return "urgent";
  }
  const today    = getTodayString();
  const tomorrow = getTomorrowString();
  if (dueDate === today) { return "today"; }
  if (dueDate === tomorrow) { return "tomorrow"; }
  return null;
}

/**
 * Mengonversi status tenggat ke label bahasa Indonesia yang informatif & real-time.
 * @param {'overdue'|'urgent'|'today'|'tomorrow'|null} dueStatus
 * @param {string} [dueDate] - Tanggal tenggat (YYYY-MM-DD).
 * @param {string} [dueTime] - Jam tenggat (HH:MM).
 * @returns {string} Label status.
 */
function getDueLabel(dueStatus, dueDate = "", dueTime = "") {
  if (dueStatus === "overdue") { return "Terlambat"; }
  if (dueStatus === "urgent") {
    if (dueDate) {
      const diffMs = getTaskDeadlineDiffMs(dueDate, dueTime);
      if (diffMs !== null && diffMs >= 0) {
        const minsLeft = Math.ceil(diffMs / 60000);
        if (minsLeft <= 1) {
          return "⚠️ 1 Menit Lagi!";
        }
        return `⚠️ ${minsLeft} Menit Lagi!`;
      }
    }
    return "⚠️ Segera Berakhir";
  }
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
 * Memformat waktu penyelesaian tugas (timestamp ms) menjadi string yang rapi.
 * Contoh: "15 Nov 2026 • 21:15 WIB".
 * @param {number|null} timestamp - Epoch timestamp dalam milidetik.
 * @returns {string}
 */
function formatCompletedTimestamp(timestamp) {
  if (!timestamp) { return ""; }
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) { return ""; }
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const day = d.getDate();
  const mon = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${mon} ${year} • ${hours}:${mins} WIB`;
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

/**
 * Memvalidasi tanggal tenggat waktu tugas sekolah (wajib diisi).
 * @param {string} dueDate - Tanggal dalam format YYYY-MM-DD.
 * @returns {string} Pesan error, atau string kosong jika valid.
 */
function validateDueDate(dueDate) {
  if (!dueDate || dueDate.trim().length === 0) {
    return "Tanggal tenggat waktu wajib diisi! 📅";
  }
  return "";
}

/**
 * Memeriksa apakah sudah ada tugas dengan judul yang sama di mata pelajaran yang sama.
 * Bersifat case-insensitive dan mengabaikan spasi berlebih.
 * @param {string} title - Judul tugas.
 * @param {string} subject - Nama mata pelajaran.
 * @param {number|null} [excludeId=null] - ID tugas yang sedang diedit (opsional).
 * @returns {boolean} true jika terdeteksi duplikat.
 */
function isDuplicateTask(title, subject, excludeId = null) {
  if (!title || !subject) { return false; }
  const tNorm = title.trim().toLowerCase();
  const sNorm = subject.trim().toLowerCase();
  return tasks.some((t) =>
    t.id !== excludeId &&
    t.title.trim().toLowerCase() === tNorm &&
    t.subject.trim().toLowerCase() === sNorm
  );
}
