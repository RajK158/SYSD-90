-- ============================================================
-- SYSD 90 — Full Database Schema + RLS Policies
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  start_date DATE,
  streak_freeze_count INTEGER DEFAULT 3,
  flexible_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'user_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── STREAKS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_active_days INTEGER DEFAULT 0,
  last_active_date DATE,
  streak_calendar JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak" ON streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak" ON streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak" ON streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- ─── TASK COMPLETIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 90),
  task_type TEXT NOT NULL CHECK (task_type IN ('system_design', 'dsa', 'practical', 'revision', 'custom')),
  task_key TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_number, task_type, task_key)
);

ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own task completions" ON task_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task completions" ON task_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task completions" ON task_completions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own task completions" ON task_completions
  FOR DELETE USING (auth.uid() = user_id);

-- ─── CUSTOM TASKS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 90),
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE custom_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own custom tasks" ON custom_tasks
  FOR ALL USING (auth.uid() = user_id);

-- ─── DSA PROBLEMS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dsa_problems (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT DEFAULT 'LeetCode',
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  status TEXT NOT NULL DEFAULT 'Solved' CHECK (status IN ('Solved', 'Attempted', 'To Revisit')),
  date_solved DATE,
  mistake_note TEXT,
  revisit_date DATE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dsa_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own DSA problems" ON dsa_problems
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_dsa_user_id ON dsa_problems(user_id);
CREATE INDEX idx_dsa_topic ON dsa_problems(topic);
CREATE INDEX idx_dsa_difficulty ON dsa_problems(difficulty);

-- ─── CASE STUDY PROGRESS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS case_study_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  case_study_key TEXT NOT NULL,
  section_key TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  diagram_link TEXT,
  github_link TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, case_study_key, section_key)
);

ALTER TABLE case_study_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own case study progress" ON case_study_progress
  FOR ALL USING (auth.uid() = user_id);

-- ─── MOCK INTERVIEWS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mock_interviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  mock_type TEXT NOT NULL CHECK (mock_type IN ('System Design', 'DSA')),
  topic TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_min INTEGER,
  score INTEGER CHECK (score BETWEEN 0 AND 10),
  went_well TEXT,
  went_wrong TEXT,
  action_items TEXT,
  revisit_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mock interviews" ON mock_interviews
  FOR ALL USING (auth.uid() = user_id);

-- ─── NOTES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'System Design',
  week_number INTEGER,
  tags TEXT[] DEFAULT '{}',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_category ON notes(category);

-- ─── RESOURCES STATUS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources_status (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resource_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'Using', 'Completed')),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_key)
);

ALTER TABLE resources_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own resource status" ON resources_status
  FOR ALL USING (auth.uid() = user_id);

-- ─── PORTFOLIO PROGRESS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  folder_key TEXT NOT NULL,
  item_key TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  github_link TEXT,
  UNIQUE(user_id, folder_key, item_key)
);

ALTER TABLE portfolio_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own portfolio progress" ON portfolio_progress
  FOR ALL USING (auth.uid() = user_id);

-- ─── WEEKLY REVIEWS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 12),
  learned TEXT,
  what_was_hard TEXT,
  what_was_skipped TEXT,
  next_week_focus TEXT,
  confidence INTEGER CHECK (confidence BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_number)
);

ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own weekly reviews" ON weekly_reviews
  FOR ALL USING (auth.uid() = user_id);

-- ─── UPDATED_AT TRIGGERS ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_completions_updated_at
  BEFORE UPDATE ON task_completions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at
  BEFORE UPDATE ON streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── DONE ────────────────────────────────────────────────────
-- All tables created with Row Level Security enabled.
-- Users can only access their own data.
