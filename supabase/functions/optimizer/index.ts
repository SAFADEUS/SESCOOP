// Edge Function "optimizer" — backend seguro do NexaCoop.
//
// Ações (POST JSON):
//  - { action: "optimize", event_id, mode: "BASELINE"|"MNBD_V2", base_seed?, seeds?, iterations?, label? }
//      executa o motor no servidor (orçamento limitado pelo tempo de CPU da Edge Function)
//  - { action: "submit", event_id, schedule, label?, mode?, parent_run_id?, meta? }
//      recebe uma programação calculada no navegador, RECALCULA métricas/validação no servidor e grava
//  - { action: "complete_session", event_id, session_index }
//      registra os encontros REALMENTE ocorridos da sessão (programação publicada − ausentes),
//      atualiza pair_history e congela a sessão
//
// A SERVICE_ROLE só existe aqui (variável de ambiente do Supabase), nunca no frontend.
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  compileProblem,
  computeMetrics,
  listEncounters,
  optimizeEvent,
  OPTIMIZER_VERSION,
  validateSolution,
  type Schedule,
} from "../_shared/engine/index.ts";
import { loadEvent } from "../_shared/loadEvent.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Limites para caber no tempo de CPU de uma Edge Function; simulações maiores rodam no navegador (Web Worker) e usam "submit".
const MAX_SEEDS = 3;
const MAX_ITERATIONS = 40000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "método não permitido" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data: auth } = await userClient.auth.getUser();
  if (!auth.user) return json({ error: "não autenticado" }, 401);
  const admin = createClient(url, service);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }
  const eventId = String(body.event_id ?? "");
  const { data: canWrite, error: rpcErr } = await userClient.rpc("can_write_event", { _event: eventId });
  if (rpcErr) return json({ error: rpcErr.message }, 400);
  if (!canWrite) return json({ error: "sem permissão (ADMIN ou OPERATOR)" }, 403);

  try {
    const loaded = await loadEvent(admin, eventId);
    const P = compileProblem(loaded.input);

    if (body.action === "optimize" || body.action === "submit") {
      let schedule: Schedule;
      let meta: Record<string, unknown> = {};
      let mode = String(body.mode ?? "MNBD_V2");
      if (body.action === "optimize") {
        if (mode !== "BASELINE" && mode !== "MNBD_V2") return json({ error: "modo inválido" }, 400);
        const r = optimizeEvent(loaded.input, {
          mode,
          baseSeed: Number(body.base_seed ?? 1),
          seeds: Math.min(MAX_SEEDS, Number(body.seeds ?? MAX_SEEDS)),
          iterations: Math.min(MAX_ITERATIONS, Number(body.iterations ?? MAX_ITERATIONS)),
        });
        schedule = r.schedule;
        meta = { seed: r.bestSeed, seeds: r.candidates.length, iterations: r.iterations, candidates: r.candidates, lex: r.lex, timeMs: r.timeMs };
      } else {
        schedule = body.schedule as Schedule;
        if (!Array.isArray(schedule)) return json({ error: "schedule ausente" }, 400);
        meta = (body.meta as Record<string, unknown>) ?? {};
        if (!["BASELINE", "MNBD_V2", "MANUAL", "REOPTIMIZATION"].includes(mode)) mode = "MANUAL";
      }
      // Métricas e validação SEMPRE recalculadas no servidor com os dados do banco.
      const metrics = computeMetrics(P, schedule);
      const validation = validateSolution(P, schedule);
      const { data: run, error } = await admin
        .from("optimization_runs")
        .insert({
          event_id: eventId,
          label: String(body.label ?? (mode === "BASELINE" ? "Baseline" : mode === "MNBD_V2" ? "MNBD Optimizer V2" : "Programação enviada")),
          mode,
          optimizer_version: OPTIMIZER_VERSION,
          seed: (meta.seed as number) ?? null,
          seeds_count: (meta.seeds as number) ?? null,
          iterations: (meta.iterations as number) ?? null,
          status: "SIMULATED",
          parent_run_id: (body.parent_run_id as string) ?? null,
          frozen_until: P.frozenUntil,
          config_snapshot: loaded.input.config,
          demand_snapshot: P.demand,
          metrics_snapshot: metrics,
          feasibility: P.issues,
          candidates: meta.candidates ?? [],
          lex: meta.lex ?? null,
          schedule,
          duration_ms: (meta.timeMs as number) ?? null,
          created_by: auth.user.id,
          finished_at: new Date().toISOString(),
        })
        .select("id,version")
        .single();
      if (error) throw new Error(error.message);
      const sid = new Map(loaded.sessions.map((s) => [s.session_index, s.id]));
      const assignments = schedule.flatMap((sess, s) =>
        sess.flatMap((mem, t) =>
          mem.map((pid) => ({
            optimization_run_id: run.id,
            session_id: sid.get(s) ?? null,
            session_index: s,
            table_id: loaded.tables[t]?.id ?? null,
            participant_id: pid,
            assignment_source: mode === "MANUAL" ? "MANUAL" : mode === "REOPTIMIZATION" ? "REOPTIMIZATION" : "OPTIMIZER",
            locked: (loaded.input.locks ?? []).some((l) => l.session === s && l.participantId === pid),
          })),
        ),
      );
      for (let i = 0; i < assignments.length; i += 500) {
        const { error: e } = await admin.from("assignments").insert(assignments.slice(i, i + 500));
        if (e) throw new Error(e.message);
      }
      const encounters = listEncounters(P, schedule).map((e) => ({
        event_id: eventId,
        optimization_run_id: run.id,
        session_id: sid.get(e.session) ?? null,
        session_index: e.session,
        table_id: loaded.tables[e.table]?.id ?? null,
        participant_a: e.a < e.b ? e.a : e.b,
        participant_b: e.a < e.b ? e.b : e.a,
        is_repeat: e.isRepeat,
        preference_type: e.preferenceType,
        preference_fulfilled: e.preferenceFulfilled,
        mutual_interest: e.mutualInterest,
        realized: false,
      }));
      for (let i = 0; i < encounters.length; i += 500) {
        const { error: e } = await admin.from("encounters").insert(encounters.slice(i, i + 500));
        if (e) throw new Error(e.message);
      }
      await admin.from("audit_logs").insert({
        organization_id: loaded.event.organization_id,
        event_id: eventId,
        user_id: auth.user.id,
        action: body.action === "optimize" ? "otimização (servidor)" : "programação enviada e validada no servidor",
        entity: "optimization_runs",
        entity_id: run.id,
        payload: { mode, seed: meta.seed ?? null, lex: meta.lex ?? null, hard: validation.hardViolations, repeats: metrics.repeats },
      });
      return json({ run_id: run.id, version: run.version, valid: validation.ok, violations: validation.details.slice(0, 20), metrics });
    }

    if (body.action === "complete_session") {
      const s = Number(body.session_index);
      if (!Number.isInteger(s) || s < 0 || s >= P.S) return json({ error: "sessão inválida" }, 400);
      if (s < P.frozenUntil) return json({ error: "sessão já concluída" }, 409);
      if (s > P.frozenUntil) return json({ error: `conclua antes a sessão ${P.frozenUntil + 1}` }, 409);
      const runId = loaded.event.published_run_id;
      if (!runId) return json({ error: "não há programação publicada" }, 409);
      const { data: pub } = await admin.from("optimization_runs").select("schedule").eq("id", runId).single();
      const plan = pub!.schedule as Schedule;
      // presentes = programados e disponíveis (não ABSENT/LEFT_EVENT) nesta sessão
      const present = (id: string) => loaded.input.availability?.[id]?.[s] !== false;
      const realized = [...(loaded.input.realizedSchedule ?? [])];
      realized[s] = (plan[s] ?? []).map((mem) => mem.filter(present));
      const partial = { ...loaded.input, frozenUntil: s + 1, realizedSchedule: realized };
      const Pr = compileProblem(partial);
      const onlyS: Schedule = realized.map((sess, k) => (k === s ? sess : sess.map(() => [])));
      const sid = loaded.sessions.find((x) => x.session_index === s)?.id ?? null;
      const encounters = listEncounters(Pr, onlyS).map((e) => ({
        event_id: eventId,
        session_id: sid,
        session_index: s,
        table_id: loaded.tables[e.table]?.id ?? null,
        participant_a: e.a < e.b ? e.a : e.b,
        participant_b: e.a < e.b ? e.b : e.a,
        preference_type: e.preferenceType,
        preference_fulfilled: e.preferenceFulfilled,
        mutual_interest: e.mutualInterest,
        realized: true,
      }));
      if (encounters.length) {
        const { error: e } = await admin.from("encounters").insert(encounters);
        if (e) throw new Error(e.message);
      }
      for (const e of encounters) {
        const { data: ph } = await admin
          .from("pair_history")
          .select("encounter_count,first_session")
          .eq("event_id", eventId)
          .eq("participant_a", e.participant_a)
          .eq("participant_b", e.participant_b)
          .maybeSingle();
        await admin.from("pair_history").upsert({
          event_id: eventId,
          participant_a: e.participant_a,
          participant_b: e.participant_b,
          encounter_count: (ph?.encounter_count ?? 0) + 1,
          first_session: ph?.first_session ?? s,
          last_session: s,
        });
      }
      await admin.from("sessions").update({ status: "COMPLETED" }).eq("event_id", eventId).eq("session_index", s);
      await admin
        .from("events")
        .update({ frozen_until: s + 1, status: "RUNNING", config: { ...(loaded.event.config ?? {}), realizedSchedule: realized } })
        .eq("id", eventId);
      await admin.from("audit_logs").insert({
        organization_id: loaded.event.organization_id,
        event_id: eventId,
        user_id: auth.user.id,
        action: "sessão concluída (encontros realizados registrados)",
        entity: "sessions",
        entity_id: String(sid),
        payload: { session_index: s, encounters: encounters.length },
      });
      return json({ ok: true, frozen_until: s + 1, encounters: encounters.length });
    }

    return json({ error: "ação desconhecida" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
