// Ponto de entrada do módulo optimization-engine.
export * from "./types.ts";
export { compileProblem, validateEvent, classifyDemand, planTableSizes, type Problem } from "./problem.ts";
export { computeMetrics, validateSolution, listEncounters, explainHub, type EncounterRecord, type HubExplanationRow } from "./metrics.ts";
export { optimizeEvent, phaseOf } from "./optimizer.ts";
export { compareLex, lexFromMetrics, lexBaselineFromMetrics } from "./objective.ts";
export { generateScenario, makeParticipants, makeTables, SCENARIOS, type ScenarioBundle, type ScenarioKey } from "./scenarios.ts";
export { applyIncident, comparePlans, projectPlan, realizeSessions, reoptimize, type Attendance, type ReoptimizationComparison } from "./reoptimize.ts";
export { percentile, satisfactionStats } from "./stats.ts";
export { mulberry32, hashSeed } from "./rng.ts";

import { compileProblem } from "./problem.ts";
import type { EventInput, ParticipantDemand } from "./types.ts";

/** calculateDemand: inbound, outbound, capacidade, IPD e classe de demanda por participante. */
export function calculateDemand(input: EventInput): ParticipantDemand[] {
  return compileProblem(input).demand;
}

/** calculateFeasibility: problemas de viabilidade detectados antes de otimizar. */
export function calculateFeasibility(input: EventInput) {
  return compileProblem(input).issues;
}
