-- Teste de RLS, ciclo de vida das execuções, isolamento sandbox e auditoria.
-- Execução: ver supabase/tests/README.md (Postgres puro + 00_supabase_stub.sql + migrações).
\set ON_ERROR_STOP 1

create or replace function pg_temp.as_user(_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', _uid, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

create or replace function pg_temp.expect_error(_sql text, _label text) returns void language plpgsql as $$
begin
  begin
    execute _sql;
  exception when others then
    raise notice 'OK (bloqueado): % — %', _label, sqlerrm;
    return;
  end;
  raise exception 'FALHA: deveria ter sido bloqueado: %', _label;
end $$;

create or replace function pg_temp.expect_count(_sql text, _n int, _label text) returns void language plpgsql as $$
declare _c int;
begin
  execute 'select count(*) from (' || _sql || ') x' into _c;
  if _c <> _n then raise exception 'FALHA: % — esperado %, obtido %', _label, _n, _c; end if;
  raise notice 'OK: % (%)', _label, _c;
end $$;

-- usuários
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@coop.test'),
  ('00000000-0000-0000-0000-00000000000b', 'operador@coop.test'),
  ('00000000-0000-0000-0000-00000000000c', 'viewer@coop.test'),
  ('00000000-0000-0000-0000-00000000000d', 'intruso@outra.test');

-- ADMIN cria organização (RPC) e atribui papéis
begin;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select public.create_organization('Sistema Coop Teste') as org \gset
insert into public.user_roles (user_id, organization_id, role) values
  ('00000000-0000-0000-0000-00000000000b', :'org', 'OPERATOR'),
  ('00000000-0000-0000-0000-00000000000c', :'org', 'VIEWER');
insert into public.events (id, organization_id, name, sandbox) values
  ('10000000-0000-0000-0000-000000000001', :'org', 'Evento Produção', false),
  ('10000000-0000-0000-0000-000000000002', :'org', 'Sandbox A', true);
insert into public.event_tables (event_id, table_number, name) values
  ('10000000-0000-0000-0000-000000000001', 1, 'Mesa 1'),
  ('10000000-0000-0000-0000-000000000002', 1, 'Mesa 1');
insert into public.sessions (event_id, session_index, name) values
  ('10000000-0000-0000-0000-000000000001', 0, 'Sessão 1'),
  ('10000000-0000-0000-0000-000000000002', 0, 'Sessão 1');
commit;

-- OPERATOR opera o evento
begin;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
insert into public.participants (id, event_id, name, company) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ana', 'Coop A'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Bruno', 'Coop B'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Carla (sandbox)', 'Coop C');
insert into public.participant_preferences (event_id, source_participant_id, target_participant_id, relationship_type) values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'PREFER'),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'HIGH_PRIORITY');
select pg_temp.expect_count('select * from public.participant_mutual_interest', 1, 'interesse mútuo detectado automaticamente');
select pg_temp.expect_count('select * from public.participant_demand where inbound_demand = 1', 2, 'demanda inbound');
-- sandbox nunca referencia produção
select pg_temp.expect_error($$insert into public.participant_preferences (event_id, source_participant_id, target_participant_id)
  values ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001')$$,
  'preferência cruzando sandbox → produção');
insert into public.optimization_runs (id, event_id, mode, optimizer_version, seed, status) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'MNBD_V2', 'mnbd-2.0.0', 1, 'SIMULATED');
select pg_temp.expect_error($$insert into public.optimization_runs (event_id, mode, optimizer_version, status)
  values ('10000000-0000-0000-0000-000000000001', 'MNBD_V2', 'x', 'PUBLISHED')$$, 'execução nascendo publicada');
select pg_temp.expect_error($$insert into public.assignments (optimization_run_id, session_index, participant_id)
  values ('30000000-0000-0000-0000-000000000001', 0, '20000000-0000-0000-0000-000000000003')$$, 'assignment com participante de outro evento');
insert into public.assignments (optimization_run_id, session_index, participant_id, table_id)
  select '30000000-0000-0000-0000-000000000001', 0, '20000000-0000-0000-0000-000000000001', id
  from public.event_tables where event_id = '10000000-0000-0000-0000-000000000001';
update public.optimization_runs set status = 'VALIDATED' where id = '30000000-0000-0000-0000-000000000001';
select pg_temp.expect_error($$update public.optimization_runs set status = 'APPROVED' where id = '30000000-0000-0000-0000-000000000001'$$,
  'OPERATOR aprovando');
select pg_temp.expect_error($$update public.optimization_runs set schedule = '[[["x"]]]' where id = '30000000-0000-0000-0000-000000000001'$$,
  'alterar conteúdo de execução');
delete from public.optimization_runs where id = '30000000-0000-0000-0000-000000000001';
select pg_temp.expect_count($$select * from public.optimization_runs where id = '30000000-0000-0000-0000-000000000001'$$, 1,
  'execução não pode ser apagada (RLS)');
commit;

-- ADMIN aprova e publica
begin;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.expect_error($$update public.optimization_runs set status = 'PUBLISHED' where id = '30000000-0000-0000-0000-000000000001'$$,
  'publicar sem aprovar');
update public.optimization_runs set status = 'APPROVED' where id = '30000000-0000-0000-0000-000000000001';
update public.optimization_runs set status = 'PUBLISHED' where id = '30000000-0000-0000-0000-000000000001';
select pg_temp.expect_count($$select * from public.events where id = '10000000-0000-0000-0000-000000000001'
  and status = 'PUBLISHED' and published_run_id = '30000000-0000-0000-0000-000000000001'$$, 1, 'evento publicado aponta para a execução');
commit;

-- VIEWER somente leitura
begin;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.expect_count('select * from public.participants', 3, 'VIEWER lê participantes');
select pg_temp.expect_error($$insert into public.participants (event_id, name) values ('10000000-0000-0000-0000-000000000001', 'X')$$,
  'VIEWER inserindo participante');
update public.participants set name = 'hack' where id = '20000000-0000-0000-0000-000000000001';
select pg_temp.expect_count($$select * from public.participants where name = 'hack'$$, 0, 'VIEWER não altera (0 linhas)');
select pg_temp.expect_count('select * from public.audit_logs', 0, 'VIEWER não lê auditoria');
commit;

-- Intruso de outra organização não vê nada
begin;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select pg_temp.expect_count('select * from public.events', 0, 'intruso não vê eventos');
select pg_temp.expect_count('select * from public.participants', 0, 'intruso não vê participantes');
select pg_temp.expect_count('select * from public.optimization_runs', 0, 'intruso não vê execuções');
commit;

-- ADMIN: auditoria e limpeza de sandbox
begin;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.expect_count($$select * from public.audit_logs where entity = 'optimization_runs'$$, 4, 'auditoria de execução (insert + 3 mudanças de status)');
select pg_temp.expect_count($$select * from public.audit_logs where entity = 'participant_preferences'$$, 2, 'auditoria de preferências');
delete from public.events where id = '10000000-0000-0000-0000-000000000001';
select pg_temp.expect_count($$select * from public.events where id = '10000000-0000-0000-0000-000000000001'$$, 1, 'evento de produção não pode ser apagado');
delete from public.events where id = '10000000-0000-0000-0000-000000000002';
select pg_temp.expect_count($$select * from public.events where id = '10000000-0000-0000-0000-000000000002'$$, 0, 'sandbox apagado pelo ADMIN');
commit;

\echo 'RLS_TESTS_PASSED'
