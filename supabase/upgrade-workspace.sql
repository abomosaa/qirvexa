-- Additive workspace upgrade draft. Root reviews/applies; no existing rows are changed.
-- This is a review script, not a generated migration-history entry.
begin;

create unique index if not exists qirvexa_projects_id_owner
  on public.qirvexa_projects(id, user_id);

create table if not exists public.qirvexa_project_details (
  project_id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  description text not null default '' check (length(description) <= 6000),
  notes text not null default '' check (length(notes) <= 12000),
  brief text not null default '' check (length(brief) <= 20000),
  updated_at timestamptz not null default now(),
  foreign key (project_id, user_id) references public.qirvexa_projects(id, user_id) on delete cascade
);

create index if not exists qirvexa_project_details_owner
  on public.qirvexa_project_details(user_id, project_id);

create table if not exists public.qirvexa_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (project_id, user_id) references public.qirvexa_projects(id, user_id) on delete cascade
);
create index if not exists qirvexa_tasks_owner_due
  on public.qirvexa_tasks(user_id, due_date, project_id);
create index if not exists qirvexa_tasks_project_owner
  on public.qirvexa_tasks(project_id, user_id);

create table if not exists public.qirvexa_clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  company text not null default '' check (length(company) <= 160),
  email text not null default '' check (length(email) <= 254),
  phone text not null default '' check (length(phone) <= 60),
  notes text not null default '' check (length(notes) <= 6000),
  updated_at timestamptz not null default now(),
  unique(user_id, name)
);

alter table public.qirvexa_project_details enable row level security;
alter table public.qirvexa_tasks enable row level security;
alter table public.qirvexa_clients enable row level security;

revoke all on public.qirvexa_project_details, public.qirvexa_tasks, public.qirvexa_clients from public, anon, authenticated;
grant select, insert, update, delete on public.qirvexa_project_details, public.qirvexa_tasks, public.qirvexa_clients to authenticated;

-- Each FOR ALL policy has SELECT visibility, existing-row authorization and new-row validation.
create policy "owner manages project details" on public.qirvexa_project_details
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "owner manages tasks" on public.qirvexa_tasks
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "owner manages clients" on public.qirvexa_clients
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

commit;
