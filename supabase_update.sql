-- 1. Create Profiles Table (if not exists)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Update existing tables to include user_id (if not exists)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='user_id') THEN
    ALTER TABLE lessons ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vocab' AND column_name='user_id') THEN
    ALTER TABLE vocab ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vocab' AND column_name='example_cn') THEN
    ALTER TABLE vocab ADD COLUMN example_cn TEXT;
    ALTER TABLE vocab ADD COLUMN example_py TEXT;
    ALTER TABLE vocab ADD COLUMN example_vi TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='grammar' AND column_name='user_id') THEN
    ALTER TABLE grammar ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rules' AND column_name='user_id') THEN
    ALTER TABLE rules ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
  END IF;
END $$;

-- 3. Trigger to automatically create a profile when a user signs up
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

-- 4. Enable Row Level Security (RLS)
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammar ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Drop first to avoid collision)
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

-- Command to set a specific user as admin (Run this ONLY AFTER signing up in the app)
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@admin.com';
