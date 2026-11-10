-- ==============================================================================
-- SKEMA BASIS DATA SUPABASE (PostgreSQL)
-- Project: SchoolTask - Manajemen Tugas Sekolah (UKK Asisten Pemrogram Junior)
-- Penulis: Andrean Rayhan Wijaya
-- ==============================================================================

-- 1. Buat Tabel tasks
CREATE TABLE IF NOT EXISTS tasks (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  due_date TEXT DEFAULT '',
  due_time TEXT DEFAULT '',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'todo',
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan Akses (Policies) untuk Akses Anonim / Publik
DROP POLICY IF EXISTS "Public Read Access" ON tasks;
CREATE POLICY "Public Read Access" ON tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Access" ON tasks;
CREATE POLICY "Public Insert Access" ON tasks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Access" ON tasks;
CREATE POLICY "Public Update Access" ON tasks FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Delete Access" ON tasks;
CREATE POLICY "Public Delete Access" ON tasks FOR DELETE USING (true);

-- 4. Contoh Data Awal (Opsional)
INSERT INTO tasks (id, title, subject, due_date, due_time, priority, status, created_at)
VALUES 
  (1700000000001, 'Latihan Soal Fisika Gerak Parabola', 'Fisika', '2026-11-20', '23:59', 'high', 'todo', 1700000000001),
  (1700000000002, 'Rangkuman Bab 3 Bahasa Indonesia', 'B. Indonesia', '2026-11-18', '12:00', 'medium', 'inprogress', 1700000000002)
ON CONFLICT (id) DO NOTHING;
