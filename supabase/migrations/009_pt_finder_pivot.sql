-- ============================================================
-- PT Finder Schema Pivot
-- Converts from tutor marketplace to personal trainer marketplace
-- ============================================================

-- 1. Add fitness-specific columns to profiles
alter table public.profiles
  add column if not exists area text not null default '',
  add column if not exists gym text not null default '',
  add column if not exists fitness_goals text[] not null default '{}',
  add column if not exists years_experience int not null default 0,
  add column if not exists certifications text[] not null default '{}',
  add column if not exists transformations text[] not null default '{}',
  add column if not exists clients_worked_with int not null default 0;

-- 2. Rename specialty column (reuse subjects)
-- We keep the 'subjects' column as 'specialty' via alias in the app layer
-- or add a dedicated column
alter table public.profiles
  add column if not exists specialty text[] not null default '{}';

-- 3. Update user_role check to include 'client' and 'trainer'
-- Drop old constraint and add new one
alter table public.profiles drop constraint if exists profiles_user_role_check;
alter table public.profiles add constraint profiles_user_role_check
  check (user_role in ('student', 'tutor', 'admin', 'client', 'trainer'));

-- 4. Add client_id/trainer_id aliases to bookings
-- The existing student_id and tutor_id columns serve as client_id/trainer_id
-- We add aliases via views or just use them directly in the app layer

-- 5. Update defaults
alter table public.profiles alter column school set default '';
alter table public.profiles alter column major set default '';
