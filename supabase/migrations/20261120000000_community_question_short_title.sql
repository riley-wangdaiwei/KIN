-- Short titles for the weekly community questions, shown in the
-- community waterfall (left half). The question canvas page keeps the
-- full question as its title, and the canvas answer prompt shows the
-- full question too — only the waterfall items shorten.
alter table public.community_questions
  add column if not exists short_title text
    check (short_title is null or char_length(short_title) between 1 and 120);

-- The current question: "what were the most special gifts that you made"
-- shows as just "special gifts" in the waterfall.
update public.community_questions
  set short_title = 'special gifts'
  where is_current
    and question = 'what were the most special gifts that you made';
