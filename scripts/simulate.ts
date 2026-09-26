// Executa todos os cenários (Baseline × MNBD V2) e imprime a comparação.
// Uso: npm run simulate -- [seeds] [iterations]
import { applyIncident, comparePlans, generateScenario, optimizeEvent, SCENARIOS } from "../src/engine/index.ts";

const seeds = Number(process.argv[2] ?? 8);
const iterations = Number(process.argv[3] ?? 30000);
const pct = (x: number) => (x * 100).toFixed(1).padStart(5) + "%";

for (const sc of SCENARIOS) {
  const b = generateScenario(sc.key, 1);
  console.log(`\n=== ${sc.label} — ${b.input.participants.length} participantes, ${b.input.preferences.length} preferências ===`);
  for (const n of b.notes) console.log("  " + n);
  for (const mode of ["BASELINE", "MNBD_V2"] as const) {
    const r = optimizeEvent(b.input, { mode, baseSeed: 1, seeds, iterations });
    const m = r.metrics;
    console.log(
      `${mode.padEnd(9)} hard=${m.hardViolations} rep=${m.repeats} uniq=${m.uniqueContacts} pref=${m.preferencesMet}/${m.preferencesRegistered} ` +
        `HIGH=${m.highPriorityMet}/${m.highPriorityTotal} MM=${m.mustMeetMet}/${m.mustMeetTotal} avg=${pct(m.satisfaction.avg)} min=${pct(m.satisfaction.min)} ` +
        `p10=${pct(m.satisfaction.p10)} <50%=${m.satisfaction.below50} hubsJuntos=${m.highDemandClusters} mesmaEmp=${m.sameCompanyPairs} div=${m.diversity.toFixed(2)} ` +
        `mesas=[${m.tableSizeMin}-${m.tableSizeMax}] t=${r.timeMs}ms seed=${r.bestSeed}`,
    );
    if (sc.key === "E_IMPREVISTO" && mode === "MNBD_V2" && b.incident) {
      const input2 = applyIncident(b.input, r.schedule, b.incident);
      const r2 = optimizeEvent(input2, { mode, baseSeed: 1, seeds, iterations });
      const cmp = comparePlans(input2, r.schedule, r2.schedule);
      console.log("  REOTIMIZAÇÃO sessões 3–6:", JSON.stringify({ antes: cmp.before, depois: cmp.after, trocam: cmp.movedParticipants, congeladasIntactas: cmp.frozenUnchanged }));
      for (const i of r2.feasibility.filter((x) => x.severity !== "INFO")) console.log("   -", i.severity, i.message);
    }
  }
}
