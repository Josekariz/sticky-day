-- Daily summary schedule: when to auto-write, in the user's timezone.

alter table public.profiles
  add column timezone text not null default 'UTC',
  add column summary_time time not null default '18:00';
