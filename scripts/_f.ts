import { generateScenario, optimizeEvent, compileProblem } from "../src/engine/index.ts";
const b = generateScenario("F_RESTRICOES", 1);
const r = optimizeEvent(b.input, { mode: "MNBD_V2", baseSeed: 1, seeds: 3, iterations: 150000 });
console.log(r.candidates.map((c) => c.summary));
const P = compileProblem(b.input);
const m = r.metrics;
for (const [i, j] of P.mustMeetPairs) {
  const a = m.perParticipant[i], bb = m.perParticipant[j];
  const met = a.fulfilledTargets.includes(P.ids[j]) || bb.fulfilledTargets.includes(P.ids[i]);
  if (!met) console.log("unmet", P.ids[i], P.ids[j], a.tables, bb.tables);
}
