-- Let a signed-in user delete their own account.
-- profiles, days, notes and ai_calls all reference auth.users(id) with
-- on delete cascade (0001, 0006), so removing the auth row removes them too.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
