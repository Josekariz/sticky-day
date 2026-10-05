-- Keep less in the AI log, and for less time: 80 characters of input, 30 days.

create or replace function public.log_ai_call(
  p_task text,
  p_model text,
  p_ok boolean,
  p_error text,
  p_duration_ms int,
  p_input text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  insert into public.ai_calls (user_id, task, model, ok, error, duration_ms, input)
  values (
    auth.uid(),
    p_task,
    p_model,
    p_ok,
    left(p_error, 500),
    greatest(coalesce(p_duration_ms, 0), 0),
    left(p_input, 80)
  );
end;
$$;

-- rows written before this migration
update public.ai_calls set input = left(input, 80) where length(input) > 80;

create or replace function public.purge_old_ai_calls()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.ai_calls where created_at < now() - interval '30 days';
$$;

-- Supabase grants new public functions to anon and authenticated by default.
revoke all on function public.purge_old_ai_calls() from public, anon, authenticated;

-- Every Supabase project ships pg_cron; without it the purge has to be run by hand.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    perform cron.schedule('purge-old-ai-calls', '17 3 * * *', 'select public.purge_old_ai_calls()');
  else
    raise warning 'pg_cron not available: run select public.purge_old_ai_calls() daily';
  end if;
end;
$$;
