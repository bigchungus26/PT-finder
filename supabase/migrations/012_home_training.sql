-- Home training, diet planning, and training packages
alter table public.profiles
  add column if not exists offers_home_training boolean not null default false,
  add column if not exists home_training_cities text[] not null default '{}',
  add column if not exists offers_diet_plan boolean not null default false;

-- Training packages table (min 4 weeks, no max)
create table if not exists public.training_packages (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  duration_weeks int not null check (duration_weeks >= 4),
  sessions_per_week int not null default 3 check (sessions_per_week >= 1 and sessions_per_week <= 7),
  price_without_diet numeric(10,2) not null check (price_without_diet > 0),
  price_with_diet numeric(10,2),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.training_packages enable row level security;

create policy "Trainers manage own packages" on public.training_packages
  for all using (trainer_id = auth.uid());
create policy "Anyone can view active packages" on public.training_packages
  for select using (is_active = true);
