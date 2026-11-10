create table if not exists public.canvas_people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  created_at timestamptz not null default now()
);

create table if not exists public.canvas_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  person_id uuid references public.canvas_people (id) on delete set null,
  related_entry_id uuid references public.canvas_entries (id) on delete cascade,
  kind text not null check (kind in ('text', 'image', 'sticker')),
  content text not null default '' check (char_length(content) <= 1000),
  storage_path text,
  created_at timestamptz not null default now(),
  check (
    (kind = 'text' and storage_path is null and related_entry_id is null)
    or (kind = 'image' and storage_path is not null)
    or (kind = 'sticker' and storage_path is null and content = 'pot')
  )
);

create index if not exists canvas_people_owner_idx
  on public.canvas_people (user_id, created_at);
create index if not exists canvas_entries_owner_person_idx
  on public.canvas_entries (user_id, person_id, created_at);
create index if not exists canvas_entries_related_idx
  on public.canvas_entries (related_entry_id);

alter table public.canvas_people enable row level security;
alter table public.canvas_entries enable row level security;

create policy "Owners can read canvas people"
  on public.canvas_people for select to authenticated
  using (user_id = auth.uid());
create policy "Owners can add canvas people"
  on public.canvas_people for insert to authenticated
  with check (user_id = auth.uid());
create policy "Owners can rename canvas people"
  on public.canvas_people for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "Owners can delete canvas people"
  on public.canvas_people for delete to authenticated
  using (user_id = auth.uid());

create policy "Owners can read canvas entries"
  on public.canvas_entries for select to authenticated
  using (user_id = auth.uid());
create policy "Owners can add canvas entries"
  on public.canvas_entries for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      person_id is null
      or exists (
        select 1 from public.canvas_people p
        where p.id = person_id and p.user_id = auth.uid()
      )
    )
    and (
      related_entry_id is null
      or exists (
        select 1 from public.canvas_entries parent
        where parent.id = related_entry_id
          and parent.user_id = auth.uid()
          and parent.kind = 'text'
          and parent.person_id is not distinct from person_id
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
        where p.id = person_id and p.user_id = auth.uid()
      )
    )
    and (
      related_entry_id is null
      or exists (
        select 1 from public.canvas_entries parent
        where parent.id = related_entry_id
          and parent.user_id = auth.uid()
          and parent.kind = 'text'
          and parent.person_id is not distinct from person_id
      )
    )
  );
create policy "Owners can delete canvas entries"
  on public.canvas_entries for delete to authenticated
  using (user_id = auth.uid());

revoke all on public.canvas_people, public.canvas_entries from anon, public;
grant select, insert, update, delete
  on public.canvas_people, public.canvas_entries to authenticated;

create or replace function public.move_canvas_entry(
  p_entry_id uuid,
  p_person_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  entry_kind text;
  previous_person_id uuid;
begin
  if p_person_id is not null and not exists (
    select 1 from public.canvas_people
    where id = p_person_id and user_id = auth.uid()
  ) then
    raise exception 'The destination person does not exist.';
  end if;

  select kind, person_id
    into entry_kind, previous_person_id
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
  elsif previous_person_id is distinct from p_person_id then
    update public.canvas_entries
      set person_id = p_person_id,
          related_entry_id = null
      where id = p_entry_id and user_id = auth.uid();
  else
    update public.canvas_entries
      set person_id = p_person_id
      where id = p_entry_id and user_id = auth.uid();
  end if;
end;
$$;

revoke all on function public.move_canvas_entry(uuid, uuid) from public;
grant execute on function public.move_canvas_entry(uuid, uuid) to authenticated;

create table if not exists public.canvas_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  person_id uuid references public.canvas_people (id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create index if not exists canvas_shares_token_idx
  on public.canvas_shares (token);

alter table public.canvas_shares enable row level security;

create policy "Owners can manage their canvas shares"
  on public.canvas_shares for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      person_id is null
      or exists (
        select 1 from public.canvas_people p
        where p.id = person_id and p.user_id = auth.uid()
      )
    )
  );

revoke all on public.canvas_shares from anon, public;
grant select, insert, update, delete on public.canvas_shares to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'canvas-images',
  'canvas-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Owners can read their canvas images"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'canvas-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Owners can upload their canvas images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'canvas-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Owners can remove their canvas images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'canvas-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
