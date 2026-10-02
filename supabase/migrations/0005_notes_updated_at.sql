-- Any note change bumps updated_at so "Your day" can detect a stale summary.

alter table public.notes
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.touch_notes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists notes_touch_updated_at on public.notes;
create trigger notes_touch_updated_at
  before update on public.notes
  for each row execute function public.touch_notes_updated_at();
