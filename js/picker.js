/**
 * @file js/picker.js
 * @description Custom Frosted Glass Date & Time Picker untuk SchoolTask UKK
 *              Menghilangkan popup putih kaku bawaan browser dengan antarmuka gelap modern,
 *              dilengkapi preset tugas sekolah, kalender Indonesia, dan kontrol jam interaktif.
 * @author Andrean Rayhan Wijaya
 */

/* ============================================================
   SECTION 1: STATE PICKER GLOBAL
   ============================================================ */
const pickerState = {
  activeDateInput: null,
  activeTimeInput: null,
  dateYear:  new Date().getFullYear(),
  dateMonth: new Date().getMonth(), // 0 = Jan
  selectedDate: "",
  timeHour: 23,
  timeMinute: 59,
};

const ST_MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/* ============================================================
   SECTION 2: DATE PICKER INITIALIZATION & RENDERING
   ============================================================ */

/**
 * Membuat elemen popup Date Picker di DOM jika belum ada.
 * @returns {HTMLDivElement}
 */
function getOrCreateDatePickerPopup() {
  let popup = document.getElementById("stDatePickerPopup");
  if (popup) { return popup; }

  popup = document.createElement("div");
  popup.id = "stDatePickerPopup";
  popup.className = "st-picker-popup hidden";
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-label", "Pilih tanggal tenggat");

  popup.innerHTML = `
    <!-- Presets -->
    <div class="st-picker-presets">
      <button type="button" class="st-preset-chip" data-preset="today">Hari Ini</button>
      <button type="button" class="st-preset-chip" data-preset="tomorrow">Besok</button>
      <button type="button" class="st-preset-chip" data-preset="in3days">+3 Hari</button>
      <button type="button" class="st-preset-chip" data-preset="nextweek">+7 Hari</button>
    </div>

    <!-- Month Navigation -->
    <div class="st-picker-header">
      <button type="button" class="st-picker-nav-btn" id="stDatePrevMonth" aria-label="Bulan sebelumnya">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="st-picker-title" id="stDateMonthTitle">November 2026</span>
      <button type="button" class="st-picker-nav-btn" id="stDateNextMonth" aria-label="Bulan berikutnya">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>

    <!-- Weekday headers -->
    <div class="st-picker-weekdays">
      <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span class="sun-col">Min</span>
    </div>

    <!-- Date Grid -->
    <div class="st-picker-grid" id="stDateGrid"></div>

    <!-- Footer -->
    <div class="st-picker-footer">
      <button type="button" class="st-picker-btn-text" id="stDateClearBtn">Kosongkan</button>
      <button type="button" class="st-picker-btn-action" id="stDateTodayBtn">Pilih Hari Ini</button>
    </div>
  `;

  document.body.appendChild(popup);

  /* Pasang event listener internal Date Picker */
  document.getElementById("stDatePrevMonth").addEventListener("click", (e) => {
    e.stopPropagation();
    pickerState.dateMonth--;
    if (pickerState.dateMonth < 0) {
      pickerState.dateMonth = 11;
      pickerState.dateYear--;
    }
    renderDatePickerGrid();
  });

  document.getElementById("stDateNextMonth").addEventListener("click", (e) => {
    e.stopPropagation();
    pickerState.dateMonth++;
    if (pickerState.dateMonth > 11) {
      pickerState.dateMonth = 0;
      pickerState.dateYear++;
    }
    renderDatePickerGrid();
  });

  document.getElementById("stDateClearBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    if (pickerState.activeDateInput) {
      pickerState.activeDateInput.value = "";
      pickerState.activeDateInput.dispatchEvent(new Event("input", { bubbles: true }));
      pickerState.activeDateInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
    closeDatePickerPopup();
  });

  document.getElementById("stDateTodayBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    selectDateValue(getTodayString());
  });

  /* Preset clicks */
  popup.querySelectorAll(".st-preset-chip").forEach((chip) => {
    chip.addEventListener("click", (e) => {
      e.stopPropagation();
      const preset = chip.dataset.preset;
      const targetDate = new Date();

      if (preset === "today") {
        /* Hari Ini */
      } else if (preset === "tomorrow") {
        targetDate.setDate(targetDate.getDate() + 1);
      } else if (preset === "in3days") {
        targetDate.setDate(targetDate.getDate() + 3);
      } else if (preset === "nextweek") {
        targetDate.setDate(targetDate.getDate() + 7);
      }

      const y = targetDate.getFullYear();
      const m = String(targetDate.getMonth() + 1).padStart(2, "0");
      const d = String(targetDate.getDate()).padStart(2, "0");
      selectDateValue(`${y}-${m}-${d}`);
    });
  });

  return popup;
}

/**
 * Merender grid kalender di dalam custom Date Picker.
 * @returns {void}
 */
function renderDatePickerGrid() {
  const titleEl = document.getElementById("stDateMonthTitle");
  const gridEl  = document.getElementById("stDateGrid");
  if (!titleEl || !gridEl) { return; }

  const year  = pickerState.dateYear;
  const month = pickerState.dateMonth;

  titleEl.textContent = `${ST_MONTH_NAMES_ID[month]} ${year}`;
  gridEl.innerHTML = "";

  const todayStr = getTodayString();
  const selectedStr = pickerState.selectedDate;

  /* Hitung hari pertama bulan (Senin-based: 0 = Mo, ..., 6 = Su) */
  const firstDay = new Date(year, month, 1);
  const startDay = (firstDay.getDay() + 6) % 7;

  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  /* 1. Ekor bulan lalu */
  for (let i = startDay - 1; i >= 0; i--) {
    const prevDay = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, prevDay);
    const dateStr = formatDateObj(prevDate);

    const cell = createDateCell(prevDay, dateStr, true, dateStr === selectedStr, dateStr === todayStr);
    gridEl.appendChild(cell);
  }

  /* 2. Hari di bulan aktif */
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const mStr = String(month + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    const dateStr = `${year}-${mStr}-${dStr}`;

    const cell = createDateCell(day, dateStr, false, dateStr === selectedStr, dateStr === todayStr);
    gridEl.appendChild(cell);
  }

  /* 3. Awal bulan berikutnya */
  const totalRendered = startDay + daysInCurrentMonth;
  const remaining = totalRendered % 7 === 0 ? 0 : 7 - (totalRendered % 7);
  for (let nextDay = 1; nextDay <= remaining; nextDay++) {
    const nextDate = new Date(year, month + 1, nextDay);
    const dateStr = formatDateObj(nextDate);

    const cell = createDateCell(nextDay, dateStr, true, dateStr === selectedStr, dateStr === todayStr);
    gridEl.appendChild(cell);
  }
}

/**
 * Membuat satu sel tanggal untuk kalender.
 * @param {number} dayNum - Nomor hari.
 * @param {string} dateStr - Format YYYY-MM-DD.
 * @param {boolean} isOtherMonth - Tanggal luar bulan aktif.
 * @param {boolean} isSelected - Apakah sedang dipilih.
 * @param {boolean} isToday - Apakah hari ini.
 * @returns {HTMLDivElement}
 */
function createDateCell(dayNum, dateStr, isOtherMonth, isSelected, isToday) {
  const cell = document.createElement("div");
  cell.className = "st-cell";
  cell.textContent = String(dayNum);

  const [y, m, d] = dateStr.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const isSunday = dateObj.getDay() === 0;

  if (isOtherMonth) { cell.classList.add("other-month"); }
  if (isSunday) { cell.classList.add("is-sunday"); }
  if (isToday) { cell.classList.add("is-today"); }
  if (isSelected) { cell.classList.add("is-selected"); }

  /* Indikator hari libur jika ada di dataset */
  if (typeof INDONESIA_HOLIDAYS !== "undefined") {
    const holiday = INDONESIA_HOLIDAYS.find((h) => h.date === dateStr);
    if (holiday) {
      cell.classList.add("has-holiday");
      cell.title = holiday.name;
    }
  }

  cell.addEventListener("click", (e) => {
    e.stopPropagation();
    selectDateValue(dateStr);
  });

  return cell;
}

/**
 * Memilih tanggal, mengisi input aktif, dan menutup popup.
 * @param {string} dateStr - Tanggal format YYYY-MM-DD.
 * @returns {void}
 */
function selectDateValue(dateStr) {
  if (pickerState.activeDateInput) {
    pickerState.activeDateInput.value = dateStr;
    pickerState.activeDateInput.dispatchEvent(new Event("input", { bubbles: true }));
    pickerState.activeDateInput.dispatchEvent(new Event("change", { bubbles: true }));
    pickerState.activeDateInput.classList.remove("input-error");
  }
  closeDatePickerPopup();
}

/**
 * Format objek Date menjadi string YYYY-MM-DD lokal.
 * @param {Date} d - Objek Date.
 * @returns {string}
 */
function formatDateObj(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Membuka custom Date Picker untuk input tertentu.
 * @param {HTMLInputElement} inputEl
 * @returns {void}
 */
function openDatePickerPopup(inputEl) {
  closeTimePickerPopup();
  const popup = getOrCreateDatePickerPopup();
  pickerState.activeDateInput = inputEl;

  /* Ambil nilai tanggal dari input jika ada */
  let initDate = inputEl.value;
  if (!initDate || !/^\d{4}-\d{2}-\d{2}$/.test(initDate)) {
    initDate = getTodayString();
  }
  pickerState.selectedDate = inputEl.value || "";

  const [y, m] = initDate.split("-").map(Number);
  pickerState.dateYear  = y;
  pickerState.dateMonth = m - 1;

  renderDatePickerGrid();
  positionPopup(popup, inputEl);
  popup.classList.remove("hidden");

  /* Tandai wrapper input aktif */
  const wrapper = inputEl.closest(".picker-input-container");
  if (wrapper) { wrapper.classList.add("active"); }
}

/**
 * Menutup custom Date Picker.
 * @returns {void}
 */
function closeDatePickerPopup() {
  const popup = document.getElementById("stDatePickerPopup");
  if (popup) { popup.classList.add("hidden"); }
  if (pickerState.activeDateInput) {
    const wrapper = pickerState.activeDateInput.closest(".picker-input-container");
    if (wrapper) { wrapper.classList.remove("active"); }
  }
  pickerState.activeDateInput = null;
}

/* ============================================================
   SECTION 3: TIME PICKER INITIALIZATION & RENDERING
   ============================================================ */

/**
 * Membuat elemen popup Time Picker di DOM jika belum ada.
 * @returns {HTMLDivElement}
 */
function getOrCreateTimePickerPopup() {
  let popup = document.getElementById("stTimePickerPopup");
  if (popup) { return popup; }

  popup = document.createElement("div");
  popup.id = "stTimePickerPopup";
  popup.className = "st-picker-popup hidden";
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-label", "Pilih jam tenggat");

  popup.innerHTML = `
    <!-- Header -->
    <div class="st-timepicker-header">
      <div class="st-timepicker-title-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>Pilih Jam Tenggat</span>
      </div>
      <button type="button" class="st-timepicker-close-btn" id="stTimeCloseBtn" aria-label="Tutup">✕</button>
    </div>

    <!-- Presets -->
    <div class="st-time-presets">
      <button type="button" class="st-time-chip featured" data-time="23:59">⏰ 23:59 (Akhir Hari)</button>
      <button type="button" class="st-time-chip" data-time="07:00">🌅 07:00 (Pagi)</button>
      <button type="button" class="st-time-chip" data-time="12:00">☀️ 12:00 (Siang)</button>
      <button type="button" class="st-time-chip" data-time="15:00">☕ 15:00 (Sore)</button>
      <button type="button" class="st-time-chip" data-time="17:00">🌇 17:00 (Pulang)</button>
      <button type="button" class="st-time-chip" data-time="21:00">🌙 21:00 (Malam)</button>
    </div>

    <!-- Digital Stepper / Direct Input -->
    <div class="st-digital-clock-stepper">
      <!-- Hour Col -->
      <div class="st-stepper-col">
        <button type="button" class="st-stepper-btn" id="stHourUp" aria-label="Tambah jam">▲</button>
        <input type="text" inputmode="numeric" maxlength="2" class="st-stepper-val st-stepper-input" id="stHourVal" value="23" aria-label="Ketik jam (00-23)" title="Ketik jam langsung (00-23)" />
        <button type="button" class="st-stepper-btn" id="stHourDown" aria-label="Kurang jam">▼</button>
        <span class="st-stepper-label">Jam</span>
      </div>

      <span class="st-clock-colon">:</span>

      <!-- Minute Col -->
      <div class="st-stepper-col">
        <button type="button" class="st-stepper-btn" id="stMinuteUp" aria-label="Tambah menit">▲</button>
        <input type="text" inputmode="numeric" maxlength="2" class="st-stepper-val st-stepper-input" id="stMinuteVal" value="59" aria-label="Ketik menit (00-59)" title="Ketik menit langsung (00-59)" />
        <button type="button" class="st-stepper-btn" id="stMinuteDown" aria-label="Kurang menit">▼</button>
        <span class="st-stepper-label">Menit</span>
      </div>
    </div>
    <div class="st-stepper-hint">💡 Klik angka untuk mengetik langsung jam & menit</div>

    <!-- Minute quick jump -->
    <div class="st-minute-quick-row">
      <button type="button" class="st-min-btn" data-min="00">:00</button>
      <button type="button" class="st-min-btn" data-min="15">:15</button>
      <button type="button" class="st-min-btn" data-min="30">:30</button>
      <button type="button" class="st-min-btn" data-min="45">:45</button>
      <button type="button" class="st-min-btn active" data-min="59">:59</button>
    </div>

    <!-- Footer -->
    <div class="st-picker-footer">
      <button type="button" class="st-picker-btn-text" id="stTimeResetBtn">Set 23:59</button>
      <button type="button" class="st-picker-btn-action" id="stTimeApplyBtn">Terapkan Jam</button>
    </div>
  `;

  document.body.appendChild(popup);

  /* Listener Close */
  document.getElementById("stTimeCloseBtn").addEventListener("click", closeTimePickerPopup);

  /* Direct Numeric Typing & Keyboard Control for Hours & Minutes */
  const hourInput = document.getElementById("stHourVal");
  const minuteInput = document.getElementById("stMinuteVal");

  [hourInput, minuteInput].forEach((inp) => {
    if (!inp) return;
    inp.addEventListener("focus", () => inp.select());
    inp.addEventListener("click", () => inp.select());
  });

  if (hourInput) {
    hourInput.addEventListener("input", () => {
      let raw = hourInput.value.replace(/\D/g, "");
      if (raw === "") { return; }
      let num = parseInt(raw, 10);
      if (isNaN(num)) { num = 0; }
      if (num > 23) { num = 23; }
      pickerState.timeHour = num;

      // Jika sudah 2 digit atau digit pertama >= 3 (misal jam 3 - 9), auto jump ke menit
      if (raw.length >= 2 || num >= 3) {
        hourInput.value = String(num).padStart(2, "0");
        if (minuteInput) {
          minuteInput.focus();
          minuteInput.select();
        }
      }
    });

    hourInput.addEventListener("blur", () => {
      hourInput.value = String(pickerState.timeHour).padStart(2, "0");
    });

    hourInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyTimeValue();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        pickerState.timeHour = (pickerState.timeHour + 1) % 24;
        updateTimeDisplay();
        hourInput.select();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        pickerState.timeHour = (pickerState.timeHour - 1 + 24) % 24;
        updateTimeDisplay();
        hourInput.select();
      } else if (e.key === ":" || e.key === "ArrowRight") {
        e.preventDefault();
        if (minuteInput) {
          minuteInput.focus();
          minuteInput.select();
        }
      }
    });
  }

  if (minuteInput) {
    minuteInput.addEventListener("input", () => {
      let raw = minuteInput.value.replace(/\D/g, "");
      if (raw === "") { return; }
      let num = parseInt(raw, 10);
      if (isNaN(num)) { num = 0; }
      if (num > 59) { num = 59; }
      pickerState.timeMinute = num;

      if (raw.length >= 2 || num >= 6) {
        minuteInput.value = String(num).padStart(2, "0");
      }
    });

    minuteInput.addEventListener("blur", () => {
      minuteInput.value = String(pickerState.timeMinute).padStart(2, "0");
    });

    minuteInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyTimeValue();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        pickerState.timeMinute = (pickerState.timeMinute + 1) % 60;
        updateTimeDisplay();
        minuteInput.select();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        pickerState.timeMinute = (pickerState.timeMinute - 1 + 60) % 60;
        updateTimeDisplay();
        minuteInput.select();
      } else if (e.key === "ArrowLeft" && minuteInput.selectionStart === 0) {
        e.preventDefault();
        if (hourInput) {
          hourInput.focus();
          hourInput.select();
        }
      }
    });
  }

  /* Hour Steppers */
  document.getElementById("stHourUp").addEventListener("click", (e) => {
    e.stopPropagation();
    pickerState.timeHour = (pickerState.timeHour + 1) % 24;
    updateTimeDisplay();
  });
  document.getElementById("stHourDown").addEventListener("click", (e) => {
    e.stopPropagation();
    pickerState.timeHour = (pickerState.timeHour - 1 + 24) % 24;
    updateTimeDisplay();
  });

  /* Minute Steppers */
  document.getElementById("stMinuteUp").addEventListener("click", (e) => {
    e.stopPropagation();
    pickerState.timeMinute = (pickerState.timeMinute + 1) % 60;
    updateTimeDisplay();
  });
  document.getElementById("stMinuteDown").addEventListener("click", (e) => {
    e.stopPropagation();
    pickerState.timeMinute = (pickerState.timeMinute - 1 + 60) % 60;
    updateTimeDisplay();
  });

  /* Minute quick jump */
  popup.querySelectorAll(".st-min-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      pickerState.timeMinute = Number(btn.dataset.min);
      updateTimeDisplay();
      popup.querySelectorAll(".st-min-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  /* Preset clicks */
  popup.querySelectorAll(".st-time-chip").forEach((chip) => {
    chip.addEventListener("click", (e) => {
      e.stopPropagation();
      const [h, m] = chip.dataset.time.split(":").map(Number);
      pickerState.timeHour = h;
      pickerState.timeMinute = m;
      applyTimeValue();
    });
  });

  /* Reset button (23:59) */
  document.getElementById("stTimeResetBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    pickerState.timeHour = 23;
    pickerState.timeMinute = 59;
    applyTimeValue();
  });

  /* Apply button */
  document.getElementById("stTimeApplyBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    applyTimeValue();
  });

  return popup;
}

/**
 * Memperbarui tampilan angka pada stepper jam & menit digital.
 * @returns {void}
 */
function updateTimeDisplay() {
  const hEl = document.getElementById("stHourVal");
  const mEl = document.getElementById("stMinuteVal");
  const hStr = String(pickerState.timeHour).padStart(2, "0");
  const mStr = String(pickerState.timeMinute).padStart(2, "0");
  if (hEl && document.activeElement !== hEl) { hEl.value = hStr; }
  if (mEl && document.activeElement !== mEl) { mEl.value = mStr; }
}

/**
 * Mengisi nilai jam ke input target dan menutup popup.
 * @returns {void}
 */
function applyTimeValue() {
  const hEl = document.getElementById("stHourVal");
  const mEl = document.getElementById("stMinuteVal");
  if (hEl && hEl.value !== "") {
    const parsedH = parseInt(hEl.value, 10);
    if (!isNaN(parsedH)) {
      pickerState.timeHour = Math.min(23, Math.max(0, parsedH));
    }
  }
  if (mEl && mEl.value !== "") {
    const parsedM = parseInt(mEl.value, 10);
    if (!isNaN(parsedM)) {
      pickerState.timeMinute = Math.min(59, Math.max(0, parsedM));
    }
  }

  if (pickerState.activeTimeInput) {
    const h = String(pickerState.timeHour).padStart(2, "0");
    const m = String(pickerState.timeMinute).padStart(2, "0");
    const timeStr = `${h}:${m}`;

    pickerState.activeTimeInput.value = timeStr;
    pickerState.activeTimeInput.dispatchEvent(new Event("input", { bubbles: true }));
    pickerState.activeTimeInput.dispatchEvent(new Event("change", { bubbles: true }));
  }
  closeTimePickerPopup();
}

/**
 * Membuka custom Time Picker untuk input tertentu.
 * @param {HTMLInputElement} inputEl
 * @returns {void}
 */
function openTimePickerPopup(inputEl) {
  closeDatePickerPopup();
  const popup = getOrCreateTimePickerPopup();
  pickerState.activeTimeInput = inputEl;

  /* Ambil nilai jam awal dari input jika ada */
  const val = inputEl.value;
  if (val && /^\d{1,2}:\d{2}$/.test(val)) {
    const [h, m] = val.split(":").map(Number);
    pickerState.timeHour = h;
    pickerState.timeMinute = m;
  } else {
    pickerState.timeHour = 23;
    pickerState.timeMinute = 59;
  }

  updateTimeDisplay();
  positionPopup(popup, inputEl);
  popup.classList.remove("hidden");

  /* Fokus otomatis ke input jam dan select teksnya agar user bisa langsung ketik */
  setTimeout(() => {
    const hEl = document.getElementById("stHourVal");
    if (hEl) {
      hEl.focus();
      hEl.select();
    }
  }, 60);

  /* Tandai wrapper input aktif */
  const wrapper = inputEl.closest(".picker-input-container");
  if (wrapper) { wrapper.classList.add("active"); }
}

/**
 * Menutup custom Time Picker.
 * @returns {void}
 */
function closeTimePickerPopup() {
  const popup = document.getElementById("stTimePickerPopup");
  if (popup) { popup.classList.add("hidden"); }
  if (pickerState.activeTimeInput) {
    const wrapper = pickerState.activeTimeInput.closest(".picker-input-container");
    if (wrapper) { wrapper.classList.remove("active"); }
  }
  pickerState.activeTimeInput = null;
}

/* ============================================================
   SECTION 4: POSISIONING & INTEGRASI DENGAN FORM
   ============================================================ */

/**
 * Menempatkan posisi popup melayang tepat di bawah input target secara responsif.
 * @param {HTMLElement} popup - Elemen popup yang diposisikan.
 * @param {HTMLElement} target - Elemen input target.
 * @returns {void}
 */
function positionPopup(popup, target) {
  const rect = target.getBoundingClientRect();
  const popupWidth = 320;
  const padding = 14;

  let top = rect.bottom + 6;
  let left = rect.left;

  /* Cegah overflow kanan */
  if (left + popupWidth > window.innerWidth - padding) {
    left = window.innerWidth - popupWidth - padding;
  }
  if (left < padding) { left = padding; }

  /* Jika overflow ke bawah viewport, tampilkan di atas input */
  if (top + 340 > window.innerHeight && rect.top > 340) {
    top = rect.top - 340 - 6;
  }

  popup.style.top = `${Math.round(top)}px`;
  popup.style.left = `${Math.round(left)}px`;
}

/**
 * Menginisialisasi custom date & time picker untuk semua input yang relevan.
 * @returns {void}
 */
function initCustomPickers() {
  const dateInputs = [
    document.getElementById("qaDueDate"),
    document.getElementById("editDueDate"),
  ].filter(Boolean);

  const timeInputs = [
    document.getElementById("qaDueTime"),
    document.getElementById("editDueTime"),
  ].filter(Boolean);

  dateInputs.forEach((input) => {
    /* Cegah browser native picker */
    input.addEventListener("click", (e) => {
      e.preventDefault();
      openDatePickerPopup(input);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        openDatePickerPopup(input);
      }
    });

    /* Klik wrapper atau icon memicu picker */
    const wrapper = input.closest(".picker-input-container");
    if (wrapper) {
      wrapper.addEventListener("click", (e) => {
        if (e.target !== input) {
          e.preventDefault();
          openDatePickerPopup(input);
        }
      });
    }
  });

  timeInputs.forEach((input) => {
    /* Sinkronisasi jika user mengetik langsung di input jam form */
    input.addEventListener("input", () => {
      const val = input.value;
      if (val && /^\d{1,2}:\d{2}$/.test(val)) {
        const [h, m] = val.split(":").map(Number);
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
          pickerState.timeHour = h;
          pickerState.timeMinute = m;
          updateTimeDisplay();
        }
      }
    });

    /* Buka custom picker */
    input.addEventListener("click", () => {
      openTimePickerPopup(input);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        openTimePickerPopup(input);
      }
    });

    /* Klik wrapper atau icon memicu picker */
    const wrapper = input.closest(".picker-input-container");
    if (wrapper) {
      wrapper.addEventListener("click", (e) => {
        if (e.target !== input) {
          e.preventDefault();
          openTimePickerPopup(input);
        }
      });
    }
  });

  /* Tutup popup jika user mengklik area lain */
  document.addEventListener("click", (e) => {
    const datePopup = document.getElementById("stDatePickerPopup");
    const timePopup = document.getElementById("stTimePickerPopup");

    const isInsideDate = datePopup && (datePopup.contains(e.target) || (pickerState.activeDateInput && pickerState.activeDateInput.closest(".picker-input-container")?.contains(e.target)));
    const isInsideTime = timePopup && (timePopup.contains(e.target) || (pickerState.activeTimeInput && pickerState.activeTimeInput.closest(".picker-input-container")?.contains(e.target)));

    if (!isInsideDate) { closeDatePickerPopup(); }
    if (!isInsideTime) { closeTimePickerPopup(); }
  });

  /* Tutup dengan Escape */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDatePickerPopup();
      closeTimePickerPopup();
    }
  });

  /* Reposisi saat scroll atau resize */
  window.addEventListener("resize", () => {
    if (pickerState.activeDateInput) {
      const popup = document.getElementById("stDatePickerPopup");
      if (popup && !popup.classList.contains("hidden")) {
        positionPopup(popup, pickerState.activeDateInput);
      }
    }
    if (pickerState.activeTimeInput) {
      const popup = document.getElementById("stTimePickerPopup");
      if (popup && !popup.classList.contains("hidden")) {
        positionPopup(popup, pickerState.activeTimeInput);
      }
    }
  }, { passive: true });
}

/* Inisialisasi otomatis setelah DOM siap */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCustomPickers);
} else {
  initCustomPickers();
}
