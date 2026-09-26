// Motor de otimização global: construção "difíceis primeiro" + simulated annealing multi-start
// + polimento lexicográfico + fairness repair. Todas as sessões não congeladas são otimizadas
// simultaneamente (os movimentos da busca local atuam em qualquer sessão do horizonte).

import { computeMetrics } from "./metrics.ts";
import {
  compareLex,
  lexBaselineFromMetrics,
  lexFromMetrics,
  lexFromState,
  mnbdSoft,
  surrogateBaseline,
  surrogateMNBD,
  surrogateRepeatFocus,
} from "./objective.ts";
import {
  compileProblem,
  F_ALLOWREPEAT,
  F_AVOID,
  F_HUBIDLE,
  F_HUBS,
  F_MUSTMEET,
  F_MUSTNOT,
  F_MUTUAL,
  F_SAMECO,
  W_HIGH,
  type Problem,
} from "./problem.ts";
import { hashSeed, mulberry32, randInt, shuffle, type Rng } from "./rng.ts";
import { State } from "./state.ts";
import {
  OPTIMIZER_VERSION,
  type CandidateResult,
  type EventInput,
  type OptimizationResult,
  type OptimizeOptions,
  type OptimizerMode,
} from "./types.ts";

type Phase = "DIVERSITY" | "PREFERENCE" | "RECOVERY";

export function phaseOf(s: number, S: number): Phase {
  if (S >= 3 && s === 0) return "DIVERSITY";
  if (S >= 3 && s >= S - Math.ceil(S / 3)) return "RECOVERY";
  return "PREFERENCE";
}

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

// ---------------------------------------------------------------------------
// Construção
// ---------------------------------------------------------------------------

function placePinned(st: State) {
  const P = st.P;
  for (let s = 0; s < P.S; s++)
    for (let p = 0; p < P.n; p++) if (P.avail[s][p] && P.pinned[s][p] >= 0) st.place(s, p, P.pinned[s][p]);
}

function seatsLeft(st: State, s: number, t: number): number {
  return st.P.sizes[s][t] - st.capCount(s, t);
}

function placeStaff(st: State, s: number) {
  const P = st.P;
  for (let p = 0; p < P.n; p++) {
    if (!P.avail[s][p] || st.tableOf[s][p] >= 0 || P.countsCap[p]) continue;
    let best = -1;
    let bestLoad = Infinity;
    for (let t = 0; t < P.T; t++) {
      if (!P.tableAvail[s][t] || P.sizes[s][t] === 0) continue;
      const load = st.members[s][t].length - st.capCount(s, t);
      if (load < bestLoad) {
        bestLoad = load;
        best = t;
      }
    }
    if (best < 0) for (let t = 0; t < P.T; t++) if (P.tableAvail[s][t]) { best = t; break; }
    if (best >= 0) st.place(s, p, best);
  }
}

function fallbackTable(st: State, s: number): number {
  const P = st.P;
  let best = -1;
  let bestLoad = Infinity;
  for (let t = 0; t < P.T; t++) {
    if (!P.tableAvail[s][t]) continue;
    const load = st.capCount(s, t) - P.sizes[s][t];
    if (load < bestLoad) {
      bestLoad = load;
      best = t;
    }
  }
  return best >= 0 ? best : 0;
}

function buildBaselineSession(st: State, s: number, rng: Rng) {
  const P = st.P;
  const n = P.n;
  placeStaff(st, s);
  const order: number[] = [];
  for (let p = 0; p < n; p++) if (P.avail[s][p] && st.tableOf[s][p] < 0) order.push(p);
  shuffle(rng, order);
  for (const p of order) {
    let best = -1;
    let bestG = -Infinity;
    for (let t = 0; t < P.T; t++) {
      if (seatsLeft(st, s, t) <= 0) continue;
      let g = rng() * 0.01;
      for (const q of st.members[s][t]) {
        if (P.staff[q]) continue;
        const k = p * n + q;
        if (P.pairFlags[k] & F_MUSTNOT) g -= 1e7;
        g -= 1000 * st.meet[k];
      }
      if (st.tableUse[p * P.T + t] > 0) g -= 0.5;
      if (g > bestG) {
        bestG = g;
        best = t;
      }
    }
    st.place(s, p, best >= 0 ? best : fallbackTable(st, s));
  }
}

interface MnbdCtx {
  mmPlan: [number, number][][]; // por sessão
  attendedBefore: Int32Array[]; // [s][p] sessões disponíveis antes de s
}

/** Distribui os pares MUST_MEET entre as sessões (preferindo sessões de preferência, 2–4). */
function planMustMeet(P: Problem, st: State, rng: Rng): [number, number][][] {
  const plan: [number, number][][] = Array.from({ length: P.S }, () => []);
  const load: Int32Array[] = Array.from({ length: P.S }, () => new Int32Array(P.n));
  const pairs = P.mustMeetPairs
    .filter(([i, j]) => st.meet[i * P.n + j] === 0) // já cumprido em sessão congelada
    .map(([i, j]) => {
      const opts: number[] = [];
      for (let s = P.frozenUntil; s < P.S; s++) {
        if (!P.avail[s][i] || !P.avail[s][j]) continue;
        const pi = P.pinned[s][i];
        const pj = P.pinned[s][j];
        if (pi >= 0 && pj >= 0 && pi !== pj) continue;
        opts.push(s);
      }
      return { i, j, opts };
    })
    .sort((a, b) => a.opts.length - b.opts.length || a.i - b.i || a.j - b.j);
  for (const { i, j, opts } of pairs) {
    let best = -1;
    let bestScore = -Infinity;
    for (const s of opts) {
      const ph = phaseOf(s, P.S);
      let sc = ph === "PREFERENCE" ? 2 : ph === "RECOVERY" ? 1 : 0;
      sc -= 3 * (load[s][i] + load[s][j]);
      sc += rng() * 0.5;
      if (sc > bestScore) {
        bestScore = sc;
        best = s;
      }
    }
    if (best >= 0) {
      plan[best].push([i, j]);
      load[best][i]++;
      load[best][j]++;
    }
  }
  return plan;
}

function buildMnbdSession(st: State, s: number, rng: Rng, ctx: MnbdCtx) {
  const P = st.P;
  const { n, T } = P;
  const cfg = P.config;
  const w = cfg.weights;
  const phase = phaseOf(s, P.S);
  const prefPhase = phase === "DIVERSITY" ? 0.6 : 1;
  const recoveryW = phase === "RECOVERY" ? 2.5 : phase === "PREFERENCE" ? 0.8 : 0.3;
  const divPhase = phase === "DIVERSITY" ? 4 : 1;
  const sameCoPen = (cfg.allowSameCompany ? w.sameCompanyPenalty : w.sameCompanyPenalty * 40) * (s === 0 ? 3 : 1);
  placeStaff(st, s);

  // Necessidade do participante nesta sessão (fairness desde o início, reforçada nas sessões finais).
  const need = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const avail = P.demand[i].availableSessions || 1;
    const expected = ctx.attendedBefore[s][i] / avail;
    const deficit = Math.max(0, expected - st.sat(i));
    let remaining = 0;
    for (let x = s; x < P.S; x++) remaining += P.avail[x][i];
    need[i] =
      1 +
      recoveryW * (deficit * 2 + (1 - st.sat(i)) * 0.5) +
      0.25 * P.institutional[i] +
      1 / Math.max(1, remaining) +
      (st.ful[i] === 0 && P.possible[i] > 0 ? 0.5 * recoveryW : 0);
  }

  const gain = (p: number, t: number): number => {
    let g = 0;
    const mem = st.members[s][t];
    for (let x = 0; x < mem.length; x++) {
      const q = mem[x];
      if (P.staff[q]) continue;
      const k = p * n + q;
      const f = P.pairFlags[k];
      if (f & F_MUSTNOT) g -= 1e7;
      const c = st.meet[k];
      if (c > 0) {
        if (!(f & F_ALLOWREPEAT)) g -= 1e5 * c;
      } else {
        let rel = 0;
        const a = P.wants[k];
        const b = P.wants[q * n + p];
        if (a > 0) rel += P.wantWeight[k] * need[p] * (a === W_HIGH ? 3 : 1);
        if (b > 0) rel += P.wantWeight[q * n + p] * need[q] * (b === W_HIGH ? 3 : 1);
        if (f & F_MUTUAL) rel += w.mutualBonus * 2;
        if (f & F_MUSTMEET) rel += 5000;
        g += rel * prefPhase * 10;
      }
      if (f & F_SAMECO) g -= sameCoPen;
      if (f & F_AVOID) g -= w.avoidPenalty;
      if (f & F_HUBS && cfg.spreadHighDemand) g -= w.highDemandClusterPenalty * 4;
      if (f & F_HUBIDLE) g -= (w.pressuredIdlePenalty ?? 0) * 2;
    }
    if (st.segCount[s][t * st.nSeg + P.segment[p]] === 0) g += w.diversityWeight * divPhase;
    if (cfg.avoidTableRevisit && st.tableUse[p * T + t] > 0) g -= w.tableRevisitPenalty;
    return g;
  };

  const bestTable = (p: number, minSeats = 1): number => {
    let best = -1;
    let bestG = -Infinity;
    for (let t = 0; t < T; t++) {
      if (seatsLeft(st, s, t) < minSeats) continue;
      const g = gain(p, t) + rng() * 1e-3;
      if (g > bestG) {
        bestG = g;
        best = t;
      }
    }
    return best;
  };

  const unplaced = (p: number) => P.avail[s][p] && st.tableOf[s][p] < 0 && P.countsCap[p] === 1;

  // 1) MUST_MEET planejados para esta sessão.
  for (const [i, j] of ctx.mmPlan[s]) {
    const ti = st.tableOf[s][i];
    const tj = st.tableOf[s][j];
    if (ti >= 0 && tj >= 0) continue;
    if (ti >= 0 && unplaced(j) && seatsLeft(st, s, ti) > 0) st.place(s, j, ti);
    else if (tj >= 0 && unplaced(i) && seatsLeft(st, s, tj) > 0) st.place(s, i, tj);
    else if (unplaced(i) && unplaced(j)) {
      const t = bestTable(i, 2);
      if (t >= 0) {
        st.place(s, i, t);
        st.place(s, j, t);
      }
    }
  }

  // 2) Participantes de alta demanda / sobredemandados: espalhados em mesas diferentes.
  const hubs: number[] = [];
  for (let p = 0; p < n; p++) if (P.isHub[p] && unplaced(p)) hubs.push(p);
  const ipd = (p: number) => (Number.isFinite(P.demand[p].ipd) ? P.demand[p].ipd : 9);
  const hubKey = new Map(hubs.map((p) => [p, ipd(p) * (1 + 0.1 * rng())]));
  hubs.sort((a, b) => hubKey.get(b)! - hubKey.get(a)!);
  const hubTables: number[] = [];
  for (const h of hubs) {
    let best = -1;
    let bestKey = -Infinity;
    for (let t = 0; t < T; t++) {
      if (seatsLeft(st, s, t) <= 0) continue;
      let hubCount = 0;
      for (const q of st.members[s][t]) if (P.isHub[q]) hubCount++;
      const key = (cfg.spreadHighDemand ? -1e4 * hubCount : 0) + gain(h, t) + rng() * 1e-3;
      if (key > bestKey) {
        bestKey = key;
        best = t;
      }
    }
    if (best < 0) continue;
    st.place(s, h, best);
    if (!hubTables.includes(best)) hubTables.push(best);
  }

  // 3) Preenche as mesas dos mais demandados com quem mais precisa deles (seção 12).
  for (const t of hubTables) {
    while (seatsLeft(st, s, t) > 0) {
      let best = -1;
      let bestG = 0;
      for (let p = 0; p < n; p++) {
        if (!unplaced(p)) continue;
        const g = gain(p, t) + rng() * 1e-3;
        if (g > bestG) {
          bestG = g;
          best = p;
        }
      }
      if (best < 0 || bestG < 20) break;
      st.place(s, best, t);
    }
  }

  // 4) Demais participantes, dos mais difíceis para os mais flexíveis.
  const rest: number[] = [];
  for (let p = 0; p < n; p++) if (unplaced(p)) rest.push(p);
  const key = new Map(rest.map((p) => [p, P.difficulty[p] * (1 + 0.35 * rng())]));
  rest.sort((a, b) => key.get(b)! - key.get(a)!);
  for (const p of rest) {
    const t = bestTable(p);
    st.place(s, p, t >= 0 ? t : fallbackTable(st, s));
  }
}

export function construct(P: Problem, rng: Rng, mode: OptimizerMode): State {
  const st = new State(P);
  placePinned(st);
  if (mode === "BASELINE") {
    for (let s = P.frozenUntil; s < P.S; s++) buildBaselineSession(st, s, rng);
    return st;
  }
  const attendedBefore: Int32Array[] = [];
  const acc = new Int32Array(P.n);
  for (let s = 0; s < P.S; s++) {
    attendedBefore.push(acc.slice());
    for (let p = 0; p < P.n; p++) acc[p] += P.avail[s][p];
  }
  const ctx: MnbdCtx = { mmPlan: planMustMeet(P, st, rng), attendedBefore };
  for (let s = P.frozenUntil; s < P.S; s++) buildMnbdSession(st, s, rng, ctx);
  return st;
}

// ---------------------------------------------------------------------------
// Vizinhança
// ---------------------------------------------------------------------------

interface Neighborhood {
  sessions: number[]; // sessões otimizáveis
  movable: number[][]; // [s] -> participantes móveis
  isMovable: Uint8Array[]; // [s][p]
  wantList: number[][]; // alvos positivos de cada participante
  prefHolders: number[]; // participantes com preferências
  hubs: number[]; // alta demanda (ALTA/CRÍTICA/SOBREDEMANDA)
  requesters: number[][]; // quem solicitou cada participante
}

function buildNeighborhood(P: Problem): Neighborhood {
  const sessions: number[] = [];
  const movable: number[][] = [];
  const isMovable: Uint8Array[] = [];
  for (let s = 0; s < P.S; s++) {
    const list: number[] = [];
    const flag = new Uint8Array(P.n);
    if (s >= P.frozenUntil)
      for (let p = 0; p < P.n; p++)
        if (P.avail[s][p] && P.pinned[s][p] < 0 && P.countsCap[p]) {
          list.push(p);
          flag[p] = 1;
        }
    movable.push(list);
    isMovable.push(flag);
    if (list.length >= 2) sessions.push(s);
  }
  const wantList: number[][] = [];
  const prefHolders: number[] = [];
  for (let i = 0; i < P.n; i++) {
    const l: number[] = [];
    for (let j = 0; j < P.n; j++) if (P.wants[i * P.n + j] > 0) l.push(j);
    wantList.push(l);
    if (P.possible[i] > 0) prefHolders.push(i);
  }
  const hubs: number[] = [];
  const requesters: number[][] = [];
  for (let j = 0; j < P.n; j++) {
    const l: number[] = [];
    for (let i = 0; i < P.n; i++) if (P.wants[i * P.n + j] > 0) l.push(i);
    requesters.push(l);
    if (P.isHub[j] && l.length > 0) hubs.push(j);
  }
  return { sessions, movable, isMovable, wantList, prefHolders, hubs, requesters };
}

/** Log de movimentos para desfazer: [s, p, mesaAnterior]. */
type MoveLog = number[];

function doMove(st: State, log: MoveLog, s: number, p: number, t: number) {
  log.push(s, p, st.tableOf[s][p]);
  st.move(s, p, t);
}

function undo(st: State, log: MoveLog) {
  for (let x = log.length - 3; x >= 0; x -= 3) st.move(log[x], log[x + 1], log[x + 2]);
  log.length = 0;
}

function randomSwap(st: State, nb: Neighborhood, rng: Rng, log: MoveLog): boolean {
  if (nb.sessions.length === 0) return false;
  const s = nb.sessions[randInt(rng, nb.sessions.length)];
  const mv = nb.movable[s];
  const p = mv[randInt(rng, mv.length)];
  for (let tries = 0; tries < 6; tries++) {
    const q = mv[randInt(rng, mv.length)];
    const tp = st.tableOf[s][p];
    const tq = st.tableOf[s][q];
    if (tp === tq) continue;
    doMove(st, log, s, p, tq);
    doMove(st, log, s, q, tp);
    return true;
  }
  return false;
}

function threeCycle(st: State, nb: Neighborhood, rng: Rng, log: MoveLog): boolean {
  if (nb.sessions.length === 0) return false;
  const s = nb.sessions[randInt(rng, nb.sessions.length)];
  const mv = nb.movable[s];
  if (mv.length < 3) return false;
  for (let tries = 0; tries < 8; tries++) {
    const p = mv[randInt(rng, mv.length)];
    const q = mv[randInt(rng, mv.length)];
    const r = mv[randInt(rng, mv.length)];
    const a = st.tableOf[s][p];
    const b = st.tableOf[s][q];
    const c = st.tableOf[s][r];
    if (a === b || b === c || a === c) continue;
    doMove(st, log, s, p, b);
    doMove(st, log, s, q, c);
    doMove(st, log, s, r, a);
    return true;
  }
  return false;
}

/**
 * Movimento "não desperdiçar os muito demandados" (seção 14): em uma mesa de um participante
 * sob alta demanda, troca alguém sem relação com ele por um solicitante ainda não atendido.
 */
function hubFillMove(st: State, nb: Neighborhood, rng: Rng, log: MoveLog): boolean {
  const P = st.P;
  const n = P.n;
  if (nb.hubs.length === 0) return false;
  const h = nb.hubs[randInt(rng, nb.hubs.length)];
  const s = nb.sessions[randInt(rng, nb.sessions.length)];
  if (!P.avail[s][h]) return false;
  const th = st.tableOf[s][h];
  const idle = st.members[s][th].filter(
    (x) => x !== h && nb.isMovable[s][x] === 1 && P.wants[x * n + h] <= 0 && P.wants[h * n + x] <= 0,
  );
  if (idle.length === 0) return false;
  const reqs = nb.requesters[h];
  for (let k = 0; k < 6; k++) {
    const r = reqs[randInt(rng, reqs.length)];
    if (st.meet[r * n + h] > 0 || !nb.isMovable[s][r]) continue;
    const tr = st.tableOf[s][r];
    if (tr < 0 || tr === th) continue;
    const x = idle[randInt(rng, idle.length)];
    doMove(st, log, s, r, th);
    doMove(st, log, s, x, tr);
    return true;
  }
  return false;
}

/** Movimento dirigido: tenta colocar um participante pouco atendido com alguém que ele deseja. */
function targetedMove(st: State, nb: Neighborhood, rng: Rng, log: MoveLog): boolean {
  const P = st.P;
  const n = P.n;
  let i = -1;
  let j = -1;
  if (st.mustMeetUnmet > 0 && rng() < 0.3) {
    const unmet = P.mustMeetPairs.filter(([a, b]) => st.meet[a * n + b] === 0);
    if (unmet.length) [i, j] = unmet[randInt(rng, unmet.length)];
  }
  if (i < 0) {
    if (nb.prefHolders.length === 0) return false;
    // Torneio: favorece quem está com menor satisfação (max-min).
    let bestSat = Infinity;
    for (let k = 0; k < 3; k++) {
      const c = nb.prefHolders[randInt(rng, nb.prefHolders.length)];
      const sc = st.sat(c) + rng() * 1e-6;
      if (sc < bestSat && st.ful[c] < P.possible[c]) {
        bestSat = sc;
        i = c;
      }
    }
    if (i < 0) return false;
    const wl = nb.wantList[i];
    for (let k = 0; k < 5; k++) {
      const c = wl[randInt(rng, wl.length)];
      if (st.meet[i * n + c] === 0) {
        j = c;
        break;
      }
    }
    if (j < 0) return false;
  }
  for (let k = 0; k < 4; k++) {
    const s = nb.sessions[randInt(rng, nb.sessions.length)];
    if (!P.avail[s][i] || !P.avail[s][j]) continue;
    const ti = st.tableOf[s][i];
    const tj = st.tableOf[s][j];
    if (ti < 0 || tj < 0 || ti === tj) continue;
    const canI = nb.isMovable[s][i] === 1;
    const canJ = nb.isMovable[s][j] === 1;
    if (!canI && !canJ) continue;
    const moveI = canI && (!canJ || rng() < 0.5);
    const [mover, stay, from, to] = moveI ? [i, j, ti, tj] : [j, i, tj, ti];
    const cands = st.members[s][to].filter((q) => q !== stay && nb.isMovable[s][q] === 1);
    if (cands.length === 0) continue;
    const q = cands[randInt(rng, cands.length)];
    doMove(st, log, s, mover, to);
    doMove(st, log, s, q, from);
    return true;
  }
  return false;
}

/**
 * Movimento dirigido por conflito: encontra um par que se reencontra (ou MUST_NOT_MEET)
 * em alguma mesa e tira um deles de lá via swap. Essencial para zerar reencontros.
 */
function conflictMove(st: State, nb: Neighborhood, rng: Rng, log: MoveLog): boolean {
  const P = st.P;
  const n = P.n;
  if (nb.sessions.length === 0) return false;
  const s0 = randInt(rng, nb.sessions.length);
  const t0 = randInt(rng, P.T);
  for (let a = 0; a < nb.sessions.length; a++) {
    const s = nb.sessions[(s0 + a) % nb.sessions.length];
    for (let b = 0; b < P.T; b++) {
      const t = (t0 + b) % P.T;
      const mem = st.members[s][t];
      for (let x = 0; x < mem.length; x++)
        for (let y = x + 1; y < mem.length; y++) {
          const i = mem[x];
          const j = mem[y];
          const k = i * n + j;
          const f = P.pairFlags[k];
          if (!(f & F_MUSTNOT) && (st.meet[k] < 2 || f & F_ALLOWREPEAT)) continue;
          const choices = [i, j].filter((p) => nb.isMovable[s][p] === 1);
          if (choices.length === 0) continue;
          const p = choices[randInt(rng, choices.length)];
          // Min-conflicts: escolhe o parceiro de troca que menos cria reencontros.
          const q = bestConflictPartner(st, nb, rng, s, p);
          if (q < 0) return false;
          const tq = st.tableOf[s][q];
          doMove(st, log, s, p, tq);
          doMove(st, log, s, q, t);
          return true;
        }
    }
  }
  return false;
}

/** Custo de conflito de x sentado na mesa t (ignorando `skip`); `extra`=1 se x já está na mesa. */
function conflictCost(st: State, s: number, x: number, t: number, skip: number, already: boolean): number {
  const P = st.P;
  const n = P.n;
  const thr = already ? 2 : 1;
  let c = 0;
  for (const m of st.members[s][t]) {
    if (m === x || m === skip || P.staff[m]) continue;
    const k = x * n + m;
    const f = P.pairFlags[k];
    if (f & F_MUSTNOT) c += 50;
    if (st.meet[k] >= thr && !(f & F_ALLOWREPEAT)) c += 1;
  }
  return c;
}

function bestConflictPartner(st: State, nb: Neighborhood, rng: Rng, s: number, p: number): number {
  const tp = st.tableOf[s][p];
  const oldP = conflictCost(st, s, p, tp, -1, true);
  let best = -1;
  let bestD = Infinity;
  for (const q of nb.movable[s]) {
    const tq = st.tableOf[s][q];
    if (tq === tp) continue;
    const d =
      conflictCost(st, s, p, tq, q, false) +
      conflictCost(st, s, q, tp, p, false) -
      oldP -
      conflictCost(st, s, q, tq, -1, true) +
      rng() * 0.5;
    if (d < bestD) {
      bestD = d;
      best = q;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Busca local
// ---------------------------------------------------------------------------

interface AnnealSpec {
  /** progress ∈ [0,1]: permite penalidades progressivas (penalty annealing). */
  score: (st: State, progress: number) => number;
  T0: number;
  T1: number;
  targeted: boolean;
  /** Probabilidade de movimento dirigido por conflito quando há reencontros/violações. */
  conflict?: number;
}

const SPEC_BASELINE: AnnealSpec = { score: surrogateBaseline, T0: 6, T1: 0.02, targeted: false, conflict: 0.3 };
/**
 * Busca principal do MNBD: as penalidades de P0–P2 começam moderadas (exploração) e crescem
 * geometricamente até dominar tudo no fim — assim o annealing primeiro encontra boas
 * estruturas de preferência e depois elimina reencontros/violações.
 */
const SPEC_MNBD: AnnealSpec = {
  score: (st, x) => {
    const g = (a: number, b: number) => a * Math.pow(b / a, x);
    const mmEnd = st.P.config.mustMeetPriority === "HARD" ? 6e4 : 1.5e4;
    return -g(2000, 1e7) * st.hard - g(60, 2e4) * st.repeats - g(60, mmEnd) * st.mustMeetUnmet + mnbdSoft(st);
  },
  T0: 150,
  T1: 0.5,
  targeted: true,
};
const SPEC_MNBD_REHEAT: AnnealSpec = { score: surrogateMNBD, T0: 25, T1: 0.3, targeted: true };
/** Parâmetros internos de calibração da busca (expostos para experimentos reprodutíveis). */
export const TUNING = { mainShare: 0.5, repeatShare: 0.2, soft0: 0.02, soft1: 0.02, repT0: 4, repConflict: 0.6, cycles: 1 };

const SPEC_REPEATS: AnnealSpec = {
  score: (st, x) => surrogateRepeatFocus(st, TUNING.soft0 * Math.pow(TUNING.soft1 / TUNING.soft0, x)),
  T0: 4,
  T1: 0.02,
  targeted: true,
};

function anneal(st: State, nb: Neighborhood, rng: Rng, iterations: number, spec: AnnealSpec): State {
  const { score, T0, T1 } = spec;
  // O "melhor" é medido pelo score final (progress = 1).
  let cur = score(st, 0);
  let best = score(st, 1);
  let bestSnap = st.snapshot();
  const log: MoveLog = [];
  for (let it = 0; it < iterations; it++) {
    const x = it / iterations;
    const temp = T0 * Math.pow(T1 / T0, x);
    if ((it & 255) === 0) cur = score(st, x);
    const r = rng();
    let ok: boolean;
    const pc = spec.conflict ?? 0.15;
    if ((st.repeats > 0 || st.hard > 0) && r < pc) ok = conflictMove(st, nb, rng, log);
    else if (spec.targeted && r < pc + 0.25) ok = targetedMove(st, nb, rng, log);
    else if (spec.targeted && r < pc + 0.3) ok = hubFillMove(st, nb, rng, log);
    else if (r < pc + 0.4) ok = threeCycle(st, nb, rng, log);
    else ok = randomSwap(st, nb, rng, log);
    if (!ok) {
      log.length = 0;
      continue;
    }
    const nw = score(st, x);
    const d = nw - cur;
    if (d >= 0 || rng() < Math.exp(d / temp)) {
      cur = nw;
      log.length = 0;
      if (x > 0.5) {
        const fin = score(st, 1);
        if (fin > best + 1e-9) {
          best = fin;
          bestSnap = st.snapshot();
        }
      }
    } else undo(st, log);
  }
  return score(st, 1) >= best - 1e-9 ? st : State.fromTableOf(st.P, bestSnap);
}

/** Polimento: só aceita movimentos que melhoram o vetor lexicográfico exato. */
function lexPolish(st: State, nb: Neighborhood, rng: Rng, iterations: number) {
  let cur = lexFromState(st);
  let curS = surrogateMNBD(st);
  const log: MoveLog = [];
  for (let it = 0; it < iterations; it++) {
    const r = rng();
    const ok =
      (st.repeats > 0 || st.hard > 0) && r < 0.2
        ? conflictMove(st, nb, rng, log)
        : r < 0.3
          ? hubFillMove(st, nb, rng, log)
          : r < 0.6
          ? targetedMove(st, nb, rng, log)
          : r < 0.75
            ? threeCycle(st, nb, rng, log)
            : randomSwap(st, nb, rng, log);
    if (!ok) {
      log.length = 0;
      continue;
    }
    const lx = lexFromState(st);
    const c = compareLex(lx, cur);
    const sc = surrogateMNBD(st);
    if (c < 0 || (c === 0 && sc > curS + 1e-9)) {
      cur = lx;
      curS = sc;
      log.length = 0;
    } else undo(st, log);
  }
}

/**
 * Reparo exaustivo de reencontros/violações: para cada participante envolvido em conflito,
 * testa todas as trocas simples e ciclos de 3 na sessão; aceita se o vetor lexicográfico
 * (`lexOf`) melhorar. Rápido porque filtra candidatos pelo delta de conflito antes do lex.
 */
export function conflictRepair(st: State, nb: Neighborhood, lexOf: (st: State) => number[], maxPasses = 4): number {
  const P = st.P;
  const n = P.n;
  let cur = lexOf(st);
  let accepted = 0;
  const log: MoveLog = [];
  for (let pass = 0; pass < maxPasses && (st.repeats > 0 || st.hard > 0); pass++) {
    let improved = false;
    for (const s of nb.sessions) {
      for (const p of nb.movable[s]) {
        const tp = st.tableOf[s][p];
        // p participa de algum conflito nesta mesa?
        if (conflictCost(st, s, p, tp, -1, true) === 0) continue;
        const oldP = conflictCost(st, s, p, tp, -1, true);
        let done = false;
        for (const q of nb.movable[s]) {
          const tq = st.tableOf[s][q];
          if (tq === tp) continue;
          const d =
            conflictCost(st, s, p, tq, q, false) + conflictCost(st, s, q, tp, p, false) - oldP - conflictCost(st, s, q, tq, -1, true);
          if (d >= 0) continue;
          doMove(st, log, s, p, tq);
          doMove(st, log, s, q, tp);
          const lx = lexOf(st);
          if (compareLex(lx, cur) < 0) {
            cur = lx;
            log.length = 0;
            accepted++;
            done = true;
            break;
          }
          undo(st, log);
        }
        if (done) {
          improved = true;
          continue;
        }
        // ciclo de 3: p → mesa de q, q → mesa de r, r → mesa de p
        for (const q of nb.movable[s]) {
          const tq = st.tableOf[s][q];
          if (tq === tp) continue;
          if (conflictCost(st, s, p, tq, q, false) >= oldP) continue;
          for (const r of nb.movable[s]) {
            const tr = st.tableOf[s][r];
            if (tr === tp || tr === tq) continue;
            doMove(st, log, s, p, tq);
            doMove(st, log, s, q, tr);
            doMove(st, log, s, r, tp);
            const lx = lexOf(st);
            if (compareLex(lx, cur) < 0) {
              cur = lx;
              log.length = 0;
              accepted++;
              done = true;
              break;
            }
            undo(st, log);
          }
          if (done) break;
        }
        if (done) improved = true;
      }
    }
    if (!improved) break;
  }
  void n;
  return accepted;
}

/** Reparo de MUST_MEET não atendidos: tenta sentar o par junto em alguma sessão futura. */
export function mustMeetRepair(st: State, nb: Neighborhood, lexOf: (st: State) => number[]): number {
  const P = st.P;
  const n = P.n;
  let cur = lexOf(st);
  let accepted = 0;
  const log: MoveLog = [];
  const tryIt = (): boolean => {
    const lx = lexOf(st);
    if (compareLex(lx, cur) < 0) {
      cur = lx;
      log.length = 0;
      accepted++;
      return true;
    }
    undo(st, log);
    return false;
  };
  for (const [a, b] of P.mustMeetPairs) {
    if (st.meet[a * n + b] > 0) continue;
    let done = false;
    for (const s of nb.sessions) {
      if (done) break;
      if (!P.avail[s][a] || !P.avail[s][b]) continue;
      for (const [mover, stay] of [
        [a, b],
        [b, a],
      ]) {
        if (done || !nb.isMovable[s][mover]) continue;
        const from = st.tableOf[s][mover];
        const to = st.tableOf[s][stay];
        for (const q of [...st.members[s][to]]) {
          if (q === stay || !nb.isMovable[s][q]) continue;
          doMove(st, log, s, mover, to);
          doMove(st, log, s, q, from);
          if (tryIt()) {
            done = true;
            break;
          }
          for (let x = 0; x < P.T && !done; x++) {
            if (x === from || x === to) continue;
            for (const r of [...st.members[s][x]]) {
              if (!nb.isMovable[s][r]) continue;
              doMove(st, log, s, mover, to);
              doMove(st, log, s, q, x);
              doMove(st, log, s, r, from);
              if (tryIt()) {
                done = true;
                break;
              }
            }
          }
          if (done) break;
        }
      }
    }
  }
  return accepted;
}

/**
 * Reparo "não desperdiçar os muito demandados" (seções 12 e 14): em cada mesa de um participante
 * sob pressão crítica, tenta trocar quem não tem relação com ele por um solicitante ainda não
 * atendido (troca direta ou cadeia de 3). Aceita somente melhora lexicográfica — nunca cria
 * reencontro nem piora satisfação mínima/P10.
 */
export function hubRepair(st: State, nb: Neighborhood, rng: Rng, lexOf: (st: State) => number[]): number {
  const P = st.P;
  const n = P.n;
  let cur = lexOf(st);
  let accepted = 0;
  const log: MoveLog = [];
  const tryIt = (): boolean => {
    const lx = lexOf(st);
    if (compareLex(lx, cur) < 0) {
      cur = lx;
      log.length = 0;
      accepted++;
      return true;
    }
    undo(st, log);
    return false;
  };
  const pressured = nb.hubs.filter((h) => P.demand[h].demandClass === "CRITICA" || P.demand[h].demandClass === "SOBREDEMANDA");
  for (const h of pressured) {
    for (const s of nb.sessions) {
      if (!P.avail[s][h]) continue;
      let progress = true;
      while (progress) {
        progress = false;
        const th = st.tableOf[s][h];
        const idle = st.members[s][th].filter((x) => x !== h && nb.isMovable[s][x] && P.wants[x * n + h] <= 0 && P.wants[h * n + x] <= 0);
        const pending = nb.requesters[h].filter((r) => st.meet[r * n + h] === 0 && P.avail[s][r] && nb.isMovable[s][r]);
        outer: for (const x of idle)
          for (const r of pending) {
            const tr = st.tableOf[s][r];
            if (tr < 0 || tr === th) continue;
            doMove(st, log, s, r, th);
            doMove(st, log, s, x, tr);
            if (tryIt()) {
              progress = true;
              break outer;
            }
            // cadeia: x vai para uma terceira mesa y; alguém de y ocupa o lugar de r
            for (let k = 0; k < 12; k++) {
              const y = randInt(rng, P.T);
              if (y === th || y === tr || st.members[s][y].length === 0) continue;
              const zs = st.members[s][y].filter((z) => nb.isMovable[s][z]);
              if (!zs.length) continue;
              const z = zs[randInt(rng, zs.length)];
              doMove(st, log, s, r, th);
              doMove(st, log, s, x, y);
              doMove(st, log, s, z, tr);
              if (tryIt()) {
                progress = true;
                break outer;
              }
            }
          }
      }
    }
  }
  return accepted;
}

const lexBaselineState = (st: State): number[] => [st.hard, st.repeats, -st.unique, st.P.config.avoidTableRevisit ? st.revisits : 0];

/**
 * FAIRNESS REPAIR (seção 21): foca participantes abaixo do P10, abaixo de 50% ou sem nenhuma
 * preferência atendida e procura swaps / trocas em 3 vias em todas as sessões futuras.
 * Aceita somente se o vetor lexicográfico melhorar — logo nunca cria MUST_NOT_MEET, nunca
 * quebra MUST_MEET, nunca excede capacidade e nunca aumenta reencontros.
 */
export function fairnessRepair(st: State, nb: Neighborhood, rng: Rng, maxRounds = 6): number {
  const P = st.P;
  const n = P.n;
  let accepted = 0;
  let cur = lexFromState(st);
  const log: MoveLog = [];
  const tryAccept = (): boolean => {
    const lx = lexFromState(st);
    if (compareLex(lx, cur) < 0) {
      cur = lx;
      log.length = 0;
      accepted++;
      return true;
    }
    undo(st, log);
    return false;
  };
  for (let round = 0; round < maxRounds; round++) {
    const sats = st.sortedSats();
    const p10 = sats.length ? sats[Math.floor((sats.length - 1) * 0.1)] : 1;
    const targets = nb.prefHolders
      .filter((i) => st.ful[i] < P.possible[i] && (st.sat(i) <= p10 + 1e-9 || st.sat(i) < 0.5 || st.ful[i] === 0))
      .sort((a, b) => st.sat(a) - st.sat(b) || a - b);
    let improved = false;
    for (const i of targets) {
      const pend = nb.wantList[i]
        .filter((j) => st.meet[i * n + j] === 0)
        .sort((a, b) => P.wants[i * n + b] - P.wants[i * n + a] || a - b);
      let done = false;
      for (const j of pend) {
        for (const s of shuffle(rng, [...nb.sessions])) {
          if (!P.avail[s][i] || !P.avail[s][j]) continue;
          const ti = st.tableOf[s][i];
          const tj = st.tableOf[s][j];
          if (ti < 0 || tj < 0 || ti === tj) continue;
          // (a) i vai para a mesa de j trocando com q
          if (nb.isMovable[s][i]) {
            for (const q of [...st.members[s][tj]]) {
              if (q === j || !nb.isMovable[s][q]) continue;
              doMove(st, log, s, i, tj);
              doMove(st, log, s, q, ti);
              if (tryAccept()) {
                done = true;
                break;
              }
              // (c) three-way: q não volta para a mesa de i, vai para uma terceira mesa x
              for (let x = 0; x < P.T && !done; x++) {
                if (x === ti || x === tj || st.members[s][x].length === 0) continue;
                const rs = st.members[s][x].filter((r) => nb.isMovable[s][r]);
                if (rs.length === 0) continue;
                const r = rs[randInt(rng, rs.length)];
                doMove(st, log, s, i, tj);
                doMove(st, log, s, q, x);
                doMove(st, log, s, r, ti);
                if (tryAccept()) done = true;
              }
              if (done) break;
            }
          }
          if (done) break;
          // (b) j vai para a mesa de i trocando com q
          if (nb.isMovable[s][j]) {
            for (const q of [...st.members[s][ti]]) {
              if (q === i || !nb.isMovable[s][q]) continue;
              doMove(st, log, s, j, ti);
              doMove(st, log, s, q, tj);
              if (tryAccept()) {
                done = true;
                break;
              }
            }
          }
          if (done) break;
        }
        if (done) break;
      }
      if (done) improved = true;
    }
    if (!improved) break;
  }
  return accepted;
}

// ---------------------------------------------------------------------------
// Orquestração multi-start
// ---------------------------------------------------------------------------

export function optimizeEvent(input: EventInput, opts: OptimizeOptions): OptimizationResult {
  const t0 = now();
  const P = compileProblem(input);
  const nb = buildNeighborhood(P);
  const candidates: CandidateResult[] = [];
  let best: { seed: number; schedule: ReturnType<State["toSchedule"]>; lex: number[] } | null = null;
  const seeds = Math.max(1, opts.seeds | 0);
  for (let k = 0; k < seeds; k++) {
    const seed = opts.baseSeed + k;
    const ts = now();
    const rng = mulberry32(hashSeed(seed, opts.mode, OPTIMIZER_VERSION));
    let st = construct(P, rng, opts.mode);
    if (opts.mode === "BASELINE") {
      st = anneal(st, nb, rng, opts.iterations, SPEC_BASELINE);
      conflictRepair(st, nb, lexBaselineState);
    }
    else {
      // 1) busca principal  2) eliminação de reencontros  3) reaquecimento curto das preferências
      st = anneal(st, nb, rng, Math.floor(opts.iterations * TUNING.mainShare), SPEC_MNBD);
      const cycles = Math.max(1, TUNING.cycles);
      const repIt = Math.floor((opts.iterations * TUNING.repeatShare) / cycles);
      const reheatIt = Math.floor((opts.iterations * (1 - TUNING.mainShare - TUNING.repeatShare)) / cycles);
      for (let c = 0; c < cycles; c++) {
        if (st.repeats > 0 || st.hard > 0 || st.mustMeetUnmet > 0)
          st = anneal(st, nb, rng, repIt, { ...SPEC_REPEATS, T0: TUNING.repT0, conflict: TUNING.repConflict });
        st = anneal(st, nb, rng, reheatIt, SPEC_MNBD_REHEAT);
      }
    }
    if (opts.mode === "MNBD_V2") {
      conflictRepair(st, nb, lexFromState);
      if (st.mustMeetUnmet > 0) mustMeetRepair(st, nb, lexFromState);
      hubRepair(st, nb, rng, lexFromState);
      lexPolish(st, nb, rng, Math.max(500, Math.floor(opts.iterations / 10)));
      if (opts.fairnessRepair !== false) fairnessRepair(st, nb, rng);
    }
    const schedule = st.toSchedule();
    const m = computeMetrics(P, schedule);
    const lex = opts.mode === "BASELINE" ? lexBaselineFromMetrics(m) : lexFromMetrics(m, P.config.mustMeetPriority);
    candidates.push({
      seed,
      timeMs: Math.round(now() - ts),
      lex,
      summary: {
        hardViolations: m.hardViolations,
        repeats: m.repeats,
        mustMeetUnmet: m.mustMeetUnmet,
        highPriorityMet: m.highPriorityMet,
        minSatisfaction: m.satisfaction.min,
        p10: m.satisfaction.p10,
        preferencesMet: m.preferencesMet,
        uniqueContacts: m.uniqueContacts,
      },
    });
    if (!best || compareLex(lex, best.lex) < 0) best = { seed, schedule, lex };
    opts.onProgress?.((k + 1) / seeds, `seed ${seed}`);
  }
  const metrics = computeMetrics(P, best!.schedule);
  return {
    mode: opts.mode,
    optimizerVersion: OPTIMIZER_VERSION,
    baseSeed: opts.baseSeed,
    bestSeed: best!.seed,
    schedule: best!.schedule,
    metrics,
    demand: P.demand,
    feasibility: P.issues,
    candidates,
    lex: best!.lex,
    timeMs: Math.round(now() - t0),
    iterations: opts.iterations,
    frozenUntil: P.frozenUntil,
  };
}
