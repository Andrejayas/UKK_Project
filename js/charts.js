/**
 * @file js/charts.js
 * @description Visualisasi data menggunakan Canvas 2D API (Donut Chart & Bar Chart Mingguan)
 *              dan rendering data analitik statistik tugas.
 * @author Andrean Rayhan Wijaya
 */

/* ============================================================
   SECTION 1: DASHBOARD CHARTS (CANVAS 2D)
   ============================================================ */

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

/* ============================================================
   SECTION 2: ANALYTICS VIEW RENDERING (EVALUASI BELAJAR LENGKAP)
   ============================================================ */

/**
 * Merender halaman Analytics dengan evaluasi performa belajar komprehensif:
 * - Skor Produktivitas Belajar (Circular Gauge 0-100 & Predikat).
 * - 3 Metrik Utama (Ketuntasan, Kedisiplinan Waktu, dan Keterlambatan) dengan visual mini-bar.
 * - Smart Study Insights (Rekomendasi Cerdas Otomatis).
 * - Distribusi Beban berdasarkan Tingkat Kesulitan Tugas.
 * - Evaluasi Ketuntasan per Mata Pelajaran dengan visual progress bar.
 * - Daftar Tugas Terlambat.
 * @returns {void}
 */
function renderAnalytics() {
  const total   = tasks.length;
  const done    = tasks.filter((t) => t.status === "done").length;
  const inprog  = tasks.filter((t) => t.status === "inprogress" && !isTaskOverdue(t));
  const overdue = tasks.filter(isTaskOverdue).length;

  const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);
  const overdueRate    = total === 0 ? 0 : Math.round((overdue / total) * 100);
  const onTimeRate     = total === 0 ? 100 : Math.max(0, 100 - overdueRate);

  /* 1. Hitung Skor Produktivitas (0 - 100) */
  let inprogSum = 0;
  inprog.forEach((t) => {
    inprogSum += (typeof t.progress === "number" ? t.progress : 50);
  });
  const inprogEffort = total === 0 ? 0 : (inprogSum / total);

  let score = 0;
  if (total > 0) {
    score = Math.round((completionRate * 0.55) + (onTimeRate * 0.30) + (inprogEffort * 0.15));
    score = Math.min(100, Math.max(0, score));
  }

  const scoreNumEl = document.getElementById("analyticsScoreNumber");
  if (scoreNumEl) {
    scoreNumEl.textContent = score;
  }

  const gaugeFill = document.getElementById("scoreGaugeFill");
  const circum = 2 * Math.PI * 50; // 314.16
  if (gaugeFill) {
    const offset = circum - (score / 100) * circum;
    gaugeFill.style.strokeDasharray = `${circum}`;
    gaugeFill.style.strokeDashoffset = `${offset}`;
    if (score >= 80) {
      gaugeFill.style.stroke = "#10b981";
    } else if (score >= 60) {
      gaugeFill.style.stroke = "#3b82f6";
    } else if (score >= 40) {
      gaugeFill.style.stroke = "#f59e0b";
    } else {
      gaugeFill.style.stroke = "#ef4444";
    }
  }

  const badgeEl = document.getElementById("analyticsScoreBadge");
  const descEl  = document.getElementById("analyticsScoreDesc");
  if (badgeEl && descEl) {
    if (total === 0) {
      badgeEl.textContent = "Belum Ada Tugas";
      badgeEl.style.color = "var(--text-muted)";
      badgeEl.style.borderColor = "rgba(255,255,255,0.15)";
      badgeEl.style.background = "rgba(255,255,255,0.05)";
      descEl.textContent = "Tambahkan tugas untuk melihat evaluasi produktivitas belajar Anda.";
    } else if (score >= 80) {
      badgeEl.textContent = "🏆 Sangat Disiplin & Produktif";
      badgeEl.style.color = "#34d399";
      badgeEl.style.borderColor = "rgba(16,185,129,0.3)";
      badgeEl.style.background = "rgba(16,185,129,0.12)";
      descEl.textContent = "Luar biasa! Tingkat ketuntasan tugas tinggi dan bebas dari keterlambatan.";
    } else if (score >= 60) {
      badgeEl.textContent = "🌟 Berkinerja Baik";
      badgeEl.style.color = "#60a5fa";
      badgeEl.style.borderColor = "rgba(59,130,246,0.3)";
      badgeEl.style.background = "rgba(59,130,246,0.12)";
      descEl.textContent = "Sebagian besar tugas tuntas tepat waktu. Pertahankan ritme belajar yang baik!";
    } else if (score >= 40) {
      badgeEl.textContent = "👍 Cukup Aktif";
      badgeEl.style.color = "#fbbf24";
      badgeEl.style.borderColor = "rgba(245,158,11,0.3)";
      badgeEl.style.background = "rgba(245,158,11,0.12)";
      descEl.textContent = "Masih ada tugas yang tertunda. Selesaikan tugas yang mendekati batas tenggat.";
    } else {
      badgeEl.textContent = "⚠️ Perlu Peningkatan Disiplin";
      badgeEl.style.color = "#f87171";
      badgeEl.style.borderColor = "rgba(239,68,68,0.3)";
      badgeEl.style.background = "rgba(239,68,68,0.12)";
      descEl.textContent = "Perhatikan tugas yang melewati tenggat waktu agar performa belajar tetap terjaga.";
    }
  }

  /* 2. Update 3 Metrik Detail & Mini Progress Bars */
  const elCompRate = document.getElementById("analyticsCompletionRate");
  if (elCompRate) { elCompRate.textContent = `${completionRate}%`; }

  const elCompDetail = document.getElementById("analyticsCompletionDetail");
  if (elCompDetail) { elCompDetail.textContent = `${done} dari ${total} tugas selesai`; }

  const elCompBar = document.getElementById("analyticsCompletionBar");
  if (elCompBar) { elCompBar.style.width = `${completionRate}%`; }

  const elOnTimeRate = document.getElementById("analyticsOnTimeRate");
  if (elOnTimeRate) { elOnTimeRate.textContent = `${onTimeRate}%`; }

  const elOnTimeDetail = document.getElementById("analyticsOnTimeDetail");
  if (elOnTimeDetail) {
    elOnTimeDetail.textContent = overdue === 0 ? "Bebas dari tugas terlambat" : `${Math.max(0, total - overdue)} tugas tepat waktu`;
  }

  const elOnTimeBar = document.getElementById("analyticsOnTimeBar");
  if (elOnTimeBar) { elOnTimeBar.style.width = `${onTimeRate}%`; }

  const elOverdueRate = document.getElementById("analyticsOverdueRate");
  if (elOverdueRate) { elOverdueRate.textContent = `${overdueRate}%`; }

  const elOverdueDetail = document.getElementById("analyticsOverdueDetail");
  if (elOverdueDetail) { elOverdueDetail.textContent = `${overdue} tugas lewat deadline`; }

  const elOverdueBar = document.getElementById("analyticsOverdueBar");
  if (elOverdueBar) { elOverdueBar.style.width = `${overdueRate}%`; }

  /* 3. Smart Study Insights (Rekomendasi Cerdas) */
  const insightsList = document.getElementById("analyticsInsightsList");
  if (insightsList) {
    const insights = [];

    // Insight 1: Hari Paling Aktif
    const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const counts = getWeeklyTaskCounts();
    let bestDayIdx = 0;
    let bestDayCount = counts[0] || 0;
    for (let i = 1; i < counts.length; i++) {
      if ((counts[i] || 0) > bestDayCount) {
        bestDayCount = counts[i];
        bestDayIdx = i;
      }
    }
    if (bestDayCount > 0) {
      insights.push({
        icon: "🔥",
        text: `Hari paling aktifmu adalah <strong>${days[bestDayIdx]}</strong> dengan <strong>${bestDayCount} tugas</strong> tercatat pada minggu ini.`
      });
    } else {
      insights.push({
        icon: "🗓️",
        text: "Belum ada aktivitas pengerjaan tugas yang tercatat pada minggu berjalan ini."
      });
    }

    // Insight 2: Disiplin & Kepatuhan Tenggat
    if (overdue === 0 && total > 0) {
      insights.push({
        icon: "🎯",
        text: "<strong>Prestasi Membanggakan!</strong> 100% tugasmu terselesaikan tepat waktu tanpa ada yang melewati batas tenggat."
      });
    } else if (overdue > 0) {
      insights.push({
        icon: "⏳",
        text: `Terdapat <strong>${overdue} tugas yang melewati deadline</strong> dan terkunci. Utamakan tugas berikutnya sebelum mendekati batas.`
      });
    } else {
      insights.push({
        icon: "💡",
        text: "Atur tanggal dan jam tenggat waktu untuk setiap tugas agar progres belajarmu terpantau rapi."
      });
    }

    // Insight 3: Beban Mapel Terbanyak
    const subjects = [...new Set(tasks.map((t) => t.subject))].filter(Boolean);
    if (subjects.length > 0) {
      let topSubj = "";
      let topCount = 0;
      subjects.forEach((s) => {
        const c = tasks.filter((t) => t.subject === s).length;
        if (c > topCount) { topCount = c; topSubj = s; }
      });
      insights.push({
        icon: "📚",
        text: `Mata pelajaran <strong>${escapeHtmlText(topSubj)}</strong> memiliki beban tugas terbanyak (<strong>${topCount} tugas</strong>).`
      });
    } else {
      insights.push({
        icon: "📖",
        text: "Gunakan fitur kategori mata pelajaran untuk memantau performa tiap bidang studi secara spesifik."
      });
    }

    insightsList.innerHTML = insights.map((item) => `
      <div class="insight-card">
        <span class="insight-icon-pill" aria-hidden="true">${item.icon}</span>
        <p class="insight-text">${item.text}</p>
      </div>
    `).join("");
  }

  /* 4. Distribusi Tingkat Kesulitan Tugas */
  const diffContainer = document.getElementById("analyticsDifficultyBars");
  if (diffContainer) {
    const diffs = [
      { key: "high",   label: "🔴 Tinggi (Sulit)", color: "#ef4444" },
      { key: "medium", label: "🟡 Sedang (Normal)", color: "#f59e0b" },
      { key: "low",    label: "🟢 Rendah (Mudah)",  color: "#10b981" },
    ];

    diffContainer.innerHTML = diffs.map(({ key, label, color }) => {
      const subList = tasks.filter((t) => (t.priority || "medium") === key);
      const doneCount = subList.filter((t) => t.status === "done").length;
      const pct = subList.length === 0 ? 0 : Math.round((doneCount / subList.length) * 100);

      return `
        <div class="diff-bar-item">
          <div class="diff-bar-top">
            <span class="diff-bar-label">${label}</span>
            <span class="diff-bar-count">${doneCount} dari ${subList.length} selesai (${pct}%)</span>
          </div>
          <div class="diff-bar-bg">
            <div class="diff-bar-fill" style="width: ${pct}%; background: ${color};"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  /* 5. Evaluasi Performa per Mata Pelajaran (Table Visual) */
  const subjects = [...new Set(tasks.map((t) => t.subject))].filter(Boolean);
  const perfBody = document.getElementById("subjectPerformanceBody");
  if (perfBody) {
    perfBody.innerHTML = "";

    if (subjects.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.setAttribute("colspan", "5");
      td.className = "empty-state-sm";
      td.textContent = "Belum ada data mata pelajaran.";
      tr.appendChild(td);
      perfBody.appendChild(tr);
    } else {
      subjects.forEach((subj) => {
        const st  = tasks.filter((t) => t.subject === subj);
        const doneC = st.filter((t) => t.status === "done").length;
        const progC = st.filter((t) => t.status === "inprogress" && !isTaskOverdue(t)).length;
        const todoC = st.filter((t) => t.status === "todo" && !isTaskOverdue(t)).length;
        const ovC   = st.filter(isTaskOverdue).length;

        let totalScore = 0;
        st.forEach((t) => {
          if (t.status === "done") {
            totalScore += 100;
          } else if (t.status === "inprogress") {
            totalScore += (typeof t.progress === "number" ? t.progress : 50);
          }
        });
        const pct = st.length === 0 ? 0 : Math.round(totalScore / st.length);

        let evalBadge = "";
        if (pct === 100) {
          evalBadge = `<span class="badge badge-done">🏆 Tuntas 100%</span>`;
        } else if (ovC > 0) {
          evalBadge = `<span class="badge badge-overdue">⚠️ Ada Terlambat (${ovC})</span>`;
        } else if (progC > 0) {
          evalBadge = `<span class="badge badge-progress">🚀 Berjalan (${pct}%)</span>`;
        } else {
          evalBadge = `<span class="badge badge-todo">⏳ Belum Dimulai</span>`;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${createSubjectBadge(subj).outerHTML}</td>
          <td><strong>${st.length}</strong> tugas</td>
          <td>
            <div class="subj-prog-cell">
              <div class="subj-prog-bar-bg">
                <div class="subj-prog-bar-fill ${pct === 100 ? "fill-done" : ""}" style="width: ${pct}%;"></div>
              </div>
              <span class="subj-prog-pct">${pct}%</span>
            </div>
          </td>
          <td>
            <div class="subj-stat-chips">
              <span class="chip-mini" title="Selesai">✅ ${doneC}</span>
              <span class="chip-mini" title="In Progress">🚀 ${progC}</span>
              <span class="chip-mini" title="To Do">⏳ ${todoC}</span>
              ${ovC > 0 ? `<span class="chip-mini" style="color:#f87171; border-color:rgba(239,68,68,0.3);" title="Terlambat">⚠️ ${ovC}</span>` : ""}
            </div>
          </td>
          <td>${evalBadge}</td>
        `;
        perfBody.appendChild(tr);
      });
    }
  }

  /* 6. Daftar Tugas Terlambat */
  const overdueList = document.getElementById("overdueList");
  if (overdueList) {
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
        if (task.description && task.description.trim()) {
          const descSpan = document.createElement("span");
          descSpan.style.fontSize = "0.74rem";
          descSpan.style.color = "var(--text-muted)";
          descSpan.textContent = `• ${task.description.trim().slice(0, 45)}...`;
          meta.appendChild(descSpan);
        }
        left.appendChild(title);
        left.appendChild(meta);

        const right = document.createElement("div");
        right.style.textAlign = "right";
        const dueBadge = document.createElement("span");
        dueBadge.className = "badge due-overdue";
        dueBadge.innerHTML = `🔒 ${task.dueTime ? `${formatDate(task.dueDate)} • ${task.dueTime}` : formatDate(task.dueDate)}`;
        right.appendChild(dueBadge);

        item.appendChild(left);
        item.appendChild(right);
        overdueList.appendChild(item);
      });
    }
  }

  /* 7. Tren Produktivitas Mingguan Chart */
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
