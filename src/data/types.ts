import type {
  CandidateResult,
  EventInput,
  FeasibilityIssue,
  Metrics,
  ParticipantDemand,
  ReoptimizationComparison,
  Schedule,
  ScenarioBundle,
  ScenarioKey,
} from "@/engine";

export type Role = "ADMIN" | "OPERATOR" | "VIEWER";

export type EventStatus = "DRAFT" | "SIMULATED" | "VALIDATED" | "APPROVED" | "PUBLISHED" | "RUNNING" | "FINISHED";
export type RunStatus = "DRAFT" | "SIMULATED" | "VALIDATED" | "APPROVED" | "PUBLISHED" | "SUPERSEDED" | "FAILED";
export type RunMode = "BASELINE" | "MNBD_V2" | "MANUAL" | "REOPTIMIZATION";

export interface SandboxEvent {
  id: string;
  name: string;
  status: EventStatus;
  sandbox: boolean;
  scenarioKey?: ScenarioKey | null;
  scenarioSeed?: number | null;
  notes?: string[];
  input: EventInput;
  sessionNames: string[];
  /** Sessões 0..frozenUntil-1 já ocorreram (congeladas). */
  frozenUntil: number;
  /** Presença real das sessões congeladas (ids presentes). */
  attendance?: Record<number, string[]>;
  incident?: ScenarioBundle["incident"];
  publishedRunId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventSummary {
  id: string;
  name: string;
  status: EventStatus;
  sandbox: boolean;
  scenarioKey?: string | null;
  participants: number;
  preferences: number;
  runs: number;
  updatedAt: string;
}

export interface RunRecord {
  id: string;
  eventId: string;
  version: number;
  label: string;
  mode: RunMode;
  status: RunStatus;
  parentRunId?: string | null;
  optimizerVersion: string;
  seed: number | null;
  seeds: number | null;
  iterations: number | null;
  frozenUntil: number;
  schedule: Schedule;
  metrics: Metrics;
  demand: ParticipantDemand[];
  feasibility: FeasibilityIssue[];
  candidates: CandidateResult[];
  lex: number[];
  timeMs: number;
  configSnapshot: EventInput["config"];
  comparison?: Omit<ReoptimizationComparison, "beforeMetrics"> | null;
  createdAt: string;
  createdBy: string;
  approvedAt?: string | null;
  publishedAt?: string | null;
}

export interface AuditEntry {
  id: string;
  eventId: string;
  at: string;
  user: string;
  role: Role;
  action: string;
  details?: string;
}
