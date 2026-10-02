-- Log every AI model attempt for debugging (select-own; insert via RPC only).

create table public.ai_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task text not null,
  model text not null,
  ok boolean not null,
  error text,
  duration_ms int not null default 0,
  input text,
  created_at timestamptz not null default now()
);

create index ai_calls_user_created_idx
  on public.ai_calls (user_id, created_at desc);

alter table public.ai_calls enable row level security;

create policy "own ai_calls: select" on public.ai_calls for select
  using (user_id = auth.uid());

-- Inserts only through this function (stamps auth.uid()).
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
    left(p_input, 2000)
  );
end;
$$;

revoke all on function public.log_ai_call(text, text, boolean, text, int, text) from public;
grant execute on function public.log_ai_call(text, text, boolean, text, int, text) to authenticated;
