-- Undo summary-email opt-in (A.5 / C). Keep summary_read_at + mark_summary_read.
-- Safe on DBs that never had these columns (fresh install after 0013 without email).

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'email_summary'
  ) then
    execute 'revoke update (email_summary) on table public.profiles from authenticated';
  end if;
end $$;

alter table public.profiles
  drop column if exists email_summary;

alter table public.days
  drop column if exists summary_emailed_at;
