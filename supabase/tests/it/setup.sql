-- Usuários/organização para o teste de integração do repositório Supabase (PostgREST local).
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    create role authenticator login noinherit;
  end if;
end $$;
grant anon, authenticated, service_role to authenticator;
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated, service_role;
grant all on all sequences in schema public to authenticated, service_role;
grant execute on all functions in schema public to authenticated, service_role;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@it.test'),
  ('00000000-0000-0000-0000-0000000000b1', 'operador@it.test'),
  ('00000000-0000-0000-0000-0000000000c1', 'viewer@it.test');
insert into public.organizations (id, name) values ('00000000-0000-0000-0000-00000000f001', 'Org IT');
insert into public.user_roles (user_id, organization_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000f001', 'ADMIN'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000f001', 'OPERATOR'),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000f001', 'VIEWER');
