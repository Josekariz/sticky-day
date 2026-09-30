-- Sticky Day: profiles, days and notes, locked to their owner.

-- ---------- tables ----------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  capacity_minutes int not null default 360,
  created_at timestamptz not null default now()
);

create table public.days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  brain_dump text,
  summary text,
  capacity_minutes int not null default 360,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id uuid not null references public.days(id) on delete cascade,
  title text not null,
  detail text not null default '',
  est_minutes int not null default 30,
  actual_minutes int,
  spent_ms bigint not null default 0,
  energy text not null default 'medium' check (energy in ('low','medium','high')),
  status text not null default 'board' check (status in ('board','focus','done','trashed')),
  color text not null default 'yellow',
  x real not null default 0.1 check (x between 0 and 1),
  y real not null default 0.1 check (y between 0 and 1),
  rotation real not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index notes_day_idx on public.notes(day_id);
create index days_user_date_idx on public.days(user_id, date desc);

-- ---------- focus cap: at most 3 notes in focus per day ----------

create function public.enforce_focus_cap() returns trigger
language plpgsql as $$
begin
  if new.status = 'focus' and (
    select count(*) from public.notes
    where day_id = new.day_id and status = 'focus' and id <> new.id
  ) >= 3 then
    raise exception 'focus cap reached';
  end if;
  return new;
end $$;

create trigger notes_focus_cap
  before insert or update of status on public.notes
  for each row execute function public.enforce_focus_cap();

-- ---------- row-level security ----------

alter table public.profiles enable row level security;
alter table public.days     enable row level security;
alter table public.notes    enable row level security;

create policy "own profile" on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

create policy "own days" on public.days for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own notes: read" on public.notes for select
  using (user_id = auth.uid());

create policy "own notes: insert" on public.notes for insert
  with check (user_id = auth.uid());

-- only today's notes can change; past days are read-only
create policy "own notes: update today" on public.notes for update
  using (
    user_id = auth.uid()
    and exists (select 1 from public.days d where d.id = day_id and d.date = current_date)
  );

create policy "own notes: delete today" on public.notes for delete
  using (
    user_id = auth.uid()
    and exists (select 1 from public.days d where d.id = day_id and d.date = current_date)
  );

-- ---------- profile row on sign-up ----------

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- users who signed up before this trigger existed
insert into public.profiles (id, display_name)
select id, raw_user_meta_data ->> 'full_name' from auth.users
on conflict (id) do nothing;