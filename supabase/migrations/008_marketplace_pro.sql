-- ============================================================
-- Professional Marketplace: Request Board, Verifications,
-- Student Notes, Packages, Buffer Times, Session Prep
-- ============================================================

-- 1. Public Request Board (inverted marketplace)
create table public.tutor_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id),
  title text not null,
  description text,
  subject text,
  max_budget numeric(8,2),
  deadline text,
  status text not null default 'open' check (status in ('open', 'filled', 'expired', 'cancelled')),
  created_at timestamptz not null default now()
);

create index idx_tutor_requests_status on public.tutor_requests(status);
create index idx_tutor_requests_student on public.tutor_requests(student_id);

alter table public.tutor_requests enable row level security;

create policy "Anyone can view open requests"
  on public.tutor_requests for select using (true);
create policy "Students can create requests"
  on public.tutor_requests for insert with check (auth.uid() = student_id);
create policy "Students can update own requests"
  on public.tutor_requests for update using (auth.uid() = student_id);

-- Tutor bids on requests
create table public.tutor_bids (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.tutor_requests(id) on delete cascade,
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  proposed_rate numeric(8,2),
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique(request_id, tutor_id)
);

create index idx_tutor_bids_request on public.tutor_bids(request_id);
create index idx_tutor_bids_tutor on public.tutor_bids(tutor_id);

alter table public.tutor_bids enable row level security;

create policy "Request owner and bidding tutor can view bids"
  on public.tutor_bids for select using (
    auth.uid() = tutor_id or
    auth.uid() = (select student_id from public.tutor_requests where id = request_id)
  );
create policy "Tutors can bid"
  on public.tutor_bids for insert with check (auth.uid() = tutor_id);
create policy "Bid participants can update"
  on public.tutor_bids for update using (
    auth.uid() = tutor_id or
    auth.uid() = (select student_id from public.tutor_requests where id = request_id)
  );

-- 2. Tutor Verification Pipeline
create table public.tutor_verifications (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('transcript', 'linkedin', 'background_check', 'other')),
  document_url text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_verifications_tutor on public.tutor_verifications(tutor_id);
create index idx_verifications_status on public.tutor_verifications(status);

alter table public.tutor_verifications enable row level security;

create policy "Tutors can see own verifications"
  on public.tutor_verifications for select using (
    auth.uid() = tutor_id or
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
create policy "Tutors can submit verifications"
  on public.tutor_verifications for insert with check (auth.uid() = tutor_id);
create policy "Admins can update verifications"
  on public.tutor_verifications for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- 3. Tutor Student Notes (private CRM)
create table public.tutor_student_notes (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_student_notes_tutor on public.tutor_student_notes(tutor_id);
create index idx_student_notes_pair on public.tutor_student_notes(tutor_id, student_id);

alter table public.tutor_student_notes enable row level security;

create policy "Only the tutor who wrote can see/edit notes"
  on public.tutor_student_notes for all using (auth.uid() = tutor_id);

-- 4. Tutor Packages (multi-session discounts)
create table public.tutor_packages (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  total_hours int not null check (total_hours >= 2),
  price numeric(8,2) not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_packages_tutor on public.tutor_packages(tutor_id);

alter table public.tutor_packages enable row level security;

create policy "Anyone can view active packages"
  on public.tutor_packages for select using (true);
create policy "Tutors can manage own packages"
  on public.tutor_packages for insert with check (auth.uid() = tutor_id);
create policy "Tutors can update own packages"
  on public.tutor_packages for update using (auth.uid() = tutor_id);

-- 5. Buffer time + session prep on profiles
alter table public.profiles
  add column if not exists buffer_minutes int not null default 0;

-- 6. Session prep fields on bookings
alter table public.bookings
  add column if not exists student_prep text,
  add column if not exists session_brief text,
  add column if not exists is_recurring boolean not null default false,
  add column if not exists package_id uuid references public.tutor_packages(id);
