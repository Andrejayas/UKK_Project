/**
 * @file js/calendar.js
 * @description Widget Kalender Interaktif & Jadwal Hari Libur Nasional & Cuti Bersama (2026 - 2027)
 *              mengadopsi estetika Linux Desktop Shell (Hyprland / Aylur's GTK Shell style)
 *              dengan fitur deteksi tanggal hari ini, hari libur mendatang, dan countdown otomatis.
 * @author Andre 
 */

/* ============================================================
   SECTION 1: DAFTAR HARI LIBUR NASIONAL & CUTI BERSAMA (2026 - 2027)
   ============================================================ */

/**
 * Data resmi Hari Libur Nasional dan Cuti Bersama Republik Indonesia (SKB 3 Menteri)
 * untuk sisa tahun 2026 dan seluruh tahun 2027.
 * @type {Array<{date: string, name: string, type: 'national'|'cuti'}>}
 */
const INDONESIA_HOLIDAYS = [
  /* --- TAHUN 2026 --- */
  { date: "2026-01-01", name: "Tahun Baru 2026 Masehi", type: "national" },
  { date: "2026-01-16", name: "Isra Mikraj Nabi Muhammad SAW", type: "national" },
  { date: "2026-02-17", name: "Tahun Baru Imlek 2577 Kongzili", type: "national" },
  { date: "2026-03-19", name: "Hari Suci Nyepi (Tahun Baru Saka 1948)", type: "national" },
  { date: "2026-03-21", name: "Hari Raya Idul Fitri 1447 H (Hari ke-1)", type: "national" },
  { date: "2026-03-22", name: "Hari Raya Idul Fitri 1447 H (Hari ke-2)", type: "national" },
  { date: "2026-03-23", name: "Cuti Bersama Hari Raya Idul Fitri 1447 H", type: "cuti" },
  { date: "2026-03-24", name: "Cuti Bersama Hari Raya Idul Fitri 1447 H", type: "cuti" },
  { date: "2026-04-03", name: "Wafat Isa Almasih (Jumat Agung)", type: "national" },
  { date: "2026-05-01", name: "Hari Buruh Internasional", type: "national" },
  { date: "2026-05-14", name: "Kenaikan Isa Almasih", type: "national" },
  { date: "2026-05-27", name: "Hari Raya Idul Adha 1447 H", type: "national" },
  { date: "2026-05-31", name: "Hari Raya Waisak 2570 BE", type: "national" },
  { date: "2026-06-01", name: "Hari Lahir Pancasila", type: "national" },
  { date: "2026-06-16", name: "Tahun Baru Islam 1448 Hijriah", type: "national" },
  { date: "2026-08-17", name: "Hari Kemerdekaan RI (HUT RI ke-81)", type: "national" },
  { date: "2026-08-25", name: "Maulid Nabi Muhammad SAW", type: "national" },
  { date: "2026-12-24", name: "Cuti Bersama Hari Raya Natal", type: "cuti" },
  { date: "2026-12-25", name: "Hari Raya Natal", type: "national" },

  /* --- TAHUN 2027 (Lengkap Sepanjang Tahun) --- */
  { date: "2027-01-01", name: "Tahun Baru 2027 Masehi", type: "national" },
  { date: "2027-01-16", name: "Isra Mikraj Nabi Muhammad SAW", type: "national" },
  { date: "2027-02-06", name: "Tahun Baru Imlek 2578 Kongzili", type: "national" },
  { date: "2027-02-08", name: "Cuti Bersama Tahun Baru Imlek 2578", type: "cuti" },
  { date: "2027-03-08", name: "Cuti Bersama Hari Suci Nyepi", type: "cuti" },
  { date: "2027-03-09", name: "Hari Suci Nyepi (Tahun Baru Saka 1949)", type: "national" },
  { date: "2027-03-22", name: "Cuti Bersama Hari Raya Idul Fitri 1448 H", type: "cuti" },
  { date: "2027-03-23", name: "Hari Raya Idul Fitri 1448 H (Hari ke-1)", type: "national" },
  { date: "2027-03-24", name: "Hari Raya Idul Fitri 1448 H (Hari ke-2)", type: "national" },
  { date: "2027-03-25", name: "Cuti Bersama Hari Raya Idul Fitri 1448 H", type: "cuti" },
  { date: "2027-03-26", name: "Wafat Isa Almasih (Jumat Agung)", type: "national" },
  { date: "2027-05-01", name: "Hari Buruh Internasional", type: "national" },
  { date: "2027-05-06", name: "Kenaikan Isa Almasih", type: "national" },
  { date: "2027-05-07", name: "Cuti Bersama Kenaikan Isa Almasih", type: "cuti" },
  { date: "2027-05-20", name: "Hari Raya Waisak 2571 BE", type: "national" },
  { date: "2027-05-21", name: "Cuti Bersama Hari Raya Waisak 2571", type: "cuti" },
  { date: "2027-06-01", name: "Hari Lahir Pancasila", type: "national" },
  { date: "2027-06-16", name: "Hari Raya Idul Adha 1448 H", type: "national" },
  { date: "2027-06-17", name: "Cuti Bersama Hari Raya Idul Adha 1448 H", type: "cuti" },
  { date: "2027-07-07", name: "Tahun Baru Islam 1449 Hijriah", type: "national" },
  { date: "2027-08-17", name: "Hari Kemerdekaan RI (HUT RI ke-82)", type: "national" },
  { date: "2027-09-15", name: "Maulid Nabi Muhammad SAW", type: "national" },
  { date: "2027-12-24", name: "Cuti Bersama Hari Raya Natal", type: "cuti" },
  { date: "2027-12-25", name: "Hari Raya Natal", type: "national" },
];

/* ============================================================
   SECTION 2: STATE KALENDER
   ============================================================ */

const calendarState = {
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(), // 0 = Jan, 10 = Nov
  selectedDate: getTodayString(),
  isOpen: false,
  closeTimer: null,
};

const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const DAY_NAMES_FULL_ID = [
  "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu",
];

/* ============================================================
   SECTION 3: HELPER PENCARIAN & PERHITUNGAN HARI LIBUR
   ============================================================ */

/**
 * Mencari hari libur pada tanggal tertentu (format YYYY-MM-DD).
 * @param {string} dateStr - Tanggal dalam format YYYY-MM-DD.
 * @returns {Object|null}
 */
function getHolidayForDate(dateStr) {
  return INDONESIA_HOLIDAYS.find((h) => h.date === dateStr) || null;
}

/**
 * Menghitung selisih hari antara tanggal target dengan hari ini.
 * @param {string} targetDateStr - Format YYYY-MM-DD.
 * @returns {number} Selisih hari (positif jika di masa depan).
 */
function getDaysDiffFromToday(targetDateStr) {
  const todayStr = getTodayString();
  const [ty, tm, td] = todayStr.split("-").map(Number);
  const [gy, gm, gd] = targetDateStr.split("-").map(Number);

  const tDate = new Date(ty, tm - 1, td);
  const gDate = new Date(gy, gm - 1, gd);

  const diffMs = gDate.getTime() - tDate.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Mendapatkan daftar hari libur mendatang mulai dari hari ini.
 * @returns {Array<Object & {daysLeft: number}>}
 */
function getUpcomingHolidays() {
  const todayStr = getTodayString();
  return INDONESIA_HOLIDAYS
    .filter((h) => h.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((h) => ({
      ...h,
      daysLeft: getDaysDiffFromToday(h.date),
    }));
}

/* ============================================================
   SECTION 4: RENDERING KALENDER & GRID TANGGAL
   ============================================================ */

/**
 * Merender grid kalender sesuai bulan dan tahun aktif.
 * Menggunakan susunan 7 kolom (Senin hingga Minggu) persis seperti Linux desktop rice.
 * @param {number} year - Tahun (misal: 2026).
 * @param {number} month - Indeks bulan 0..11.
 * @returns {void}
 */
function renderCalendar(year, month) {
  calendarState.viewYear = year;
  calendarState.viewMonth = month;

  /* 1. Perbarui Judul Header Bulan & Tahun */
  const titleEl = document.getElementById("calMonthYearTitle");
  if (titleEl) {
    titleEl.textContent = `${MONTH_NAMES_ID[month]} ${year}`;
  }

  /* 2. Bersihkan Grid & Picu Animasi Transisi Halus */
  const gridEl = document.getElementById("calGrid");
  if (!gridEl) { return; }
  gridEl.innerHTML = "";
  gridEl.classList.remove("animating");
  void gridEl.offsetWidth; // Reflow untuk memicu keyframe animation
  gridEl.classList.add("animating");

  const todayStr = getTodayString();

  /* 3. Hitung hari pertama bulan ini (Konversi ke Senin-based: 0 = Mo, ..., 6 = Su) */
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayMoBased = (firstDayOfMonth.getDay() + 6) % 7; // Sunday (0) -> 6, Monday (1) -> 0

  /* Jumlah hari di bulan ini */
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

  /* Jumlah hari di bulan sebelumnya */
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  /* 4. Render Tanggal Ekor Bulan Sebelumnya (Dimmed) */
  for (let i = startDayMoBased - 1; i >= 0; i--) {
    const prevDayNum = daysInPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, prevDayNum);
    const pYear = prevMonthDate.getFullYear();
    const pMonth = String(prevMonthDate.getMonth() + 1).padStart(2, "0");
    const pDay = String(prevDayNum).padStart(2, "0");
    const cellDateStr = `${pYear}-${pMonth}-${pDay}`;

    const cell = createCalendarCell(prevDayNum, cellDateStr, true, false);
    gridEl.appendChild(cell);
  }

  /* 5. Render Hari-hari di Bulan Aktif */
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const mStr = String(month + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    const cellDateStr = `${year}-${mStr}-${dStr}`;

    const isToday = cellDateStr === todayStr;
    const cell = createCalendarCell(day, cellDateStr, false, isToday);
    gridEl.appendChild(cell);
  }

  /* 6. Render Tanggal Awal Bulan Berikutnya (Padded ke kelipatan 7: 35 atau 42) */
  const totalRendered = startDayMoBased + daysInCurrentMonth;
  const remainingCells = totalRendered % 7 === 0 ? 0 : 7 - (totalRendered % 7);
  for (let nextDay = 1; nextDay <= remainingCells; nextDay++) {
    const nextMonthDate = new Date(year, month + 1, nextDay);
    const nYear = nextMonthDate.getFullYear();
    const nMonth = String(nextMonthDate.getMonth() + 1).padStart(2, "0");
    const nDay = String(nextDay).padStart(2, "0");
    const cellDateStr = `${nYear}-${nMonth}-${nDay}`;

    const cell = createCalendarCell(nextDay, cellDateStr, true, false);
    gridEl.appendChild(cell);
  }

  /* 7. Perbarui Panel Status Hari Terpilih */
  updateSelectedDayPanel(calendarState.selectedDate);
}

/**
 * Membuat elemen tombol cell tanggal untuk grid kalender.
 * @param {number} dayNumber - Nomor hari (1..31).
 * @param {string} dateStr - Format YYYY-MM-DD.
 * @param {boolean} isOtherMonth - Apakah tanggal ini milik bulan sebelum/sesudahnya.
 * @param {boolean} isToday - Apakah tanggal ini hari ini.
 * @returns {HTMLDivElement}
 */
function createCalendarCell(dayNumber, dateStr, isOtherMonth, isToday) {
  const cell = document.createElement("div");
  cell.className = "cal-cell";
  cell.textContent = String(dayNumber);
  cell.dataset.date = dateStr;

  /* Hari Minggu (Sunday column) */
  const [y, m, d] = dateStr.split("-").map(Number);
  const cellDateObj = new Date(y, m - 1, d);
  const isSunday = cellDateObj.getDay() === 0;

  if (isOtherMonth) {
    cell.classList.add("other-month");
  }
  if (isSunday) {
    cell.classList.add("is-sunday");
  }
  if (isToday) {
    cell.classList.add("is-today");
  }
  if (dateStr === calendarState.selectedDate) {
    cell.classList.add("is-selected");
  }

  /* Cek Hari Libur & Tugas Sekolah */
  const holiday = getHolidayForDate(dateStr);
  const hasTasks = typeof tasks !== "undefined" && tasks.some((t) => t.dueDate === dateStr);

  if (holiday || hasTasks) {
    const dotContainer = document.createElement("div");
    dotContainer.className = "cal-dot-container";

    if (holiday) {
      const hDot = document.createElement("span");
      hDot.className = "cal-dot holiday-dot";
      hDot.title = holiday.name;
      dotContainer.appendChild(hDot);
    }
    if (hasTasks) {
      const tDot = document.createElement("span");
      tDot.className = "cal-dot task-dot";
      tDot.title = "Ada tugas tenggat hari ini";
      dotContainer.appendChild(tDot);
    }
    cell.appendChild(dotContainer);
  }

  /* Klik untuk memilih tanggal */
  cell.addEventListener("click", () => {
    calendarState.selectedDate = dateStr;

    /* Jika mengklik tanggal dari bulan lain, otomatis pindah ke bulan tersebut */
    if (isOtherMonth) {
      calendarState.viewYear = cellDateObj.getFullYear();
      calendarState.viewMonth = cellDateObj.getMonth();
      renderCalendar(calendarState.viewYear, calendarState.viewMonth);
    } else {
      document.querySelectorAll(".cal-cell.is-selected").forEach((c) => c.classList.remove("is-selected"));
      cell.classList.add("is-selected");
      updateSelectedDayPanel(dateStr);
    }
  });

  return cell;
}

/* ============================================================
   SECTION 5: SELECTED DAY STATUS & UPCOMING HOLIDAYS PANEL
   ============================================================ */

/**
 * Memformat string YYYY-MM-DD menjadi hari dan tanggal lengkap Indonesia.
 * Contoh: "Minggu, 15 November 2026".
 * @param {string} dateStr - Format YYYY-MM-DD.
 * @returns {string}
 */
function formatFullDateIndonesian(dateStr) {
  if (!dateStr) { return "—"; }
  const [y, m, d] = dateStr.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayName = DAY_NAMES_FULL_ID[dateObj.getDay()];
  const monthName = MONTH_NAMES_ID[m - 1];
  return `${dayName}, ${d} ${monthName} ${y}`;
}

/**
 * Memperbarui panel status tanggal di bagian bawah kartu kalender (persis tampilan desktop Linux).
 * @param {string} dateStr - Tanggal yang dipilih (YYYY-MM-DD).
 * @returns {void}
 */
function updateSelectedDayPanel(dateStr) {
  const nameEl  = document.getElementById("calSelectedDayName");
  const badgeEl = document.getElementById("calSelectedDayBadge");
  const descEl  = document.getElementById("calSelectedDayDesc");
  const tasksEl = document.getElementById("calSelectedDayTasks");

  if (!nameEl || !badgeEl || !descEl) { return; }

  nameEl.textContent = formatFullDateIndonesian(dateStr);

  const todayStr = getTodayString();
  const isToday  = dateStr === todayStr;
  const holiday  = getHolidayForDate(dateStr);

  /* Reset kelas badge */
  badgeEl.className = "linux-cal-badge-pill";

  if (holiday) {
    badgeEl.textContent = holiday.type === "cuti" ? "Cuti Bersama" : "Libur Nasional";
    badgeEl.classList.add("is-holiday");
    descEl.textContent = `🔴 ${holiday.name}`;
  } else if (isToday) {
    badgeEl.textContent = "Hari Ini";
    badgeEl.classList.add("is-today-badge");
    descEl.textContent = "Hari efektif sekolah • Tidak ada hari libur nasional.";
  } else {
    badgeEl.textContent = "Hari Efektif";
    descEl.textContent = "Hari efektif belajar mengajar • Tidak ada hari libur nasional.";
  }

  /* Tampilkan tugas sekolah jika ada pada tanggal ini */
  if (tasksEl) {
    const dueTasks = typeof tasks !== "undefined" ? tasks.filter((t) => t.dueDate === dateStr) : [];
    if (dueTasks.length > 0) {
      tasksEl.classList.remove("hidden");
      tasksEl.innerHTML = `
        <div style="font-size:0.75rem; font-weight:700; color:var(--accent); margin-bottom:4px;">
          📚 ${dueTasks.length} Tugas Sekolah pada tanggal ini:
        </div>
      `;
      dueTasks.forEach((t) => {
        const item = document.createElement("div");
        item.className = "linux-cal-task-item";
        item.innerHTML = `
          <span class="linux-cal-task-bullet"></span>
          <span><strong>${t.title}</strong> (${t.subject}) ${t.dueTime ? `• 🕒 ${t.dueTime}` : ""}</span>
        `;
        tasksEl.appendChild(item);
      });
    } else {
      tasksEl.classList.add("hidden");
      tasksEl.innerHTML = "";
    }
  }
}

/**
 * Memperbarui badge kalender di topbar dengan tanggal aktif dan info libur terdekat.
 * @returns {void}
 */
function updateTopbarCalendarBadge() {
  const pillEl = document.getElementById("topbarHolidayPill");

  if (pillEl) {
    const upcoming = getUpcomingHolidays();
    if (upcoming.length > 0) {
      const nextH = upcoming[0];
      let cleanName = nextH.name;
      cleanName = cleanName.replace(/^Cuti Bersama Hari Raya\s+/i, "Cuti ");
      cleanName = cleanName.replace(/^Cuti Bersama\s+/i, "Cuti ");
      cleanName = cleanName.replace(/^Hari Raya\s+/i, "");
      cleanName = cleanName.replace(/^Hari Suci\s+/i, "");
      cleanName = cleanName.replace(/\s*\(.*?\)/g, "");
      cleanName = cleanName.replace(/\s+Masehi$/i, "");
      cleanName = cleanName.trim();
      if (cleanName.length > 16) {
        cleanName = cleanName.slice(0, 15) + "…";
      }

      if (nextH.daysLeft === 0) {
        pillEl.textContent = `🎉 Libur: ${cleanName}`;
      } else {
        pillEl.textContent = `${nextH.daysLeft}h ${cleanName}`;
      }
      pillEl.title = `Libur terdekat: ${nextH.name} (${formatFullDateIndonesian(nextH.date)}) – ${nextH.daysLeft} hari lagi`;
    } else {
      pillEl.textContent = "Kalender";
    }
  }
}

/* ============================================================
   SECTION 6: POPUP CONTROLS & EVENT LISTENERS
   ============================================================ */

/**
 * Membuka popup kalender.
 * @returns {void}
 */
function openCalendarPopup() {
  const popup = document.getElementById("calendarPopup");
  const btn   = document.getElementById("topbarCalendarBtn");
  if (!popup) { return; }

  clearTimeout(calendarState.closeTimer);
  calendarState.isOpen = true;
  popup.classList.remove("hidden");
  if (btn) {
    btn.classList.add("active");
    btn.setAttribute("aria-expanded", "true");
  }

  /* Render ulang data kalender */
  renderCalendar(calendarState.viewYear, calendarState.viewMonth);
}

/**
 * Menutup popup kalender.
 * @returns {void}
 */
function closeCalendarPopup() {
  const popup = document.getElementById("calendarPopup");
  const btn   = document.getElementById("topbarCalendarBtn");
  if (!popup) { return; }

  calendarState.isOpen = false;
  popup.classList.add("hidden");
  if (btn) {
    btn.classList.remove("active");
    btn.setAttribute("aria-expanded", "false");
  }
}

/**
 * Mengatur timer penutupan saat kursor meninggalkan area kalender (dengan jeda halus).
 * @returns {void}
 */
function scheduleCloseCalendar() {
  clearTimeout(calendarState.closeTimer);
  calendarState.closeTimer = setTimeout(() => {
    closeCalendarPopup();
  }, 280);
}

/**
 * Membatalkan timer penutupan kalender saat kursor kembali mendekat.
 * @returns {void}
 */
function cancelCloseCalendar() {
  clearTimeout(calendarState.closeTimer);
}

/**
 * Menginisialisasi seluruh event listener kalender & hari libur.
 * Mendukung pembukaan otomatis saat kursor mouse mendekat (hover) maupun saat diklik.
 * @returns {void}
 */
function initCalendar() {
  const wrapper     = document.getElementById("calendarWidgetWrapper");
  const calBtn      = document.getElementById("topbarCalendarBtn");
  const clockEl     = document.getElementById("topbarClock");
  const popup       = document.getElementById("calendarPopup");
  const prevBtn     = document.getElementById("calPrevMonthBtn");
  const nextBtn     = document.getElementById("calNextMonthBtn");
  const todayBtn    = document.getElementById("calTodayBtn");

  /* Inisialisasi awal tampilan */
  updateTopbarCalendarBadge();
  renderCalendar(calendarState.viewYear, calendarState.viewMonth);

  /* 1. HOVER TRIGGER: Saat kursor mouse mendekati pill terpadu */
  if (wrapper) {
    wrapper.addEventListener("mouseenter", () => {
      cancelCloseCalendar();
      openCalendarPopup();
    });
    wrapper.addEventListener("mouseleave", scheduleCloseCalendar);
  }

  /* 2. CLICK TRIGGER: Klik pill terpadu untuk toggle kalender */
  if (calBtn) {
    calBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (calendarState.isOpen) {
        closeCalendarPopup();
      } else {
        openCalendarPopup();
      }
    });
  }

  /* 3. Popup Container Hover Shield (Mencegah tertutup saat mouse bergerak di dalam popup) */
  if (popup) {
    popup.addEventListener("mouseenter", cancelCloseCalendar);
    popup.addEventListener("mouseleave", scheduleCloseCalendar);
  }

  /* 4. Tutup kalender saat klik di luar area */
  document.addEventListener("click", (e) => {
    if (calendarState.isOpen &&
        popup && !popup.contains(e.target) &&
        wrapper && !wrapper.contains(e.target) &&
        clockEl && !clockEl.contains(e.target)) {
      closeCalendarPopup();
    }
  });

  /* 5. Tutup kalender dengan tombol Escape */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && calendarState.isOpen) {
      closeCalendarPopup();
    }
  });

  /* 6. Navigasi Bulan: Sebelumnya (<) */
  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      let newMonth = calendarState.viewMonth - 1;
      let newYear  = calendarState.viewYear;
      if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      }
      renderCalendar(newYear, newMonth);
    });
  }

  /* 7. Navigasi Bulan: Berikutnya (>) */
  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      let newMonth = calendarState.viewMonth + 1;
      let newYear  = calendarState.viewYear;
      if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      }
      renderCalendar(newYear, newMonth);
    });
  }

  /* 8. Tombol Hari Ini (Reset ke tanggal & bulan saat ini) */
  if (todayBtn) {
    todayBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const now = new Date();
      calendarState.selectedDate = getTodayString();
      renderCalendar(now.getFullYear(), now.getMonth());
      showToast("Kembali ke bulan & hari ini! 📍", "success");
    });
  }
}
