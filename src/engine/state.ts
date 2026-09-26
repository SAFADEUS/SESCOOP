// Estado mutável de uma solução com avaliação incremental.
// Usado pela construção, busca local (simulated annealing) e fairness repair.

import {
  F_ALLOWREPEAT,
  F_AVOID,
  F_HUBS,
  F_MUSTMEET,
  F_MUSTNOT,
  F_SAMECO,
  W_HIGH,
  type Problem,
} from "./problem.ts";
import type { Schedule } from "./types.ts";

/** Utilidade côncava da satisfação: ganhos em quem está baixo valem mais (guia de max-min). */
export function fairUtil(x: number): number {
  const y = 1 - x;
  return 1 - y * y;
}

export class State {
  readonly P: Problem;
  readonly n: number;
  readonly S: number;
  readonly T: number;
  tableOf: Int16Array[]; // [s][p]
  members: number[][][]; // [s][t] -> p[]
  meet: Int16Array; // n*n simétrico
  tableUse: Int16Array; // n*T
  segCount: Int16Array[]; // [s][t*nSeg + seg]
  distinctSeg: Int16Array[]; // [s][t]
  nSeg: number;

  hard = 0;
  repeats = 0;
  strategicRepeats = 0;
  unique = 0;
  mustMeetUnmet = 0;
  highMet = 0;
  prefMet = 0;
  prefValue = 0;
  util = 0;
  sameCo = 0;
  sameCoS0 = 0;
  avoidCo = 0;
  hubCo = 0;
  revisits = 0;
  diversity = 0; // soma ponderada de segmentos distintos
  ful: Int32Array;

  constructor(P: Problem) {
    this.P = P;
    this.n = P.n;
    this.S = P.S;
    this.T = P.T;
    const { n, S, T } = this;
    this.tableOf = [];
    this.members = [];
    this.segCount = [];
    this.distinctSeg = [];
    let maxSeg = 0;
    for (let i = 0; i < n; i++) maxSeg = Math.max(maxSeg, P.segment[i] + 1);
    this.nSeg = maxSeg;
    for (let s = 0; s < S; s++) {
      this.tableOf.push(new Int16Array(n).fill(-1));
      const m: number[][] = [];
      for (let t = 0; t < T; t++) m.push([]);
      this.members.push(m);
      this.segCount.push(new Int16Array(T * Math.max(1, maxSeg)));
      this.distinctSeg.push(new Int16Array(T));
    }
    this.meet = new Int16Array(n * n);
    this.tableUse = new Int16Array(n * T);
    this.ful = new Int32Array(n);
    this.mustMeetUnmet = P.mustMeetPairs.length;
    this.util = 0; // util(0) = 0 para todos
  }

  sat(i: number): number {
    const d = this.P.possible[i];
    if (d <= 0) return 1;
    const v = this.ful[i] / d;
    return v > 1 ? 1 : v;
  }

  private bumpFul(i: number, d: number) {
    const poss = this.P.possible[i];
    if (poss <= 0) {
      this.ful[i] += d;
      return;
    }
    const before = fairUtil(Math.min(1, this.ful[i] / poss));
    this.ful[i] += d;
    this.util += fairUtil(Math.min(1, this.ful[i] / poss)) - before;
  }

  private addPair(i: number, j: number, s: number) {
    const P = this.P;
    const n = this.n;
    const k = i * n + j;
    const c = this.meet[k];
    this.meet[k] = c + 1;
    this.meet[j * n + i] = c + 1;
    const f = P.pairFlags[k];
    if (f !== 0) {
      if (f & F_MUSTNOT) this.hard++;
      if (f & F_AVOID) this.avoidCo++;
      if (f & F_SAMECO) {
        this.sameCo++;
        if (s === 0) this.sameCoS0++;
      }
      if (f & F_HUBS) this.hubCo++;
    }
    if (c === 0) {
      this.unique++;
      this.prefValue += P.pairValue[k];
      if (f & F_MUSTMEET) this.mustMeetUnmet--;
      const a = P.wants[k];
      if (a > 0) {
        this.prefMet++;
        if (a === W_HIGH) this.highMet++;
        this.bumpFul(i, 1);
      }
      const b = P.wants[j * n + i];
      if (b > 0) {
        this.prefMet++;
        if (b === W_HIGH) this.highMet++;
        this.bumpFul(j, 1);
      }
    } else if (f & F_ALLOWREPEAT) this.strategicRepeats++;
    else this.repeats++;
  }

  private removePair(i: number, j: number, s: number) {
    const P = this.P;
    const n = this.n;
    const k = i * n + j;
    const c = this.meet[k];
    this.meet[k] = c - 1;
    this.meet[j * n + i] = c - 1;
    const f = P.pairFlags[k];
    if (f !== 0) {
      if (f & F_MUSTNOT) this.hard--;
      if (f & F_AVOID) this.avoidCo--;
      if (f & F_SAMECO) {
        this.sameCo--;
        if (s === 0) this.sameCoS0--;
      }
      if (f & F_HUBS) this.hubCo--;
    }
    if (c === 1) {
      this.unique--;
      this.prefValue -= P.pairValue[k];
      if (f & F_MUSTMEET) this.mustMeetUnmet++;
      const a = P.wants[k];
      if (a > 0) {
        this.prefMet--;
        if (a === W_HIGH) this.highMet--;
        this.bumpFul(i, -1);
      }
      const b = P.wants[j * n + i];
      if (b > 0) {
        this.prefMet--;
        if (b === W_HIGH) this.highMet--;
        this.bumpFul(j, -1);
      }
    } else if (f & F_ALLOWREPEAT) this.strategicRepeats--;
    else this.repeats--;
  }

  private segDelta(s: number, t: number, p: number, d: number) {
    const seg = this.P.segment[p];
    const arr = this.segCount[s];
    const key = t * this.nSeg + seg;
    const before = arr[key];
    arr[key] = before + d;
    const w = s === 0 ? 3 : 1;
    if (before === 0 && d > 0) {
      this.distinctSeg[s][t]++;
      this.diversity += w;
    } else if (before + d === 0 && d < 0) {
      this.distinctSeg[s][t]--;
      this.diversity -= w;
    }
  }

  /** Senta p na mesa t da sessão s (p não pode estar sentado nessa sessão). */
  place(s: number, p: number, t: number) {
    const staffP = this.P.staff[p];
    const mem = this.members[s][t];
    if (!staffP) {
      for (let x = 0; x < mem.length; x++) {
        const q = mem[x];
        if (this.P.staff[q]) continue;
        this.addPair(p, q, s);
      }
      this.segDelta(s, t, p, 1);
      const u = this.tableUse[p * this.T + t];
      if (u > 0) this.revisits++;
      this.tableUse[p * this.T + t] = u + 1;
    }
    mem.push(p);
    this.tableOf[s][p] = t;
  }

  /** Remove p da sua mesa na sessão s. */
  unplace(s: number, p: number) {
    const t = this.tableOf[s][p];
    if (t < 0) return;
    const mem = this.members[s][t];
    const pos = mem.indexOf(p);
    mem[pos] = mem[mem.length - 1];
    mem.pop();
    this.tableOf[s][p] = -1;
    if (this.P.staff[p]) return;
    for (let x = 0; x < mem.length; x++) {
      const q = mem[x];
      if (this.P.staff[q]) continue;
      this.removePair(p, q, s);
    }
    this.segDelta(s, t, p, -1);
    const u = this.tableUse[p * this.T + t];
    if (u > 1) this.revisits--;
    this.tableUse[p * this.T + t] = u - 1;
  }

  move(s: number, p: number, t: number) {
    this.unplace(s, p);
    this.place(s, p, t);
  }

  swap(s: number, p: number, q: number) {
    const tp = this.tableOf[s][p];
    const tq = this.tableOf[s][q];
    this.unplace(s, p);
    this.unplace(s, q);
    this.place(s, p, tq);
    this.place(s, q, tp);
  }

  /** Quantos participantes que contam capacidade estão na mesa. */
  capCount(s: number, t: number): number {
    const mem = this.members[s][t];
    let c = 0;
    for (const p of mem) if (this.P.countsCap[p]) c++;
    return c;
  }

  snapshot(): Int16Array[] {
    return this.tableOf.map((r) => r.slice());
  }

  /** Reconstrói o estado a partir de um snapshot de tableOf. */
  static fromTableOf(P: Problem, tableOf: Int16Array[]): State {
    const st = new State(P);
    for (let s = 0; s < P.S; s++)
      for (let p = 0; p < P.n; p++) {
        const t = tableOf[s][p];
        if (t >= 0) st.place(s, p, t);
      }
    return st;
  }

  static fromSchedule(P: Problem, schedule: Schedule): State {
    const st = new State(P);
    for (let s = 0; s < P.S; s++) {
      const sess = schedule[s] ?? [];
      sess.forEach((mem, t) => {
        for (const id of mem) {
          const p = P.idx.get(id);
          if (p === undefined || st.tableOf[s][p] >= 0) continue;
          st.place(s, p, t);
        }
      });
    }
    return st;
  }

  toSchedule(): Schedule {
    const out: Schedule = [];
    for (let s = 0; s < this.S; s++) {
      const sess: string[][] = [];
      for (let t = 0; t < this.T; t++) {
        const mem = [...this.members[s][t]].sort((a, b) => a - b);
        sess.push(mem.map((p) => this.P.ids[p]));
      }
      out.push(sess);
    }
    return out;
  }

  /** Satisfações dos participantes com preferências (ordenadas). */
  sortedSats(): number[] {
    const out: number[] = [];
    for (let i = 0; i < this.n; i++) if (this.P.possible[i] > 0) out.push(Math.round(this.sat(i) * 1e9) / 1e9);
    out.sort((a, b) => a - b);
    return out;
  }
}
