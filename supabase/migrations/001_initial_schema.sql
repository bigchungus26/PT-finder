-- ============================================================
-- StudyHub Database Schema
-- ============================================================

-- 1. Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  school text not null default '',
  major text not null default '',
  year text not null default '' check (year in ('Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', '')),
  avatar text,
  bio text,
  study_style text[] not null default '{}',
  goals text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- 2. Courses
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text,
  professor text,
  created_at timestamptz not null default now()
);

-- 3. User-Course enrollment
create table public.user_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique(user_id, course_id)
);

-- 4. Availability time blocks
create table public.availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  day text not null check (day in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time text not null,
  end_time text not null
);

-- 5. Study groups
create table public.study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  course_id uuid not null references public.courses(id) on delete cascade,
  max_members int not null default 8,
  level text not null default 'average' check (level in ('beginner', 'average', 'advanced')),
  tags text[] not null default '{}',
  rules text,
  is_public boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 6. Group members
create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  unique(group_id, user_id)
);

-- 7. Sessions
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  title text not null,
  description text,
  date date not null,
  start_time text not null,
  end_time text not null,
  location text,
  is_online boolean not null default false,
  meeting_link text,
  created_at timestamptz not null default now()
);

-- 8. Session attendees
create table public.session_attendees (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'going' check (status in ('going', 'maybe', 'not-going')),
  unique(session_id, user_id)
);

-- 9. Agenda items
create table public.agenda_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  title text not null,
  duration int not null default 30,
  description text,
  sort_order int not null default 0
);

-- 10. Questions
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  tags text[] not null default '{}',
  is_resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- 11. Answers
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  is_accepted boolean not null default false,
  created_at timestamptz not null default now()
);

-- 12. Question votes (upvotes)
create table public.question_votes (
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (question_id, user_id)
);

-- 13. Answer votes (upvotes)
create table public.answer_votes (
  answer_id uuid not null references public.answers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (answer_id, user_id)
);

-- 14. Chat messages
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now()
);

-- 15. Resources
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null default 'link' check (type in ('link', 'note', 'file')),
  url text,
  course_id uuid references public.courses(id) on delete set null,
  group_id uuid references public.study_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 16. Reports
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  reported_group_id uuid references public.study_groups(id) on delete set null,
  reason text not null,
  description text not null default '',
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index idx_user_courses_user on public.user_courses(user_id);
create index idx_user_courses_course on public.user_courses(course_id);
create index idx_availability_user on public.availability(user_id);
create index idx_study_groups_course on public.study_groups(course_id);
create index idx_group_members_group on public.group_members(group_id);
create index idx_group_members_user on public.group_members(user_id);
create index idx_sessions_group on public.sessions(group_id);
create index idx_session_attendees_session on public.session_attendees(session_id);
create index idx_agenda_items_session on public.agenda_items(session_id);
create index idx_questions_course on public.questions(course_id);
create index idx_questions_user on public.questions(user_id);
create index idx_answers_question on public.answers(question_id);
create index idx_chat_messages_group on public.chat_messages(group_id);
create index idx_chat_messages_created on public.chat_messages(created_at);
create index idx_resources_group on public.resources(group_id);

-- ============================================================
-- Trigger: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Enable Realtime for chat_messages
-- ============================================================
alter publication supabase_realtime add table public.chat_messages;

-- ============================================================
-- Row Level Security
-- ============================================================

-- Profiles
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Courses
alter table public.courses enable row level security;

create policy "Courses are viewable by everyone"
  on public.courses for select
  using (true);

-- User Courses
alter table public.user_courses enable row level security;

create policy "User courses are viewable by everyone"
  on public.user_courses for select
  using (true);

create policy "Users can manage own course enrollments"
  on public.user_courses for insert
  with check (auth.uid() = user_id);

create policy "Users can remove own course enrollments"
  on public.user_courses for delete
  using (auth.uid() = user_id);

-- Availability
alter table public.availability enable row level security;

create policy "Availability is viewable by everyone"
  on public.availability for select
  using (true);

create policy "Users can manage own availability"
  on public.availability for insert
  with check (auth.uid() = user_id);

create policy "Users can update own availability"
  on public.availability for update
  using (auth.uid() = user_id);

create policy "Users can delete own availability"
  on public.availability for delete
  using (auth.uid() = user_id);

-- Study Groups
alter table public.study_groups enable row level security;

create policy "Public groups are viewable by everyone"
  on public.study_groups for select
  using (
    is_public = true
    or created_by = auth.uid()
    or exists (
      select 1 from public.group_members
      where group_members.group_id = study_groups.id
        and group_members.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create groups"
  on public.study_groups for insert
  with check (auth.uid() = created_by);

create policy "Group creators can update their groups"
  on public.study_groups for update
  using (auth.uid() = created_by);

create policy "Group creators can delete their groups"
  on public.study_groups for delete
  using (auth.uid() = created_by);

-- Group Members
alter table public.group_members enable row level security;

create policy "Group members are viewable by everyone"
  on public.group_members for select
  using (true);

create policy "Users can join groups"
  on public.group_members for insert
  with check (auth.uid() = user_id);

create policy "Users can leave groups or admins can remove members"
  on public.group_members for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'admin'
    )
  );

-- Sessions
alter table public.sessions enable row level security;

create policy "Sessions are viewable by group members"
  on public.sessions for select
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = sessions.group_id
        and group_members.user_id = auth.uid()
    )
    or exists (
      select 1 from public.study_groups
      where study_groups.id = sessions.group_id
        and study_groups.is_public = true
    )
  );

create policy "Group admins can create sessions"
  on public.sessions for insert
  with check (
    exists (
      select 1 from public.group_members
      where group_members.group_id = sessions.group_id
        and group_members.user_id = auth.uid()
        and group_members.role = 'admin'
    )
  );

create policy "Group admins can update sessions"
  on public.sessions for update
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = sessions.group_id
        and group_members.user_id = auth.uid()
        and group_members.role = 'admin'
    )
  );

-- Session Attendees
alter table public.session_attendees enable row level security;

create policy "Session attendees are viewable by everyone"
  on public.session_attendees for select
  using (true);

create policy "Users can RSVP to sessions"
  on public.session_attendees for insert
  with check (auth.uid() = user_id);

create policy "Users can update own RSVP"
  on public.session_attendees for update
  using (auth.uid() = user_id);

create policy "Users can remove own RSVP"
  on public.session_attendees for delete
  using (auth.uid() = user_id);

-- Agenda Items
alter table public.agenda_items enable row level security;

create policy "Agenda items are viewable by everyone"
  on public.agenda_items for select
  using (true);

create policy "Group admins can manage agenda items"
  on public.agenda_items for insert
  with check (
    exists (
      select 1 from public.sessions s
      join public.group_members gm on gm.group_id = s.group_id
      where s.id = agenda_items.session_id
        and gm.user_id = auth.uid()
        and gm.role = 'admin'
    )
  );

-- Questions
alter table public.questions enable row level security;

create policy "Questions are viewable by everyone"
  on public.questions for select
  using (true);

create policy "Authenticated users can create questions"
  on public.questions for insert
  with check (auth.uid() = user_id);

create policy "Authors can update own questions"
  on public.questions for update
  using (auth.uid() = user_id);

create policy "Authors can delete own questions"
  on public.questions for delete
  using (auth.uid() = user_id);

-- Answers
alter table public.answers enable row level security;

create policy "Answers are viewable by everyone"
  on public.answers for select
  using (true);

create policy "Authenticated users can create answers"
  on public.answers for insert
  with check (auth.uid() = user_id);

create policy "Authors can update own answers"
  on public.answers for update
  using (auth.uid() = user_id);

create policy "Authors can delete own answers"
  on public.answers for delete
  using (auth.uid() = user_id);

-- Question Votes
alter table public.question_votes enable row level security;

create policy "Question votes are viewable by everyone"
  on public.question_votes for select
  using (true);

create policy "Authenticated users can vote on questions"
  on public.question_votes for insert
  with check (auth.uid() = user_id);

create policy "Users can remove own question votes"
  on public.question_votes for delete
  using (auth.uid() = user_id);

-- Answer Votes
alter table public.answer_votes enable row level security;

create policy "Answer votes are viewable by everyone"
  on public.answer_votes for select
  using (true);

create policy "Authenticated users can vote on answers"
  on public.answer_votes for insert
  with check (auth.uid() = user_id);

create policy "Users can remove own answer votes"
  on public.answer_votes for delete
  using (auth.uid() = user_id);

-- Chat Messages
alter table public.chat_messages enable row level security;

create policy "Group members can view messages"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = chat_messages.group_id
        and group_members.user_id = auth.uid()
    )
  );

create policy "Group members can send messages"
  on public.chat_messages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.group_members
      where group_members.group_id = chat_messages.group_id
        and group_members.user_id = auth.uid()
    )
  );

create policy "Authors can update own messages"
  on public.chat_messages for update
  using (auth.uid() = user_id);

create policy "Authors can delete own messages"
  on public.chat_messages for delete
  using (auth.uid() = user_id);

-- Resources
alter table public.resources enable row level security;

create policy "Resources are viewable by everyone"
  on public.resources for select
  using (true);

create policy "Authenticated users can create resources"
  on public.resources for insert
  with check (auth.uid() = user_id);

create policy "Authors can update own resources"
  on public.resources for update
  using (auth.uid() = user_id);

create policy "Authors can delete own resources"
  on public.resources for delete
  using (auth.uid() = user_id);

-- Reports
alter table public.reports enable row level security;

create policy "Users can create reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "Users can view own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

-- ============================================================
-- Seed Data: Courses
-- ============================================================
insert into public.courses (code, title, professor) values
  ('CS101', 'Introduction to Computer Science', 'Dr. Smith'),
  ('MATH201', 'Calculus II', 'Dr. Johnson'),
  ('PHYS101', 'Physics I', 'Dr. Williams'),
  ('CHEM101', 'General Chemistry', 'Dr. Brown'),
  ('ENG102', 'Academic Writing', 'Dr. Davis'),
  ('PSYCH101', 'Introduction to Psychology', 'Dr. Miller'),
  ('ECON101', 'Principles of Economics', 'Dr. Wilson'),
  ('BIO101', 'Biology I', 'Dr. Taylor');
