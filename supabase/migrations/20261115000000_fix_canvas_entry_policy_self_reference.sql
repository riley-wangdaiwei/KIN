-- Fix the canvas_entries INSERT/UPDATE policies on the live project.
--
-- What was wrong: the live policies (named "Users can insert/update own
-- entries") were NOT the ones in 20260705000000_gifting_identity_canvas.sql
-- (named "Owners can add/move canvas entries"). Their WITH CHECK compared
-- the parent note to ITSELF:
--   parent.id = parent.related_entry_id
--   parent.person_id IS NOT DISTINCT FROM parent.person_id
-- A text note's own related_entry_id is always NULL (enforced by the table
-- CHECK), so the first condition is always false, EXISTS is always false,
-- and EVERY image attached to a text note was rejected by RLS. (Standalone
-- images, with related_entry_id NULL, were unaffected.) The second condition
-- is always true, so the person-match check was a no-op.
--
-- The repo's original migration had the correct unqualified references
-- (related_entry_id / person_id = the NEW row's columns). Drop both name
-- variants and recreate with the correct definitions, converging live to
-- the repo file.
--
-- CORRECTION 2026-11-15 18:13: the above assumption was WRONG. Unqualified
-- column references inside the policy's subquery resolve to the subquery's
-- own FROM item (the "parent" alias), NOT to the new row — Postgres stored
-- the recreated policies as parent.id = parent.related_entry_id, i.e. still
-- self-referential. The new row's columns MUST be qualified with the table
-- name (canvas_entries.related_entry_id / canvas_entries.person_id). The
-- statements below use the qualified form throughout.
drop policy if exists "Users can insert own entries" on public.canvas_entries;
drop policy if exists "Users can update own entries" on public.canvas_entries;
drop policy if exists "Owners can add canvas entries" on public.canvas_entries;
drop policy if exists "Owners can move canvas entries" on public.canvas_entries;

create policy "Owners can add canvas entries"
  on public.canvas_entries for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      person_id is null
      or exists (
        select 1 from public.canvas_people p
        where p.id = canvas_entries.person_id and p.user_id = auth.uid()
      )
    )
    and (
      related_entry_id is null
      or exists (
        select 1 from public.canvas_entries parent
        where parent.id = canvas_entries.related_entry_id
          and parent.user_id = auth.uid()
          and parent.kind = 'text'
          and parent.person_id is not distinct from canvas_entries.person_id
      )
    )
  );

create policy "Owners can move canvas entries"
  on public.canvas_entries for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      person_id is null
      or exists (
        select 1 from public.canvas_people p
        where p.id = canvas_entries.person_id and p.user_id = auth.uid()
      )
    )
    and (
      related_entry_id is null
      or exists (
        select 1 from public.canvas_entries parent
        where parent.id = canvas_entries.related_entry_id
          and parent.user_id = auth.uid()
          and parent.kind = 'text'
          and parent.person_id is not distinct from canvas_entries.person_id
      )
    )
  );
