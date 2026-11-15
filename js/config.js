/**
 * @file js/config.js
 * @description Konfigurasi utama, kunci penyimpanan LocalStorage, daftar mata pelajaran bawaan,
 *              dan manajemen data profil pengguna.
 * @author Andrean Rayhan Wijaya
 */

/* ============================================================
   SECTION 1: KONFIGURASI & KUNCI STORAGE
   ============================================================ */

/** Daftar mata pelajaran bawaan SMK RPL */
const DEFAULT_SUBJECTS = [
  "Matematika", "B. Indonesia", "B. Inggris", "Informatika",
  "IPAS", "PJOK", "Seni Budaya", "PKn", "Sejarah",
  "Fisika", "Kimia", "Biologi",
];

/** Kunci penyimpanan LocalStorage */
const KEYS = {
  TASKS:    "schooltask_tasks",
  USER:     "schooltask_user",
  SUBJECTS: "schooltask_subjects",
  SESSION:  "schooltask_session",
  SUPABASE: "schooltask_supabase_config",
};

/**
 * Konfigurasi bawaan Supabase Cloud PostgreSQL.
 * Terhubung otomatis ke project Supabase tanpa konfigurasi manual dari user.
 */
const DEFAULT_SUPABASE_CONFIG = {
  url: "https://qlvflsqbhkqsuyqvvbbm.supabase.co",
  key: "sb_publishable_49djRHFJZxoJJ2Q_FJGjKQ_anvt5QvW",
};

/**
 * Pasangan warna badge mata pelajaran (rotating palette).
 * Setiap elemen: [backgroundColor, textColor]
 * @type {string[][]}
 */
const SUBJECT_COLORS = [
  ["#fef3c7", "#92400e"],
  ["#dbeafe", "#1e40af"],
  ["#dcfce7", "#166534"],
  ["#fce7f3", "#9d174d"],
  ["#ede9fe", "#5b21b6"],
  ["#ffedd5", "#9a3412"],
  ["#cffafe", "#164e63"],
  ["#fef9c3", "#713f12"],
  ["#f0fdf4", "#14532d"],
  ["#fff1f2", "#881337"],
  ["#fdf4ff", "#6b21a8"],
  ["#ecfeff", "#155e75"],
];

/* ============================================================
   SECTION 2: STATE GLOBAL APLIKASI
   ============================================================ */

/** Semua data tugas aktif */
let tasks = [];

/** Filter yang sedang aktif di dashboard */
let currentFilter = {
  status:  "all",
  subject: "all",
  search:  "",
  sort:    "newest",
};

/** Data pengguna yang sedang aktif */
let currentUser = null;

/** Daftar mata pelajaran kustom yang ditambahkan pengguna */
let customSubjects = [];

/** Nama view yang sedang aktif: 'dashboard' | 'analytics' | 'settings' */
let currentView = "dashboard";

/** Instance klien Supabase (PostgreSQL Cloud) */
let supabaseClient = null;

/** Status konektivitas ke database Supabase */
let isSupabaseConnected = false;

/* ============================================================
   SECTION 3: MANAJEMEN PROFIL PENGGUNA
   ============================================================ */

/**
 * Memuat objek user dari LocalStorage jika sudah ada.
 * Jika belum ada, biarkan null agar modal sambutan dapat ditampilkan.
 * @returns {void}
 */
function initDefaultUser() {
  try {
    currentUser = loadProfile();
  } catch (err) {
    console.error("initDefaultUser error:", err);
    currentUser = null;
  }
}

/**
 * Memuat data user dari LocalStorage.
 * @returns {Object|null} Objek user atau null jika tidak ada.
 */
function loadProfile() {
  try {
    const raw = localStorage.getItem(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Menyimpan data profil user ke LocalStorage.
 * @param {Object} data - Data profil yang diperbarui.
 * @returns {void}
 */
function saveProfile(data) {
  try {
    currentUser = { ...currentUser, ...data };
    localStorage.setItem(KEYS.USER, JSON.stringify(currentUser));
  } catch (err) {
    console.error("saveProfile error:", err);
  }
}

/**
 * Menghasilkan data URL SVG dengan inisial nama sebagai avatar default.
 * @param {string} name - Nama yang akan diambil inisialnya.
 * @returns {string} Data URL SVG.
 */
function generateAvatarDataUrl(name) {
  const initials = (name || "Siswa")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="#f97316"/><text x="40" y="40" dy=".35em" text-anchor="middle" font-family="Inter,sans-serif" font-size="28" font-weight="bold" fill="#fff">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
