-- Account-wide appearance: system (Auto) | light | dark. Default Auto.

alter table public.profiles
  add column if not exists appearance text not null default 'system';

alter table public.profiles
  drop constraint if exists profiles_appearance_check;

alter table public.profiles
  add constraint profiles_appearance_check
    check (appearance in ('system', 'light', 'dark'));

grant update (appearance) on table public.profiles to authenticated;
