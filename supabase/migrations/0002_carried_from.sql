-- Tag notes that rolled over from a previous day.
-- Null for notes written today; set once on first rollover and kept across further carries.

alter table public.notes
  add column carried_from date;
