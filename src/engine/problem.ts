// Compilação do EventInput em uma estrutura indexada (Problem) usada por todo o motor.
// Inclui: validateEvent, calculateDemand, calculateParticipantDifficulty,
// plano de capacidade das mesas e calculateFeasibility.

import type {
  DemandClass,
  EventConfig,
  EventInput,
  FeasibilityIssue,
  Participant,
  ParticipantDemand,
  PreferenceType,
  SizePlan,
} from "./types.ts";

// Códigos de preferência direcional (wants[i*n+j]).
export const W_NONE = 0;
export const W_NORMAL = 1;
export const W_PREFER = 2;
export const W_HIGH = 3;
export const W_MUST = 4;
export const W_AVOID = -1;
export const W_MUSTNOT = -2;

const TYPE_CODE: Record<PreferenceType, number> = {
  NORMAL: W_NORMAL,
  PREFER: W_PREFER,
  HIGH_PRIORITY: W_HIGH,
  MUST_MEET: W_MUST,
  AVOID: W_AVOID,
  MUST_NOT_MEET: W_MUSTNOT,
};
export const CODE_TYPE: Record<number, PreferenceType> = {
  1: "NORMAL",
  2: "PREFER",
  3: "HIGH_PRIORITY",
  4: "MUST_MEET",
  [-1]: "AVOID",
  [-2]: "MUST_NOT_MEET",
};

// Flags simétricas de par (pairFlags[i*n+j]).
export const F_MUSTNOT = 1;
export const F_MUSTMEET = 2;
export const F_AVOID = 4;
export const F_ALLOWREPEAT = 8;
export const F_MUTUAL = 16;
export const F_SAMECO = 32;
export const F_HUBS = 64;

export interface Problem {
  input: EventInput;
  config: EventConfig;
  n: number;
  S: number;
  T: number;
  ids: string[];
  idx: Map<string, number>;
  participants: Participant[];
  tableIds: string[];
  tableIdx: Map<string, number>;
  /** 1 = ocupa vaga comercial. */
  countsCap: Uint8Array;
  /** 1 = moderador/âncora fora da capacidade: excluído da contabilidade de pares. */
  staff: Uint8Array;
  avail: Uint8Array[]; // [s][p]
  tableAvail: Uint8Array[]; // [s][t]
  wants: Int8Array; // n*n direcional
  wantWeight: Float64Array; // n*n direcional (peso positivo)
  pairFlags: Uint8Array; // n*n simétrico
  pairValue: Float64Array; // n*n simétrico: valor de relevância do primeiro encontro
  requested: Int32Array;
  possible: Int32Array; // min(requested, capacity)
  segment: Int32Array;
  isHub: Uint8Array; // classe de demanda >= ALTA
  institutional: Int32Array;
  /** pinned[s][p] = índice de mesa fixado (lock, mesa fixa ou sessão congelada) ou -1. */
  pinned: Int32Array[];
  frozenUntil: number;
  sizes: number[][];
  maxCap: number[]; // por sessão
  minCap: number[];
  demand: ParticipantDemand[];
  issues: FeasibilityIssue[];
  difficulty: Float64Array;
  mustMeetPairs: [number, number][];
  /** Pares MUST_MEET sem nenhuma sessão/mesa viável em comum. */
  mustMeetImpossible: Set<number>; // chave i*n+j (i<j)
}

function pct(x: number): string {
  return `${(x * 100).toFixed(1).replace(".", ",")}%`;
}

export function classifyDemand(ipd: number, cfg: EventConfig): DemandClass {
  const t = cfg.demandThresholds;
  if (ipd > t.over) return "SOBREDEMANDA";
  if (ipd >= t.critical) return "CRITICA";
  if (ipd >= t.high) return "ALTA";
  return "NORMAL";
}

/** validateEvent: checagens estruturais do input. */
export function validateEvent(input: EventInput): FeasibilityIssue[] {
  const issues: FeasibilityIssue[] = [];
  const c = input.config;
  if (c.sessionCount < 1) issues.push({ severity: "ERROR", code: "NO_SESSIONS", message: "O evento precisa de pelo menos 1 sessão." });
  if (input.tables.length < 1) issues.push({ severity: "ERROR", code: "NO_TABLES", message: "O evento precisa de pelo menos 1 mesa." });
  if (c.minTableCapacity > c.maxTableCapacity)
    issues.push({ severity: "ERROR", code: "CAPACITY_RANGE", message: "Capacidade mínima maior que a máxima." });
  if (c.idealTableCapacity < c.minTableCapacity || c.idealTableCapacity > c.maxTableCapacity)
    issues.push({ severity: "WARNING", code: "IDEAL_RANGE", message: "Capacidade ideal fora do intervalo [mín, máx]." });
  const seen = new Set<string>();
  for (const p of input.participants) {
    if (seen.has(p.id)) issues.push({ severity: "ERROR", code: "DUP_PARTICIPANT", message: `Participante duplicado: ${p.id}`, participantIds: [p.id] });
    seen.add(p.id);
  }
  const tseen = new Set<string>();
  for (const t of input.tables) {
    if (tseen.has(t.id)) issues.push({ severity: "ERROR", code: "DUP_TABLE", message: `Mesa duplicada: ${t.id}` });
    tseen.add(t.id);
  }
  const active = input.participants.filter((p) => p.active).length;
  if (active !== c.participantTarget)
    issues.push({
      severity: "INFO",
      code: "TARGET_DIFF",
      message: `Participantes ativos (${active}) diferente da meta do evento (${c.participantTarget}).`,
    });
  return issues;
}

export function compileProblem(input: EventInput): Problem {
  const config = input.config;
  const issues: FeasibilityIssue[] = validateEvent(input);
  const participants = input.participants.filter((p) => p.active);
  const n = participants.length;
  const S = config.sessionCount;
  const T = input.tables.length;
  const ids = participants.map((p) => p.id);
  const idx = new Map(ids.map((id, i) => [id, i]));
  const tableIds = input.tables.map((t) => t.id);
  const tableIdx = new Map(tableIds.map((id, i) => [id, i]));
  const frozenUntil = Math.max(0, Math.min(S, input.frozenUntil ?? 0));

  const countsCap = new Uint8Array(n);
  const staff = new Uint8Array(n);
  const institutional = new Int32Array(n);
  participants.forEach((p, i) => {
    countsCap[i] = p.countsTowardCapacity ? 1 : 0;
    staff[i] = p.countsTowardCapacity ? 0 : 1;
    institutional[i] = Math.max(0, Math.min(3, p.institutionalPriority | 0));
  });

  // Disponibilidade de mesas por sessão.
  const tableAvail: Uint8Array[] = [];
  for (let s = 0; s < S; s++) {
    const row = new Uint8Array(T);
    for (let t = 0; t < T; t++) {
      const a = input.tableAvailability?.[tableIds[t]];
      row[t] = a && a[s] === false ? 0 : 1;
    }
    tableAvail.push(row);
  }

  // Disponibilidade de participantes por sessão. Sessões congeladas usam o realizado.
  const avail: Uint8Array[] = [];
  const pinned: Int32Array[] = [];
  for (let s = 0; s < S; s++) {
    const row = new Uint8Array(n);
    const pin = new Int32Array(n).fill(-1);
    if (s < frozenUntil) {
      const realized = input.realizedSchedule?.[s];
      if (!realized) {
        issues.push({ severity: "ERROR", code: "FROZEN_MISSING", message: `Sessão ${s + 1} está congelada mas não há registro do realizado.`, session: s });
      } else {
        realized.forEach((members, t) => {
          for (const id of members) {
            const i = idx.get(id);
            if (i === undefined) continue;
            row[i] = 1;
            pin[i] = t;
          }
        });
      }
    } else {
      for (let i = 0; i < n; i++) {
        const a = input.availability?.[ids[i]];
        row[i] = a && a[s] === false ? 0 : 1;
      }
    }
    avail.push(row);
    pinned.push(pin);
  }

  // Segmentos.
  const segCodes = new Map<string, number>();
  const segment = new Int32Array(n);
  participants.forEach((p, i) => {
    const key = (p.segment || "").trim().toLowerCase();
    if (!segCodes.has(key)) segCodes.set(key, segCodes.size);
    segment[i] = segCodes.get(key)!;
  });

  // Preferências.
  const wants = new Int8Array(n * n);
  const wantWeight = new Float64Array(n * n);
  const allowRepeat = new Uint8Array(n * n);
  const w = config.weights;
  let ignored = 0;
  for (const pref of input.preferences) {
    const i = idx.get(pref.sourceId);
    const j = idx.get(pref.targetId);
    if (i === undefined || j === undefined || i === j) {
      ignored++;
      continue;
    }
    if (staff[i] || staff[j]) {
      ignored++;
      continue;
    }
    const code = TYPE_CODE[pref.type];
    const k = i * n + j;
    const cur = wants[k];
    // Mantém a relação mais forte; negativos (restrições) prevalecem sobre positivos neutros.
    const rank = (c: number) => (c === W_MUSTNOT ? 10 : c === W_MUST ? 9 : c === W_AVOID ? 5 : c);
    if (cur === 0 || rank(code) > rank(cur)) {
      wants[k] = code;
      if (code > 0) {
        const base = w.typeWeight[pref.type as keyof typeof w.typeWeight];
        wantWeight[k] = base * (pref.weight && pref.weight > 0 ? pref.weight : 1);
      } else wantWeight[k] = 0;
    }
    if (pref.allowRepeat) {
      allowRepeat[k] = 1;
      allowRepeat[j * n + i] = 1;
    }
  }
  if (ignored > 0)
    issues.push({ severity: "WARNING", code: "PREF_IGNORED", message: `${ignored} preferência(s) ignoradas (participante inativo, inexistente, moderador ou autopreferência).` });

  // Demanda.
  const availableSessions = new Int32Array(n);
  for (let i = 0; i < n; i++) for (let s = 0; s < S; s++) availableSessions[i] += avail[s][i];
  const estSize = config.idealTableCapacity;
  const requested = new Int32Array(n);
  const possible = new Int32Array(n);
  const demand: ParticipantDemand[] = [];
  const inbound = new Int32Array(n);
  const inboundByType: Record<PreferenceType, number>[] = [];
  for (let i = 0; i < n; i++)
    inboundByType.push({ NORMAL: 0, PREFER: 0, HIGH_PRIORITY: 0, MUST_MEET: 0, AVOID: 0, MUST_NOT_MEET: 0 });
  const mustMeetCount = new Int32Array(n);
  const mustNotCount = new Int32Array(n);
  const mutualCount = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const c = wants[i * n + j];
      if (c === 0) continue;
      inboundByType[j][CODE_TYPE[c]]++;
      if (c > 0) {
        requested[i]++;
        inbound[j]++;
      }
    }
  }

  const pairFlags = new Uint8Array(n * n);
  const pairValue = new Float64Array(n * n);
  const mustMeetPairs: [number, number][] = [];
  const companyKey = participants.map((p) => (p.company || "").trim().toLowerCase());
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = wants[i * n + j];
      const b = wants[j * n + i];
      let f = 0;
      if (a === W_MUSTNOT || b === W_MUSTNOT) f |= F_MUSTNOT;
      if ((a === W_MUST || b === W_MUST) && !(f & F_MUSTNOT)) f |= F_MUSTMEET;
      if (a === W_AVOID || b === W_AVOID) f |= F_AVOID;
      if (allowRepeat[i * n + j]) f |= F_ALLOWREPEAT;
      if (a > 0 && b > 0) f |= F_MUTUAL;
      if (companyKey[i] && companyKey[i] === companyKey[j]) f |= F_SAMECO;
      if ((a === W_MUST || b === W_MUST) && (a === W_MUSTNOT || b === W_MUSTNOT)) {
        issues.push({
          severity: "ERROR",
          code: "MUST_CONFLICT",
          message: `Conflito: ${participants[i].name} e ${participants[j].name} possuem MUST_MEET e MUST_NOT_MEET simultaneamente (MUST_NOT_MEET prevalece).`,
          participantIds: [ids[i], ids[j]],
        });
      }
      let v = 0;
      if (a > 0) v += wantWeight[i * n + j];
      if (b > 0) v += wantWeight[j * n + i];
      if (a > 0 && b > 0) {
        v += w.mutualBonus;
        mutualCount[i]++;
        mutualCount[j]++;
      }
      pairFlags[i * n + j] = pairFlags[j * n + i] = f;
      pairValue[i * n + j] = pairValue[j * n + i] = v;
      if (f & F_MUSTMEET) {
        mustMeetPairs.push([i, j]);
        mustMeetCount[i]++;
        mustMeetCount[j]++;
      }
      if (f & F_MUSTNOT) {
        mustNotCount[i]++;
        mustNotCount[j]++;
      }
    }
  }

  const isHub = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const cap = staff[i] ? 0 : availableSessions[i] * (estSize - 1);
    possible[i] = Math.min(requested[i], cap);
    const ipd = cap > 0 ? inbound[i] / cap : inbound[i] > 0 ? Infinity : 0;
    const cls = classifyDemand(ipd, config);
    if (cls !== "NORMAL") isHub[i] = 1;
    demand.push({
      participantId: ids[i],
      inbound: inbound[i],
      outbound: requested[i],
      inboundByType: inboundByType[i],
      availableSessions: availableSessions[i],
      contactCapacity: cap,
      ipd,
      excess: Math.max(0, inbound[i] - cap),
      demandClass: cls,
      mustMeetCount: mustMeetCount[i],
      mustNotCount: mustNotCount[i],
      mutualCount: mutualCount[i],
      difficulty: 0,
    });
  }
  // Não desperdiçar os muito demandados (seção 14): encontrar alguém sob alta pressão de demanda
  // é um recurso escasso, então vale mais na busca (não altera as métricas).
  const scarcity = (j: number) => (demand[j].demandClass === "NORMAL" ? 1 : demand[j].demandClass === "ALTA" ? 1.3 : 1.6);
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const a = wants[i * n + j];
      const b = wants[j * n + i];
      if (a <= 0 && b <= 0) continue;
      let v = 0;
      if (a > 0) v += wantWeight[i * n + j] * scarcity(j);
      if (b > 0) v += wantWeight[j * n + i] * scarcity(i);
      if (a > 0 && b > 0) v += w.mutualBonus;
      pairValue[i * n + j] = pairValue[j * n + i] = v;
    }
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      // Só penaliza juntar dois muito demandados quando não há interesse entre eles.
      if (isHub[i] && isHub[j] && config.spreadHighDemand && wants[i * n + j] <= 0 && wants[j * n + i] <= 0) {
        pairFlags[i * n + j] |= F_HUBS;
        pairFlags[j * n + i] |= F_HUBS;
      }

  // Mesas fixas / participantes fixos / locks.
  const fixedLoad = new Int32Array(T);
  const pendingFixed: number[] = [];
  participants.forEach((p, i) => {
    if (!p.fixed && !p.fixedTableId) return;
    if (p.fixedTableId) {
      const t = tableIdx.get(p.fixedTableId);
      if (t === undefined) {
        issues.push({ severity: "WARNING", code: "FIXED_TABLE_UNKNOWN", message: `Mesa fixa de ${p.name} não existe; ignorada.`, participantIds: [p.id] });
        return;
      }
      fixedLoad[t]++;
      for (let s = frozenUntil; s < S; s++) if (avail[s][i]) pinTo(s, i, t, "mesa fixa");
    } else pendingFixed.push(i);
  });
  for (const i of pendingFixed) {
    // participante_fixo sem mesa definida: escolhe a mesa menos carregada (determinístico).
    let best = 0;
    for (let t = 1; t < T; t++) if (fixedLoad[t] < fixedLoad[best]) best = t;
    fixedLoad[best]++;
    for (let s = frozenUntil; s < S; s++) if (avail[s][i]) pinTo(s, i, best, "participante fixo");
  }
  for (const lock of input.locks ?? []) {
    const i = idx.get(lock.participantId);
    const t = tableIdx.get(lock.tableId);
    if (i === undefined || t === undefined || lock.session < 0 || lock.session >= S) continue;
    if (lock.session < frozenUntil) continue; // sessão congelada já é imutável
    if (!avail[lock.session][i]) {
      issues.push({ severity: "WARNING", code: "LOCK_UNAVAILABLE", message: `Lock ignorado: ${participants[i].name} indisponível na sessão ${lock.session + 1}.`, participantIds: [ids[i]], session: lock.session });
      continue;
    }
    pinTo(lock.session, i, t, "lock manual");
  }

  function pinTo(s: number, i: number, t: number, why: string) {
    if (!tableAvail[s][t]) {
      issues.push({
        severity: "WARNING",
        code: "PIN_TABLE_CLOSED",
        message: `${participants[i].name}: ${why} na mesa ${input.tables[t].name}, indisponível na sessão ${s + 1}. O motor escolherá outra mesa.`,
        participantIds: [ids[i]],
        session: s,
      });
      pinned[s][i] = -1;
      return;
    }
    pinned[s][i] = t;
  }

  // Plano de capacidade.
  const plan = planTableSizes(input, { n, S, T, avail, tableAvail, pinned, countsCap, frozenUntil, participants });
  issues.push(...plan.issues);
  const maxCap: number[] = [];
  const minCap: number[] = [];
  for (let s = 0; s < S; s++) {
    const o = config.sessionOverrides?.[s];
    maxCap.push(o?.maxCapacity ?? config.maxTableCapacity);
    minCap.push(o?.minCapacity ?? config.minTableCapacity);
  }

  // Dificuldade ("pessoas difíceis primeiro").
  const difficulty = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const d = demand[i];
    const ipd = Number.isFinite(d.ipd) ? d.ipd : 3;
    const cap = Math.max(1, d.contactCapacity);
    let score = 0;
    score += 4 * Math.min(ipd, 2); // pressão de demanda recebida
    score += 1.5 * Math.min(d.outbound / cap, 2); // pressão de demanda enviada
    score += 3 * d.mustMeetCount + 2 * d.mustNotCount;
    score += 3 * (1 - d.availableSessions / Math.max(1, S)); // disponibilidade reduzida
    score += 0.5 * institutional[i];
    score += 0.3 * d.mutualCount;
    const p = participants[i];
    if (p.fixed || p.fixedTableId) score += 2;
    if (p.kind === "ANCHOR") score += 1;
    difficulty[i] = score;
    d.difficulty = Math.round(score * 100) / 100;
  }

  // Feasibility de demanda e restrições.
  for (let i = 0; i < n; i++) {
    const d = demand[i];
    if (d.demandClass === "SOBREDEMANDA")
      issues.push({
        severity: "WARNING",
        code: "OVERDEMAND",
        message: `${participants[i].name}: solicitações recebidas ${d.inbound}, capacidade máxima estimada ${d.contactCapacity}, excesso ${d.excess}, IPD ${pct(d.ipd)}.`,
        participantIds: [ids[i]],
      });
    if (d.outbound > d.contactCapacity && d.contactCapacity > 0)
      issues.push({
        severity: "INFO",
        code: "OUTBOUND_OVER_CAPACITY",
        message: `${participants[i].name} deseja ${d.outbound} contatos, mas pode encontrar no máximo ${d.contactCapacity}.`,
        participantIds: [ids[i]],
      });
    if (d.mustMeetCount > d.contactCapacity)
      issues.push({
        severity: "ERROR",
        code: "MUST_MEET_OVER_CAPACITY",
        message: `${participants[i].name} possui ${d.mustMeetCount} MUST_MEET, acima da capacidade ${d.contactCapacity}.`,
        participantIds: [ids[i]],
      });
  }
  const mustMeetImpossible = new Set<number>();
  for (const [i, j] of mustMeetPairs) {
    let ok = false;
    for (let s = 0; s < S && !ok; s++) {
      if (!avail[s][i] || !avail[s][j]) continue;
      if (pinned[s][i] >= 0 && pinned[s][j] >= 0 && pinned[s][i] !== pinned[s][j]) continue;
      ok = true;
    }
    if (!ok) mustMeetImpossible.add(i * n + j);
    if (!ok)
      issues.push({
        severity: "ERROR",
        code: "MUST_MEET_IMPOSSIBLE",
        message: `MUST_MEET matematicamente impossível: ${participants[i].name} e ${participants[j].name} não compartilham sessão/mesa viável.`,
        participantIds: [ids[i], ids[j]],
      });
  }
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      if (!(pairFlags[i * n + j] & F_MUSTNOT)) continue;
      for (let s = frozenUntil; s < S; s++)
        if (pinned[s][i] >= 0 && pinned[s][i] === pinned[s][j])
          issues.push({
            severity: "ERROR",
            code: "MUST_NOT_PINNED",
            message: `${participants[i].name} e ${participants[j].name} (MUST_NOT_MEET) estão fixados na mesma mesa na sessão ${s + 1}.`,
            participantIds: [ids[i], ids[j]],
            session: s,
          });
    }

  return {
    input,
    config,
    n,
    S,
    T,
    ids,
    idx,
    participants,
    tableIds,
    tableIdx,
    countsCap,
    staff,
    avail,
    tableAvail,
    wants,
    wantWeight,
    pairFlags,
    pairValue,
    requested,
    possible,
    segment,
    isHub,
    institutional,
    pinned,
    frozenUntil,
    sizes: plan.sizes,
    maxCap,
    minCap,
    demand,
    issues,
    difficulty,
    mustMeetPairs,
    mustMeetImpossible,
  };
}

interface PlanCtx {
  n: number;
  S: number;
  T: number;
  avail: Uint8Array[];
  tableAvail: Uint8Array[];
  pinned: Int32Array[];
  countsCap: Uint8Array;
  frozenUntil: number;
  participants: Participant[];
}

/**
 * Distribui N participantes entre as mesas disponíveis mantendo cada mesa em [mín, máx]
 * sempre que possível. Ex.: 59 → 9×6 + 1×5; 58 → 8×6 + 2×5.
 */
export function planTableSizes(input: EventInput, ctx: PlanCtx): SizePlan {
  const { S, T, n } = ctx;
  const cfg = input.config;
  const sizes: number[][] = [];
  const issues: FeasibilityIssue[] = [];
  for (let s = 0; s < S; s++) {
    const row = new Array<number>(T).fill(0);
    const pinnedCount = new Array<number>(T).fill(0);
    let count = 0;
    for (let i = 0; i < n; i++) {
      if (!ctx.avail[s][i] || !ctx.countsCap[i]) continue;
      count++;
      if (ctx.pinned[s][i] >= 0) pinnedCount[ctx.pinned[s][i]]++;
    }
    if (s < ctx.frozenUntil) {
      for (let t = 0; t < T; t++) row[t] = pinnedCount[t];
      sizes.push(row);
      continue;
    }
    const o = cfg.sessionOverrides?.[s];
    const maxC = o?.maxCapacity ?? cfg.maxTableCapacity;
    const minC = o?.minCapacity ?? cfg.minTableCapacity;
    const open: number[] = [];
    for (let t = 0; t < T; t++) if (ctx.tableAvail[s][t]) open.push(t);
    const k = open.length;
    if (count === 0) {
      sizes.push(row);
      continue;
    }
    if (k === 0) {
      issues.push({ severity: "ERROR", code: "NO_OPEN_TABLES", message: `Sessão ${s + 1}: nenhuma mesa disponível para ${count} participantes.`, session: s });
      sizes.push(row);
      continue;
    }
    const need = Math.ceil(count / maxC);
    const byMin = Math.max(1, Math.floor(count / minC));
    let m = Math.min(k, byMin);
    if (k < need) {
      m = k;
      issues.push({
        severity: "ERROR",
        code: "CAPACITY_EXCEEDED",
        message: `Sessão ${s + 1}: ${count} participantes para ${k} mesas × ${maxC} lugares. Aumente a capacidade da sessão ou reabra mesas (as mesas ficarão com mais de ${maxC}).`,
        session: s,
      });
    } else if (byMin < need) {
      m = need;
      issues.push({
        severity: "WARNING",
        code: "BELOW_MIN",
        message: `Sessão ${s + 1}: não existe divisão de ${count} participantes com todas as mesas entre ${minC} e ${maxC}; algumas ficarão abaixo do mínimo.`,
        session: s,
      });
    }
    // Mesas com participantes fixados precisam ser usadas.
    const mustUse = open.filter((t) => pinnedCount[t] > 0);
    m = Math.max(m, Math.min(k, mustUse.length));
    const chosen = [...mustUse];
    for (const t of open) if (chosen.length < m && !chosen.includes(t)) chosen.push(t);
    chosen.sort((a, b) => a - b);
    const base = Math.floor(count / m);
    let rem = count % m;
    // Mesas com mais fixados recebem as vagas extras primeiro.
    const order = [...chosen].sort((a, b) => pinnedCount[b] - pinnedCount[a] || a - b);
    for (const t of order) {
      row[t] = base + (rem > 0 ? 1 : 0);
      if (rem > 0) rem--;
    }
    // Ajuste: fixados acima da vaga planejada.
    for (const t of chosen) {
      while (pinnedCount[t] > row[t]) {
        const donor = chosen
          .filter((u) => u !== t && row[u] > pinnedCount[u])
          .sort((a, b) => row[b] - pinnedCount[b] - (row[a] - pinnedCount[a]) || a - b)[0];
        if (donor === undefined) break;
        row[donor]--;
        row[t]++;
      }
      if (pinnedCount[t] > row[t]) {
        issues.push({ severity: "ERROR", code: "PINNED_OVERFLOW", message: `Sessão ${s + 1}: participantes fixados excedem a mesa ${input.tables[t].name}.`, session: s });
        row[t] = pinnedCount[t];
      }
      if (row[t] > maxC && k >= need)
        issues.push({ severity: "WARNING", code: "PINNED_ABOVE_MAX", message: `Sessão ${s + 1}: mesa ${input.tables[t].name} com ${row[t]} por causa de participantes fixados.`, session: s });
    }
    sizes.push(row);
  }
  return { sizes, issues };
}
