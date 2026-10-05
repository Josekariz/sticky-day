-- Say hi messages from the About page. Written only through submit_message
-- (called by POST /api/contact); read only from the Supabase dashboard.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  message text not null check (char_length(message) between 1 and 2000),
  email text check (email is null or char_length(email) between 3 and 254),
  ip_hash text not null check (char_length(ip_hash) = 64),
  created_at timestamptz not null default now()
);

create index messages_ip_created_idx on public.messages (ip_hash, created_at desc);

-- RLS on with no policies: anon and authenticated can't touch rows directly.
alter table public.messages enable row level security;
revoke all on table public.messages from anon, authenticated;

-- Returns 'ok' when saved, 'rate_limited' after 5 messages from one IP hash in an hour.
create or replace function public.submit_message(
  p_name text,
  p_message text,
  p_email text,
  p_ip_hash text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_message text := btrim(coalesce(p_message, ''));
  v_email text := nullif(btrim(coalesce(p_email, '')), '');
begin
  if char_length(v_name) not between 1 and 80
    or char_length(v_message) not between 1 and 2000
    or (v_email is not null and char_length(v_email) not between 3 and 254)
    or p_ip_hash is null or char_length(p_ip_hash) <> 64
  then
    raise exception 'invalid message' using errcode = '22023';
  end if;

  -- Serialise per IP hash so two parallel requests can't both pass the count.
  perform pg_advisory_xact_lock(hashtext(p_ip_hash));

  if (
    select count(*) from public.messages
    where ip_hash = p_ip_hash and created_at > now() - interval '1 hour'
  ) >= 5 then
    return 'rate_limited';
  end if;

  insert into public.messages (name, message, email, ip_hash)
  values (v_name, v_message, v_email, p_ip_hash);

  return 'ok';
end;
$$;

revoke all on function public.submit_message(text, text, text, text) from public;
grant execute on function public.submit_message(text, text, text, text) to anon, authenticated;
