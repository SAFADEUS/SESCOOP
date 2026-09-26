import { DEFAULT_CONFIG, type EventConfig, type Participant, type Preference } from "@/engine";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Repo } from "./repo";
import type { AuditEntry, EventStatus, EventSummary, RunRecord, SandboxEvent } from "./types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string) => UUID.test(s);

/** Remapeia ids não-UUID (ex.: P001 gerados pelo simulador) para UUIDs em todo o evento. */
export function normalizeIds(ev: SandboxEvent): SandboxEvent {
  const map = new Map<string, string>();
  const m = (id: string) => {
    if (isUuid(id)) return id;
    if (!map.has(id)) map.set(id, crypto.randomUUID());
    return map.get(id)!;
  };
  const mo = (id: string | null | undefined) => (id ? m(id) : id ?? null);
  const input = ev.input;
  const out: SandboxEvent = {
    ...ev,
    id: m(ev.id),
    input: {
      ...input,
      tables: input.tables.map((t) => ({ ...t, id: m(t.id) })),
      participants: input.participants.map((p) => ({ ...p, id: m(p.id), fixedTableId: mo(p.fixedTableId) })),
      preferences: input.preferences.map((p) => ({ ...p, id: m(p.id), sourceId: m(p.sourceId), targetId: m(p.targetId) })),
      availability: Object.fromEntries(Object.entries(input.availability ?? {}).map(([k, v]) => [m(k), v])),
      tableAvailability: Object.fromEntries(Object.entries(input.tableAvailability ?? {}).map(([k, v]) => [m(k), v])),
      locks: (input.locks ?? []).map((l) => ({ ...l, participantId: m(l.participantId), tableId: m(l.tableId) })),
      realizedSchedule: input.realizedSchedule?.map((s) => s.map((t) => t.map(m))),
    },
    attendance: ev.attendance ? Object.fromEntries(Object.entries(ev.attendance).map(([k, v]) => [k, v.map(m)])) : undefined,
    incident: ev.incident
      ? { ...ev.incident, absentId: m(ev.incident.absentId), lateId: m(ev.incident.lateId), closedTableId: m(ev.incident.closedTableId) }
      : undefined,
  };
  return out;
}

type PgError = { message: string; details?: string | null; hint?: string | null; code?: string };
async function must<T>(p: PromiseLike<{ data: T; error: PgError | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error([error.message, error.details, error.hint].filter(Boolean).join(" — ") || `erro ${error.code ?? "desconhecido"}`);
  return data;
}

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function createSupabaseRepo(sb: SupabaseClient): Repo {
  /** Remove as linhas do evento que não estão em `keep` (em lotes; evita URLs gigantes com NOT IN). */
  const deleteMissing = async (table: string, eventId: string, keep: string[]) => {
    const keepSet = new Set(keep);
    const existing = (await must(sb.from(table).select("id").eq("event_id", eventId))) as Row[];
    const drop = existing.map((r) => r.id as string).filter((id) => !keepSet.has(id));
    for (let i = 0; i < drop.length; i += 100) await must(sb.from(table).delete().in("id", drop.slice(i, i + 100)));
  };

  let orgCache: string | null = null;
  const currentOrg = async (): Promise<string> => {
    if (orgCache) return orgCache;
    const { data: u } = await sb.auth.getUser();
    if (!u.user) throw new Error("Faça login para usar o Supabase.");
    const roles = await must(sb.from("user_roles").select("organization_id").eq("user_id", u.user.id).limit(1));
    if (!roles?.length) throw new Error("Seu usuário ainda não pertence a uma organização.");
    orgCache = roles[0].organization_id as string;
    return orgCache;
  };
  const userLabel = async () => (await sb.auth.getUser()).data.user?.email ?? "?";

  return {
    kind: "supabase",
    async listEvents() {
      const rows = await must(
        sb
          .from("events")
          .select(
            "id,name,status,sandbox,scenario_key,updated_at,participants!participants_event_id_fkey(count),participant_preferences!participant_preferences_event_id_fkey(count),optimization_runs!optimization_runs_event_id_fkey(count)",
          ).order("updated_at", { ascending: false }),
      );
      return (rows as Row[]).map(
        (r): EventSummary => ({
          id: r.id,
          name: r.name,
          status: r.status,
          sandbox: r.sandbox,
          scenarioKey: r.scenario_key,
          participants: r.participants?.[0]?.count ?? 0,
          preferences: r.participant_preferences?.[0]?.count ?? 0,
          runs: r.optimization_runs?.[0]?.count ?? 0,
          updatedAt: r.updated_at,
        }),
      );
    },

    async getEvent(id) {
      const ev = (await must(sb.from("events").select("*").eq("id", id).maybeSingle())) as Row | null;
      if (!ev) return null;
      const [sessions, tables, parts, avail, prefs, locks] = await Promise.all([
        must(sb.from("sessions").select("*").eq("event_id", id).order("session_index")),
        must(sb.from("event_tables").select("*").eq("event_id", id).order("table_number")),
        must(sb.from("participants").select("*").eq("event_id", id).order("created_at")),
        must(sb.from("participant_availability").select("participant_id,available,status,sessions(session_index)").eq("event_id", id)),
        must(sb.from("participant_preferences").select("*").eq("event_id", id).order("created_at")),
        must(sb.from("manual_locks").select("*").eq("event_id", id)),
      ]);
      const extra = (ev.config ?? {}) as Row;
      const S = ev.session_count as number;
      const sessionOverrides: NonNullable<EventConfig["sessionOverrides"]> = { ...(extra.sessionOverrides ?? {}) };
      for (const s of sessions as Row[])
        if (s.max_capacity_override) sessionOverrides[s.session_index] = { ...(sessionOverrides[s.session_index] ?? {}), maxCapacity: s.max_capacity_override };
      const config: EventConfig = {
        ...DEFAULT_CONFIG,
        participantTarget: ev.participant_target,
        tableCount: ev.table_count,
        sessionCount: S,
        idealTableCapacity: ev.ideal_table_capacity,
        minTableCapacity: ev.min_table_capacity,
        maxTableCapacity: ev.max_table_capacity,
        sessionDurationMinutes: ev.session_duration_minutes,
        avoidTableRevisit: ev.avoid_table_revisit,
        allowSameCompany: ev.allow_same_company,
        demandThresholds: extra.demandThresholds ?? DEFAULT_CONFIG.demandThresholds,
        spreadHighDemand: extra.spreadHighDemand ?? true,
        mustMeetPriority: extra.mustMeetPriority ?? "HARD",
        weights: { ...DEFAULT_CONFIG.weights, ...(extra.weights ?? {}) },
        sessionOverrides,
      };
      const availability: Record<string, boolean[]> = {};
      for (const a of avail as Row[]) {
        const s = a.sessions?.session_index;
        if (s === undefined || s === null) continue;
        availability[a.participant_id] ??= Array.from({ length: S }, () => true);
        availability[a.participant_id][s] = a.available && a.status !== "ABSENT" && a.status !== "LEFT_EVENT";
      }
      const tableAvailability: Record<string, boolean[]> = {};
      for (const t of tables as Row[]) {
        if (!t.active || (t.unavailable_sessions ?? []).length)
          tableAvailability[t.id] = Array.from({ length: S }, (_, s) => t.active && !(t.unavailable_sessions ?? []).includes(s));
      }
      const participants: Participant[] = (parts as Row[]).map((p) => ({
        id: p.id,
        name: p.name,
        company: p.company,
        role: p.role,
        segment: p.segment,
        category: p.category,
        description: p.description ?? "",
        tags: p.tags ?? [],
        active: p.active,
        fixed: p.participant_fixed,
        fixedTableId: p.fixed_table_id,
        institutionalPriority: p.institutional_priority,
        kind: p.kind,
        countsTowardCapacity: p.counts_toward_capacity,
        notes: p.notes ?? "",
        status: p.attendance_status,
      }));
      const preferences: Preference[] = (prefs as Row[]).map((p) => ({
        id: p.id,
        sourceId: p.source_participant_id,
        targetId: p.target_participant_id,
        type: p.relationship_type,
        weight: Number(p.weight),
        reason: p.reason ?? "",
        allowRepeat: p.allow_repeat,
      }));
      const out: SandboxEvent = {
        id: ev.id,
        name: ev.name,
        status: ev.status as EventStatus,
        sandbox: ev.sandbox,
        scenarioKey: ev.scenario_key,
        scenarioSeed: ev.scenario_seed,
        notes: extra.notes ?? [],
        sessionNames: Array.from({ length: S }, (_, s) => (sessions as Row[]).find((x) => x.session_index === s)?.name ?? `Sessão ${s + 1}`),
        frozenUntil: ev.frozen_until,
        attendance: extra.attendance,
        incident: extra.incident,
        publishedRunId: ev.published_run_id,
        createdAt: ev.created_at,
        updatedAt: ev.updated_at,
        input: {
          config,
          participants,
          preferences,
          tables: (tables as Row[]).map((t) => ({ id: t.id, number: t.table_number, name: t.name })),
          availability,
          tableAvailability,
          locks: (locks as Row[]).map((l) => ({ participantId: l.participant_id, session: l.session_index, tableId: l.table_id })),
          frozenUntil: ev.frozen_until,
          realizedSchedule: extra.realizedSchedule,
        },
      };
      return out;
    },

    async saveEvent(raw) {
      const ev = normalizeIds(raw);
      const org = await currentOrg();
      const c = ev.input.config;
      const S = c.sessionCount;
      await must(
        sb.from("events").upsert({
          id: ev.id,
          organization_id: org,
          name: ev.name,
          status: ev.status,
          participant_target: c.participantTarget,
          table_count: c.tableCount,
          session_count: S,
          ideal_table_capacity: c.idealTableCapacity,
          min_table_capacity: c.minTableCapacity,
          max_table_capacity: c.maxTableCapacity,
          session_duration_minutes: c.sessionDurationMinutes,
          avoid_table_revisit: c.avoidTableRevisit,
          allow_same_company: c.allowSameCompany,
          sandbox: ev.sandbox,
          scenario_key: ev.scenarioKey ?? null,
          scenario_seed: ev.scenarioSeed ?? null,
          frozen_until: ev.frozenUntil,
          config: {
            weights: c.weights,
            demandThresholds: c.demandThresholds,
            spreadHighDemand: c.spreadHighDemand,
            mustMeetPriority: c.mustMeetPriority,
            sessionOverrides: c.sessionOverrides ?? {},
            attendance: ev.attendance ?? null,
            incident: ev.incident ?? null,
            notes: ev.notes ?? [],
            realizedSchedule: ev.input.realizedSchedule ?? null,
          },
        }),
      );
      // Sessões
      await must(
        sb.from("sessions").upsert(
          ev.sessionNames.slice(0, S).map((name, s) => ({ event_id: ev.id, session_index: s, name })),
          { onConflict: "event_id,session_index" },
        ),
      );
      await must(sb.from("sessions").delete().eq("event_id", ev.id).gte("session_index", S));
      const sessRows = (await must(sb.from("sessions").select("id,session_index").eq("event_id", ev.id))) as Row[];
      const sessionId = new Map(sessRows.map((r) => [r.session_index as number, r.id as string]));
      // Mesas
      const tIds = ev.input.tables.map((t) => t.id);
      if (tIds.length)
        await must(
          sb.from("event_tables").upsert(
            ev.input.tables.map((t) => {
              const a = ev.input.tableAvailability?.[t.id];
              return {
                id: t.id,
                event_id: ev.id,
                table_number: t.number,
                name: t.name,
                active: true,
                unavailable_sessions: a ? a.map((v, s) => (v === false ? s : -1)).filter((s) => s >= 0) : [],
              };
            }),
          ),
        );
      await deleteMissing("event_tables", ev.id, tIds);
      // Participantes
      const pIds = ev.input.participants.map((p) => p.id);
      if (pIds.length)
        await must(
          sb.from("participants").upsert(
            ev.input.participants.map((p) => ({
              id: p.id,
              event_id: ev.id,
              name: p.name,
              company: p.company,
              role: p.role,
              segment: p.segment,
              category: p.category,
              description: p.description ?? null,
              tags: p.tags,
              active: p.active,
              participant_fixed: p.fixed,
              fixed_table_id: p.fixedTableId ?? null,
              institutional_priority: p.institutionalPriority,
              kind: p.kind,
              counts_toward_capacity: p.countsTowardCapacity,
              attendance_status: p.status ?? "CONFIRMED",
              notes: p.notes ?? null,
            })),
          ),
        );
      await deleteMissing("participants", ev.id, pIds);
      // Disponibilidade (somente exceções)
      await must(sb.from("participant_availability").delete().eq("event_id", ev.id));
      const availRows: Row[] = [];
      for (const [pid, arr] of Object.entries(ev.input.availability ?? {}))
        arr.forEach((v, s) => {
          if (v === false && sessionId.has(s))
            availRows.push({ event_id: ev.id, participant_id: pid, session_id: sessionId.get(s), available: false, status: "ABSENT" });
        });
      if (availRows.length) await must(sb.from("participant_availability").insert(availRows));
      // Preferências
      const prIds = ev.input.preferences.map((p) => p.id);
      await deleteMissing("participant_preferences", ev.id, prIds);
      for (let i = 0; i < ev.input.preferences.length; i += 500)
        await must(
          sb.from("participant_preferences").upsert(
            ev.input.preferences.slice(i, i + 500).map((p) => ({
              id: p.id,
              event_id: ev.id,
              source_participant_id: p.sourceId,
              target_participant_id: p.targetId,
              relationship_type: p.type,
              weight: p.weight ?? 1,
              reason: p.reason ?? null,
              allow_repeat: !!p.allowRepeat,
            })),
          ),
        );
      // Locks manuais
      await must(sb.from("manual_locks").delete().eq("event_id", ev.id));
      if (ev.input.locks?.length)
        await must(
          sb.from("manual_locks").insert(
            ev.input.locks.map((l) => ({ event_id: ev.id, session_index: l.session, participant_id: l.participantId, table_id: l.tableId })),
          ),
        );
      return ev;
    },

    async deleteEvent(id) {
      await must(sb.from("events").delete().eq("id", id).eq("sandbox", true));
    },

    async listRuns(eventId) {
      const rows = (await must(sb.from("optimization_runs").select("*").eq("event_id", eventId).order("version", { ascending: false }))) as Row[];
      return rows.map(
        (r): RunRecord => ({
          id: r.id,
          eventId: r.event_id,
          version: r.version,
          label: r.label ?? "",
          mode: r.mode,
          status: r.status,
          parentRunId: r.parent_run_id,
          optimizerVersion: r.optimizer_version,
          seed: r.seed,
          seeds: r.seeds_count,
          iterations: r.iterations,
          frozenUntil: r.frozen_until,
          schedule: r.schedule,
          metrics: r.metrics_snapshot,
          demand: r.demand_snapshot,
          feasibility: r.feasibility,
          candidates: r.candidates,
          lex: r.lex ?? [],
          timeMs: r.duration_ms ?? 0,
          configSnapshot: r.config_snapshot,
          comparison: r.comparison,
          createdAt: r.created_at,
          createdBy: r.created_by ?? "",
          approvedAt: r.approved_at,
          publishedAt: r.published_at,
        }),
      );
    },

    async insertRun(run) {
      const row = (await must(
        sb
          .from("optimization_runs")
          .insert({
            event_id: run.eventId,
            label: run.label,
            mode: run.mode,
            optimizer_version: run.optimizerVersion,
            seed: run.seed,
            seeds_count: run.seeds,
            iterations: run.iterations,
            status: run.status === "DRAFT" ? "DRAFT" : "SIMULATED",
            parent_run_id: run.parentRunId ?? null,
            frozen_until: run.frozenUntil,
            config_snapshot: run.configSnapshot,
            demand_snapshot: run.demand,
            metrics_snapshot: run.metrics,
            feasibility: run.feasibility,
            candidates: run.candidates,
            comparison: run.comparison ?? null,
            lex: run.lex,
            schedule: run.schedule,
            duration_ms: run.timeMs,
            finished_at: new Date().toISOString(),
          })
          .select("*")
          .single(),
      )) as Row;
      // assignments normalizados (uma linha por participante/sessão)
      const [sessions, tables] = await Promise.all([
        must(sb.from("sessions").select("id,session_index").eq("event_id", run.eventId)),
        must(sb.from("event_tables").select("id,table_number").eq("event_id", run.eventId).order("table_number")),
      ]);
      const sid = new Map((sessions as Row[]).map((s) => [s.session_index, s.id]));
      const tableRows = tables as Row[];
      const source = run.mode === "MANUAL" ? "MANUAL" : run.mode === "REOPTIMIZATION" ? "REOPTIMIZATION" : "OPTIMIZER";
      const assignments: Row[] = [];
      run.schedule.forEach((sess, s) =>
        sess.forEach((mem, t) =>
          mem.forEach((pid) =>
            assignments.push({
              optimization_run_id: row.id,
              session_id: sid.get(s) ?? null,
              session_index: s,
              table_id: tableRows[t]?.id ?? null,
              participant_id: pid,
              assignment_source: source,
            }),
          ),
        ),
      );
      for (let i = 0; i < assignments.length; i += 500) await must(sb.from("assignments").insert(assignments.slice(i, i + 500)));
      const m = run.metrics;
      const metricRows: Row[] = [
        ["hard_violations", m.hardViolations],
        ["repeats", m.repeats],
        ["unique_contacts", m.uniqueContacts],
        ["preferences_met", m.preferencesMet],
        ["preferences_registered", m.preferencesRegistered],
        ["must_meet_unmet", m.mustMeetUnmet],
        ["high_priority_met", m.highPriorityMet],
        ["satisfaction_min", m.satisfaction.min],
        ["satisfaction_p10", m.satisfaction.p10],
        ["satisfaction_median", m.satisfaction.median],
        ["satisfaction_avg", m.satisfaction.avg],
        ["time_ms", run.timeMs],
      ].map(([k, v]) => ({ optimization_run_id: row.id, metric_key: k, metric_value: v }));
      for (const p of m.perParticipant)
        if (p.satisfaction !== null)
          metricRows.push({ optimization_run_id: row.id, metric_key: "participant_satisfaction", metric_value: p.satisfaction, participant_id: p.participantId });
      await must(sb.from("optimization_metrics").insert(metricRows));
      return { ...run, id: row.id, version: row.version, createdAt: row.created_at, createdBy: row.created_by };
    },

    async updateRunStatus(id, patch) {
      const upd: Row = { status: patch.status };
      if (patch.label !== undefined) upd.label = patch.label;
      await must(sb.from("optimization_runs").update(upd).eq("id", id));
    },

    async addAudit(entry) {
      const org = await currentOrg();
      const { data: u } = await sb.auth.getUser();
      await must(
        sb.from("audit_logs").insert({
          organization_id: org,
          event_id: entry.eventId,
          user_id: u.user?.id,
          action: entry.action,
          entity: "ui",
          payload: { details: entry.details ?? null, role: entry.role, user: entry.user || (await userLabel()) },
        }),
      );
    },

    async listAudit(eventId) {
      const rows = (await must(
        sb.from("audit_logs").select("*").eq("event_id", eventId).order("created_at", { ascending: false }).limit(500),
      )) as Row[];
      return rows.map(
        (r): AuditEntry => ({
          id: String(r.id),
          eventId: r.event_id,
          at: r.created_at,
          user: r.payload?.user ?? r.user_id ?? "sistema",
          role: r.payload?.role ?? "ADMIN",
          action: r.entity === "ui" ? r.action : `${r.action} ${r.entity}`,
          details: r.payload?.details ?? (r.entity !== "ui" ? r.payload?.name ?? r.entity_id : undefined),
        }),
      );
    },
  };
}
