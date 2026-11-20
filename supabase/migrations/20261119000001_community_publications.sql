-- Community publications + weekly community questions.
--
-- canvas_publications: one row per user while their canvas is published.
-- The public link is /canvas-share/<token>, the same token-link format as
-- the Send-to-re.KIN share; unpublishing deletes the row, which invalidates
-- the token. The re.KIN share (canvas_shares) is untouched.
-- community_questions: the weekly questions. Only one may be current at a
-- time (partial unique index). Answers are canvas_entries rows with
-- question_id set, so an answer lives on the user's own canvas and is
-- collected into the question's community canvas automatically.

create table if not exists public.canvas_publications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now(),
  constraint canvas_publications_one_per_user unique (user_id)
);

create index if not exists canvas_publications_token_idx
  on public.canvas_publications (token);
create index if not exists canvas_publications_created_at_idx
  on public.canvas_publications (created_at desc);

alter table public.canvas_publications enable row level security;

-- Published canvases are public by design: anyone may read them.
create policy "Anyone can read published canvases"
  on public.canvas_publications for select to anon, authenticated
  using (true);

create policy "Owners can manage their own publication"
  on public.canvas_publications for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.canvas_publications from anon, public;
grant select on public.canvas_publications to anon;
grant select, insert, update, delete on public.canvas_publications to authenticated;

create table if not exists public.community_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 1 and 500),
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

-- Only one question may be current at a time.
create unique index if not exists community_questions_one_current_idx
  on public.community_questions (is_current)
  where is_current;

create index if not exists community_questions_created_at_idx
  on public.community_questions (created_at desc);

alter table public.community_questions enable row level security;

create policy "Anyone can read community questions"
  on public.community_questions for select to anon, authenticated
  using (true);

revoke all on public.community_questions from anon, public;
grant select on public.community_questions to anon, authenticated;

-- Seed the first weekly question.
insert into public.community_questions (question, is_current)
values ('what were the most special gifts that you made', true)
on conflict do nothing;

-- An answer is a canvas text entry linked to its question. It stays on the
-- user's own board and is collected into the question's community canvas.
alter table public.canvas_entries
  add column if not exists question_id uuid references public.community_questions (id) on delete set null;

create index if not exists canvas_entries_question_id_idx
  on public.canvas_entries (question_id);
