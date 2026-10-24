-- Documents owned by authenticated users.
-- Ownership, writable columns, size limits and versioning are enforced here,
-- so the browser can talk to PostgREST directly under Row-Level Security.

create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null default 'Untitled' check (char_length(title) between 1 and 200),
  content     text not null default '' check (octet_length(content) <= 1048576),
  version     integer not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index documents_user_updated_idx on public.documents (user_id, updated_at desc);

alter table public.documents enable row level security;

create policy documents_select_own on public.documents
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy documents_insert_own on public.documents
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy documents_update_own on public.documents
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy documents_delete_own on public.documents
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Clients may only write title/content; id, user_id, version and timestamps are server-owned.
revoke all on public.documents from anon;
revoke all on public.documents from authenticated;
grant select, delete on public.documents to authenticated;
grant insert (title, content) on public.documents to authenticated;
grant update (title, content) on public.documents to authenticated;

-- version tracks content only, so a rename never conflicts with an in-flight autosave.
create or replace function public.documents_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.content is distinct from old.content then
    new.version := old.version + 1;
  end if;
  if new.content is distinct from old.content or new.title is distinct from old.title then
    new.updated_at := now();
  end if;
  return new;
end
$$;

create trigger documents_before_update
  before update on public.documents
  for each row execute function public.documents_before_update();

-- Cap documents per user to bound abuse (RLS scopes the count to the caller's rows).
create or replace function public.documents_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.documents where user_id = new.user_id) >= 1000 then
    raise exception 'document limit reached' using errcode = 'P0001';
  end if;
  return new;
end
$$;

create trigger documents_before_insert
  before insert on public.documents
  for each row execute function public.documents_before_insert();
