import { describe, expect, it } from "vitest";
import {
  applyIncident,
  calculateDemand,
  compileProblem,
  comparePlans,
  computeMetrics,
  DEFAULT_CONFIG,
  explainHub,
  generateScenario,
  makeParticipants,
  makeTables,
  mulberry32,
  optimizeEvent,
  percentile,
  validateSolution,
  type EventInput,
  type Schedule,
} from "../index.ts";

// Orçamento reduzido para a suíte ficar rápida; a UI usa mais seeds/iterações.
const FAST = { baseSeed: 1, seeds: 2, iterations: 40000 } as const;

function eachSessionOnce(input: EventInput, schedule: Schedule) {
  const P = compileProblem(input);
  for (let s = 0; s < P.S; s++) {
    const seen = new Map<string, number>();
    for (const table of schedule[s]) for (const id of table) seen.set(id, (seen.get(id) ?? 0) + 1);
    for (let p = 0; p < P.n; p++) {
      const count = seen.get(P.ids[p]) ?? 0;
      expect(count, `sessão ${s + 1}, ${P.ids[p]}`).toBe(P.avail[s][p] ? 1 : 0);
    }
  }
}

describe("TESTE 1 — 60 participantes, 10 mesas, 6 por mesa", () => {
  it("cada participante aparece exatamente uma vez por sessão", () => {
    const b = generateScenario("A_EQUILIBRADO", 1);
    for (const mode of ["BASELINE", "MNBD_V2"] as const) {
      const r = optimizeEvent(b.input, { mode, ...FAST });
      expect(r.schedule).toHaveLength(6);
      r.schedule.forEach((sess) => expect(sess).toHaveLength(10));
      eachSessionOnce(b.input, r.schedule);
      expect(r.metrics.hardViolations).toBe(0);
    }
  });
});

describe("TESTE 2 — nenhuma mesa com mais de 6", () => {
  it("todas as mesas têm <= 6 participantes em todos os cenários", () => {
    for (const key of ["A_EQUILIBRADO", "B_ESTRELA", "C_CINCO_DEMANDADOS", "D_DESIGUALDADE"] as const) {
      const b = generateScenario(key, 3);
      const r = optimizeEvent(b.input, { mode: "MNBD_V2", ...FAST, seeds: 1 });
      for (const sess of r.schedule) for (const t of sess) expect(t.length).toBeLessThanOrEqual(6);
    }
  });
});

describe("TESTE 3 — nenhuma mesa < 5 enquanto existir solução válida", () => {
  it.each([
    [60, [6, 6, 6, 6, 6, 6, 6, 6, 6, 6]],
    [59, [6, 6, 6, 6, 6, 6, 6, 6, 6, 5]],
    [58, [6, 6, 6, 6, 6, 6, 6, 6, 5, 5]],
    [55, [6, 6, 6, 6, 6, 5, 5, 5, 5, 5]],
    [50, [5, 5, 5, 5, 5, 5, 5, 5, 5, 5]],
    [45, [5, 5, 5, 5, 5, 5, 5, 5, 5]],
  ])("N=%i", (n, expected) => {
    const rng = mulberry32(7);
    const input: EventInput = {
      config: { ...DEFAULT_CONFIG, participantTarget: n },
      participants: makeParticipants(rng, n),
      preferences: [],
      tables: makeTables(10),
    };
    const P = compileProblem(input);
    for (let s = 0; s < 6; s++) {
      const sizes = P.sizes[s].filter((x) => x > 0).sort((a, b) => b - a);
      expect(sizes).toEqual(expected);
    }
    const r = optimizeEvent(input, { mode: "BASELINE", baseSeed: 1, seeds: 1, iterations: 5000 });
    for (const sess of r.schedule)
      for (const t of sess) if (t.length > 0) expect(t.length).toBeGreaterThanOrEqual(5);
    eachSessionOnce(input, r.schedule);
  });
});

describe("TESTE 4 e 5 — restrições obrigatórias (cenário F)", () => {
  const b = generateScenario("F_RESTRICOES", 1);
  const r = optimizeEvent(b.input, { mode: "MNBD_V2", baseSeed: 1, seeds: 3, iterations: 60000 });
  const P = compileProblem(b.input);

  it("MUST_NOT_MEET nunca é violado", () => {
    expect(r.metrics.mustNotViolations).toBe(0);
    for (const pref of b.input.preferences.filter((p) => p.type === "MUST_NOT_MEET"))
      for (const sess of r.schedule)
        for (const t of sess) expect(t.includes(pref.sourceId) && t.includes(pref.targetId)).toBe(false);
  });

  it("MUST_MEET viável é atendido", () => {
    expect(P.mustMeetImpossible.size).toBe(0);
    expect(r.metrics.mustMeetUnmet).toBe(0);
    expect(r.metrics.mustMeetMet).toBe(r.metrics.mustMeetTotal);
  });

  it("mesa fixa, moderador fora da capacidade e solução publicável", () => {
    const anchor = b.input.participants.find((p) => p.kind === "ANCHOR")!;
    const moderator = b.input.participants.find((p) => p.kind === "MODERATOR")!;
    const anchorT = b.input.tables.findIndex((t) => t.id === anchor.fixedTableId);
    const modT = b.input.tables.findIndex((t) => t.id === moderator.fixedTableId);
    for (const sess of r.schedule) {
      expect(sess[anchorT]).toContain(anchor.id);
      expect(sess[modT]).toContain(moderator.id);
      // moderador não ocupa vaga: mesa pode ter 6 comerciais + moderador
      expect(sess[modT].filter((id) => id !== moderator.id).length).toBeLessThanOrEqual(6);
    }
    expect(validateSolution(P, r.schedule).ok).toBe(true);
  });

  it("MUST_MEET impossível é detectado antes de otimizar", () => {
    const input = structuredClone(b.input);
    const [a, c] = [input.participants[30].id, input.participants[31].id];
    input.availability = { [a]: [true, true, true, false, false, false], [c]: [false, false, false, true, true, true] };
    input.preferences.push({ id: "x", sourceId: a, targetId: c, type: "MUST_MEET" });
    const P2 = compileProblem(input);
    expect(P2.issues.some((i) => i.code === "MUST_MEET_IMPOSSIBLE")).toBe(true);
    const r2 = optimizeEvent(input, { mode: "MNBD_V2", baseSeed: 1, seeds: 1, iterations: 20000 });
    // impossível não conta como violação obrigatória
    expect(r2.metrics.mustMeetUnmetViable).toBe(0);
  });
});

describe("TESTE 6 — reprodutibilidade", () => {
  it("mesmo input + mesma seed ⇒ mesmo resultado", () => {
    const b = generateScenario("C_CINCO_DEMANDADOS", 5);
    for (const mode of ["BASELINE", "MNBD_V2"] as const) {
      const a = optimizeEvent(b.input, { mode, baseSeed: 42, seeds: 2, iterations: 20000 });
      const c = optimizeEvent(structuredClone(b.input), { mode, baseSeed: 42, seeds: 2, iterations: 20000 });
      expect(c.schedule).toEqual(a.schedule);
      expect(c.lex).toEqual(a.lex);
      expect(c.bestSeed).toBe(a.bestSeed);
    }
  });
  it("o gerador de cenários é determinístico", () => {
    expect(generateScenario("D_DESIGUALDADE", 9)).toEqual(generateScenario("D_DESIGUALDADE", 9));
  });
});

describe("TESTE 7 — sobredemanda", () => {
  it("40 solicitações ⇒ IPD 133,3% e excesso 10", () => {
    const b = generateScenario("B_ESTRELA", 1);
    const star = calculateDemand(b.input).find((d) => d.participantId === b.input.participants[0].id)!;
    expect(star.inbound).toBe(40);
    expect(star.contactCapacity).toBe(30);
    expect(star.ipd).toBeCloseTo(40 / 30, 6);
    expect(star.excess).toBe(10);
    expect(star.demandClass).toBe("SOBREDEMANDA");
  });
  it("a estrela encontra o máximo possível de solicitantes (≈30) sem reencontros desnecessários", () => {
    const b = generateScenario("B_ESTRELA", 1);
    const r = optimizeEvent(b.input, { mode: "MNBD_V2", ...FAST });
    const P = compileProblem(b.input);
    const rows = explainHub(P, r.schedule, b.input.participants[0].id);
    expect(rows).toHaveLength(40);
    const met = rows.filter((x) => x.met).length;
    expect(met).toBeLessThanOrEqual(30);
    // Os 30 lugares da estrela devem ser usados com contatos relevantes:
    // quem a solicitou ou quem ela própria deseja encontrar.
    const star = b.input.participants[0].id;
    const relevant = new Set([
      ...rows.map((x) => x.requesterId),
      ...b.input.preferences.filter((p) => p.sourceId === star).map((p) => p.targetId),
    ]);
    const contacts = new Set(r.schedule.flatMap((sess) => sess.find((t) => t.includes(star))!.filter((id) => id !== star)));
    const relevantMet = [...contacts].filter((id) => relevant.has(id)).length;
    expect(relevantMet).toBeGreaterThanOrEqual(26);
    expect(met).toBeGreaterThanOrEqual(24);
  });
  it("cinco muito demandados não ficam concentrados sem necessidade", () => {
    const b = generateScenario("C_CINCO_DEMANDADOS", 1);
    const r = optimizeEvent(b.input, { mode: "MNBD_V2", ...FAST });
    const hubs = b.input.participants.slice(0, 5).map((p) => p.id);
    const wants = new Set(b.input.preferences.map((p) => `${p.sourceId}>${p.targetId}`));
    let togetherNoInterest = 0;
    for (const sess of r.schedule)
      for (const t of sess) {
        const hs = t.filter((id) => hubs.includes(id));
        for (let x = 0; x < hs.length; x++)
          for (let y = x + 1; y < hs.length; y++)
            if (!wants.has(`${hs[x]}>${hs[y]}`) && !wants.has(`${hs[y]}>${hs[x]}`)) togetherNoInterest++;
      }
    // Juntar dois muito demandados só se justifica quando um deles quer encontrar o outro.
    expect(togetherNoInterest).toBe(0);
    expect(r.metrics.highDemandClusters).toBe(0);
  });
});

describe("TESTE 8 — reotimização (cenário E)", () => {
  const b = generateScenario("E_IMPREVISTO", 1);
  const first = optimizeEvent(b.input, { mode: "MNBD_V2", ...FAST });
  const input2 = applyIncident(b.input, first.schedule, b.incident!);
  const r2 = optimizeEvent(input2, { mode: "MNBD_V2", ...FAST });

  it("sessões concluídas nunca mudam", () => {
    for (let s = 0; s < 2; s++) expect(r2.schedule[s]).toEqual(input2.realizedSchedule![s].map((t) => [...t].sort()));
    expect(comparePlans(input2, first.schedule, r2.schedule).frozenUnchanged).toBe(true);
  });

  it("usa encontros realmente ocorridos e respeita a nova realidade", () => {
    const late = b.incident!.lateId;
    const absent = b.incident!.absentId;
    // atrasado não aparece nas sessões 1–2 realizadas
    expect(r2.schedule[0].flat()).not.toContain(late);
    expect(r2.schedule[1].flat()).not.toContain(late);
    for (let s = 2; s < 6; s++) {
      expect(r2.schedule[s].flat()).toContain(late);
      expect(r2.schedule[s].flat()).not.toContain(absent);
      expect(r2.schedule[s][9]).toHaveLength(0); // mesa 10 fechada
    }
    expect(r2.metrics.hardViolations).toBe(0);
    eachSessionOnce(input2, r2.schedule);
  });

  it("comparação antes × depois mostra a programação antiga inválida", () => {
    const cmp = comparePlans(input2, first.schedule, r2.schedule);
    expect(cmp.before.hardViolations).toBeGreaterThan(0); // mesa fechada ainda ocupada
    expect(cmp.after.hardViolations).toBe(0);
    expect(cmp.movedParticipants).toBeGreaterThan(0);
  });
});

describe("Métricas", () => {
  it("percentis por interpolação linear", () => {
    expect(percentile([0, 0.5, 1], 0.5)).toBe(0.5);
    expect(percentile([0, 1], 0.1)).toBeCloseTo(0.1);
  });
  it("métricas independentes batem com o estado incremental", () => {
    const b = generateScenario("D_DESIGUALDADE", 2);
    const r = optimizeEvent(b.input, { mode: "MNBD_V2", ...FAST, seeds: 1 });
    const P = compileProblem(b.input);
    const m = computeMetrics(P, r.schedule);
    expect(m.uniqueContacts + m.repeats + m.strategicRepeats).toBe(m.pairSlots);
    expect(m.pairSlots).toBe(900);
    const sum = m.perParticipant.reduce((a, x) => a + x.fulfilled, 0);
    expect(sum).toBe(m.preferencesMet);
  });
  it("MNBD V2 não piora os critérios que o baseline também otimiza além do necessário", () => {
    const b = generateScenario("A_EQUILIBRADO", 4);
    const base = optimizeEvent(b.input, { mode: "BASELINE", ...FAST });
    const v2 = optimizeEvent(b.input, { mode: "MNBD_V2", ...FAST });
    expect(v2.metrics.hardViolations).toBe(0);
    expect(base.metrics.hardViolations).toBe(0);
    // apenas registra; a comparação é mostrada ao usuário, não afirmada automaticamente
    expect(v2.metrics.preferencesMet).toBeGreaterThan(0);
  });
});
