-- Today in the user's timezone; tighten write policies; profile bounds; AI quota counters.

-- Calendar date for auth.uid() in their profile timezone (UTC fallback).
-- Bad timezone strings must not break RLS — fall back to current_date.
create or replace function public.user_today()
returns date
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return (
    now() at time zone coalesce(
      (select timezone from public.profiles where id = auth.uid()),
      'UTC'
    )
  )::date;
exception
  when others then
    return current_date;
end;
$$;

-- ---------- notes: today only (user tz), including insert ----------

drop policy if exists "own notes: insert" on public.notes;
drop policy if exists "own notes: update today" on public.notes;
drop policy if exists "own notes: delete today" on public.notes;

create policy "own notes: insert today" on public.notes for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.days d
      where d.id = day_id
        and d.user_id = auth.uid()
        and d.date = public.user_today()
    )
  );

create policy "own notes: update today" on public.notes for update
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.days d
      where d.id = day_id and d.date = public.user_today()
    )
  );

create policy "own notes: delete today" on public.notes for delete
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.days d
      where d.id = day_id and d.date = public.user_today()
    )
  );

-- ---------- days: select/insert any owned; update today only; no delete ----------

drop policy if exists "own days" on public.days;

create policy "own days: select" on public.days for select
  using (user_id = auth.uid());

create policy "own days: insert" on public.days for insert
  with check (user_id = auth.uid());

create policy "own days: update today" on public.days for update
  using (user_id = auth.uid() and date = public.user_today())
  with check (user_id = auth.uid() and date = public.user_today());

-- ---------- profiles: bounds + AI daily counter ----------

alter table public.profiles
  add column if not exists ai_calls_date date,
  add column if not exists ai_calls_count int not null default 0;

alter table public.profiles
  drop constraint if exists profiles_capacity_minutes_range,
  drop constraint if exists profiles_display_name_length,
  drop constraint if exists profiles_timezone_format;

alter table public.profiles
  add constraint profiles_capacity_minutes_range
    check (capacity_minutes between 30 and 960),
  add constraint profiles_display_name_length
    check (display_name is null or length(display_name) <= 60),
  add constraint profiles_timezone_format
    check (timezone ~ '^[A-Za-z_]+(/[A-Za-z_+-]+)*$');
