-- Create Lessons Table
CREATE TABLE lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Vocab Table
CREATE TABLE vocab (
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

-- Create Grammar Table
CREATE TABLE grammar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  example TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Rules Table
CREATE TABLE rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammar ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow users to manage their own data)
CREATE POLICY "Public read-only accessibility" ON lessons FOR SELECT USING (true);
CREATE POLICY "Users can manage their own lessons" ON lessons FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public read-only accessibility" ON vocab FOR SELECT USING (true);
CREATE POLICY "Users can manage their own vocab" ON vocab FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public read-only accessibility" ON grammar FOR SELECT USING (true);
CREATE POLICY "Admins/Owners can manage grammar" ON grammar FOR ALL USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
);

CREATE POLICY "Public read-only accessibility" ON rules FOR SELECT USING (true);
CREATE POLICY "Admins/Owners can manage rules" ON rules FOR ALL USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
);

CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- Insert Sample Data
INSERT INTO lessons (name) VALUES ('Buổi 1'), ('Buổi 2');

-- Note: You should set up Auth policies for INSERT/UPDATE/DELETE if using Admin features.
