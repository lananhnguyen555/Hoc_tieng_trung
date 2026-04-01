-- ==========================================
-- SUPABASE COMPLETE SETUP (SAFE FOR UPDATES)
-- ==========================================

-- 1. Create Tables (If not already exist)
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS vocab (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  meaning TEXT NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  example_cn TEXT,
  example_py TEXT,
  example_vi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS grammar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  example TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Add missing columns to existing tables (Incremental Updates)
DO $$ 
BEGIN 
  -- Lessons
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='user_id') THEN
    ALTER TABLE lessons ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
  END IF;
  
  -- Vocab
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vocab' AND column_name='user_id') THEN
    ALTER TABLE vocab ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vocab' AND column_name='example_cn') THEN
    ALTER TABLE vocab ADD COLUMN example_cn TEXT;
    ALTER TABLE vocab ADD COLUMN example_py TEXT;
    ALTER TABLE vocab ADD COLUMN example_vi TEXT;
  END IF;

  -- Grammar
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='grammar' AND column_name='user_id') THEN
    ALTER TABLE grammar ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
  END IF;

  -- Rules
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rules' AND column_name='user_id') THEN
    ALTER TABLE rules ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
  END IF;
END $$;

-- 3. Trigger and Function for Auto-Profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Enable RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammar ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Policies (Drop-and-Recreate)
DROP POLICY IF EXISTS "Public read-only accessibility" ON lessons;
DROP POLICY IF EXISTS "Users can manage their own lessons" ON lessons;
CREATE POLICY "Public read-only accessibility" ON lessons FOR SELECT USING (true);
CREATE POLICY "Users can manage their own lessons" ON lessons FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read-only accessibility" ON vocab;
DROP POLICY IF EXISTS "Users can manage their own vocab" ON vocab;
CREATE POLICY "Public read-only accessibility" ON vocab FOR SELECT USING (true);
CREATE POLICY "Users can manage their own vocab" ON vocab FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read-only accessibility" ON grammar;
DROP POLICY IF EXISTS "Admins/Owners can manage grammar" ON grammar;
CREATE POLICY "Public read-only accessibility" ON grammar FOR SELECT USING (true);
CREATE POLICY "Admins/Owners can manage grammar" ON grammar FOR ALL USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
);

DROP POLICY IF EXISTS "Public read-only accessibility" ON rules;
DROP POLICY IF EXISTS "Admins/Owners can manage rules" ON rules;
CREATE POLICY "Public read-only accessibility" ON rules FOR SELECT USING (true);
CREATE POLICY "Admins/Owners can manage rules" ON rules FOR ALL USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
);

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- 6. Insert initial data (only if empty)
INSERT INTO lessons (name) 
SELECT 'Buổi 1' WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE name = 'Buổi 1');
INSERT INTO lessons (name) 
SELECT 'Buổi 2' WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE name = 'Buổi 2');

-- Command to Promote Admin (Sign up at /auth first!)
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@admin.com';
