-- ============================================================
-- Gym Profiles & Enhanced Trainer Filtering
-- ============================================================

-- 1. Create gyms table
create table if not exists public.gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  city text not null default '',
  address text,
  logo_url text,
  website text,
  owner_id uuid references public.profiles(id) on delete set null,
  invite_code text unique not null default upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at timestamptz not null default now()
);

-- 2. Add new columns to profiles
alter table public.profiles
  add column if not exists gym_id uuid references public.gyms(id) on delete set null,
  add column if not exists gender text check (gender in ('male', 'female', 'non-binary', 'prefer-not-to-say')),
  add column if not exists service_type text check (service_type in ('training_only', 'diet_and_training')) default 'training_only',
  add column if not exists city text not null default '';

-- 3. Expand user_role to include 'gym'
alter table public.profiles drop constraint if exists profiles_user_role_check;
alter table public.profiles add constraint profiles_user_role_check
  check (user_role in ('student', 'tutor', 'admin', 'client', 'trainer', 'gym'));

-- 4. RLS for gyms table
alter table public.gyms enable row level security;

-- Anyone logged in can view gyms
create policy "gyms_select" on public.gyms
  for select using (auth.role() = 'authenticated');

-- Only the owner can update their gym
create policy "gyms_update" on public.gyms
  for update using (auth.uid() = owner_id);

-- Authenticated users can create a gym
create policy "gyms_insert" on public.gyms
  for insert with check (auth.uid() = owner_id);

-- Only the owner can delete their gym
create policy "gyms_delete" on public.gyms
  for delete using (auth.uid() = owner_id);

-- 5. Index for gym trainers lookup
create index if not exists profiles_gym_id_idx on public.profiles(gym_id);
create index if not exists profiles_city_idx on public.profiles(city);
create index if not exists profiles_gender_idx on public.profiles(gender);
create index if not exists gyms_invite_code_idx on public.gyms(invite_code);
create index if not exists gyms_city_idx on public.gyms(city);
