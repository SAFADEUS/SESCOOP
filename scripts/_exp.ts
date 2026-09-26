import { generateScenario, optimizeEvent, SCENARIOS } from "../src/engine/index.ts";
import { TUNING } from "../src/engine/optimizer.ts";
const configs = JSON.parse(process.argv[2]);
const iters = Number(process.argv[3] ?? 150000);
for (const c of configs) {
  Object.assign(TUNING, c);
  let rep = 0, pref = 0, min = 0, p10 = 0, mm = 0, t = 0;
  const per: string[] = [];
  for (const sc of SCENARIOS) {
    const b = generateScenario(sc.key, 1);
    const r = optimizeEvent(b.input, { mode: "MNBD_V2", baseSeed: 1, seeds: 3, iterations: iters });
    const m = r.metrics;
    rep += m.repeats; pref += m.preferencesMet; min += m.satisfaction.min; p10 += m.satisfaction.p10; mm += m.mustMeetUnmet; t += r.timeMs;
    per.push(`${m.repeats}/${m.preferencesMet}`);
  }
  console.log(JSON.stringify(c), `rep=${rep} pref=${pref} min=${(min/6).toFixed(3)} p10=${(p10/6).toFixed(3)} mmUnmet=${mm} t=${t}`, per.join(" "));
}
