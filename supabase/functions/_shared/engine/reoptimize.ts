// Reotimização durante o evento (seções 29–32).
// Congela as sessões concluídas usando os encontros REALMENTE ocorridos e otimiza só as futuras.

import { computeMetrics } from "./metrics.ts";
import { optimizeEvent } from "./optimizer.ts";
import { compileProblem } from "./problem.ts";
import type { EventInput, Metrics, OptimizationResult, OptimizeOptions, Schedule } from "./types.ts";

/** Presença real por sessão: attendance[session] = ids presentes (ausente = não compareceu). */
export type Attendance = Record<number, string[] | undefined>;

/**
 * Constrói o realizado das sessões congeladas: programação publicada menos quem não compareceu.
 * Se não houver registro de presença para a sessão, assume que a programação ocorreu como previsto.
 */
export function realizeSessions(plan: Schedule, frozenUntil: number, attendance: Attendance = {}): Schedule {
  const out: Schedule = [];
  for (let s = 0; s < frozenUntil; s++) {
    const present = attendance[s] ? new Set(attendance[s]) : null;
    out.push((plan[s] ?? []).map((mem) => (present ? mem.filter((id) => present.has(id)) : [...mem])));
  }
  return out;
}

/** Projeta a programação antiga sobre a nova realidade (remove indisponíveis) para comparação. */
export function projectPlan(input: EventInput, plan: Schedule): Schedule {
  const P = compileProblem(input);
  const out: Schedule = [];
  for (let s = 0; s < P.S; s++) {
    if (s < P.frozenUntil) {
      out.push((input.realizedSchedule?.[s] ?? []).map((m) => [...m]));
      continue;
    }
    out.push(
      (plan[s] ?? []).map((mem) =>
        mem.filter((id) => {
          const p = P.idx.get(id);
          return p !== undefined && P.avail[s][p] === 1;
        }),
      ),
    );
  }
  return out;
}

export interface ComparisonSide {
  repeats: number;
  preferencesMet: number;
  minSatisfaction: number;
  p10: number;
  avgSatisfaction: number;
  uniqueContacts: number;
  hardViolations: number;
  mustMeetUnmet: number;
}

export interface ReoptimizationComparison {
  before: ComparisonSide;
  after: ComparisonSide;
  movedParticipants: number; // pessoas que trocam de mesa em ao menos uma sessão futura
  movedAssignments: number; // (sessão, pessoa) que trocaram de mesa
  frozenUnchanged: boolean;
  beforeMetrics: Metrics;
}

function side(m: Metrics): ComparisonSide {
  return {
    repeats: m.repeats,
    preferencesMet: m.preferencesMet,
    minSatisfaction: m.satisfaction.min,
    p10: m.satisfaction.p10,
    avgSatisfaction: m.satisfaction.avg,
    uniqueContacts: m.uniqueContacts,
    hardViolations: m.hardViolations,
    mustMeetUnmet: m.mustMeetUnmet,
  };
}

export function comparePlans(input: EventInput, oldPlan: Schedule, newPlan: Schedule): ReoptimizationComparison {
  const P = compileProblem(input);
  const projected = projectPlan(input, oldPlan);
  const before = computeMetrics(P, projected);
  const after = computeMetrics(P, newPlan);
  const tableOf = (plan: Schedule, s: number) => {
    const m = new Map<string, number>();
    (plan[s] ?? []).forEach((mem, t) => mem.forEach((id) => m.set(id, t)));
    return m;
  };
  const movedSet = new Set<string>();
  let movedAssignments = 0;
  for (let s = P.frozenUntil; s < P.S; s++) {
    const a = tableOf(oldPlan, s);
    const b = tableOf(newPlan, s);
    for (const [id, t] of b) {
      if (a.has(id) && a.get(id) !== t) {
        movedSet.add(id);
        movedAssignments++;
      }
    }
  }
  let frozenUnchanged = true;
  for (let s = 0; s < P.frozenUntil; s++) {
    const real = input.realizedSchedule?.[s] ?? [];
    const got = newPlan[s] ?? [];
    for (let t = 0; t < Math.max(real.length, got.length); t++) {
      const x = [...(real[t] ?? [])].sort().join(",");
      const y = [...(got[t] ?? [])].sort().join(",");
      if (x !== y) frozenUnchanged = false;
    }
  }
  return {
    before: side(before),
    after: side(after),
    movedParticipants: movedSet.size,
    movedAssignments,
    frozenUnchanged,
    beforeMetrics: before,
  };
}

export function reoptimize(
  input: EventInput,
  oldPlan: Schedule,
  opts: OptimizeOptions,
): { result: OptimizationResult; comparison: ReoptimizationComparison } {
  const result = optimizeEvent(input, opts);
  const comparison = comparePlans(input, oldPlan, result.schedule);
  return { result, comparison };
}

/** Aplica o script do cenário E sobre o input original. */
export function applyIncident(
  input: EventInput,
  plan: Schedule,
  incident: { afterSession: number; absentId: string; lateId: string; closedTableId: string; capacityOverride: number },
): EventInput {
  const S = input.config.sessionCount;
  const k = incident.afterSession;
  const attendance: Attendance = {};
  for (let s = 0; s < k; s++) {
    // o atrasado não esteve nas sessões anteriores
    attendance[s] = (plan[s] ?? []).flat().filter((id) => id !== incident.lateId);
  }
  const availability = { ...(input.availability ?? {}) };
  availability[incident.absentId] = Array.from({ length: S }, (_, s) => s < k);
  availability[incident.lateId] = Array.from({ length: S }, (_, s) => s >= k);
  const tableAvailability = { ...(input.tableAvailability ?? {}) };
  tableAvailability[incident.closedTableId] = Array.from({ length: S }, (_, s) => s < k);
  const overrides = { ...(input.config.sessionOverrides ?? {}) };
  for (let s = k; s < S; s++) overrides[s] = { ...(overrides[s] ?? {}), maxCapacity: incident.capacityOverride };
  return {
    ...input,
    config: { ...input.config, sessionOverrides: overrides },
    availability,
    tableAvailability,
    frozenUntil: k,
    realizedSchedule: realizeSessions(plan, k, attendance),
    previousSchedule: plan,
  };
}
