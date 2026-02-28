-- Direct Messages
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index idx_dm_sender on public.direct_messages(sender_id);
create index idx_dm_receiver on public.direct_messages(receiver_id);
create index idx_dm_created on public.direct_messages(created_at desc);

alter table public.direct_messages enable row level security;

-- Users can read messages they sent or received
create policy "Users can read own DMs"
  on public.direct_messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Users can send messages (insert where they are the sender)
create policy "Users can send DMs"
  on public.direct_messages for insert
  with check (auth.uid() = sender_id);

-- Users can mark messages as read (update is_read on received messages)
create policy "Users can mark DMs as read"
  on public.direct_messages for update
  using (auth.uid() = receiver_id);

-- Enable realtime for direct_messages
alter publication supabase_realtime add table public.direct_messages;

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- 'new_dm', 'new_answer', 'session_reminder', 'group_joined'
  title text not null,
  body text not null default '',
  link text, -- app route to navigate to
  is_read boolean default false,
  created_at timestamptz default now()
);

create index idx_notif_user on public.notifications(user_id);
create index idx_notif_unread on public.notifications(user_id, is_read) where is_read = false;
create index idx_notif_created on public.notifications(created_at desc);

alter table public.notifications enable row level security;

-- Users can only read their own notifications
create policy "Users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Authenticated users can insert notifications (for triggering from client or edge functions)
create policy "Authenticated users can create notifications"
  on public.notifications for insert
  with check (auth.role() = 'authenticated');

-- Users can mark their own notifications as read
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Enable realtime for notifications
alter publication supabase_realtime add table public.notifications;
