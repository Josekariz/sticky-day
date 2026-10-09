-- Note shapes, the profile's shape for new notes, and the first-visit flag.

alter table public.notes
  add column shape text not null default 'square'
    constraint notes_shape_check
    check (shape in ('square', 'rounded', 'circle', 'heart', 'pill'));

-- default_shape null = a random mix for new notes.
-- onboarded_at null = the first-visit card has not been answered yet.
alter table public.profiles
  add column default_shape text
    constraint profiles_default_shape_check
    check (default_shape is null or default_shape in ('square', 'rounded', 'circle', 'heart', 'pill')),
  add column onboarded_at timestamptz;

-- Profile UPDATE is column-granted (0004); the board and profile form may write these.
grant update (default_shape, onboarded_at) on table public.profiles to authenticated;
