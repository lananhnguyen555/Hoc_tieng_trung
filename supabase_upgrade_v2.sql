-- =============================================
-- NÂNG CẤP: Thêm bảng SRS và Lịch sử ôn tập
-- Chạy file này trong Supabase SQL Editor
-- =============================================

-- Bảng tiến độ học từng từ (SRS)
CREATE TABLE IF NOT EXISTS vocab_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vocab_id TEXT NOT NULL,
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  review_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  last_reviewed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, vocab_id)
);

-- Bảng lịch sử phiên ôn tập
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('flashcard', 'quiz', 'writing', 'speaking')),
  lesson_id TEXT,
  score INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng từ khó (đánh dấu sao)
CREATE TABLE IF NOT EXISTS starred_vocab (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vocab_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, vocab_id)
);

-- Enable RLS
ALTER TABLE vocab_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE starred_vocab ENABLE ROW LEVEL SECURITY;

-- Policies: user chỉ thấy data của mình
CREATE POLICY "vocab_progress_own" ON vocab_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "study_sessions_own" ON study_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "starred_vocab_own" ON starred_vocab FOR ALL USING (auth.uid() = user_id);

-- Thêm cột word_type vào vocab nếu chưa có
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vocab' AND column_name='word_type') THEN
    ALTER TABLE vocab ADD COLUMN word_type TEXT DEFAULT '';
  END IF;
END $$;
