-- Workers table
CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  city TEXT,
  area TEXT,
  phone TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  payfast_token TEXT,
  status TEXT DEFAULT 'pending',
  next_billing_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Workers: public can view active profiles
CREATE POLICY "Public can view active workers" ON workers
  FOR SELECT USING (is_active = true);

-- Workers: can view and manage their own profile
CREATE POLICY "Workers can view own profile" ON workers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Workers can insert own profile" ON workers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Workers can update own profile" ON workers
  FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions: workers can view their own
CREATE POLICY "Workers can view own subscription" ON subscriptions
  FOR SELECT USING (
    worker_id IN (SELECT id FROM workers WHERE user_id = auth.uid())
  );

-- Reviews: anyone can read and write (no login required)
CREATE POLICY "Public can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert reviews" ON reviews
  FOR INSERT WITH CHECK (true);

-- Storage bucket for worker photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('worker-photos', 'worker-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view worker photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'worker-photos');

CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'worker-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Workers can update own photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'worker-photos' AND auth.role() = 'authenticated');
