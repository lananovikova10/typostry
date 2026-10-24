-- Run with: supabase test db
begin;
select plan(11);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.com');

-- Alice creates a document
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into public.documents (title, content) values ('Alice doc', 'hello');

select is(
  (select user_id from public.documents where title = 'Alice doc'),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'user_id defaults to the caller'
);

select is((select version from public.documents where title = 'Alice doc'), 1, 'new document starts at version 1');

update public.documents set title = 'Alice renamed' where title = 'Alice doc';
select is((select version from public.documents where title = 'Alice renamed'), 1, 'rename does not bump version');

update public.documents set content = 'hello again' where title = 'Alice renamed';
select is((select version from public.documents where title = 'Alice renamed'), 2, 'content change bumps version');

select throws_ok(
  $$ update public.documents set version = 99 $$,
  '42501',
  null,
  'version is not writable by clients'
);

select throws_ok(
  $$ update public.documents set user_id = '22222222-2222-2222-2222-222222222222' $$,
  '42501',
  null,
  'user_id is not writable by clients'
);

select throws_ok(
  $$ insert into public.documents (title, content, user_id) values ('x', 'y', '22222222-2222-2222-2222-222222222222') $$,
  '42501',
  null,
  'user_id cannot be set on insert'
);

-- Bob cannot see or change Alice's document
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is((select count(*) from public.documents)::int, 0, 'other users rows are invisible');

update public.documents set content = 'pwned';
delete from public.documents;

set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select is(
  (select content from public.documents where title = 'Alice renamed'),
  'hello again',
  'other users cannot update or delete rows'
);

-- Anonymous visitors get nothing
reset role;
set local role anon;
select throws_ok($$ select * from public.documents $$, '42501', null, 'anon cannot read documents');

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_ok(
  $$ insert into public.documents (title) values ('') $$,
  '23514',
  null,
  'empty titles are rejected'
);

select * from finish();
rollback;
