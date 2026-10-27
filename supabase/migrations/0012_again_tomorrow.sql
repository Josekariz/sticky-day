-- One-shot flag: copy a fresh sticky onto the next day when that day is created.

alter table public.notes
  add column if not exists again_tomorrow boolean not null default false;
