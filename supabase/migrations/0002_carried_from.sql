-- Tag notes that rolled over from a previous day.
-- Null for notes written today; set once on first rollover and kept across further carries.

alter table public.notes
  add column carried_from date;

-- Cache the whole summarize result, not just the recap:
-- { recap, carryOver, dropSuggestions, model, createdAt }.
-- Existing text recaps are kept with empty lists.

alter table public.days
  alter column summary type jsonb
  using case
    when summary is null then null
    else jsonb_build_object(
      'recap', summary,
      'carryOver', '[]'::jsonb,
      'dropSuggestions', '[]'::jsonb,
      'model', 'unknown',
      'createdAt', to_jsonb(created_at)
    )
  end;
