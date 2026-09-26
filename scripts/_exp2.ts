import { generateScenario, optimizeEvent } from "../src/engine/index.ts";
import { TUNING } from "../src/engine/optimizer.ts";
Object.assign(TUNING, JSON.parse(process.argv[2] ?? "{}"));
const key = (process.argv[4] ?? "A_EQUILIBRADO") as any;
const b = generateScenario(key, 1);
for (const it of (process.argv[3] ?? "150000,600000").split(",").map(Number)) {
  const r = optimizeEvent(b.input, { mode: "MNBD_V2", baseSeed: 1, seeds: 2, iterations: it });
  console.log(it, r.candidates.map((c) => `${c.summary.repeats}/${c.summary.preferencesMet}/${c.summary.minSatisfaction.toFixed(2)}`).join(" "), r.timeMs);
}
