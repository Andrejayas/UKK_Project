/**
 * ==============================================================================
 * Project: To-Do List Website (Latihan Mandiri UKK SMK)
 * Skema  : Asisten Pemrogram Junior (LSP Telematika / BNSP)
 * Penulis: Andrean Rayhan Wijaya
 * ==============================================================================
 * 
 * Pemetaan Unit Kompetensi:
 * 1. J.620100.004.02 - Menggunakan struktur data:
 *    Data task disimpan dalam array of objects: [{ id, title, status }].
 * 2. J.620100.009.01 - Menggunakan spesifikasi program:
 *    Tiap kebutuhan didefinisikan ke fungsi mandiri (single responsibility).
 * 3. J.620100.010.01 - Menerapkan perintah eksekusi bahasa pemrograman:
 *    Manipulasi DOM, penanganan event, perubahan class CSS.
 * 4. J.620100.016.01 - Guidelines dan best practices:
 *    const/let, strict equality (===), 2 spasi indentasi, penamaan semantik.
 * 5. J.620100.017.02 - Pemrograman terstruktur:
 *    Sequence (urutan logis), Selection (if/else), Iteration (forEach).
 * 6. J.620100.025.02 - Debugging:
 *    Validasi input yang aman, bebas error di browser DevTools Console.
 * ==============================================================================
 */

// ==========================================
// 1. STATE & STRUKTUR DATA (J.620100.004.02)
// ==========================================

/**
 * Array utama penyimpan seluruh task.
 * Struktur tiap task: { id: number, title: string, status: 'todo' | 'progress' | 'done' }
 */
let tasks = [];

/**
 * Menyimpan status filter yang sedang aktif: 'all' | 'todo' | 'progress' | 'done'
 */
let currentFilter = "all";

// Kunci penyimpanan localStorage
const STORAGE_KEY = "todo_tasks_data";

// ==========================================
// 2. ELEMEN DOM (Document Object Model)
// ==========================================

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const errorMessage = document.getElementById("errorMessage");
const taskList = document.getElementById("taskList");
const filterButtons = document.querySelectorAll(".filter-btn");
const activeFilterLabel = document.getElementById("activeFilterLabel");

// Elemen badge counter
const countAll = document.getElementById("countAll");
const countTodo = document.getElementById("countTodo");
const countProgress = document.getElementById("countProgress");
const countDone = document.getElementById("countDone");

// =======================================================
// 3. SPESIFIKASI FUNGSI INTI (PRD Bagian 6 & J.620100.009.01)
// =======================================================

/**
 * F6: Validasi Input
 * Memeriksa apakah input valid atau memiliki pesan kesalahan.
 * 
 * Penerapan Selection (if/else):
 * - Judul kosong ditolak
 * - Judul kurang dari 3 karakter ditolak
 * 
 * @param {string} title - Judul yang diinputkan pengguna
 * @returns {string} Pesan error jika tidak valid, atau string kosong jika valid
 */
function validateTitle(title) {
  const trimmed = title.trim();

  // Selection: Memeriksa apakah judul kosong
  if (trimmed === "") {
    return "Judul tugas tidak boleh kosong.";
  }

  // Selection: Memeriksa panjang minimal judul
  if (trimmed.length < 3) {
    return "Judul tugas minimal harus 3 karakter.";
  }

  return "";
}

/**
 * F1: Tambah Task Baru
 * Membuat objek task baru dan menambahkannya ke dalam array.
 * Menggunakan operasi array: push()
 * 
 * @param {string} title - Judul tugas
 */
function addTask(title) {
  const newTask = {
    id: Date.now(),
    title: title.trim(),
    status: "todo"
  };

  // Operasi array: push (menambahkan elemen baru ke akhir array)
  tasks.push(newTask);
  saveToLocalStorage();
}

/**
 * F3: Ubah Status Task
 * Mencari task berdasarkan ID dan memperbarui statusnya.
 * Menggunakan operasi array: find()
 * 
 * @param {number} id - ID unik tugas
 * @param {string} status - Status baru ('todo', 'progress', 'done')
 */
function updateStatus(id, status) {
  // Operasi array: find (mencari elemen yang cocok dengan kriteria)
  const taskToUpdate = tasks.find((task) => task.id === id);

  // Selection: Memastikan task ditemukan sebelum mengubah
  if (taskToUpdate) {
    taskToUpdate.status = status;
    saveToLocalStorage();
  }
}

/**
 * F4: Hapus Task
 * Menghapus task dari array berdasarkan ID.
 * Menggunakan operasi array: filter()
 * 
 * @param {number} id - ID unik tugas
 */
function deleteTask(id) {
  // Operasi array: filter (membuat array baru tanpa item yang dihapus)
  tasks = tasks.filter((task) => task.id !== id);
  saveToLocalStorage();
}

/**
 * F5: Filter Task Berdasarkan Status
 * Mengembalikan seluruh task atau task yang sesuai dengan kriteria filter.
 * Menggunakan operasi array: filter()
 * 
 * @param {string} status - Filter yang dipilih ('all', 'todo', 'progress', 'done')
 * @returns {Array} Daftar task yang sudah difilter
 */
function filterTasks(status) {
  // Selection: Bila filter 'all', kembalikan salinan seluruh array
  if (status === "all") {
    return tasks;
  }

  // Operasi array: filter berdasarkan kesamaan status
  return tasks.filter((task) => task.status === status);
}

/**
 * F2: Menampilkan Daftar Task ke Halaman
 * Mengosongkan tampilan sebelumnya lalu merender ulang task dari list.
 * Menggunakan operasi array: forEach()
 * 
 * @param {Array} list - Daftar task yang akan ditampilkan
 */
function renderTasks(list) {
  // Mengosongkan kontainer daftar sebelum render ulang
  taskList.innerHTML = "";

  // Selection: Tampilkan empty state jika tidak ada task
  if (list.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-state";
    emptyItem.textContent = "Belum ada tugas pada kategori ini.";
    taskList.appendChild(emptyItem);
    updateCounts();
    return;
  }

  // Iteration: forEach untuk mengiterasi setiap task dan membangun elemen DOM
  list.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.status === "done" ? "done" : ""}`;
    li.dataset.id = String(task.id);

    // Helper teks badge
    let statusLabel = "To Do";
    if (task.status === "progress") {
      statusLabel = "In Progress";
    } else if (task.status === "done") {
      statusLabel = "Done";
    }

    // Bagian konten kiri (judul & badge)
    const taskMain = document.createElement("div");
    taskMain.className = "task-main";

    const badge = document.createElement("span");
    badge.className = `status-badge status-${task.status}`;
    badge.textContent = statusLabel;

    const titleSpan = document.createElement("span");
    titleSpan.className = "task-title";
    titleSpan.textContent = task.title;

    taskMain.appendChild(badge);
    taskMain.appendChild(titleSpan);

    // Bagian kontrol kanan (select status, tombol edit, tombol hapus)
    const controls = document.createElement("div");
    controls.className = "task-controls";

    // Dropdown Ubah Status
    const select = document.createElement("select");
    select.className = "status-select";
    select.setAttribute("aria-label", `Ubah status tugas ${task.title}`);

    const optionTodo = new Option("To Do", "todo", false, task.status === "todo");
    const optionProgress = new Option("In Progress", "progress", false, task.status === "progress");
    const optionDone = new Option("Done", "done", false, task.status === "done");

    select.appendChild(optionTodo);
    select.appendChild(optionProgress);
    select.appendChild(optionDone);

    // Event listener: Perubahan status via select
    select.addEventListener("change", (event) => {
      updateStatus(task.id, event.target.value);
      applyFilterAndRender();
    });

    // Fitur Bonus: Tombol Edit Judul
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-sm btn-edit";
    editBtn.textContent = "Edit";
    editBtn.setAttribute("aria-label", `Edit tugas ${task.title}`);
    editBtn.addEventListener("click", () => {
      handleEditTask(task.id, task.title);
    });

    // Tombol Hapus
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-sm btn-delete";
    deleteBtn.textContent = "Hapus";
    deleteBtn.setAttribute("aria-label", `Hapus tugas ${task.title}`);
    deleteBtn.addEventListener("click", () => {
      handleDeleteTask(task.id);
    });

    controls.appendChild(select);
    controls.appendChild(editBtn);
    controls.appendChild(deleteBtn);

    li.appendChild(taskMain);
    li.appendChild(controls);
    taskList.appendChild(li);
  });

  // Perbarui penghitung jumlah tugas
  updateCounts();
}

// ==========================================
// 4. FITUR TAMBAHAN & HELPER LOGIC
// ==========================================

/**
 * Memperbarui tampilan sesuai filter yang sedang aktif
 */
function applyFilterAndRender() {
  const filtered = filterTasks(currentFilter);
  renderTasks(filtered);
}

/**
 * Fitur Bonus: Menghitung jumlah task per kategori
 */
function updateCounts() {
  const total = tasks.length;
  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const progressCount = tasks.filter((t) => t.status === "progress").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  if (countAll) {
    countAll.textContent = String(total);
  }
  if (countTodo) {
    countTodo.textContent = String(todoCount);
  }
  if (countProgress) {
    countProgress.textContent = String(progressCount);
  }
  if (countDone) {
    countDone.textContent = String(doneCount);
  }
}

/**
 * Menampilkan pesan error validasi di layar
 * 
 * @param {string} message - Pesan error yang akan ditampilkan
 */
function showError(message) {
  if (message) {
    errorMessage.textContent = message;
    errorMessage.classList.add("show");
  } else {
    errorMessage.textContent = "";
    errorMessage.classList.remove("show");
  }
}

/**
 * Fitur Bonus: Konfirmasi sebelum menghapus tugas
 * 
 * @param {number} id - ID tugas yang ingin dihapus
 */
function handleDeleteTask(id) {
  const confirmation = confirm("Apakah Anda yakin ingin menghapus tugas ini?");
  if (confirmation) {
    deleteTask(id);
    applyFilterAndRender();
  }
}

/**
 * Fitur Bonus: Edit judul tugas
 * 
 * @param {number} id - ID tugas yang ingin diedit
 * @param {string} currentTitle - Judul saat ini
 */
function handleEditTask(id, currentTitle) {
  const newTitle = window.prompt("Ubah judul tugas:", currentTitle);

  // Jika pengguna membatalkan prompt
  if (newTitle === null) {
    return;
  }

  const validationError = validateTitle(newTitle);
  if (validationError !== "") {
    alert(validationError);
    return;
  }

  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.title = newTitle.trim();
    saveToLocalStorage();
    applyFilterAndRender();
  }
}

/**
 * Fitur Bonus: Menyimpan data task ke localStorage browser
 */
function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.warn("Gagal menyimpan ke localStorage:", error);
  }
}

/**
 * Membaca data task dari localStorage saat inisialisasi aplikasi
 */
function loadFromLocalStorage() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (Array.isArray(parsed)) {
        tasks = parsed;
      }
    }
  } catch (error) {
    console.warn("Gagal memuat dari localStorage:", error);
    tasks = [];
  }
}

// ==========================================
// 5. EVENT LISTENERS (Sequence & Interaksi)
// ==========================================

/**
 * Event: Submit Form Penambahan Task
 */
taskForm.addEventListener("submit", (event) => {
  event.preventDefault(); // Mencegah reload halaman

  const inputValue = taskInput.value;
  const validationResult = validateTitle(inputValue);

  // Selection: Jika validasi gagal, tampilkan pesan error
  if (validationResult !== "") {
    showError(validationResult);
    taskInput.focus();
    return;
  }

  // Jika lolos validasi, bersihkan error dan tambahkan task
  showError("");
  addTask(inputValue);
  taskInput.value = "";
  taskInput.focus();

  // Render ulang daftar tugas
  applyFilterAndRender();
});

/**
 * Event: Realtime clearing pesan error saat pengguna mulai mengetik ulang
 */
taskInput.addEventListener("input", () => {
  if (errorMessage.classList.contains("show")) {
    showError("");
  }
});

/**
 * Event: Filter Buttons
 */
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Perbarui class active pada tombol
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    // Ambil data filter
    currentFilter = button.dataset.filter || "all";

    // Perbarui label status aktif
    const labelMap = {
      all: "Semua",
      todo: "To Do",
      progress: "In Progress",
      done: "Done"
    };
    if (activeFilterLabel) {
      activeFilterLabel.textContent = `Menampilkan: ${labelMap[currentFilter] || currentFilter}`;
    }

    // Render ulang berdasarkan filter yang baru dipilih
    applyFilterAndRender();
  });
});

// ==========================================
// 6. INISIALISASI APLIKASI (Alur Sequence)
// ==========================================
function initApp() {
  // 1. Muat data tersimpan
  loadFromLocalStorage();

  // 2. Render tampilan awal
  applyFilterAndRender();

  // 3. Pasang fungsi ke window (opsional untuk kemudahan pengujian penguji/asesor di Console)
  window.addTask = addTask;
  window.renderTasks = renderTasks;
  window.updateStatus = updateStatus;
  window.deleteTask = deleteTask;
  window.filterTasks = filterTasks;
  window.validateTitle = validateTitle;
  window.tasks = tasks;
}

// Jalankan inisialisasi aplikasi saat script dieksekusi
initApp();
