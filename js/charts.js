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
   SECTION 2: ANALYTICS VIEW RENDERING
   ============================================================ */

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
