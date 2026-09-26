#!/usr/bin/env bash
# Teste de integração do repositório Supabase do frontend contra Postgres + PostgREST reais (com RLS).
# Requer: Postgres acessível via PGHOST/PGPORT/PGUSER (superusuário) e o binário `postgrest` no PATH (ou POSTGREST=...).
set -euo pipefail
cd "$(dirname "$0")/../../.."
DB=${TEST_DB:-nexacoop_it}
psql -q -c "drop database if exists $DB" -c "create database $DB"
psql -d "$DB" -v ON_ERROR_STOP=1 -q -f supabase/tests/00_supabase_stub.sql
for f in supabase/migrations/*.sql; do psql -d "$DB" -v ON_ERROR_STOP=1 -q -f "$f"; done
psql -d "$DB" -v ON_ERROR_STOP=1 -q -f supabase/tests/it/setup.sql
SECRET=${JWT_SECRET:-super-secret-jwt-token-with-at-least-32-characters}
cat > /tmp/nexacoop-pgrst.conf <<CONF
db-uri = "postgres://authenticator@/$DB?host=${PGHOST:-/var/run/postgresql}&port=${PGPORT:-5432}"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "$SECRET"
server-host = "127.0.0.1"
server-port = 3900
CONF
${POSTGREST:-postgrest} /tmp/nexacoop-pgrst.conf > /tmp/nexacoop-pgrst.log 2>&1 &
PGRST_PID=$!
node supabase/tests/it/proxy.mjs > /tmp/nexacoop-proxy.log 2>&1 &
PROXY_PID=$!
trap 'kill $PGRST_PID $PROXY_PID 2>/dev/null || true' EXIT
sleep 2
SUPABASE_IT=1 JWT_SECRET=$SECRET npx vitest run src/data/__it__ --reporter=verbose
