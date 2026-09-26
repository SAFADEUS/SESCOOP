// calculateMetrics + validateSolution: cálculo INDEPENDENTE a partir do Schedule publicado.
// Não reutiliza os agregados incrementais do State, servindo como verificação cruzada.

import {
  CODE_TYPE,
  F_ALLOWREPEAT,
  F_AVOID,
  F_HUBS,
  F_MUSTMEET,
  F_MUSTNOT,
  F_MUTUAL,
  F_SAMECO,
  type Problem,
} from "./problem.ts";
import { satisfactionStats, stdDev } from "./stats.ts";
import type { Metrics, ParticipantResult, Schedule } from "./types.ts";

export interface EncounterRecord {
  a: string;
  b: string;
  session: number;
  table: number;
  isRepeat: boolean;
  strategic: boolean;
  preferenceType: string | null; // tipo mais forte entre as duas direções
  preferenceFulfilled: boolean; // primeiro encontro de um par com preferência positiva
  mutualInterest: boolean;
}

export function listEncounters(P: Problem, schedule: Schedule): EncounterRecord[] {
  const out: EncounterRecord[] = [];
  const n = P.n;
  const seen = new Int16Array(n * n);
  for (let s = 0; s < P.S; s++) {
    const sess = schedule[s] ?? [];
    sess.forEach((mem, t) => {
      const ps = uniq(mem.map((id) => P.idx.get(id)).filter((x): x is number => x !== undefined && !P.staff[x]));
      for (let x = 0; x < ps.length; x++)
        for (let y = x + 1; y < ps.length; y++) {
          const i = Math.min(ps[x], ps[y]);
          const j = Math.max(ps[x], ps[y]);
          const k = i * n + j;
          const c = seen[k]++;
          const a = P.wants[k];
          const b = P.wants[j * n + i];
          const strongest = Math.max(a, b);
          const f = P.pairFlags[k];
          out.push({
            a: P.ids[i],
            b: P.ids[j],
            session: s,
            table: t,
            isRepeat: c > 0 && !(f & F_ALLOWREPEAT),
            strategic: c > 0 && !!(f & F_ALLOWREPEAT),
            preferenceType: strongest > 0 ? CODE_TYPE[strongest] : a < 0 || b < 0 ? CODE_TYPE[Math.min(a, b)] : null,
            preferenceFulfilled: c === 0 && strongest > 0,
            mutualInterest: !!(f & F_MUTUAL),
          });
        }
    });
  }
  return out;
}

function uniq(a: number[]): number[] {
  return [...new Set(a)];
}

export function computeMetrics(P: Problem, schedule: Schedule): Metrics {
  const { n, S, T } = P;
  const details: string[] = [];
  let duplicate = 0;
  let unseated = 0;
  let availabilityV = 0;
  let capacityV = 0;
  let lockV = 0;
  const tableOf: number[][] = [];
  const sizes: number[] = [];
  let pairSlots = 0;

  for (let s = 0; s < S; s++) {
    const row = new Array<number>(n).fill(-1);
    const sess = schedule[s] ?? [];
    for (let t = 0; t < Math.max(T, sess.length); t++) {
      const mem = sess[t] ?? [];
      if (t >= T && mem.length) {
        capacityV++;
        details.push(`Sessão ${s + 1}: mesa inexistente (#${t + 1}) com participantes.`);
        continue;
      }
      let cap = 0;
      let comm = 0;
      for (const id of mem) {
        const p = P.idx.get(id);
        if (p === undefined) {
          duplicate++;
          details.push(`Sessão ${s + 1}: participante desconhecido/inativo ${id}.`);
          continue;
        }
        if (row[p] >= 0) {
          duplicate++;
          details.push(`Sessão ${s + 1}: ${P.participants[p].name} aparece mais de uma vez.`);
          continue;
        }
        row[p] = t;
        if (P.countsCap[p]) cap++;
        if (!P.staff[p]) comm++;
        if (!P.avail[s][p]) {
          availabilityV++;
          details.push(`Sessão ${s + 1}: ${P.participants[p].name} alocado mas indisponível.`);
        }
      }
      if (mem.length > 0 && !P.tableAvail[s][t] && s >= P.frozenUntil) {
        capacityV++;
        details.push(`Sessão ${s + 1}: mesa ${P.input.tables[t].name} está indisponível mas possui participantes.`);
      }
      if (cap > 0) sizes.push(cap);
      if (cap > P.maxCap[s] && s >= P.frozenUntil) {
        capacityV++;
        details.push(`Sessão ${s + 1}: mesa ${P.input.tables[t].name} com ${cap} (> máx ${P.maxCap[s]}).`);
      }
      pairSlots += (comm * (comm - 1)) / 2;
    }
    for (let p = 0; p < n; p++) {
      if (P.avail[s][p] && row[p] < 0) {
        unseated++;
        details.push(`Sessão ${s + 1}: ${P.participants[p].name} disponível mas sem mesa.`);
      }
      if (P.pinned[s][p] >= 0 && row[p] >= 0 && row[p] !== P.pinned[s][p]) {
        lockViolations(s, p);
      }
    }
    tableOf.push(row);
  }
  function lockViolations(s: number, p: number) {
    lockV++;
    details.push(
      s < P.frozenUntil
        ? `Sessão ${s + 1} (congelada): ${P.participants[p].name} foi alterado.`
        : `Sessão ${s + 1}: ${P.participants[p].name} fora da mesa bloqueada/fixa.`,
    );
  }

  // Pares
  const meet = new Int16Array(n * n);
  const segSets: number[] = [];
  let repeats = 0;
  let strategic = 0;
  let mustNot = 0;
  let sameCo = 0;
  let avoid = 0;
  let hubs = 0;
  for (let s = 0; s < S; s++) {
    for (let t = 0; t < T; t++) {
      const ps: number[] = [];
      for (let p = 0; p < n; p++) if (tableOf[s][p] === t && !P.staff[p]) ps.push(p);
      if (ps.length === 0) continue;
      segSets.push(new Set(ps.map((p) => P.segment[p])).size);
      for (let x = 0; x < ps.length; x++)
        for (let y = x + 1; y < ps.length; y++) {
          const i = ps[x];
          const j = ps[y];
          const k = i * n + j;
          const c = meet[k];
          meet[k] = meet[j * n + i] = c + 1;
          const f = P.pairFlags[k];
          if (f & F_MUSTNOT) {
            mustNot++;
            details.push(`Sessão ${s + 1}: MUST_NOT_MEET violado (${P.participants[i].name} × ${P.participants[j].name}).`);
          }
          if (f & F_SAMECO) sameCo++;
          if (f & F_AVOID) avoid++;
          if (f & F_HUBS) hubs++;
          if (c > 0) {
            if (f & F_ALLOWREPEAT) strategic++;
            else repeats++;
          }
        }
    }
  }
  let unique = 0;
  let repeatPairs = 0;
  let mustMeetMet = 0;
  let mustMeetUnmetViable = 0;
  let mutualPairs = 0;
  let mutualMet = 0;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const k = i * n + j;
      if (meet[k] > 0) unique++;
      if (meet[k] > 1 && !(P.pairFlags[k] & F_ALLOWREPEAT)) repeatPairs++;
      if (P.pairFlags[k] & F_MUSTMEET && meet[k] > 0) mustMeetMet++;
      if (P.pairFlags[k] & F_MUSTMEET && meet[k] === 0 && !P.mustMeetImpossible.has(k)) {
        mustMeetUnmetViable++;
        if (P.config.mustMeetPriority === "HARD")
          details.push(`MUST_MEET viável não atendido: ${P.participants[i].name} × ${P.participants[j].name}.`);
      }
      if (P.pairFlags[k] & F_MUTUAL) {
        mutualPairs++;
        if (meet[k] > 0) mutualMet++;
      }
    }

  // Preferências e satisfação
  const byType: Record<string, { total: number; met: number }> = {};
  for (const t of ["NORMAL", "PREFER", "HIGH_PRIORITY", "MUST_MEET", "AVOID", "MUST_NOT_MEET"]) byType[t] = { total: 0, met: 0 };
  let prefReg = 0;
  let prefMet = 0;
  const perParticipant: ParticipantResult[] = [];
  const sats: number[] = [];
  const inboundMet = new Int32Array(n);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const c = P.wants[i * n + j];
      if (c === 0) continue;
      const type = CODE_TYPE[c];
      byType[type].total++;
      if (meet[i * n + j] > 0) {
        byType[type].met++;
        if (c > 0) inboundMet[j]++;
      }
      if (c > 0) {
        prefReg++;
        if (meet[i * n + j] > 0) prefMet++;
      }
    }
  const pRepeats = new Int32Array(n);
  const contacts = new Int32Array(n);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const c = meet[i * n + j];
      if (c > 0) contacts[i]++;
      if (c > 1 && !(P.pairFlags[i * n + j] & F_ALLOWREPEAT)) pRepeats[i] += c - 1;
    }
  let revisits = 0;
  for (let i = 0; i < n; i++) {
    const fulfilledTargets: string[] = [];
    const pendingTargets: string[] = [];
    for (let j = 0; j < n; j++) {
      if (P.wants[i * n + j] <= 0) continue;
      if (meet[i * n + j] > 0) fulfilledTargets.push(P.ids[j]);
      else pendingTargets.push(P.ids[j]);
    }
    const possible = P.possible[i];
    const sat = possible > 0 ? Math.min(1, fulfilledTargets.length / possible) : null;
    if (sat !== null) sats.push(sat);
    const tables: (number | null)[] = [];
    const used = new Map<number, number>();
    for (let s = 0; s < S; s++) {
      const t = tableOf[s][i];
      tables.push(t >= 0 ? t : null);
      if (t >= 0 && !P.staff[i]) used.set(t, (used.get(t) ?? 0) + 1);
    }
    for (const c of used.values()) revisits += c - 1;
    perParticipant.push({
      participantId: P.ids[i],
      requested: P.requested[i],
      possible,
      fulfilled: fulfilledTargets.length,
      satisfaction: sat,
      contacts: contacts[i],
      repeats: pRepeats[i],
      tables,
      fulfilledTargets,
      pendingTargets,
      inboundMet: inboundMet[i],
    });
  }

  const hard = mustNot + capacityV + availabilityV + duplicate + lockV + unseated;
  const sizeStd = stdDev(sizes);
  return {
    participants: n,
    sessions: S,
    tables: T,
    hardViolations: hard,
    hardViolationDetails: details.slice(0, 200),
    mustNotViolations: mustNot,
    capacityViolations: capacityV,
    availabilityViolations: availabilityV,
    duplicateViolations: duplicate,
    lockViolations: lockV,
    unseated,
    repeats,
    strategicRepeats: strategic,
    repeatPairs,
    uniqueContacts: unique,
    pairSlots,
    preferencesRegistered: prefReg,
    preferencesMet: prefMet,
    preferencesMetByType: byType,
    mutualPairs,
    mutualPairsMet: mutualMet,
    mustMeetTotal: P.mustMeetPairs.length,
    mustMeetMet,
    mustMeetUnmet: P.mustMeetPairs.length - mustMeetMet,
    mustMeetUnmetViable,
    highPriorityTotal: byType.HIGH_PRIORITY.total,
    highPriorityMet: byType.HIGH_PRIORITY.met,
    avoidMet: avoid,
    sameCompanyPairs: sameCo,
    diversity: segSets.length ? segSets.reduce((a, b) => a + b, 0) / segSets.length : 0,
    tableRevisits: P.config.avoidTableRevisit ? revisits : 0,
    highDemandClusters: hubs,
    tableSizeMin: sizes.length ? Math.min(...sizes) : 0,
    tableSizeMax: sizes.length ? Math.max(...sizes) : 0,
    tableSizeStdDev: sizeStd,
    satisfaction: satisfactionStats(sats),
    overdemanded: P.demand.filter((d) => d.demandClass === "SOBREDEMANDA").length,
    critical: P.demand.filter((d) => d.demandClass === "CRITICA").length,
    perParticipant,
  };
}

/** validateSolution: lista de violações obrigatórias (vazia = solução publicável). */
export function validateSolution(P: Problem, schedule: Schedule): { ok: boolean; hardViolations: number; details: string[] } {
  const m = computeMetrics(P, schedule);
  const mm = P.config.mustMeetPriority === "HARD" ? m.mustMeetUnmetViable : 0;
  return { ok: m.hardViolations + mm === 0, hardViolations: m.hardViolations + mm, details: m.hardViolationDetails };
}

export interface HubExplanationRow {
  requesterId: string;
  type: string;
  mutual: boolean;
  institutionalPriority: number;
  requesterSatisfaction: number | null;
  requesterAvailableSessions: number;
  met: boolean;
  session: number | null;
}

/** Explica como as vagas de um participante sobredemandado foram distribuídas (seção 12 / cenário B). */
export function explainHub(P: Problem, schedule: Schedule, hubId: string): HubExplanationRow[] {
  const h = P.idx.get(hubId);
  if (h === undefined) return [];
  const n = P.n;
  const m = computeMetrics(P, schedule);
  const firstMeet = new Map<number, number>();
  for (let s = 0; s < P.S; s++)
    (schedule[s] ?? []).forEach((mem) => {
      if (!mem.includes(hubId)) return;
      for (const id of mem) {
        const q = P.idx.get(id);
        if (q !== undefined && q !== h && !firstMeet.has(q)) firstMeet.set(q, s);
      }
    });
  const rows: HubExplanationRow[] = [];
  for (let i = 0; i < n; i++) {
    const c = P.wants[i * n + h];
    if (c <= 0) continue;
    rows.push({
      requesterId: P.ids[i],
      type: CODE_TYPE[c],
      mutual: P.wants[h * n + i] > 0,
      institutionalPriority: P.institutional[i],
      requesterSatisfaction: m.perParticipant[i].satisfaction,
      requesterAvailableSessions: P.demand[i].availableSessions,
      met: firstMeet.has(i),
      session: firstMeet.get(i) ?? null,
    });
  }
  const rank: Record<string, number> = { MUST_MEET: 0, HIGH_PRIORITY: 1, PREFER: 2, NORMAL: 3 };
  rows.sort((a, b) => Number(b.met) - Number(a.met) || rank[a.type] - rank[b.type] || Number(b.mutual) - Number(a.mutual));
  return rows;
}
