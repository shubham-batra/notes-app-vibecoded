create extension if not exists "pgcrypto";

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled note',
  content_md text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.note_tags (
  note_id uuid not null references public.notes(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (note_id, tag_id)
);

create index if not exists idx_notes_user_updated_at on public.notes (user_id, updated_at desc);
create index if not exists idx_note_tags_note_id on public.note_tags (note_id);
create index if not exists idx_note_tags_tag_id on public.note_tags (tag_id);
create index if not exists idx_tags_user_name on public.tags (user_id, name);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_notes_updated_at on public.notes;
create trigger trg_notes_updated_at
before update on public.notes
for each row
execute function public.set_updated_at();

alter table public.notes enable row level security;
alter table public.tags enable row level security;
alter table public.note_tags enable row level security;

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own"
on public.notes
for select
using (auth.uid() = user_id);

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own"
on public.notes
for insert
with check (auth.uid() = user_id);

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own"
on public.notes
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own"
on public.notes
for delete
using (auth.uid() = user_id);

drop policy if exists "tags_select_own" on public.tags;
create policy "tags_select_own"
on public.tags
for select
using (auth.uid() = user_id);

drop policy if exists "tags_insert_own" on public.tags;
create policy "tags_insert_own"
on public.tags
for insert
with check (auth.uid() = user_id);

drop policy if exists "tags_update_own" on public.tags;
create policy "tags_update_own"
on public.tags
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "tags_delete_own" on public.tags;
create policy "tags_delete_own"
on public.tags
for delete
using (auth.uid() = user_id);

drop policy if exists "note_tags_select_own" on public.note_tags;
create policy "note_tags_select_own"
on public.note_tags
for select
using (
  exists (
    select 1
    from public.notes n
    where n.id = note_tags.note_id
      and n.user_id = auth.uid()
  )
);

drop policy if exists "note_tags_insert_own" on public.note_tags;
create policy "note_tags_insert_own"
on public.note_tags
for insert
with check (
  exists (
    select 1
    from public.notes n
    where n.id = note_tags.note_id
      and n.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.tags t
    where t.id = note_tags.tag_id
      and t.user_id = auth.uid()
  )
);

drop policy if exists "note_tags_delete_own" on public.note_tags;
create policy "note_tags_delete_own"
on public.note_tags
for delete
using (
  exists (
    select 1
    from public.notes n
    where n.id = note_tags.note_id
      and n.user_id = auth.uid()
  )
);
