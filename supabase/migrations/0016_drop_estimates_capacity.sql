-- Drop planned-time estimates and daily capacity. Keep spent_ms / actual_minutes
-- for the focus timer. Rewrite finish_split before dropping est_minutes.

create or replace function public.finish_split(p_claim_id uuid, p_notes jsonb, p_warning text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  r public.split_requests;
begin
  select * into r from public.split_requests
  where user_id = auth.uid() and claim_id = p_claim_id and status = 'pending'
  for update;

  if not found then
    raise exception 'split claim lost';
  end if;

  insert into public.notes (
    id, user_id, day_id, title, detail, actual_minutes, spent_ms,
    energy, status, color, shape, x, y, rotation, started_at, carried_from
  )
  select
    n.id, auth.uid(), r.day_id, n.title, n.detail, n.actual_minutes, n.spent_ms,
    n.energy, n.status, n.color, n.shape, n.x, n.y, n.rotation, n.started_at, n.carried_from
  from jsonb_populate_recordset(null::public.notes, p_notes) as n;

  update public.split_requests
  set status = 'done',
      note_ids = coalesce((select array_agg((e ->> 'id')::uuid) from jsonb_array_elements(p_notes) as e), '{}'),
      warning = p_warning,
      touched_at = now()
  where user_id = auth.uid() and claim_id = p_claim_id;
end;
$$;

-- Column grants are additive; clear capacity before the column goes away.
revoke update (capacity_minutes) on table public.profiles from authenticated;

alter table public.notes drop column if exists est_minutes;

alter table public.profiles drop constraint if exists profiles_capacity_minutes_range;
alter table public.profiles drop column if exists capacity_minutes;
alter table public.days drop column if exists capacity_minutes;
