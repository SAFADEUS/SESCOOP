// Carrega um evento do banco e monta o EventInput do motor (mesmo mapeamento do frontend).
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { DEFAULT_CONFIG, type EventConfig, type EventInput, type Schedule } from "./engine/index.ts";

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

async function must<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data;
}

export interface LoadedEvent {
  event: Row;
  input: EventInput;
  sessions: Row[];
  tables: Row[];
}

export async function loadEvent(sb: SupabaseClient, eventId: string): Promise<LoadedEvent> {
  const event = (await must(sb.from("events").select("*").eq("id", eventId).single())) as Row;
  const [sessions, tables, parts, avail, prefs, locks] = await Promise.all([
    must(sb.from("sessions").select("*").eq("event_id", eventId).order("session_index")),
    must(sb.from("event_tables").select("*").eq("event_id", eventId).order("table_number")),
    must(sb.from("participants").select("*").eq("event_id", eventId).order("created_at")),
    must(sb.from("participant_availability").select("participant_id,available,status,sessions(session_index)").eq("event_id", eventId)),
    must(sb.from("participant_preferences").select("*").eq("event_id", eventId)),
    must(sb.from("manual_locks").select("*").eq("event_id", eventId)),
  ]);
  const extra = (event.config ?? {}) as Row;
  const S = event.session_count as number;
  const sessionOverrides: NonNullable<EventConfig["sessionOverrides"]> = { ...(extra.sessionOverrides ?? {}) };
  for (const s of sessions as Row[])
    if (s.max_capacity_override) sessionOverrides[s.session_index] = { ...(sessionOverrides[s.session_index] ?? {}), maxCapacity: s.max_capacity_override };
  const config: EventConfig = {
    ...DEFAULT_CONFIG,
    participantTarget: event.participant_target,
    tableCount: event.table_count,
    sessionCount: S,
    idealTableCapacity: event.ideal_table_capacity,
    minTableCapacity: event.min_table_capacity,
    maxTableCapacity: event.max_table_capacity,
    sessionDurationMinutes: event.session_duration_minutes,
    avoidTableRevisit: event.avoid_table_revisit,
    allowSameCompany: event.allow_same_company,
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
  for (const t of tables as Row[])
    if (!t.active || (t.unavailable_sessions ?? []).length)
      tableAvailability[t.id] = Array.from({ length: S }, (_, s) => t.active && !(t.unavailable_sessions ?? []).includes(s));
  const input: EventInput = {
    config,
    participants: (parts as Row[]).map((p) => ({
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
    })),
    preferences: (prefs as Row[]).map((p) => ({
      id: p.id,
      sourceId: p.source_participant_id,
      targetId: p.target_participant_id,
      type: p.relationship_type,
      weight: Number(p.weight),
      reason: p.reason ?? "",
      allowRepeat: p.allow_repeat,
    })),
    tables: (tables as Row[]).map((t) => ({ id: t.id, number: t.table_number, name: t.name })),
    availability,
    tableAvailability,
    locks: (locks as Row[]).map((l) => ({ participantId: l.participant_id, session: l.session_index, tableId: l.table_id })),
    frozenUntil: event.frozen_until,
    realizedSchedule: (extra.realizedSchedule ?? undefined) as Schedule | undefined,
  };
  return { event, input, sessions: sessions as Row[], tables: tables as Row[] };
}
