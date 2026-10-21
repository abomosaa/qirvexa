create table public.qirvexa_projects (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check (length(name) between 1 and 120),
 client text not null check (length(client) between 1 and 100),
 category text not null check (category in ('web','app','design','commerce')),
 status text not null default 'active' check (status in ('active','review','done')),
 amount numeric(12,2) not null check (amount between 0 and 999999999),
 paid boolean not null default false,
 due_date date not null,
 created_at timestamptz not null default now()
);
create index qirvexa_projects_owner_created on public.qirvexa_projects(user_id,created_at desc);
alter table public.qirvexa_projects enable row level security;
grant select,insert,update,delete on public.qirvexa_projects to authenticated;
revoke all on public.qirvexa_projects from anon;
create policy "owner reads projects" on public.qirvexa_projects for select to authenticated using ((select auth.uid())=user_id);
create policy "owner creates projects" on public.qirvexa_projects for insert to authenticated with check ((select auth.uid())=user_id);
create policy "owner updates projects" on public.qirvexa_projects for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "owner deletes projects" on public.qirvexa_projects for delete to authenticated using ((select auth.uid())=user_id);
create table public.qirvexa_briefs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 title text not null check (length(title) between 1 and 120),
 content text not null check (length(content)<=20000),
 created_at timestamptz not null default now()
);
create index qirvexa_briefs_owner_created on public.qirvexa_briefs(user_id,created_at desc);
alter table public.qirvexa_briefs enable row level security;
grant select,insert,update,delete on public.qirvexa_briefs to authenticated;
revoke all on public.qirvexa_briefs from anon;
create policy "owner reads briefs" on public.qirvexa_briefs for select to authenticated using ((select auth.uid())=user_id);
create policy "owner creates briefs" on public.qirvexa_briefs for insert to authenticated with check ((select auth.uid())=user_id);
create policy "owner updates briefs" on public.qirvexa_briefs for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "owner deletes briefs" on public.qirvexa_briefs for delete to authenticated using ((select auth.uid())=user_id);
