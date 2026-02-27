-- Add admin flag and policies for reports admin tooling

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create policy "Admins can view all reports"
  on public.reports for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "Admins can update reports"
  on public.reports for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

