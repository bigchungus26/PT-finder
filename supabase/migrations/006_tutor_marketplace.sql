-- ============================================================
-- Pivot to Tutor Marketplace: roles, tutor metadata, bookings, reviews
-- ============================================================

-- 1. Role-based profiles
alter table public.profiles
  add column if not exists user_role text not null default 'student'
    check (user_role in ('student', 'tutor', 'admin'));

-- 2. Tutor-specific metadata
alter table public.profiles
  add column if not exists bio_expert text,
  add column if not exists hourly_rate numeric(8,2),
  add column if not exists verified_status boolean not null default false,
  add column if not exists rating_avg numeric(3,2) default 0,
  add column if not exists total_reviews int not null default 0,
  add column if not exists subjects text[] not null default '{}';

create index idx_profiles_role on public.profiles(user_role);
create index idx_profiles_tutor_rate on public.profiles(hourly_rate) where user_role = 'tutor';
create index idx_profiles_tutor_rating on public.profiles(rating_avg desc) where user_role = 'tutor';

-- 3. Bookings table (1:1 tutoring sessions)
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id),
  date text not null,
  start_time text not null,
  end_time text not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_bookings_student on public.bookings(student_id);
create index idx_bookings_tutor on public.bookings(tutor_id);
create index idx_bookings_status on public.bookings(status);
create index idx_bookings_date on public.bookings(date);

alter table public.bookings enable row level security;

create policy "Students and tutors can see their own bookings"
  on public.bookings for select
  using (auth.uid() = student_id or auth.uid() = tutor_id);

create policy "Students can create bookings"
  on public.bookings for insert
  with check (auth.uid() = student_id);

create policy "Booking participants can update"
  on public.bookings for update
  using (auth.uid() = student_id or auth.uid() = tutor_id);

-- 4. Reviews table
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(booking_id)
);

create index idx_reviews_tutor on public.reviews(tutor_id);
create index idx_reviews_student on public.reviews(student_id);

alter table public.reviews enable row level security;

create policy "Anyone can read reviews"
  on public.reviews for select
  using (true);

create policy "Students can review completed bookings"
  on public.reviews for insert
  with check (
    auth.uid() = student_id and
    exists (
      select 1 from public.bookings b
      where b.id = reviews.booking_id
        and b.student_id = auth.uid()
        and b.status = 'completed'
    )
  );

-- 5. Trigger: update tutor rating_avg + total_reviews on review insert
create or replace function public.update_tutor_rating()
returns trigger as $$
begin
  update public.profiles
  set rating_avg = (select coalesce(avg(rating), 0) from public.reviews where tutor_id = new.tutor_id),
      total_reviews = (select count(*) from public.reviews where tutor_id = new.tutor_id)
  where id = new.tutor_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_update_tutor_rating
  after insert or update on public.reviews
  for each row execute function public.update_tutor_rating();
