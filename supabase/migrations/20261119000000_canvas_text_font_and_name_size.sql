alter table public.canvas_entries
  add column if not exists font_size integer;
alter table public.canvas_entries
  drop constraint if exists canvas_entries_font_size_range;
alter table public.canvas_entries
  add constraint canvas_entries_font_size_range
  check (font_size is null or (font_size >= 14 and font_size <= 80));

alter table public.canvas_people
  add column if not exists name_size integer;
alter table public.canvas_people
  drop constraint if exists canvas_people_name_size_range;
alter table public.canvas_people
  add constraint canvas_people_name_size_range
  check (name_size is null or (name_size >= 24 and name_size <= 240));
