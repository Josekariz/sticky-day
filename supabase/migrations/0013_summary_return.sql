-- Your day return loop: read tracking + mark-read for past days.

alter table public.days
  add column if not exists summary_read_at timestamptz;

-- Past days are read-only under RLS; this only sets summary_read_at for the caller.
create or replace function public.mark_summary_read(p_day_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_id uuid;
begin
  if auth.uid() is null then
    return false;
  end if;

  update public.days
  set summary_read_at = now()
  where id = p_day_id
    and user_id = auth.uid()
    and summary is not null
    and summary_read_at is null
  returning id into updated_id;

  return updated_id is not null;
end;
$$;

revoke all on function public.mark_summary_read(uuid) from public;
grant execute on function public.mark_summary_read(uuid) to authenticated;
