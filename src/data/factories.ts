import { DEFAULT_CONFIG, generateScenario, makeParticipants, makeTables, mulberry32, type ScenarioKey } from "@/engine";
import type { SandboxEvent } from "./types";

const uid = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Math.random().toString(36).slice(2));

export function newEventFromScenario(key: ScenarioKey, seed: number): SandboxEvent {
  const b = generateScenario(key, seed);
  const now = new Date().toISOString();
  return {
    id: uid(),
    name: `${b.name} · seed ${seed}`,
    status: "DRAFT",
    sandbox: true,
    scenarioKey: key,
    scenarioSeed: seed,
    notes: b.notes,
    input: b.input,
    sessionNames: Array.from({ length: b.input.config.sessionCount }, (_, s) => `Sessão ${s + 1}`),
    frozenUntil: 0,
    incident: b.incident,
    createdAt: now,
    updatedAt: now,
  };
}

export function newBlankEvent(name: string, sandbox: boolean, fake: number): SandboxEvent {
  const now = new Date().toISOString();
  const cfg = { ...DEFAULT_CONFIG };
  return {
    id: uid(),
    name,
    status: "DRAFT",
    sandbox,
    input: {
      config: cfg,
      participants: fake > 0 ? makeParticipants(mulberry32(Date.now() & 0xffff), fake) : [],
      preferences: [],
      tables: makeTables(cfg.tableCount),
      availability: {},
      tableAvailability: {},
      locks: [],
    },
    sessionNames: Array.from({ length: cfg.sessionCount }, (_, s) => `Sessão ${s + 1}`),
    frozenUntil: 0,
    createdAt: now,
    updatedAt: now,
  };
}
