alter table public.canvas_people
  add column if not exists pos_x integer;
alter table public.canvas_people
  add column if not exists pos_y integer;
alter table public.canvas_entries
  add column if not exists pos_x integer;
alter table public.canvas_entries
  add column if not exists pos_y integer;
