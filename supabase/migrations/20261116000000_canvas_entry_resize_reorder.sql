alter table public.canvas_entries
  add column if not exists image_size integer;

alter table public.canvas_entries
  add constraint canvas_entries_image_size_check
  check (image_size is null or image_size between 16 and 10000);

-- Allow the provided public stickers and user-uploaded stickers alongside old pot rows.
do $$
declare
  existing_check text;
begin
  for existing_check in
    select conname
    from pg_constraint
    where conrelid = 'public.canvas_entries'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%related_entry_id%'
      and pg_get_constraintdef(oid) like '%storage_path%'
  loop
    execute format('alter table public.canvas_entries drop constraint %I', existing_check);
  end loop;
end;
$$;

alter table public.canvas_entries
  add constraint canvas_entries_kind_storage_check
  check (
    (kind = 'text' and storage_path is null and related_entry_id is null)
    or (kind = 'image' and storage_path is not null)
    or (
      kind = 'sticker'
      and (
        (storage_path is not null and storage_path not like '/%')
        or (
          storage_path = '/pot.jpg' and content = 'pot'
        )
        or (
          storage_path like '/stickers/%'
          and content in ('humankind', 'rekin', 'love', 'foto')
        )
        or (storage_path is null and content = 'pot')
      )
    )
  );

create or replace function public.reorder_canvas_entry(
  p_entry_id uuid,
  p_person_id uuid,
  p_before_entry_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  entry_kind text;
  ordered_id uuid;
  ordered_ids uuid[] := array[]::uuid[];
begin
  if p_person_id is not null and not exists (
    select 1 from public.canvas_people
    where id = p_person_id and user_id = auth.uid()
  ) then
    raise exception 'The destination person does not exist.';
  end if;

  select kind
    into entry_kind
    from public.canvas_entries
    where id = p_entry_id and user_id = auth.uid();

  if not found then
    raise exception 'The canvas entry does not exist.';
  end if;

  if entry_kind = 'text' then
    update public.canvas_entries
      set person_id = p_person_id
      where id = p_entry_id and user_id = auth.uid();
    update public.canvas_entries
      set person_id = p_person_id
      where related_entry_id = p_entry_id and user_id = auth.uid();
  else
    update public.canvas_entries
      set person_id = p_person_id,
          related_entry_id = null
      where id = p_entry_id and user_id = auth.uid();
  end if;

  if p_before_entry_id is not null and not exists (
    select 1
    from public.canvas_entries
    where id = p_before_entry_id
      and user_id = auth.uid()
      and person_id is not distinct from p_person_id
  ) then
    raise exception 'The position target does not exist in this canvas area.';
  end if;

  for ordered_id in
    select id
    from public.canvas_entries
    where user_id = auth.uid()
      and person_id is not distinct from p_person_id
      and id <> p_entry_id
    order by sort_order, created_at, id
  loop
    if ordered_id = p_before_entry_id then
      ordered_ids := array_append(ordered_ids, p_entry_id);
    end if;
    ordered_ids := array_append(ordered_ids, ordered_id);
  end loop;

  if p_before_entry_id is null then
    ordered_ids := array_append(ordered_ids, p_entry_id);
  elsif array_position(ordered_ids, p_entry_id) is null then
    raise exception 'The position target does not exist in this canvas area.';
  end if;

  update public.canvas_entries as entry
    set sort_order = positions.ordinality
    from unnest(ordered_ids) with ordinality as positions(id, ordinality)
    where entry.id = positions.id
      and entry.user_id = auth.uid();
end;
$$;

revoke all on function public.reorder_canvas_entry(uuid, uuid, uuid) from public;
grant execute on function public.reorder_canvas_entry(uuid, uuid, uuid) to authenticated;
