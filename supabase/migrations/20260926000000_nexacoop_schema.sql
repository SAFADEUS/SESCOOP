-- =============================================================================
-- NexaCoop — Conexão Cooperativista
-- Schema inicial: organizações, papéis, eventos, participantes, preferências,
-- execuções de otimização (versionadas, nunca apagadas), alocações, encontros,
-- histórico de pares, locks manuais, cenários de sandbox e auditoria.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.app_role as enum ('ADMIN', 'OPERATOR', 'VIEWER');
create type public.event_status as enum ('DRAFT', 'SIMULATED', 'VALIDATED', 'APPROVED', 'PUBLISHED', 'RUNNING', 'FINISHED');
create type public.run_status as enum ('DRAFT', 'SIMULATED', 'VALIDATED', 'APPROVED', 'PUBLISHED', 'SUPERSEDED', 'FAILED');
create type public.optimizer_mode as enum ('BASELINE', 'MNBD_V2', 'MANUAL', 'REOPTIMIZATION');
create type public.preference_type as enum ('NORMAL', 'PREFER', 'HIGH_PRIORITY', 'MUST_MEET', 'AVOID', 'MUST_NOT_MEET');
create type public.attendance_status as enum ('CONFIRMED', 'CHECKED_IN', 'ABSENT', 'LATE', 'LEFT_EVENT');
create type public.participant_kind as enum ('PARTICIPANT', 'MODERATOR', 'ANCHOR');
create type public.assignment_source as enum ('OPTIMIZER', 'MANUAL', 'REOPTIMIZATION');
create type public.session_status as enum ('PLANNED', 'RUNNING', 'COMPLETED');

-- -----------------------------------------------------------------------------
-- Organizações, perfis e papéis
-- -----------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

-- Papéis ficam em tabela separada (nunca em profiles) para evitar escalonamento de privilégio.
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

-- -----------------------------------------------------------------------------
-- Eventos, sessões e mesas
-- -----------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  status public.event_status not null default 'DRAFT',
  participant_target int not null default 60 check (participant_target > 0),
  table_count int not null default 10 check (table_count > 0),
  session_count int not null default 6 check (session_count > 0),
  ideal_table_capacity int not null default 6,
  min_table_capacity int not null default 5,
  max_table_capacity int not null default 6,
  session_duration_minutes int not null default 15,
  avoid_table_revisit boolean not null default true,
  allow_same_company boolean not null default true,
  optimizer_version text not null default 'mnbd-2.0.0',
  -- pesos, limiares de demanda (60/90/100%), prioridade do MUST_MEET, sobrescritas por sessão
  config jsonb not null default '{}'::jsonb,
  sandbox boolean not null default false,
  scenario_key text,
  scenario_seed int,
  frozen_until int not null default 0,
  published_run_id uuid,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (min_table_capacity <= ideal_table_capacity and ideal_table_capacity <= max_table_capacity)
);
create index on public.events (organization_id);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  session_index int not null check (session_index >= 0),
  name text not null,
  starts_at timestamptz,
  status public.session_status not null default 'PLANNED',
  max_capacity_override int,
  unique (event_id, session_index)
);

create table public.event_tables (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  table_number int not null check (table_number > 0),
  name text not null,
  active boolean not null default true,
  -- índices (0-based) das sessões em que a mesa está indisponível
  unavailable_sessions int[] not null default '{}',
  unique (event_id, table_number)
);

-- -----------------------------------------------------------------------------
-- Participantes, disponibilidade e preferências
-- -----------------------------------------------------------------------------
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  external_ref text,
  name text not null,
  company text not null default '',
  role text not null default '', -- cargo
  segment text not null default '',
  category text not null default '',
  description text,
  tags text[] not null default '{}',
  active boolean not null default true,
  participant_fixed boolean not null default false,
  fixed_table_id uuid references public.event_tables (id) on delete set null,
  institutional_priority int not null default 0 check (institutional_priority between 0 and 3),
  kind public.participant_kind not null default 'PARTICIPANT',
  counts_toward_capacity boolean not null default true,
  attendance_status public.attendance_status not null default 'CONFIRMED',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, external_ref)
);
create index on public.participants (event_id);

create table public.participant_availability (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  available boolean not null default true,
  status public.attendance_status not null default 'CONFIRMED',
  updated_at timestamptz not null default now(),
  unique (participant_id, session_id)
);

create table public.participant_preferences (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  source_participant_id uuid not null references public.participants (id) on delete cascade,
  target_participant_id uuid not null references public.participants (id) on delete cascade,
  relationship_type public.preference_type not null default 'PREFER',
  weight numeric not null default 1 check (weight > 0),
  reason text,
  allow_repeat boolean not null default false, -- reencontro estratégico (MUST_MEET_REPEAT, continuidade)
  created_at timestamptz not null default now(),
  unique (event_id, source_participant_id, target_participant_id),
  check (source_participant_id <> target_participant_id)
);
create index on public.participant_preferences (event_id, target_participant_id);

-- Interesse mútuo detectado automaticamente (sem cadastro duplicado manual).
create view public.participant_mutual_interest with (security_invoker = true) as
select a.event_id,
       least(a.source_participant_id, a.target_participant_id) as participant_a,
       greatest(a.source_participant_id, a.target_participant_id) as participant_b
from public.participant_preferences a
join public.participant_preferences b
  on b.event_id = a.event_id
 and b.source_participant_id = a.target_participant_id
 and b.target_participant_id = a.source_participant_id
where a.relationship_type in ('NORMAL', 'PREFER', 'HIGH_PRIORITY', 'MUST_MEET')
  and b.relationship_type in ('NORMAL', 'PREFER', 'HIGH_PRIORITY', 'MUST_MEET')
  and a.source_participant_id < a.target_participant_id;

-- Demanda de entrada e saída (IPD é calculado pelo motor, que conhece a disponibilidade).
create view public.participant_demand with (security_invoker = true) as
select p.event_id,
       p.id as participant_id,
       (select count(*) from public.participant_preferences x
         where x.target_participant_id = p.id
           and x.relationship_type in ('NORMAL', 'PREFER', 'HIGH_PRIORITY', 'MUST_MEET')) as inbound_demand,
       (select count(*) from public.participant_preferences x
         where x.source_participant_id = p.id
           and x.relationship_type in ('NORMAL', 'PREFER', 'HIGH_PRIORITY', 'MUST_MEET')) as outbound_demand
from public.participants p;

-- -----------------------------------------------------------------------------
-- Otimização (versionada — nunca apagar)
-- -----------------------------------------------------------------------------
create table public.optimization_runs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  version int not null,
  label text,
  mode public.optimizer_mode not null,
  optimizer_version text not null,
  seed int,
  seeds_count int,
  iterations int,
  status public.run_status not null default 'SIMULATED',
  parent_run_id uuid references public.optimization_runs (id),
  frozen_until int not null default 0,
  config_snapshot jsonb not null default '{}'::jsonb,
  demand_snapshot jsonb not null default '[]'::jsonb,
  metrics_snapshot jsonb not null default '{}'::jsonb,
  feasibility jsonb not null default '[]'::jsonb,
  candidates jsonb not null default '[]'::jsonb,
  comparison jsonb,
  lex jsonb,
  schedule jsonb not null default '[]'::jsonb, -- cópia compacta de assignments para leitura rápida
  duration_ms int,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_by uuid default auth.uid(),
  validated_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  published_by uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, version)
);
create index on public.optimization_runs (event_id, created_at desc);

alter table public.events
  add constraint events_published_run_fk foreign key (published_run_id) references public.optimization_runs (id);

create table public.optimization_metrics (
  id uuid primary key default gen_random_uuid(),
  optimization_run_id uuid not null references public.optimization_runs (id) on delete cascade,
  metric_key text not null,
  metric_value numeric,
  participant_id uuid references public.participants (id) on delete cascade,
  details jsonb
);
create index on public.optimization_metrics (optimization_run_id);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  optimization_run_id uuid not null references public.optimization_runs (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete cascade,
  session_index int not null,
  table_id uuid references public.event_tables (id) on delete set null,
  participant_id uuid not null references public.participants (id) on delete cascade,
  locked boolean not null default false,
  assignment_source public.assignment_source not null default 'OPTIMIZER',
  unique (optimization_run_id, session_index, participant_id)
);
create index on public.assignments (optimization_run_id, session_index);

create table public.encounters (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  optimization_run_id uuid references public.optimization_runs (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete cascade,
  session_index int not null,
  table_id uuid references public.event_tables (id) on delete set null,
  participant_a uuid not null references public.participants (id) on delete cascade,
  participant_b uuid not null references public.participants (id) on delete cascade,
  is_repeat boolean not null default false,
  preference_type public.preference_type,
  preference_fulfilled boolean not null default false,
  mutual_interest boolean not null default false,
  realized boolean not null default false, -- true = encontro efetivamente ocorrido
  created_at timestamptz not null default now(),
  check (participant_a < participant_b)
);
create index on public.encounters (event_id, realized);

-- Histórico de pares REALMENTE ocorridos (base da reotimização).
create table public.pair_history (
  event_id uuid not null references public.events (id) on delete cascade,
  participant_a uuid not null references public.participants (id) on delete cascade,
  participant_b uuid not null references public.participants (id) on delete cascade,
  encounter_count int not null default 0,
  first_session int,
  last_session int,
  primary key (event_id, participant_a, participant_b),
  check (participant_a < participant_b)
);

create table public.manual_locks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  session_index int not null,
  participant_id uuid not null references public.participants (id) on delete cascade,
  table_id uuid not null references public.event_tables (id) on delete cascade,
  reason text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (event_id, session_index, participant_id)
);

create table public.scenario_runs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  scenario_key text not null,
  seed int not null,
  baseline_run_id uuid references public.optimization_runs (id),
  v2_run_id uuid references public.optimization_runs (id),
  comparison jsonb,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations (id) on delete cascade,
  event_id uuid references public.events (id) on delete cascade,
  user_id uuid default auth.uid(),
  action text not null,
  entity text,
  entity_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index on public.audit_logs (event_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Funções de autorização (SECURITY DEFINER evita recursão de RLS)
-- -----------------------------------------------------------------------------
create or replace function public.has_org_role(_org uuid, _roles public.app_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and organization_id = _org and role = any (_roles)
  );
$$;

create or replace function public.is_org_member(_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_org_role(_org, array['ADMIN', 'OPERATOR', 'VIEWER']::public.app_role[]);
$$;

create or replace function public.event_org(_event uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select organization_id from public.events where id = _event;
$$;

create or replace function public.can_read_event(_event uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_org_member(public.event_org(_event));
$$;

create or replace function public.can_write_event(_event uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_org_role(public.event_org(_event), array['ADMIN', 'OPERATOR']::public.app_role[]);
$$;

create or replace function public.is_event_admin(_event uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_org_role(public.event_org(_event), array['ADMIN']::public.app_role[]);
$$;

create or replace function public.run_event(_run uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select event_id from public.optimization_runs where id = _run;
$$;

-- Cria organização e torna o chamador ADMIN (primeiro acesso).
create or replace function public.create_organization(_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare _org uuid;
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  insert into public.organizations (name) values (_name) returning id into _org;
  insert into public.user_roles (user_id, organization_id, role) values (auth.uid(), _org, 'ADMIN');
  update public.profiles set organization_id = _org where id = auth.uid() and organization_id is null;
  return _org;
end $$;

-- Perfil automático no cadastro.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Integridade: tudo que referencia participantes/mesas precisa ser do MESMO evento.
-- Garante que dados de sandbox nunca alterem um evento de produção.
-- -----------------------------------------------------------------------------
create or replace function public.assert_same_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare _event uuid; _bad int;
begin
  if tg_table_name = 'participant_preferences' then
    select count(*) into _bad from public.participants
      where id in (new.source_participant_id, new.target_participant_id) and event_id <> new.event_id;
  elsif tg_table_name = 'participant_availability' then
    select count(*) into _bad from (
      select event_id from public.participants where id = new.participant_id
      union all select event_id from public.sessions where id = new.session_id) x
      where x.event_id <> new.event_id;
  elsif tg_table_name = 'assignments' then
    _event := public.run_event(new.optimization_run_id);
    select count(*) into _bad from (
      select event_id from public.participants where id = new.participant_id
      union all select event_id from public.event_tables where id = new.table_id
      union all select event_id from public.sessions where id = new.session_id) x
      where x.event_id <> _event;
  elsif tg_table_name = 'manual_locks' then
    select count(*) into _bad from (
      select event_id from public.participants where id = new.participant_id
      union all select event_id from public.event_tables where id = new.table_id) x
      where x.event_id <> new.event_id;
  elsif tg_table_name = 'participants' then
    select count(*) into _bad from public.event_tables where id = new.fixed_table_id and event_id <> new.event_id;
  elsif tg_table_name = 'encounters' then
    select count(*) into _bad from public.participants
      where id in (new.participant_a, new.participant_b) and event_id <> new.event_id;
  else
    _bad := 0;
  end if;
  if _bad > 0 then
    raise exception 'Referência cruzada entre eventos não permitida (%).', tg_table_name;
  end if;
  return new;
end $$;

create trigger trg_same_event before insert or update on public.participant_preferences for each row execute function public.assert_same_event();
create trigger trg_same_event before insert or update on public.participant_availability for each row execute function public.assert_same_event();
create trigger trg_same_event before insert or update on public.assignments for each row execute function public.assert_same_event();
create trigger trg_same_event before insert or update on public.manual_locks for each row execute function public.assert_same_event();
create trigger trg_same_event before insert or update on public.participants for each row execute function public.assert_same_event();
create trigger trg_same_event before insert or update on public.encounters for each row execute function public.assert_same_event();

-- updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger trg_touch before update on public.events for each row execute function public.touch_updated_at();
create trigger trg_touch before update on public.participants for each row execute function public.touch_updated_at();
create trigger trg_touch before update on public.participant_availability for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Ciclo de vida das execuções: nunca apagar; aprovar/publicar somente ADMIN.
-- O algoritmo nunca publica automaticamente: toda execução nasce SIMULATED/DRAFT.
-- -----------------------------------------------------------------------------
create or replace function public.guard_run_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status not in ('DRAFT', 'SIMULATED', 'FAILED') then
    raise exception 'Uma execução nova deve nascer como DRAFT/SIMULATED (recebido %).', new.status;
  end if;
  if new.version is null then
    select coalesce(max(version), 0) + 1 into new.version from public.optimization_runs where event_id = new.event_id;
  end if;
  return new;
end $$;
create trigger trg_run_insert before insert on public.optimization_runs for each row execute function public.guard_run_insert();

create or replace function public.guard_run_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare _is_service boolean := auth.uid() is null;
begin
  -- conteúdo da execução é imutável; apenas status/rótulo e carimbos de aprovação mudam
  if new.schedule is distinct from old.schedule or new.metrics_snapshot is distinct from old.metrics_snapshot
     or new.event_id is distinct from old.event_id or new.mode is distinct from old.mode or new.seed is distinct from old.seed then
    raise exception 'Execuções de otimização são imutáveis; crie uma nova versão.';
  end if;
  if new.status is distinct from old.status then
    if new.status in ('APPROVED', 'PUBLISHED') and not _is_service and not public.is_event_admin(new.event_id) then
      raise exception 'Somente ADMIN pode aprovar ou publicar.';
    end if;
    if new.status = 'VALIDATED' and old.status not in ('SIMULATED', 'DRAFT') then
      raise exception 'Transição inválida: % → VALIDATED', old.status;
    end if;
    if new.status = 'APPROVED' and old.status not in ('SIMULATED', 'VALIDATED') then
      raise exception 'Transição inválida: % → APPROVED', old.status;
    end if;
    if new.status = 'PUBLISHED' and old.status <> 'APPROVED' then
      raise exception 'Somente execuções APROVADAS podem ser publicadas.';
    end if;
    if new.status = 'VALIDATED' then new.validated_at := now(); end if;
    if new.status = 'APPROVED' then new.approved_at := now(); new.approved_by := auth.uid(); end if;
    if new.status = 'PUBLISHED' then new.published_at := now(); new.published_by := auth.uid(); end if;
  end if;
  return new;
end $$;
create trigger trg_run_update before update on public.optimization_runs for each row execute function public.guard_run_update();

create or replace function public.after_run_published()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'PUBLISHED' and old.status is distinct from 'PUBLISHED' then
    update public.optimization_runs set status = 'SUPERSEDED'
      where event_id = new.event_id and id <> new.id and status = 'PUBLISHED';
    update public.events set published_run_id = new.id,
      status = case when status in ('RUNNING', 'FINISHED') then status else 'PUBLISHED' end
      where id = new.event_id;
  end if;
  return new;
end $$;
create trigger trg_run_published after update on public.optimization_runs for each row execute function public.after_run_published();

create or replace function public.forbid_delete()
returns trigger language plpgsql as $$
begin
  raise exception 'Registros de % nunca são apagados (histórico).', tg_table_name;
end $$;
create trigger trg_no_delete before delete on public.optimization_runs for each row
  when (pg_trigger_depth() = 0) execute function public.forbid_delete();
create trigger trg_no_delete before delete on public.audit_logs for each row
  when (pg_trigger_depth() = 0) execute function public.forbid_delete();

-- Status do evento: APPROVED/PUBLISHED somente ADMIN.
create or replace function public.guard_event_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('APPROVED', 'PUBLISHED')
     and auth.uid() is not null and not public.is_event_admin(new.id) then
    raise exception 'Somente ADMIN pode aprovar ou publicar o evento.';
  end if;
  if new.sandbox is distinct from old.sandbox then
    raise exception 'Um evento não pode mudar entre sandbox e produção.';
  end if;
  return new;
end $$;
create trigger trg_event_update before update on public.events for each row execute function public.guard_event_update();

-- -----------------------------------------------------------------------------
-- Auditoria automática
-- -----------------------------------------------------------------------------
create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare _row jsonb; _event uuid; _org uuid;
begin
  _row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  if tg_table_name = 'events' then
    _event := (_row ->> 'id')::uuid;
    _org := (_row ->> 'organization_id')::uuid;
  else
    _event := (_row ->> 'event_id')::uuid;
    _org := public.event_org(_event);
  end if;
  -- em exclusões em cascata o evento pode não existir mais
  if _event is not null and not exists (select 1 from public.events where id = _event) then
    _event := null;
  end if;
  if _org is not null and not exists (select 1 from public.organizations where id = _org) then
    _org := null;
  end if;
  -- não gravar a programação inteira no log
  _row := _row - 'schedule' - 'metrics_snapshot' - 'demand_snapshot' - 'candidates' - 'config_snapshot';
  insert into public.audit_logs (organization_id, event_id, user_id, action, entity, entity_id, payload)
  values (_org, _event,
          auth.uid(), lower(tg_op), tg_table_name, _row ->> 'id', _row);
  return null;
end $$;

create trigger trg_audit after insert or update or delete on public.events for each row execute function public.audit_row();
create trigger trg_audit after insert or update or delete on public.participants for each row execute function public.audit_row();
create trigger trg_audit after insert or update or delete on public.participant_preferences for each row execute function public.audit_row();
create trigger trg_audit after insert or update or delete on public.participant_availability for each row execute function public.audit_row();
create trigger trg_audit after insert or update or delete on public.event_tables for each row execute function public.audit_row();
create trigger trg_audit after insert or update or delete on public.manual_locks for each row execute function public.audit_row();
create trigger trg_audit after insert or update on public.optimization_runs for each row execute function public.audit_row();
create trigger trg_audit after insert or update on public.sessions for each row execute function public.audit_row();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.events enable row level security;
alter table public.sessions enable row level security;
alter table public.event_tables enable row level security;
alter table public.participants enable row level security;
alter table public.participant_availability enable row level security;
alter table public.participant_preferences enable row level security;
alter table public.optimization_runs enable row level security;
alter table public.optimization_metrics enable row level security;
alter table public.assignments enable row level security;
alter table public.encounters enable row level security;
alter table public.pair_history enable row level security;
alter table public.manual_locks enable row level security;
alter table public.scenario_runs enable row level security;
alter table public.audit_logs enable row level security;

create policy org_select on public.organizations for select to authenticated using (public.is_org_member(id));
create policy org_update on public.organizations for update to authenticated
  using (public.has_org_role(id, array['ADMIN']::public.app_role[]));

create policy profile_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_org_member(organization_id));
create policy profile_update on public.profiles for update to authenticated using (id = auth.uid())
  with check (id = auth.uid());

create policy roles_select on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_org_member(organization_id));
create policy roles_admin_insert on public.user_roles for insert to authenticated
  with check (public.has_org_role(organization_id, array['ADMIN']::public.app_role[]));
create policy roles_admin_update on public.user_roles for update to authenticated
  using (public.has_org_role(organization_id, array['ADMIN']::public.app_role[]));
create policy roles_admin_delete on public.user_roles for delete to authenticated
  using (public.has_org_role(organization_id, array['ADMIN']::public.app_role[]) and user_id <> auth.uid());

-- Eventos: todos os membros leem; ADMIN cria; ADMIN/OPERATOR operam; só sandbox pode ser apagado (ADMIN).
create policy events_select on public.events for select to authenticated using (public.is_org_member(organization_id));
create policy events_insert on public.events for insert to authenticated
  with check (public.has_org_role(organization_id, array['ADMIN']::public.app_role[])
              or (sandbox and public.has_org_role(organization_id, array['OPERATOR']::public.app_role[])));
create policy events_update on public.events for update to authenticated
  using (public.has_org_role(organization_id, array['ADMIN', 'OPERATOR']::public.app_role[]));
create policy events_delete on public.events for delete to authenticated
  using (sandbox and public.has_org_role(organization_id, array['ADMIN']::public.app_role[]));

-- Tabelas filhas editáveis pela operação.
do $$
declare t text;
begin
  foreach t in array array['sessions', 'event_tables', 'participants', 'participant_availability',
                           'participant_preferences', 'manual_locks', 'scenario_runs']
  loop
    execute format('create policy %1$s_select on public.%1$s for select to authenticated using (public.can_read_event(event_id))', t);
    execute format('create policy %1$s_insert on public.%1$s for insert to authenticated with check (public.can_write_event(event_id))', t);
    execute format('create policy %1$s_update on public.%1$s for update to authenticated using (public.can_write_event(event_id)) with check (public.can_write_event(event_id))', t);
    execute format('create policy %1$s_delete on public.%1$s for delete to authenticated using (public.can_write_event(event_id))', t);
  end loop;
end $$;

-- Histórico: leitura para membros, escrita por ADMIN/OPERATOR, sem delete.
create policy runs_select on public.optimization_runs for select to authenticated using (public.can_read_event(event_id));
create policy runs_insert on public.optimization_runs for insert to authenticated with check (public.can_write_event(event_id));
create policy runs_update on public.optimization_runs for update to authenticated using (public.can_write_event(event_id));

create policy metrics_select on public.optimization_metrics for select to authenticated
  using (public.can_read_event(public.run_event(optimization_run_id)));
create policy metrics_insert on public.optimization_metrics for insert to authenticated
  with check (public.can_write_event(public.run_event(optimization_run_id)));

create policy assignments_select on public.assignments for select to authenticated
  using (public.can_read_event(public.run_event(optimization_run_id)));
create policy assignments_insert on public.assignments for insert to authenticated
  with check (public.can_write_event(public.run_event(optimization_run_id)));

create policy encounters_select on public.encounters for select to authenticated using (public.can_read_event(event_id));
create policy encounters_insert on public.encounters for insert to authenticated with check (public.can_write_event(event_id));

create policy pair_history_select on public.pair_history for select to authenticated using (public.can_read_event(event_id));
-- pair_history é escrito apenas pelo backend (Edge Function com service role) a partir dos encontros realizados.

create policy audit_select on public.audit_logs for select to authenticated
  using (public.has_org_role(organization_id, array['ADMIN', 'OPERATOR']::public.app_role[]));
create policy audit_insert on public.audit_logs for insert to authenticated
  with check (user_id = auth.uid() and public.is_org_member(organization_id));

-- -----------------------------------------------------------------------------
-- Realtime (modo evento ao vivo)
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.sessions, public.participant_availability,
      public.optimization_runs, public.manual_locks, public.events;
  end if;
end $$;
