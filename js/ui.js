/**
 * @file js/ui.js
 * @description Manipulasi antarmuka pengguna (UI): perenderan tabel tugas, kartu metrik,
 *              progress bar mapel, modal (edit, profile, welcome), toast notifikasi,
 *              jam digital topbar, dan navigasi sidebar responsif.
 * @author Andrean Rayhan Wijaya
 */

/* ============================================================
   SECTION 1: APPSHELL & CLOCK
   ============================================================ */

/**
 * Menampilkan tampilan utama aplikasi setelah user login atau menutup modal sambutan.
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
  renderUrgentDeadlineBanner();
  updateAvatarDisplays();
  renderProfileDropdown();
  initClock();
}

/**
 * Menginisialisasi dan memperbarui jam digital di topbar setiap detik secara real-time,
 * serta memperbarui banner peringatan deadline dan status tugas setiap 10 detik.
 * @returns {void}
 */
function initClock() {
  let tickerSeconds = 0;
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

    // Ticker periodik (setiap 10 detik) untuk memeriksa sisa waktu tugas real-time
    tickerSeconds++;
    if (tickerSeconds % 10 === 0) {
      if (typeof renderUrgentDeadlineBanner === "function") {
        renderUrgentDeadlineBanner();
      }
      if (typeof checkTaskDeadlinesNotification === "function") {
        checkTaskDeadlinesNotification();
      }
      const hasPendingDeadlines = tasks.some((t) => t.status !== "done" && t.dueDate);
      const isModalOpen = document.querySelector(".modal-backdrop:not(.hidden)");
      const isTableActive = document.getElementById("taskTableBody")?.contains(document.activeElement);
      if (hasPendingDeadlines && !isModalOpen && !isTableActive) {
        applyFilters();
        renderMetricCards();
      }
    }
  }
  updateClock();
  setInterval(updateClock, 1000);
}

/* ============================================================
   SECTION 2: RENDER DAFTAR TUGAS & KOMPONEN DASHBOARD
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

    /* --- Due date & Completion info --- */
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

    if (task.status === "done") {
      const compBadge = document.createElement("span");
      compBadge.className = "badge completed-badge";
      const compTimeStr = formatCompletedTimestamp(task.completedAt);
      compBadge.textContent = compTimeStr ? `✅ Selesai: ${compTimeStr}` : "✅ Selesai";
      tdDue.appendChild(compBadge);
    } else if (dueStatus) {
      const dueBadge = document.createElement("span");
      dueBadge.className = `badge due-${dueStatus}`;
      if (dueStatus === "urgent") {
        dueBadge.classList.add("pulse-urgent");
        dueBadge.title = "Tenggat waktu mendekati batas! Segera selesaikan tugas ini.";
      }
      dueBadge.textContent = getDueLabel(dueStatus, task.dueDate, task.dueTime);
      tdDue.appendChild(dueBadge);
    }
    tr.appendChild(tdDue);

    /* --- Priority / Difficulty badge --- */
    const tdPriority = document.createElement("td");
    const priBadge = document.createElement("span");
    const priMap = {
      high:   ["priority-high",   "🔴 Tinggi (Sulit)"],
      medium: ["priority-medium", "🟡 Sedang (Normal)"],
      low:    ["priority-low",    "🟢 Rendah (Mudah)"],
    };
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
      openDeleteModal(task.id, task.title);
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
 * Merender banner peringatan tenggat waktu mendesak (tugas yang mendekati deadline <= 60 menit) di dashboard.
 * @returns {void}
 */
function renderUrgentDeadlineBanner() {
  const banner = document.getElementById("urgentDeadlineBanner");
  if (!banner) { return; }

  const urgentTasks = tasks
    .filter((t) => t.status !== "done" && getDueStatus(t.dueDate, t.status, t.dueTime) === "urgent")
    .sort((a, b) => {
      const diffA = getTaskDeadlineDiffMs(a.dueDate, a.dueTime) ?? Infinity;
      const diffB = getTaskDeadlineDiffMs(b.dueDate, b.dueTime) ?? Infinity;
      return diffA - diffB;
    });

  if (urgentTasks.length === 0) {
    banner.classList.add("hidden");
    banner.innerHTML = "";
    return;
  }

  banner.classList.remove("hidden");
  const first = urgentTasks[0];
  const diffMs = getTaskDeadlineDiffMs(first.dueDate, first.dueTime) ?? 0;
  const minsLeft = Math.max(1, Math.ceil(diffMs / 60000));
  const timeNotice = minsLeft <= 1 ? "kurang dari 1 menit lagi" : `${minsLeft} menit lagi`;
  const timeFormatted = first.dueTime ? `pukul ${first.dueTime} WIB` : "hari ini";

  banner.innerHTML = `
    <div class="urgent-banner-inner">
      <div class="urgent-banner-left">
        <div class="urgent-banner-icon-box" aria-hidden="true">
          <svg class="urgent-bell-anim" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <div class="urgent-banner-text">
          <div class="urgent-banner-title-row">
            <span class="urgent-tag">MENDEKATI DEADLINE</span>
            <strong class="urgent-banner-title">Peringatan Tugas Segera Berakhir!</strong>
          </div>
          <p class="urgent-banner-desc">
            Tugas <strong class="urgent-highlight-title">"${escapeHtmlText(first.title)}"</strong> (${escapeHtmlText(first.subject)}) akan berakhir dalam <strong class="urgent-highlight-time">${timeNotice}</strong> (${timeFormatted})!
            ${urgentTasks.length > 1 ? `<span class="urgent-more-count">+${urgentTasks.length - 1} tugas lainnya</span>` : ""}
          </p>
        </div>
      </div>
      <div class="urgent-banner-actions">
        <button type="button" class="btn btn-urgent-action" id="btnQuickCompleteUrgent" title="Tandai tugas ini sebagai selesai">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Selesaikan Sekarang
        </button>
      </div>
    </div>
  `;

  const actionBtn = banner.querySelector("#btnQuickCompleteUrgent");
  if (actionBtn) {
    actionBtn.addEventListener("click", () => {
      updateStatus(first.id, "done");
      if (typeof showToast === "function") {
        showToast(`Tugas "${first.title}" berhasil diselesaikan tepat waktu! 🎉`, "success");
      }
    });
  }
}

/**
 * Escapes HTML characters in string safely.
 * @param {string} str
 * @returns {string}
 */
function escapeHtmlText(str) {
  if (!str) { return ""; }
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
    item.style.cursor = "pointer";
    item.title = `Klik untuk memfilter daftar tugas mata pelajaran "${subj}"`;

    const header = document.createElement("div");
    header.className = "subject-progress-header";

    const nameEl = document.createElement("span");
    nameEl.className = "subject-progress-name";
    nameEl.textContent = subj;

    const detailEl = document.createElement("div");
    detailEl.className = "subject-progress-detail";
    detailEl.innerHTML = `
      <span class="subject-progress-count">${done} dari ${subjTasks.length} selesai</span>
      <span class="subject-progress-pct ${pct === 100 ? "done-100" : ""}">${pct}%</span>
    `;

    header.appendChild(nameEl);
    header.appendChild(detailEl);

    const bg   = document.createElement("div");
    bg.className = "progress-bar-bg";
    const fill = document.createElement("div");
    fill.className = "progress-bar-fill";
    fill.style.width = `${pct}%`;
    if (pct === 100) { fill.style.background = "var(--success)"; }
    bg.appendChild(fill);

    item.appendChild(header);
    item.appendChild(bg);

    /* Interaktivitas: Klik untuk filter daftar tugas sesuai mapel ini */
    item.addEventListener("click", () => {
      const filterSubjEl = document.getElementById("filterSubject");
      if (filterSubjEl) {
        filterSubjEl.value = subj;
        currentFilter.subject = subj;
        applyFilters();
        showToast(`Menampilkan tugas ${subj} 📚`, "info");
      }
    });

    container.appendChild(item);
  });
}

/* ============================================================
   SECTION 3: DROPDOWN & AVATAR RENDERING
   ============================================================ */

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

    if (sel.id === "qaSubject") {
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
  const name = currentUser && currentUser.fullName ? currentUser.fullName : "Siswa";
  const src = currentUser && currentUser.avatar
    ? currentUser.avatar
    : generateAvatarDataUrl(name);

  avatarEls.forEach((el) => {
    el.src = src;
    el.style.objectPosition = "center center";
  });
}

/** State ID tugas yang sedang menunggu konfirmasi hapus */
let pendingDeleteTaskId = null;

/**
 * Membuka modal konfirmasi hapus tugas kustom yang modern.
 * @param {number} taskId - ID tugas yang akan dihapus.
 * @param {string} taskTitle - Judul tugas.
 * @returns {void}
 */
function openDeleteModal(taskId, taskTitle) {
  pendingDeleteTaskId = taskId;
  const modal = document.getElementById("confirmDeleteModal");
  const titleEl = document.getElementById("deleteTaskTitle");
  if (titleEl) {
    titleEl.textContent = `"${taskTitle}"`;
  }
  if (modal) {
    modal.classList.remove("hidden");
  }
}

/**
 * Menutup modal konfirmasi hapus tugas.
 * @returns {void}
 */
function closeDeleteModal() {
  pendingDeleteTaskId = null;
  const modal = document.getElementById("confirmDeleteModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

/**
 * Memperbarui konten profile dropdown (nama, kelas/jurusan, produktivitas).
 * @returns {void}
 */
function renderProfileDropdown() {
  if (!currentUser) { return; }

  const fullName = currentUser.fullName || "Siswa";
  const firstName = fullName.trim().split(/\s+/)[0] || fullName;
  document.getElementById("dropdownName").textContent = fullName;
  document.getElementById("topbarUsername").textContent = firstName;

  const subtitleEl = document.getElementById("dropdownSubtitle");
  if (subtitleEl) {
    const parts = [];
    if (currentUser.kelas && currentUser.kelas.trim()) {
      parts.push(currentUser.kelas.trim());
    }
    if (currentUser.jurusan && currentUser.jurusan.trim()) {
      parts.push(currentUser.jurusan.trim());
    }
    if (parts.length > 0) {
      subtitleEl.textContent = parts.join(" • ");
      subtitleEl.style.display = "block";
    } else {
      subtitleEl.textContent = "";
      subtitleEl.style.display = "none";
    }
  }

  const done  = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

  document.getElementById("dropdownProdBar").style.width = `${pct}%`;
  document.getElementById("dropdownProdPct").textContent = `${pct}%`;
}

/* ============================================================
   SECTION 4: MODALS & DIALOGS
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

  /* Tampilkan timestamp penyelesaian jika status selesai */
  const compGroup = document.getElementById("editCompletedGroup");
  const compInfo  = document.getElementById("editCompletedInfo");
  if (compGroup && compInfo) {
    if (task.status === "done") {
      compGroup.classList.remove("hidden");
      const timeStr = formatCompletedTimestamp(task.completedAt);
      compInfo.innerHTML = `<span>✅ <strong>Tugas Selesai</strong></span> <span class="completed-time-tag">${timeStr || "Waktu otomatis tercatat"}</span>`;
    } else {
      compGroup.classList.add("hidden");
      compInfo.innerHTML = "";
    }
  }

  /* Populate subject dropdown */
  const sel = document.getElementById("editSubject");
  updateSubjectSelects();
  if (task.subject && ![...sel.options].some((o) => o.value === task.subject)) {
    const opt = document.createElement("option");
    opt.value = task.subject;
    opt.textContent = task.subject;
    sel.appendChild(opt);
  }
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
  const fullNameInput = document.getElementById("profileFullName");
  if (fullNameInput) {
    fullNameInput.value = (currentUser && currentUser.fullName) ? currentUser.fullName : "";
  }
  const kelasInput = document.getElementById("profileKelas");
  if (kelasInput) {
    kelasInput.value = (currentUser && currentUser.kelas) ? currentUser.kelas : "";
  }
  const jurusanInput = document.getElementById("profileJurusan");
  if (jurusanInput) {
    jurusanInput.value = (currentUser && currentUser.jurusan) ? currentUser.jurusan : "";
  }
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

/**
 * Membuka modal sambutan untuk pengunjung baru.
 * @returns {void}
 */
function openWelcomeModal() {
  const modal = document.getElementById("welcomeModal");
  if (modal) {
    modal.classList.remove("hidden");
    const input = document.getElementById("welcomeNameInput");
    if (input) {
      setTimeout(() => input.focus(), 150);
    }
  }
}

/**
 * Menutup modal sambutan.
 * @returns {void}
 */
function closeWelcomeModal() {
  const modal = document.getElementById("welcomeModal");
  if (modal) { modal.classList.add("hidden"); }
}

/* ============================================================
   SECTION 5: TOAST NOTIFICATIONS
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
   SECTION 6: VIEW NAVIGATION & SIDEBAR RESPONSIVE
   ============================================================ */

/**
 * Mengkapitalisasi huruf pertama string.
 * @param {string} str - String input.
 * @returns {string} String dengan huruf kapital di awal.
 */
function capitalize(str) {
  if (!str) { return ""; }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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
    if (typeof updateSettingsNotificationUI === "function") {
      updateSettingsNotificationUI();
    }
  } else if (viewName === "dashboard") {
    renderMetricCards();
    renderSubjectProgress();
    renderDonutChart();
    renderWeeklyChart();
    renderUrgentDeadlineBanner();
  }
}

/** @type {boolean} Apakah sidebar desktop sedang collapsed */
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
