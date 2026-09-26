// Objetivos lexicográficos (seção 22) + surrogate escalar usado apenas para guiar a busca.
//
// Seleção de soluções: SEMPRE por comparação lexicográfica do vetor abaixo (menor é melhor).
// Busca local: usa um surrogate em "camadas" cujas ordens de grandeza respeitam a mesma
// hierarquia; no final, uma fase de polimento aceita apenas movimentos que melhoram o vetor
// lexicográfico exato.

import { percentile, stdDev } from "./stats.ts";
import type { State } from "./state.ts";
import type { Metrics } from "./types.ts";

const r9 = (x: number) => Math.round(x * 1e9) / 1e9;

/** Vetor lexicográfico: [P0..P10], todos no sentido "menor é melhor". */
export function lexFromState(st: State): number[] {
  const sats = st.sortedSats();
  const min = sats.length ? sats[0] : 1;
  const p10 = sats.length ? percentile(sats, 0.1) : 1;
  let used = 0;
  let divSum = 0;
  const sizes: number[] = [];
  for (let s = 0; s < st.S; s++)
    for (let t = 0; t < st.T; t++) {
      const c = st.capCount(s, t);
      if (c === 0) continue;
      used++;
      divSum += st.distinctSeg[s][t];
      sizes.push(c);
    }
  const diversity = used ? divSum / used : 0;
  return [
    st.hard + mustMeetHardFromState(st),
    st.repeats,
    st.mustMeetUnmet,
    -st.highMet,
    -r9(min),
    -r9(p10),
    -st.prefMet,
    -st.unique,
    -r9(diversity),
    r9(stdDev(sizes)),
    st.P.config.avoidTableRevisit ? st.revisits : 0,
    st.moved,
  ];
}

export function lexFromMetrics(m: Metrics, mustMeetPriority: "HARD" | "AFTER_REPEATS" = "HARD", moved = 0): number[] {
  return [
    m.hardViolations + (mustMeetPriority === "HARD" ? m.mustMeetUnmetViable : 0),
    m.repeats,
    m.mustMeetUnmet,
    -m.highPriorityMet,
    -r9(m.satisfaction.count ? m.satisfaction.min : 1),
    -r9(m.satisfaction.count ? m.satisfaction.p10 : 1),
    -m.preferencesMet,
    -m.uniqueContacts,
    -r9(m.diversity),
    r9(m.tableSizeStdDev),
    m.tableRevisits,
    moved,
  ];
}

/** MUST_MEET viáveis não atendidos contam em P0 quando mustMeetPriority = HARD. */
export function mustMeetHardFromState(st: State): number {
  if (st.P.config.mustMeetPriority !== "HARD" || st.mustMeetUnmet === 0) return 0;
  return st.mustMeetUnmet - unmetImpossible(st);
}

function unmetImpossible(st: State): number {
  // pares impossíveis nunca se encontram nas sessões futuras; podem ter se encontrado em sessões congeladas
  let c = 0;
  for (const k of st.P.mustMeetImpossible) if (st.meet[k] === 0) c++;
  return c;
}

/** Baseline: só enxerga restrições, reencontros e contatos únicos. */
export function lexBaselineFromMetrics(m: Metrics): number[] {
  return [m.hardViolations, m.repeats, -m.uniqueContacts, r9(m.tableSizeStdDev), m.tableRevisits];
}

/** Compara vetores lexicográficos. <0 se a é melhor que b. */
export function compareLex(a: number[], b: number[]): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const d = a[i] - b[i];
    if (Math.abs(d) > 1e-9) return d < 0 ? -1 : 1;
  }
  return 0;
}

// Camadas do surrogate (maior = mais importante). Refletem P0 > P1 > P2 > P3 > fairness > preferências.
const W_HARD = 1e9;
const W_REPEAT = 1e6;
const W_MUSTMEET = 1e5;
const W_HIGHMET = 1500;
const W_PREF = 30;
const W_UNIQUE = 2;

/** Parte "suave" do MNBD: tudo abaixo das camadas P0–P2. */
export function mnbdSoft(st: State): number {
  const w = st.P.config.weights;
  const cfg = st.P.config;
  const sameCoPen = cfg.allowSameCompany ? w.sameCompanyPenalty : w.sameCompanyPenalty * 40;
  return (
    W_HIGHMET * st.highMet +
    w.fairnessWeight * st.util +
    W_PREF * st.prefValue +
    W_UNIQUE * st.unique +
    w.diversityWeight * st.diversity -
    sameCoPen * st.sameCo -
    sameCoPen * st.sameCoS0 - // sessão 1: diversidade estruturada pesa em dobro
    w.avoidPenalty * st.avoidCo -
    (cfg.spreadHighDemand ? w.highDemandClusterPenalty * st.hubCo : 0) -
    (w.pressuredIdlePenalty ?? 0) * st.hubIdle -
    (cfg.avoidTableRevisit ? w.tableRevisitPenalty * st.revisits : 0) -
    (w.stabilityWeight ?? 0) * st.moved
  );
}

/** Score do MNBD V2 (maior = melhor). */
export function surrogateMNBD(st: State): number {
  const mmHard = st.P.config.mustMeetPriority === "HARD" ? W_REPEAT * 3 : W_MUSTMEET;
  return -W_HARD * st.hard - W_REPEAT * st.repeats - mmHard * st.mustMeetUnmet + mnbdSoft(st);
}

/**
 * Fase de eliminação de reencontros: as camadas P0–P2 ganham escala compatível com a
 * temperatura para que o annealing atravesse platôs; a parte suave vira desempate.
 */
export function surrogateRepeatFocus(st: State, softWeight = 0.01): number {
  return -1e4 * st.hard - 10 * st.repeats - 12 * st.mustMeetUnmet + softWeight * mnbdSoft(st);
}

/** Score do BASELINE: distribuição por sessão + redução de reencontros (sem demanda). */
export function surrogateBaseline(st: State): number {
  // Escala própria (reencontro = 10) para que o annealing consiga atravessar platôs.
  return -1e4 * st.hard - 10 * st.repeats - (st.P.config.avoidTableRevisit ? 0.05 * st.revisits : 0);
}
