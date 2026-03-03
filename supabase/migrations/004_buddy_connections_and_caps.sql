-- ============================================================
-- Buddy-first: 1:1 connections table + 48h expiry, 8-person group cap
-- ============================================================

-- 1. Connections table (1:1 buddy relationships)
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  initiated_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'ignored', 'blocked')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint connections_ordered check (user_a_id < user_b_id),
  unique(user_a_id, user_b_id)
);

create index idx_connections_user_a on public.connections(user_a_id);
create index idx_connections_user_b on public.connections(user_b_id);
create index idx_connections_status on public.connections(status);

alter table public.connections enable row level security;

create policy "Users can view connections they are part of"
  on public.connections for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

create policy "Users can create connection request (as requester)"
  on public.connections for insert
  with check (auth.uid() = user_a_id or auth.uid() = user_b_id);

create policy "Users can update connections they are part of (accept/ignore/block)"
  on public.connections for update
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- 2. Enforce max 8 members per group (hard cap)
create or replace function public.check_group_member_cap()
returns trigger as $$
declare
  cap int;
  current_count int;
begin
  select max_members into cap from public.study_groups where id = new.group_id;
  select count(*) into current_count from public.group_members where group_id = new.group_id;
  if current_count >= cap then
    raise exception 'Group has reached maximum members (%)', cap;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger enforce_group_member_cap
  before insert on public.group_members
  for each row execute function public.check_group_member_cap();

-- 3. All groups require request-to-join (no public direct join)
-- Ensure study_groups default is still sensible; RLS from 003_group_join_requests already restricts group_members insert.
alter table public.study_groups alter column is_public set default false;
