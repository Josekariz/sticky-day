-- One claim per brain dump per day, so a repeated dump never makes a second
-- set of notes or spends the AI quota twice. Stores a hash, never the text.

create table public.split_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id uuid not null references public.days(id) on delete cascade,
  dump_hash text not null check (dump_hash ~ '^[0-9a-f]{64}$'),
  claim_id uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'done')),
  note_ids uuid[] not null default '{}',
  warning text,
  touched_at timestamptz not null default now(),
  primary key (user_id, day_id, dump_hash)
);

create index split_requests_touched_idx on public.split_requests (touched_at);

alter table public.split_requests enable row level security;

create policy "own split_requests: select" on public.split_requests for select
  using (user_id = auth.uid());
create policy "own split_requests: insert" on public.split_requests for insert
  with check (user_id = auth.uid());
create policy "own split_requests: update" on public.split_requests for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own split_requests: delete" on public.split_requests for delete
  using (user_id = auth.uid());

-- Claim a dump in one statement. A new row, a pending claim older than
-- 2 minutes, a done one older than 10, or a done one whose notes have all
-- been deleted is (re)claimed; otherwise report 'busy' or 'done' with the
-- earlier result.
create or replace function public.claim_split(p_day_id uuid, p_hash text)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  r public.split_requests;
begin
  if not exists (
    select 1 from public.days
    where id = p_day_id and user_id = auth.uid() and date = public.user_today()
  ) then
    raise exception 'not today''s board';
  end if;

  insert into public.split_requests as s (user_id, day_id, dump_hash)
  values (auth.uid(), p_day_id, p_hash)
  on conflict (user_id, day_id, dump_hash) do update
    set status = 'pending',
        claim_id = gen_random_uuid(),
        note_ids = '{}',
        warning = null,
        touched_at = now()
    where (s.status = 'pending' and s.touched_at < now() - interval '2 minutes')
       or (s.status = 'done' and s.touched_at < now() - interval '10 minutes')
       or (s.status = 'done' and cardinality(s.note_ids) > 0
           and not exists (select 1 from public.notes n where n.id = any (s.note_ids)))
  returning * into r;

  if found then
    return jsonb_build_object('outcome', 'claimed', 'claim_id', r.claim_id);
  end if;

  select * into r from public.split_requests
  where user_id = auth.uid() and day_id = p_day_id and dump_hash = p_hash;

  if r.status = 'done' then
    return jsonb_build_object('outcome', 'done', 'note_ids', to_jsonb(r.note_ids), 'warning', r.warning);
  end if;
  return jsonb_build_object('outcome', 'busy');
end;
$$;

-- Save the split's notes and mark the claim done in one transaction.
-- Raises (and saves nothing) if the claim was taken over or already finished.
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
    id, user_id, day_id, title, detail, est_minutes, actual_minutes, spent_ms,
    energy, status, color, shape, x, y, rotation, started_at, carried_from
  )
  select
    n.id, auth.uid(), r.day_id, n.title, n.detail, n.est_minutes, n.actual_minutes, n.spent_ms,
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

revoke all on function public.claim_split(uuid, text) from public, anon;
grant execute on function public.claim_split(uuid, text) to authenticated;
revoke all on function public.finish_split(uuid, jsonb, text) from public, anon;
grant execute on function public.finish_split(uuid, jsonb, text) to authenticated;

-- The nightly purge (0008) also clears claims older than a day.
create or replace function public.purge_old_ai_calls()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.ai_calls where created_at < now() - interval '30 days';
  delete from public.split_requests where touched_at < now() - interval '1 day';
$$;

revoke all on function public.purge_old_ai_calls() from public, anon, authenticated;
