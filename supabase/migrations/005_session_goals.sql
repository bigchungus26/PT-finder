-- ============================================================
-- Session goals: shared checklist for study sessions
-- ============================================================

create table public.session_goals (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  is_completed boolean not null default false,
  completed_by uuid references public.profiles(id),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_session_goals_session on public.session_goals(session_id);

alter table public.session_goals enable row level security;

create policy "Session attendees can view goals"
  on public.session_goals for select
  using (
    exists (
      select 1 from public.session_attendees sa
      where sa.session_id = session_goals.session_id
        and sa.user_id = auth.uid()
    )
  );

create policy "Session attendees can add goals"
  on public.session_goals for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.session_attendees sa
      where sa.session_id = session_goals.session_id
        and sa.user_id = auth.uid()
    )
  );

create policy "Session attendees can update goals"
  on public.session_goals for update
  using (
    exists (
      select 1 from public.session_attendees sa
      where sa.session_id = session_goals.session_id
        and sa.user_id = auth.uid()
    )
  );

create policy "Goal creator can delete"
  on public.session_goals for delete
  using (auth.uid() = user_id);
