-- ============================================================
-- Group join requests: users must request to join; admins approve/reject
-- ============================================================

create table public.group_join_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(group_id, user_id)
);

create index idx_group_join_requests_group on public.group_join_requests(group_id);
create index idx_group_join_requests_user on public.group_join_requests(user_id);
create index idx_group_join_requests_status on public.group_join_requests(status);

-- ============================================================
-- RLS for group_join_requests
-- ============================================================
alter table public.group_join_requests enable row level security;

-- Users can see their own requests
create policy "Users can view own join requests"
  on public.group_join_requests for select
  using (auth.uid() = user_id);

-- Group admins can view all requests for their group
create policy "Group admins can view join requests for their group"
  on public.group_join_requests for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_join_requests.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'admin'
    )
  );

-- Authenticated users can create a request for themselves (one per group)
create policy "Users can request to join a group"
  on public.group_join_requests for insert
  with check (auth.uid() = user_id);

-- Group admins can update (approve/reject) requests for their group
create policy "Group admins can update join requests"
  on public.group_join_requests for update
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_join_requests.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'admin'
    )
  );

-- Users can update their own request (e.g. re-request after rejection)
create policy "Users can update own join request"
  on public.group_join_requests for update
  using (auth.uid() = user_id);

-- ============================================================
-- Restrict group_members: no direct join; only via approved request or admin add
-- ============================================================
drop policy if exists "Users can join groups" on public.group_members;

-- Group creator can add themselves as admin when creating the group
create policy "Group creator can add self as admin"
  on public.group_members for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.study_groups sg
      where sg.id = group_members.group_id
        and sg.created_by = auth.uid()
    )
  );

-- Group admins can add other members (e.g. when approving a join request)
create policy "Group admins can add members"
  on public.group_members for insert
  with check (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'admin'
    )
  );
