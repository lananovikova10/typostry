-- Serialize the per-user document cap: without a lock, concurrent inserts
-- can all count 999 rows and each succeed. The transaction-scoped advisory
-- lock is per user, so different users never wait on each other.

create or replace function public.documents_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('documents_quota:' || new.user_id::text, 0));
  if (select count(*) from public.documents where user_id = new.user_id) >= 1000 then
    raise exception 'document limit reached' using errcode = 'P0001';
  end if;
  return new;
end
$$;
