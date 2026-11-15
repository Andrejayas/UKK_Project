/**
 * @file js/database.js
 * @description Integrasi dan sinkronisasi Cloud Database PostgreSQL (Supabase).
 *              Mendukung fallback offline mulus ke LocalStorage jika jaringan lab terputus.
 * @author Andrean Rayhan Wijaya
 */

/* ============================================================
   SECTION 1: MAPPING DATA JAVASCRIPT <-> POSTGRESQL SUPABASE
   ============================================================ */

/**
 * Mengonversi objek task JavaScript ke format baris tabel database PostgreSQL Supabase.
 * @param {Object} t - Objek task lokal.
 * @returns {Object} Objek kolom database.
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

/* ============================================================
   SECTION 2: INDIKATOR STATUS BASIS DATA
   ============================================================ */

/**
 * Memperbarui tampilan indikator basis data di topbar dan halaman pengaturan.
 * @param {boolean} isConnected - Status apakah Supabase berhasil terhubung.
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

/* ============================================================
   SECTION 3: KONEKSI & INITIALISASI SUPABASE
   ============================================================ */

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
