-- Profile page persistence: the user's gifting styles and their named
-- canvases. Both tables are owner-only (RLS: a user manages only their
-- own rows); nothing here is public.
--
-- user_gifting_styles: one row per keyword the user added on their
-- profile. The profile page seeds three starter styles on first load
-- when the table is empty; additions and removals are row operations.
-- profile_canvases: the canvases the user names on their profile with
-- the "+" under the directory. person_id links the entry to a person on
-- the user's board (matched by name when it is added) so the preview
-- shows that person's slice; null means a named canvas with an empty
-- preview for now. The whole board itself is not a row here — it is
-- always the first directory entry, built from the canvas tables.

create table if not exists public.user_gifting_styles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  style text not null check (char_length(style) between 1 and 40),
  created_at timestamptz not null default now()
);

create unique index if not exists user_gifting_styles_one_per_user_style_idx
  on public.user_gifting_styles (user_id, lower(style));

create index if not exists user_gifting_styles_user_created_idx
  on public.user_gifting_styles (user_id, created_at);

alter table public.user_gifting_styles enable row level security;

create policy "Owners can manage their own gifting styles"
  on public.user_gifting_styles for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.user_gifting_styles from anon, public;
grant select, insert, update, delete on public.user_gifting_styles to authenticated;

create table if not exists public.profile_canvases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  person_id uuid references public.canvas_people (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists profile_canvases_one_per_user_name_idx
  on public.profile_canvases (user_id, lower(name));

create index if not exists profile_canvases_user_created_idx
  on public.profile_canvases (user_id, created_at);

alter table public.profile_canvases enable row level security;

create policy "Owners can manage their own profile canvases"
  on public.profile_canvases for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.profile_canvases from anon, public;
grant select, insert, update, delete on public.profile_canvases to authenticated;
