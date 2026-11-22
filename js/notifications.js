/**
 * notifications.js - Sistem Notifikasi & Pengingat Tenggat Waktu SchoolTask
 * 
 * Fitur:
 * 1. Web Audio Synthesizer: Nada lonceng lembut (D5 -> A5 -> D6) tanpa file audio eksternal.
 * 2. Web Notification API: Pop-up notifikasi desktop sistem operasi saat mendekati jadwal.
 * 3. Milestone Scheduler: Mengingatkan pada T-30m, T-15m, T-5m, T-1m, dan saat terlambat (tanpa spam berulang).
 * 4. Notification Center: Dropdown lonceng di topbar dengan penghitung badge aktif.
 * 5. Integrasi Pengaturan: Toggle suara & izin notifikasi browser desktop.
 */

const NOTIF_STORAGE_KEYS = {
  SOUND_ENABLED: "schooltask_notif_sound",
  NOTIFIED_MILESTONES: "schooltask_notified_milestones",
};

/**
 * Memutar nada dering lonceng lembut dengan Web Audio API secara murni sintetis.
 * @returns {void}
 */
function playNotificationSound() {
  try {
    const soundEnabled = localStorage.getItem(NOTIF_STORAGE_KEYS.SOUND_ENABLED) !== "false";
    if (!soundEnabled) { return; }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) { return; }

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Oscillator 1: Nada D5 -> A5
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    // Oscillator 2: Nada A5 -> D6
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.28);

    // Volume Gain Envelope: Lembut dan memudar anggun
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.3);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (err) {
    // Browser mungkin memerlukan gestur klik pertama sebelum mengizinkan audio
  }
}

/**
 * Mengambil rekam jejak milestone notifikasi yang sudah terkirim dari sessionStorage.
 * @returns {Object<string, string[]>}
 */
function getNotifiedMilestones() {
  try {
    const raw = sessionStorage.getItem(NOTIF_STORAGE_KEYS.NOTIFIED_MILESTONES);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Mencatat bahwa milestone tertentu telah dikirim untuk tugas tertentu (mencegah spam).
 * @param {number} taskId
 * @param {string} milestone - '30m' | '15m' | '5m' | '1m' | 'overdue'
 */
function recordTaskMilestoneNotified(taskId, milestone) {
  try {
    const current = getNotifiedMilestones();
    const taskKey = String(taskId);
    if (!current[taskKey]) { current[taskKey] = []; }
    if (!current[taskKey].includes(milestone)) {
      current[taskKey].push(milestone);
      sessionStorage.setItem(NOTIF_STORAGE_KEYS.NOTIFIED_MILESTONES, JSON.stringify(current));
    }
  } catch (e) {}
}

/**
 * Memeriksa apakah milestone notifikasi tugas sudah pernah dikirim pada sesi ini.
 * @param {number} taskId
 * @param {string} milestone
 * @returns {boolean}
 */
function hasTaskMilestoneNotified(taskId, milestone) {
  const current = getNotifiedMilestones();
  return Array.isArray(current[String(taskId)]) && current[String(taskId)].includes(milestone);
}

/**
 * Menghapus riwayat milestone tugas saat jadwal atau tenggatnya diubah.
 * @param {number} taskId
 */
function clearTaskMilestones(taskId) {
  try {
    const current = getNotifiedMilestones();
    delete current[String(taskId)];
    sessionStorage.setItem(NOTIF_STORAGE_KEYS.NOTIFIED_MILESTONES, JSON.stringify(current));
  } catch (e) {}
}

/**
 * Mengirimkan notifikasi gabungan (Suara + Toast + Desktop Push Notification).
 * @param {Object} task
 * @param {string} milestoneKey
 * @param {string} title
 * @param {string} body
 */
function sendNotificationAlert(task, milestoneKey, title, body) {
  // 1. Putar suara lonceng
  playNotificationSound();

  // 2. In-App Toast
  if (typeof showToast === "function") {
    showToast(body, milestoneKey === "overdue" ? "error" : "warning");
  }

  // 3. Desktop Native Push Notification
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const notif = new Notification(title, {
        body,
        tag: `task-${task.id}-${milestoneKey}`,
        renotify: true,
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {
      console.warn("Desktop notification error:", e);
    }
  }

  // 4. Rekam milestone agar tidak berulang
  recordTaskMilestoneNotified(task.id, milestoneKey);

  // 5. Perbarui status lonceng notifikasi di topbar
  renderNotificationCenter();
}

/**
 * Memeriksa seluruh tugas secara berkala untuk mendeteksi yang mendekati tenggat waktu.
 * Dipanggil setiap 10 detik oleh ticker jam.
 * @returns {void}
 */
function checkTaskDeadlinesNotification() {
  if (typeof tasks === "undefined" || !Array.isArray(tasks) || tasks.length === 0) {
    renderNotificationCenter();
    return;
  }

  tasks.forEach((task) => {
    if (task.status === "done" || !task.dueDate) { return; }

    const diffMs = typeof getTaskDeadlineDiffMs === "function" ? getTaskDeadlineDiffMs(task.dueDate, task.dueTime) : null;
    if (diffMs === null) { return; }

    const minsLeft = Math.ceil(diffMs / 60000);
    const timeFormatted = task.dueTime ? `pukul ${task.dueTime} WIB` : "hari ini";

    // Milestone 1: 30 menit sebelum deadline (antara 16 - 30 menit)
    if (minsLeft > 15 && minsLeft <= 30 && !hasTaskMilestoneNotified(task.id, "30m")) {
      sendNotificationAlert(
        task,
        "30m",
        "SchoolTask - Pengingat 30 Menit",
        `⏰ Tugas "${task.title}" (${task.subject}) akan berakhir dalam ${minsLeft} menit lagi (${timeFormatted})!`
      );
    }
    // Milestone 2: 15 menit sebelum deadline (antara 6 - 15 menit)
    else if (minsLeft > 5 && minsLeft <= 15 && !hasTaskMilestoneNotified(task.id, "15m")) {
      sendNotificationAlert(
        task,
        "15m",
        "SchoolTask - Peringatan 15 Menit",
        `⚠️ Tugas "${task.title}" (${task.subject}) tersisa ${minsLeft} menit lagi (${timeFormatted})!`
      );
    }
    // Milestone 3: 5 menit sebelum deadline (antara 2 - 5 menit)
    else if (minsLeft > 1 && minsLeft <= 5 && !hasTaskMilestoneNotified(task.id, "5m")) {
      sendNotificationAlert(
        task,
        "5m",
        "SchoolTask - 🚨 5 Menit Lagi!",
        `🚨 Segera selesaikan! Tugas "${task.title}" (${task.subject}) tersisa ${minsLeft} menit lagi!`
      );
    }
    // Milestone 4: 1 menit sebelum deadline (<= 1 menit)
    else if (minsLeft >= 0 && minsLeft <= 1 && !hasTaskMilestoneNotified(task.id, "1m")) {
      sendNotificationAlert(
        task,
        "1m",
        "SchoolTask - 🚨 Waktu Hampir Habis!",
        `⚠️ Tugas "${task.title}" (${task.subject}) akan berakhir dalam 1 menit lagi!`
      );
    }
    // Milestone 5: Baru saja melewati tenggat (dalam kurun 30 menit pertama keterlambatan)
    else if (diffMs < 0 && diffMs >= -30 * 60 * 1000 && !hasTaskMilestoneNotified(task.id, "overdue")) {
      sendNotificationAlert(
        task,
        "overdue",
        "SchoolTask - Waktu Tenggat Habis",
        `🚨 Batas waktu tugas "${task.title}" (${task.subject}) telah terlewat (Terlambat)!`
      );
    }
  });

  renderNotificationCenter();
}

/**
 * Merender daftar tugas yang mendekati batas waktu atau terlambat pada panel dropdown lonceng notifikasi.
 * @returns {void}
 */
function renderNotificationCenter() {
  const badgeEl = document.getElementById("notifBadge");
  const bellBtn = document.getElementById("topbarNotifBtn");
  const listContainer = document.getElementById("notifListContainer");
  const enableDesktopBtn = document.getElementById("notifEnableDesktopBtn");
  const desktopBtnText = document.getElementById("notifDesktopBtnText");

  // Perbarui status tombol desktop notification
  if (enableDesktopBtn && desktopBtnText) {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        enableDesktopBtn.classList.add("active");
        desktopBtnText.textContent = "✔ Desktop Aktif";
      } else if (Notification.permission === "denied") {
        enableDesktopBtn.classList.remove("active");
        desktopBtnText.textContent = "❌ Izin Diblokir";
      } else {
        enableDesktopBtn.classList.remove("active");
        desktopBtnText.textContent = "Aktifkan Desktop";
      }
    } else {
      enableDesktopBtn.style.display = "none";
    }
  }

  if (typeof tasks === "undefined" || !Array.isArray(tasks)) { return; }

  // Ambil tugas yang belum selesai dan memiliki tenggat hari ini, mendesak, atau terlambat
  const activeAlertTasks = tasks
    .filter((t) => {
      if (t.status === "done" || !t.dueDate) { return false; }
      const diffMs = typeof getTaskDeadlineDiffMs === "function" ? getTaskDeadlineDiffMs(t.dueDate, t.dueTime) : null;
      if (diffMs === null) { return false; }
      // Terlambat, atau sisa waktu <= 120 menit (2 jam)
      return diffMs <= 120 * 60 * 1000;
    })
    .sort((a, b) => {
      const diffA = typeof getTaskDeadlineDiffMs === "function" ? getTaskDeadlineDiffMs(a.dueDate, a.dueTime) ?? Infinity : 0;
      const diffB = typeof getTaskDeadlineDiffMs === "function" ? getTaskDeadlineDiffMs(b.dueDate, b.dueTime) ?? Infinity : 0;
      return diffA - diffB;
    });

  // Perbarui badge lonceng
  if (badgeEl && bellBtn) {
    if (activeAlertTasks.length > 0) {
      badgeEl.textContent = activeAlertTasks.length > 9 ? "9+" : activeAlertTasks.length;
      badgeEl.classList.remove("hidden");
      bellBtn.classList.add("has-unread");
    } else {
      badgeEl.classList.add("hidden");
      bellBtn.classList.remove("has-unread");
    }
  }

  // Render list dalam dropdown
  if (!listContainer) { return; }

  if (activeAlertTasks.length === 0) {
    listContainer.innerHTML = `
      <div class="notif-empty-state">
        <span class="notif-empty-icon">🎉</span>
        <p><strong>Semua Jadwal Aman!</strong></p>
        <p>Tidak ada tugas yang mendekati batas waktu saat ini.</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = "";
  activeAlertTasks.forEach((task) => {
    const diffMs = typeof getTaskDeadlineDiffMs === "function" ? getTaskDeadlineDiffMs(task.dueDate, task.dueTime) ?? 0 : 0;
    const isOverdue = diffMs < 0;
    const minsLeft = Math.max(1, Math.ceil(diffMs / 60000));

    const item = document.createElement("div");
    item.className = `notif-item ${isOverdue ? "overdue" : "urgent"}`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "notif-item-content";

    const topDiv = document.createElement("div");
    topDiv.className = "notif-item-top";

    const subjBadge = typeof createSubjectBadge === "function"
      ? createSubjectBadge(task.subject)
      : document.createElement("span");
    if (!subjBadge.textContent) { subjBadge.textContent = task.subject; }

    const titleSpan = document.createElement("span");
    titleSpan.className = "notif-item-title";
    titleSpan.textContent = task.title;

    topDiv.appendChild(subjBadge);
    topDiv.appendChild(titleSpan);

    const timeSpan = document.createElement("span");
    timeSpan.className = "notif-item-time";
    if (isOverdue) {
      timeSpan.textContent = `🚨 Terlambat • Tenggat: ${task.dueTime || "23:59"} WIB`;
    } else if (minsLeft <= 1) {
      timeSpan.textContent = `⚠️ Kurang dari 1 menit lagi (${task.dueTime || "23:59"} WIB)`;
    } else {
      timeSpan.textContent = `⚠️ Tersisa ${minsLeft} menit lagi (${task.dueTime || "23:59"} WIB)`;
    }

    contentDiv.appendChild(topDiv);
    contentDiv.appendChild(timeSpan);

    const completeBtn = document.createElement("button");
    completeBtn.type = "button";
    completeBtn.className = "btn-notif-complete";
    completeBtn.innerHTML = "✔ Selesai";
    completeBtn.title = `Tandai tugas "${task.title}" sebagai selesai`;
    completeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof updateStatus === "function") {
        updateStatus(task.id, "done");
        if (typeof showToast === "function") {
          showToast(`Tugas "${task.title}" berhasil diselesaikan! 🎉`, "success");
        }
      }
    });

    item.appendChild(contentDiv);
    item.appendChild(completeBtn);
    listContainer.appendChild(item);
  });
}

/**
 * Meminta izin notifikasi desktop sistem ke user melalui Web Notification API.
 * @param {Function} [onComplete]
 */
function requestDesktopNotificationPermission(onComplete) {
  if (!("Notification" in window)) {
    if (typeof showToast === "function") {
      showToast("Browser Anda tidak mendukung notifikasi desktop.", "warning");
    }
    return;
  }

  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      playNotificationSound();
      if (typeof showToast === "function") {
        showToast("Notifikasi desktop browser berhasil diaktifkan! 🔔", "success");
      }
      try {
        new Notification("SchoolTask", {
          body: "Notifikasi desktop aktif! Anda akan menerima peringatan saat tugas mendekati deadline.",
          tag: "schooltask-welcome",
        });
      } catch (e) {}
    } else if (permission === "denied") {
      if (typeof showToast === "function") {
        showToast("Izin notifikasi ditolak oleh browser. Anda dapat mengaktifkannya di pengaturan situs browser.", "warning");
      }
    }
    renderNotificationCenter();
    updateSettingsNotificationUI();
    if (typeof onComplete === "function") { onComplete(permission); }
  });
}

/**
 * Memperbarui tampilan opsi notifikasi di halaman Pengaturan (Settings View).
 */
function updateSettingsNotificationUI() {
  const permDesc = document.getElementById("notifPermissionStatus");
  const toggleBtn = document.getElementById("btnToggleDesktopNotif");
  const soundCheckbox = document.getElementById("chkNotifSound");

  if (soundCheckbox) {
    soundCheckbox.checked = localStorage.getItem(NOTIF_STORAGE_KEYS.SOUND_ENABLED) !== "false";
  }

  if (permDesc && toggleBtn) {
    if (!("Notification" in window)) {
      permDesc.textContent = "Browser Anda tidak mendukung Web Notification API.";
      toggleBtn.disabled = true;
      toggleBtn.textContent = "Tidak Didukung";
      return;
    }

    if (Notification.permission === "granted") {
      permDesc.innerHTML = `<span style="color:#4ade80; font-weight:600;">✔ Notifikasi Desktop Aktif</span> — Anda akan menerima notifikasi pop-up sistem saat tugas mendekati tenggat waktu.`;
      toggleBtn.textContent = "Aktif (Uji Coba)";
      toggleBtn.className = "btn btn-secondary";
    } else if (Notification.permission === "denied") {
      permDesc.innerHTML = `<span style="color:#f87171; font-weight:600;">❌ Izin Diblokir</span> — Izin dinonaktifkan di peramban. Silakan klik ikon gembok di bilah alamat browser untuk mengizinkannya.`;
      toggleBtn.textContent = "Izin Diblokir";
      toggleBtn.className = "btn btn-danger";
    } else {
      permDesc.textContent = "Munculkan notifikasi pop-up di desktop sistem saat tugas mendekati deadline (30m, 15m, 5m, 1m).";
      toggleBtn.textContent = "Izinkan Notifikasi";
      toggleBtn.className = "btn btn-primary";
    }
  }
}

/**
 * Menginisialisasi event listener dan status awal untuk fitur notifikasi.
 */
function initNotifications() {
  const notifBtn = document.getElementById("topbarNotifBtn");
  const notifDropdown = document.getElementById("notifDropdown");
  const enableDesktopBtn = document.getElementById("notifEnableDesktopBtn");
  const testChimeBtn = document.getElementById("btnTestChimeSound");
  const toggleDesktopBtn = document.getElementById("btnToggleDesktopNotif");
  const soundCheckbox = document.getElementById("chkNotifSound");

  // Toggle dropdown lonceng
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = notifDropdown.classList.contains("hidden");
      // Tutup dropdown lain
      document.getElementById("profileDropdown")?.classList.add("hidden");
      document.getElementById("calendarPopup")?.classList.add("hidden");

      if (isHidden) {
        notifDropdown.classList.remove("hidden");
        notifBtn.setAttribute("aria-expanded", "true");
        renderNotificationCenter();
      } else {
        notifDropdown.classList.add("hidden");
        notifBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Tutup dropdown saat klik di luar
  document.addEventListener("click", (e) => {
    if (notifDropdown && !notifDropdown.contains(e.target) && !notifBtn?.contains(e.target)) {
      notifDropdown.classList.add("hidden");
      notifBtn?.setAttribute("aria-expanded", "false");
    }
  });

  // Tombol Aktifkan Desktop di dalam panel lonceng
  if (enableDesktopBtn) {
    enableDesktopBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      requestDesktopNotificationPermission();
    });
  }

  // Tombol di Halaman Pengaturan (Settings)
  if (toggleDesktopBtn) {
    toggleDesktopBtn.addEventListener("click", () => {
      requestDesktopNotificationPermission();
    });
  }

  if (testChimeBtn) {
    testChimeBtn.addEventListener("click", () => {
      playNotificationSound();
      if (typeof showToast === "function") {
        showToast("🔔 Nada lonceng pengingat berhasil dibunyikan!", "info");
      }
    });
  }

  if (soundCheckbox) {
    soundCheckbox.addEventListener("change", () => {
      localStorage.setItem(NOTIF_STORAGE_KEYS.SOUND_ENABLED, soundCheckbox.checked ? "true" : "false");
      if (soundCheckbox.checked) {
        playNotificationSound();
      }
    });
  }

  // Jalankan pemeriksaan awal
  checkTaskDeadlinesNotification();
  updateSettingsNotificationUI();
}

// Inisialisasi otomatis saat script dimuat
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNotifications);
} else {
  initNotifications();
}
