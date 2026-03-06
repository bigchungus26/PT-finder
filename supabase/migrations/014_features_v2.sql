-- Migration 014: Features V2 - Sections 2-13
-- Adds columns and tables for bug fixes, gamification, messaging, trainer tools,
-- client experience, admin console, and performance features.

-- ============================================================
-- SECTION 2: Bug fix support columns
-- ============================================================

-- 2g: Double-booking prevention (handled in app logic, no schema change needed)

-- ============================================================
-- SECTION 5: Trainer profile improvements
-- ============================================================

-- 5c: Featured package flag
ALTER TABLE training_packages ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- ============================================================
-- SECTION 7: Gamification
-- ============================================================

-- 7a: Client activity streaks
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0;

-- 7b: Trainer achievement badges
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badges jsonb DEFAULT '[]'::jsonb;

-- 7c: Leaderboard cache
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  trainer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  metric_value numeric NOT NULL DEFAULT 0,
  computed_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leaderboard_category ON leaderboard_cache(category, rank);

-- 7e: Monthly challenges
CREATE TABLE IF NOT EXISTS platform_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  target_sessions integer NOT NULL DEFAULT 8,
  month integer NOT NULL,
  year integer NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES platform_challenges(id) ON DELETE CASCADE NOT NULL,
  completed_sessions integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- ============================================================
-- SECTION 8: Messaging improvements
-- ============================================================

-- 8a: Read receipts
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- 8c: Message reactions
CREATE TABLE IF NOT EXISTS message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES direct_messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- 8d: File sharing - attachment URL on messages
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS attachment_type text;

-- ============================================================
-- SECTION 9: Trainer tools
-- ============================================================

-- 9a: Accepting bookings toggle
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accepting_bookings boolean DEFAULT true;

-- 9b: Session rate snapshot on bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS session_rate numeric;

-- 9c: Trainer client notes
CREATE TABLE IF NOT EXISTS trainer_client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  note text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(trainer_id, client_id)
);

-- 9d: Profile views tracking
CREATE TABLE IF NOT EXISTS profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  viewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON profile_views(profile_id, viewed_at);

-- 9e: Vacation mode
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vacation_start date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vacation_end date;

-- ============================================================
-- SECTION 10: Client experience
-- ============================================================

-- 10a: Saved/favorited trainers
CREATE TABLE IF NOT EXISTS saved_trainers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  trainer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  saved_at timestamptz DEFAULT now(),
  UNIQUE(client_id, trainer_id)
);

-- 10d: Goal check-ins
CREATE TABLE IF NOT EXISTS goal_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  goal text NOT NULL,
  response text NOT NULL,
  checked_at timestamptz DEFAULT now()
);

-- 10e: Notification preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{
  "booking_request": true,
  "booking_confirmed": true,
  "booking_declined": true,
  "new_message": true,
  "session_reminder": true,
  "weekly_summary": true,
  "announcements": true
}'::jsonb;

-- ============================================================
-- SECTION 11: Session reminders
-- ============================================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_1hr_sent boolean DEFAULT false;

-- ============================================================
-- SECTION 12: Admin console
-- ============================================================

-- 12b: User deactivation
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 12c: Review flagging and admin actions
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS flagged boolean DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS flag_reason text;

CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- 12d: Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  target_audience text NOT NULL DEFAULT 'all',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaderboard is public read" ON leaderboard_cache FOR SELECT USING (true);

ALTER TABLE platform_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenges are public read" ON platform_challenges FOR SELECT USING (true);
CREATE POLICY "Admins manage challenges" ON platform_challenges FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own progress" ON challenge_progress FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own progress" ON challenge_progress FOR ALL USING (user_id = auth.uid());

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see reactions on their messages" ON message_reactions FOR SELECT USING (true);
CREATE POLICY "Users manage own reactions" ON message_reactions FOR ALL USING (user_id = auth.uid());

ALTER TABLE trainer_client_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainers see own notes" ON trainer_client_notes FOR SELECT USING (trainer_id = auth.uid());
CREATE POLICY "Trainers manage own notes" ON trainer_client_notes FOR ALL USING (trainer_id = auth.uid());

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profile owners see their views" ON profile_views FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Anyone can create views" ON profile_views FOR INSERT WITH CHECK (true);

ALTER TABLE saved_trainers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own saves" ON saved_trainers FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Users manage own saves" ON saved_trainers FOR ALL USING (client_id = auth.uid());

ALTER TABLE goal_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own checkins" ON goal_checkins FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Users create own checkins" ON goal_checkins FOR INSERT WITH CHECK (client_id = auth.uid());

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins see actions" ON admin_actions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins create actions" ON admin_actions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Announcements are public read" ON announcements FOR SELECT USING (true);
CREATE POLICY "Admins manage announcements" ON announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
