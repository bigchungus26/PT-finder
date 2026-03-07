-- ============================================================
-- Enhanced Trainer Profiles: age, gender, trainer type,
-- profile photo, city, ID verification
-- ============================================================

-- 1. New profile fields for trainers
alter table public.profiles
  add column if not exists age int,
  add column if not exists gender text check (gender in ('male', 'female', 'other', null)),
  add column if not exists trainer_type text check (trainer_type in ('freelancer', 'gym_affiliated', null)),
  add column if not exists profile_photo_url text,
  add column if not exists city text not null default '',
  add column if not exists testimonials jsonb not null default '[]';

-- 2. Update tutor_verifications type enum to include ID documents
alter table public.tutor_verifications drop constraint if exists tutor_verifications_type_check;
alter table public.tutor_verifications add constraint tutor_verifications_type_check
  check (type in ('transcript', 'linkedin', 'background_check', 'other', 'id_card', 'passport'));

-- 3. Add OCR extracted data column to verifications
alter table public.tutor_verifications
  add column if not exists extracted_data jsonb;
