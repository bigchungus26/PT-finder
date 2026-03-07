-- ============================================================
-- Migration 013: Retention, Engagement & Social Features
-- Covers: Sections 1-10 of the retention/engagement system
-- ============================================================

-- ── Profile extensions ──────────────────────────────────────
alter table public.profiles
  add column if not exists last_active_at timestamptz default now(),
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists setup_step_discover boolean not null default false,
  add column if not exists setup_step_inquiry boolean not null default false,
  add column if not exists setup_step_share boolean not null default false,
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid references public.profiles(id),
  add column if not exists earnings_goal numeric(10,2),
  add column if not exists response_commitment text default 'asap',
  add column if not exists health_score integer default 0,
  add column if not exists profile_strength integer default 0,
  add column if not exists total_completed_sessions integer default 0;

-- ── Accountability Partners ─────────────────────────────────
create table if not exists public.accountability_pairs (
  id uuid primary key default gen_random_uuid(),
  user_id_1 uuid not null references public.profiles(id) on delete cascade,
  user_id_2 uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id_1, user_id_2)
);
alter table public.accountability_pairs enable row level security;
create policy "Users see own pairs" on public.accountability_pairs
  for select using (user_id_1 = auth.uid() or user_id_2 = auth.uid());
create policy "Users create own pairs" on public.accountability_pairs
  for insert with check (user_id_1 = auth.uid() or user_id_2 = auth.uid());

-- ── Trainer Challenges ──────────────────────────────────────
create table if not exists public.trainer_challenges (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  target_sessions integer not null default 10,
  start_date date not null,
  end_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.trainer_challenges enable row level security;
create policy "Anyone can view active challenges" on public.trainer_challenges
  for select using (active = true);
create policy "Trainers manage own challenges" on public.trainer_challenges
  for all using (trainer_id = auth.uid());

create table if not exists public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.trainer_challenges(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  sessions_completed integer not null default 0,
  joined_at timestamptz not null default now(),
  unique(challenge_id, client_id)
);
alter table public.challenge_participants enable row level security;
create policy "Participants see own challenges" on public.challenge_participants
  for select using (
    client_id = auth.uid() or
    challenge_id in (select id from public.trainer_challenges where trainer_id = auth.uid())
  );
create policy "Clients join challenges" on public.challenge_participants
  for insert with check (client_id = auth.uid());
create policy "Trainers update participant progress" on public.challenge_participants
  for update using (
    challenge_id in (select id from public.trainer_challenges where trainer_id = auth.uid())
  );

-- ── Client Progress Photos ──────────────────────────────────
create table if not exists public.client_progress_photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  photo_url text not null,
  body_side text not null default 'front' check (body_side in ('front', 'side', 'back', 'other')),
  uploaded_at timestamptz not null default now()
);
alter table public.client_progress_photos enable row level security;
create policy "Clients manage own photos" on public.client_progress_photos
  for all using (client_id = auth.uid());

-- ── Client Weekly Logs (micro-tracker) ──────────────────────
create table if not exists public.client_weekly_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  week_start_date date not null,
  weight_kg numeric(5,1),
  energy integer check (energy >= 1 and energy <= 5),
  sleep integer check (sleep >= 1 and sleep <= 5),
  note text,
  created_at timestamptz not null default now(),
  unique(client_id, week_start_date)
);
alter table public.client_weekly_logs enable row level security;
create policy "Clients manage own logs" on public.client_weekly_logs
  for all using (client_id = auth.uid());

-- ── Client Milestones ───────────────────────────────────────
create table if not exists public.client_milestones (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  milestone integer not null,
  celebrated_at timestamptz not null default now(),
  unique(client_id, milestone)
);
alter table public.client_milestones enable row level security;
create policy "Clients see own milestones" on public.client_milestones
  for all using (client_id = auth.uid());

-- ── Referrals ───────────────────────────────────────────────
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid references public.profiles(id) on delete set null,
  source_trainer_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'converted')),
  created_at timestamptz not null default now()
);
alter table public.referrals enable row level security;
create policy "Users see own referrals" on public.referrals
  for select using (referrer_id = auth.uid() or referred_id = auth.uid() or source_trainer_id = auth.uid());
create policy "System inserts referrals" on public.referrals
  for insert with check (true);
create policy "System updates referrals" on public.referrals
  for update using (true);

-- ── Trainer Posts (Tips Feed) ───────────────────────────────
create table if not exists public.trainer_posts (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) <= 280),
  image_url text,
  created_at timestamptz not null default now()
);
alter table public.trainer_posts enable row level security;
create policy "Anyone can view posts" on public.trainer_posts
  for select using (true);
create policy "Trainers manage own posts" on public.trainer_posts
  for all using (trainer_id = auth.uid());

-- ── Weekly Content (admin-created) ──────────────────────────
create table if not exists public.weekly_content (
  id uuid primary key default gen_random_uuid(),
  week_number integer not null,
  year integer not null,
  theme text not null,
  tip_text text not null,
  cta_text text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(week_number, year)
);
alter table public.weekly_content enable row level security;
create policy "Anyone can view active content" on public.weekly_content
  for select using (active = true);
create policy "Admins manage content" on public.weekly_content
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- ── Seasonal Notifications ──────────────────────────────────
create table if not exists public.seasonal_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  trigger_date date not null,
  sent boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.seasonal_notifications enable row level security;
create policy "Admins manage seasonal" on public.seasonal_notifications
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
create policy "Anyone can view seasonal" on public.seasonal_notifications
  for select using (true);

-- ── Trainer Incidents (no-shows, late cancels) ──────────────
create table if not exists public.trainer_incidents (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  type text not null check (type in ('no_show', 'late_cancel')),
  created_at timestamptz not null default now()
);
alter table public.trainer_incidents enable row level security;
create policy "Admins see incidents" on public.trainer_incidents
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    or trainer_id = auth.uid()
  );
create policy "System inserts incidents" on public.trainer_incidents
  for insert with check (true);

-- ── Discover Sessions (live browsing counter) ───────────────
create table if not exists public.discover_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  city_filter text,
  last_seen_at timestamptz not null default now()
);
alter table public.discover_sessions enable row level security;
create policy "Anyone can read discover sessions" on public.discover_sessions
  for select using (true);
create policy "Users manage own sessions" on public.discover_sessions
  for all using (user_id = auth.uid() or user_id is null);

-- ── User Events (funnel tracking) ───────────────────────────
create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_name text not null,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);
alter table public.user_events enable row level security;
create policy "Users insert own events" on public.user_events
  for insert with check (user_id = auth.uid());
create policy "Admins read all events" on public.user_events
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- ── Session Notes (trainer private per-session) ─────────────
create table if not exists public.session_notes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(booking_id, trainer_id)
);
alter table public.session_notes enable row level security;
create policy "Trainers manage own notes" on public.session_notes
  for all using (trainer_id = auth.uid());

-- ── Reviews extension: kg_lost field ────────────────────────
alter table public.reviews
  add column if not exists kg_lost integer;

-- ── Bookings extension: priority_client flag ────────────────
alter table public.bookings
  add column if not exists priority_client boolean not null default false;

-- ── Index for performance ───────────────────────────────────
create index if not exists idx_user_events_name on public.user_events(event_name);
create index if not exists idx_user_events_user on public.user_events(user_id);
create index if not exists idx_discover_sessions_seen on public.discover_sessions(last_seen_at);
create index if not exists idx_profiles_last_active on public.profiles(last_active_at);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_trainer_posts_trainer on public.trainer_posts(trainer_id);
create index if not exists idx_referrals_referrer on public.referrals(referrer_id);
