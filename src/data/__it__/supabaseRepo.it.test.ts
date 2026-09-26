// Integração real: supabase-js → PostgREST → Postgres com as migrações e RLS.
// Executado por supabase/tests/it/run-it.sh (SUPABASE_IT=1). Ignorado na suíte normal.
import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { compileProblem, optimizeEvent, validateSolution } from "@/engine";
import { newEventFromScenario } from "@/data/factories";
import { createSupabaseRepo } from "@/data/supabaseRepo";
import type { RunRecord } from "@/data/types";

const URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const SECRET = process.env.JWT_SECRET ?? "super-secret-jwt-token-with-at-least-32-characters";
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
function jwt(sub: string, email: string) {
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({ sub, email, role: "authenticated", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 });
  const sig = createHmac("sha256", SECRET).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}
async function client(sub: string, email: string) {
  const sb = createClient(URL, jwt("00000000-0000-0000-0000-000000000000", "anon"), { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await sb.auth.setSession({ access_token: jwt(sub, email), refresh_token: "x" });
  if (error) throw error;
  return sb;
}
const ADMIN = ["00000000-0000-0000-0000-0000000000a1", "admin@it.test"] as const;
const OPER = ["00000000-0000-0000-0000-0000000000b1", "operador@it.test"] as const;
const VIEW = ["00000000-0000-0000-0000-0000000000c1", "viewer@it.test"] as const;

describe.skipIf(!process.env.SUPABASE_IT)("SupabaseRepo (PostgREST + RLS)", () => {
  let eventId = "";
  let run: RunRecord;

  it("OPERATOR cria cenário sandbox F com ids normalizados para UUID", async () => {
    const repo = createSupabaseRepo(await client(...OPER));
    const ev = newEventFromScenario("F_RESTRICOES", 1);
    ev.input.locks = [{ participantId: ev.input.participants[40].id, session: 3, tableId: ev.input.tables[4].id }];
    const saved = await repo.saveEvent(ev);
    eventId = saved.id;
    expect(eventId).toMatch(/^[0-9a-f-]{36}$/);
    const back = (await repo.getEvent(eventId))!;
    expect(back.input.participants).toHaveLength(61);
    expect(back.input.preferences).toHaveLength(saved.input.preferences.length);
    expect(back.input.tables).toHaveLength(10);
    expect(back.input.locks).toHaveLength(1);
    const anchor = back.input.participants.find((p) => p.kind === "ANCHOR")!;
    expect(anchor.fixedTableId).toBe(back.input.tables[2].id);
    const mod = back.input.participants.find((p) => p.kind === "MODERATOR")!;
    expect(mod.countsTowardCapacity).toBe(false);
    expect(back.input.preferences.filter((p) => p.type === "MUST_MEET")).toHaveLength(9);
    // a demanda calculada é a mesma do evento original
    const d1 = compileProblem(saved.input).demand.map((d) => d.inbound).sort();
    const d2 = compileProblem(back.input).demand.map((d) => d.inbound).sort();
    expect(d2).toEqual(d1);
  });

  it("edição persiste (participante editado, preferência removida, disponibilidade)", async () => {
    const repo = createSupabaseRepo(await client(...OPER));
    const ev = (await repo.getEvent(eventId))!;
    const p0 = ev.input.participants[0];
    ev.input.participants[0] = { ...p0, name: "Nome Editado", tags: ["a", "b"] };
    ev.input.preferences = ev.input.preferences.slice(1);
    ev.input.availability = { [ev.input.participants[5].id]: [true, true, false, true, true, true] };
    await repo.saveEvent(ev);
    const back = (await repo.getEvent(eventId))!;
    expect(back.input.participants.find((p) => p.id === p0.id)!.name).toBe("Nome Editado");
    expect(back.input.preferences).toHaveLength(ev.input.preferences.length);
    expect(back.input.availability![ev.input.participants[5].id]).toEqual([true, true, false, true, true, true]);
  });

  it("salva execução com assignments e métricas; VIEWER não escreve", async () => {
    const sb = await client(...OPER);
    const repo = createSupabaseRepo(sb);
    const ev = (await repo.getEvent(eventId))!;
    const r = optimizeEvent(ev.input, { mode: "MNBD_V2", baseSeed: 1, seeds: 1, iterations: 20000 });
    expect(validateSolution(compileProblem(ev.input), r.schedule).ok).toBe(true);
    run = await repo.insertRun({
      id: "",
      eventId,
      label: "MNBD Optimizer V2",
      mode: "MNBD_V2",
      status: "SIMULATED",
      optimizerVersion: r.optimizerVersion,
      seed: r.bestSeed,
      seeds: 1,
      iterations: r.iterations,
      frozenUntil: 0,
      schedule: r.schedule,
      metrics: r.metrics,
      demand: r.demand,
      feasibility: r.feasibility,
      candidates: r.candidates,
      lex: r.lex,
      timeMs: r.timeMs,
      configSnapshot: ev.input.config,
      createdAt: new Date().toISOString(),
      createdBy: "",
    });
    expect(run.version).toBe(1);
    const { count } = await sb.from("assignments").select("*", { count: "exact", head: true }).eq("optimization_run_id", run.id);
    expect(count).toBe(61 * 6 - 1); // um participante indisponível na sessão 3 (teste anterior)
    const runs = await repo.listRuns(eventId);
    expect(runs[0].schedule).toEqual(r.schedule);
    expect(runs[0].metrics.preferencesMet).toBe(r.metrics.preferencesMet);

    const viewer = createSupabaseRepo(await client(...VIEW));
    await expect(viewer.saveEvent({ ...ev, name: "hack" })).rejects.toThrow();
    expect((await viewer.getEvent(eventId))!.name).not.toBe("hack");
  });

  it("OPERATOR valida mas não aprova; ADMIN aprova e publica", async () => {
    const op = createSupabaseRepo(await client(...OPER));
    await op.updateRunStatus(run.id, { status: "VALIDATED" });
    await expect(op.updateRunStatus(run.id, { status: "APPROVED" })).rejects.toThrow(/ADMIN/);
    const adm = createSupabaseRepo(await client(...ADMIN));
    await expect(adm.updateRunStatus(run.id, { status: "PUBLISHED" })).rejects.toThrow(/APROVADAS/);
    await adm.updateRunStatus(run.id, { status: "APPROVED" });
    await adm.updateRunStatus(run.id, { status: "PUBLISHED" });
    const ev = (await adm.getEvent(eventId))!;
    expect(ev.status).toBe("PUBLISHED");
    expect(ev.publishedRunId).toBe(run.id);
  });

  it("auditoria registra ações de UI e de banco", async () => {
    const adm = createSupabaseRepo(await client(...ADMIN));
    await adm.addAudit({ eventId, user: "admin@it.test", role: "ADMIN", action: "teste de auditoria", details: "ok" });
    const log = await adm.listAudit(eventId);
    expect(log.some((a) => a.action === "teste de auditoria")).toBe(true);
    expect(log.some((a) => a.action.includes("optimization_runs"))).toBe(true);
    expect(log.length).toBeGreaterThan(100); // inserts de participantes/preferências auditados por trigger
  });

  it("lista eventos com contagens e ADMIN apaga o sandbox", async () => {
    const adm = createSupabaseRepo(await client(...ADMIN));
    const list = await adm.listEvents();
    const mine = list.find((e) => e.id === eventId)!;
    expect(mine.participants).toBe(61);
    expect(mine.runs).toBe(1);
    await adm.deleteEvent(eventId);
    expect(await adm.getEvent(eventId)).toBeNull();
  });
});
