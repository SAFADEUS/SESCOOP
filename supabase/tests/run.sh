#!/usr/bin/env bash
# Aplica stub + migrações num Postgres descartável e roda os testes SQL.
# Uso: PGHOST=... PGPORT=... PGUSER=... supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${TEST_DB:-nexacoop_test}
psql -q -c "drop database if exists $DB" -c "create database $DB"
psql -d "$DB" -v ON_ERROR_STOP=1 -q -f supabase/tests/00_supabase_stub.sql
for f in supabase/migrations/*.sql; do psql -d "$DB" -v ON_ERROR_STOP=1 -q -f "$f"; done
psql -d "$DB" -v ON_ERROR_STOP=1 -q -f supabase/tests/01_rls_test.sql 2>&1 | grep -E "NOTICE|ERROR|PASSED" | sed 's/^psql:[^ ]* //'
