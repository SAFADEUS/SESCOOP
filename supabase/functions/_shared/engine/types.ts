// NexaCoop — tipos do motor de otimização (MNBD).
// Este módulo é TypeScript puro: roda no navegador (Web Worker), em Node (testes)
// e em Deno (Supabase Edge Functions). Não importar nada de DOM/React aqui.

export const OPTIMIZER_VERSION = "mnbd-2.0.0";

export type PreferenceType =
  | "NORMAL"
  | "PREFER"
  | "HIGH_PRIORITY"
  | "MUST_MEET"
  | "AVOID"
  | "MUST_NOT_MEET";

export const POSITIVE_TYPES: PreferenceType[] = ["NORMAL", "PREFER", "HIGH_PRIORITY", "MUST_MEET"];

export type AttendanceStatus = "CONFIRMED" | "CHECKED_IN" | "ABSENT" | "LATE" | "LEFT_EVENT";

export type ParticipantKind = "PARTICIPANT" | "MODERATOR" | "ANCHOR";

export interface Participant {
  id: string;
  name: string;
  company: string;
  role: string;
  segment: string;
  category: string;
  description?: string;
  tags: string[];
  active: boolean;
  /** participante_fixo: permanece na mesma mesa em todas as sessões. */
  fixed: boolean;
  /** mesa_fixa (id da mesa). Se fixed=true e fixedTableId=null, o motor escolhe a mesa e a mantém. */
  fixedTableId?: string | null;
  /** prioridade_institucional: 0 (nenhuma) a 3 (máxima). */
  institutionalPriority: number;
  kind: ParticipantKind;
  /** Moderadores/âncoras podem não ocupar vaga comercial. */
  countsTowardCapacity: boolean;
  notes?: string;
  status?: AttendanceStatus;
}

export interface Preference {
  id: string;
  sourceId: string;
  targetId: string;
  type: PreferenceType;
  /** Peso opcional (multiplica o peso padrão do tipo). */
  weight?: number;
  reason?: string;
  /** Reencontro estratégico permitido (MUST_MEET_REPEAT, continuidade de negociação...). */
  allowRepeat?: boolean;
}

export interface EventTable {
  id: string;
  number: number;
  name: string;
}

export interface DemandThresholds {
  /** IPD >= high → ALTA DEMANDA */
  high: number;
  /** IPD >= critical → CRÍTICA */
  critical: number;
  /** IPD > over → SOBREDEMANDA */
  over: number;
}

export interface SessionOverride {
  minCapacity?: number;
  maxCapacity?: number;
}

export interface EventConfig {
  participantTarget: number;
  tableCount: number;
  sessionCount: number;
  idealTableCapacity: number;
  minTableCapacity: number;
  maxTableCapacity: number;
  sessionDurationMinutes: number;
  avoidTableRevisit: boolean;
  allowSameCompany: boolean;
  demandThresholds: DemandThresholds;
  /** Evitar concentrar participantes muito demandados na mesma mesa (preferência, não hard). */
  spreadHighDemand: boolean;
  /**
   * Prioridade do MUST_MEET no vetor lexicográfico:
   * - "HARD" (padrão): MUST_MEET viável é restrição obrigatória (seção 7) e entra em P0.
   * - "AFTER_REPEATS": ordem literal da seção 22 (P1 reencontros antes de P2 MUST_MEET).
   * MUST_MEET matematicamente impossível nunca conta como violação.
   */
  mustMeetPriority: "HARD" | "AFTER_REPEATS";
  /** Sobrescritas de capacidade por sessão (índice 0-based). */
  sessionOverrides?: Record<number, SessionOverride>;
  weights: ObjectiveWeights;
}

/**
 * Pesos do surrogate usado DENTRO da busca local. A seleção final entre candidatos
 * é sempre lexicográfica (ver objective.ts); estes pesos apenas guiam a busca.
 */
export interface ObjectiveWeights {
  typeWeight: Record<"NORMAL" | "PREFER" | "HIGH_PRIORITY" | "MUST_MEET", number>;
  mutualBonus: number;
  avoidPenalty: number;
  sameCompanyPenalty: number;
  tableRevisitPenalty: number;
  highDemandClusterPenalty: number;
  /** Penalidade por assento "ocioso" ao lado de um sobredemandado/crítico (seção 14). */
  pressuredIdlePenalty: number;
  diversityWeight: number;
  fairnessWeight: number;
}

export const DEFAULT_WEIGHTS: ObjectiveWeights = {
  typeWeight: { NORMAL: 1, PREFER: 2, HIGH_PRIORITY: 4, MUST_MEET: 6 },
  mutualBonus: 2,
  avoidPenalty: 60,
  sameCompanyPenalty: 25,
  tableRevisitPenalty: 1,
  highDemandClusterPenalty: 40,
  pressuredIdlePenalty: 200,
  diversityWeight: 4,
  fairnessWeight: 400,
};

export const DEFAULT_CONFIG: EventConfig = {
  participantTarget: 60,
  tableCount: 10,
  sessionCount: 6,
  idealTableCapacity: 6,
  minTableCapacity: 5,
  maxTableCapacity: 6,
  sessionDurationMinutes: 15,
  avoidTableRevisit: true,
  allowSameCompany: true,
  demandThresholds: { high: 0.6, critical: 0.9, over: 1.0 },
  spreadHighDemand: true,
  mustMeetPriority: "HARD",
  weights: DEFAULT_WEIGHTS,
};

/** Lock manual: participante X fica na mesa Y na sessão S. */
export interface Lock {
  participantId: string;
  session: number; // 0-based
  tableId: string;
}

/** schedule[session][tableIndex] = ids dos participantes. tableIndex segue a ordem de EventInput.tables. */
export type Schedule = string[][][];

export interface EventInput {
  config: EventConfig;
  participants: Participant[];
  preferences: Preference[];
  tables: EventTable[];
  /** availability[participantId][session] — ausente = disponível em todas as sessões. */
  availability?: Record<string, boolean[]>;
  /** tableAvailability[tableId][session] — ausente = disponível. */
  tableAvailability?: Record<string, boolean[]>;
  locks?: Lock[];
  /**
   * Sessões congeladas (já realizadas): índices < frozenUntil são imutáveis e devem conter
   * os encontros REALMENTE ocorridos (realizedSchedule).
   */
  frozenUntil?: number;
  realizedSchedule?: Schedule;
}

export type OptimizerMode = "BASELINE" | "MNBD_V2";

export interface OptimizeOptions {
  mode: OptimizerMode;
  /** Semente base; candidatos usam seeds baseSeed..baseSeed+seeds-1 */
  baseSeed: number;
  seeds: number;
  /** Iterações da busca local (simulated annealing) por seed. */
  iterations: number;
  /** Executa fase de fairness repair (apenas MNBD_V2). */
  fairnessRepair?: boolean;
  /** Callback de progresso (0..1). */
  onProgress?: (p: number, label: string) => void;
}

export type DemandClass = "NORMAL" | "ALTA" | "CRITICA" | "SOBREDEMANDA";

export interface ParticipantDemand {
  participantId: string;
  inbound: number;
  outbound: number;
  inboundByType: Record<PreferenceType, number>;
  availableSessions: number;
  contactCapacity: number;
  ipd: number; // inbound / capacity
  excess: number;
  demandClass: DemandClass;
  mustMeetCount: number;
  mustNotCount: number;
  mutualCount: number;
  difficulty: number;
}

export interface FeasibilityIssue {
  severity: "ERROR" | "WARNING" | "INFO";
  code: string;
  message: string;
  participantIds?: string[];
  session?: number;
}

export interface SatisfactionStats {
  count: number; // participantes com preferências (entram na estatística)
  min: number;
  p10: number;
  p25: number;
  median: number;
  avg: number;
  p75: number;
  p90: number;
  below25: number;
  below50: number;
  above80: number;
  full: number;
  zero: number;
}

export interface ParticipantResult {
  participantId: string;
  requested: number; // preferências positivas
  possible: number; // min(requested, capacity)
  fulfilled: number;
  satisfaction: number | null;
  contacts: number; // pessoas distintas encontradas
  repeats: number; // reencontros involuntários envolvendo o participante
  tables: (number | null)[]; // índice de mesa por sessão
  fulfilledTargets: string[];
  pendingTargets: string[];
  inboundMet: number; // solicitações recebidas atendidas
}

export interface Metrics {
  participants: number;
  sessions: number;
  tables: number;
  hardViolations: number;
  hardViolationDetails: string[];
  mustNotViolations: number;
  capacityViolations: number;
  availabilityViolations: number;
  duplicateViolations: number;
  lockViolations: number;
  unseated: number;
  repeats: number; // reencontros involuntários (encontros extras de pares já encontrados)
  strategicRepeats: number;
  repeatPairs: number;
  uniqueContacts: number; // pares distintos que se encontraram
  pairSlots: number; // oportunidades de pares (soma C(k,2))
  preferencesRegistered: number; // positivas
  preferencesMet: number;
  preferencesMetByType: Record<string, { total: number; met: number }>;
  mutualPairs: number;
  mutualPairsMet: number;
  mustMeetTotal: number; // pares
  mustMeetMet: number;
  mustMeetUnmet: number;
  /** MUST_MEET não atendidos que eram viáveis (par com sessão/mesa em comum). */
  mustMeetUnmetViable: number;
  highPriorityTotal: number;
  highPriorityMet: number;
  avoidMet: number;
  sameCompanyPairs: number;
  diversity: number; // média de segmentos distintos por mesa-sessão
  tableRevisits: number;
  highDemandClusters: number; // co-alocações de dois participantes de alta demanda
  tableSizeMin: number;
  tableSizeMax: number;
  tableSizeStdDev: number;
  satisfaction: SatisfactionStats;
  overdemanded: number;
  critical: number;
  perParticipant: ParticipantResult[];
}

export interface CandidateResult {
  seed: number;
  timeMs: number;
  lex: number[];
  summary: {
    hardViolations: number;
    repeats: number;
    mustMeetUnmet: number;
    highPriorityMet: number;
    minSatisfaction: number;
    p10: number;
    preferencesMet: number;
    uniqueContacts: number;
  };
}

export interface SizePlan {
  /** sizes[session][tableIndex] = vagas que contam para capacidade (0 = mesa não usada). */
  sizes: number[][];
  issues: FeasibilityIssue[];
}

export interface OptimizationResult {
  mode: OptimizerMode;
  optimizerVersion: string;
  baseSeed: number;
  bestSeed: number;
  schedule: Schedule;
  metrics: Metrics;
  demand: ParticipantDemand[];
  feasibility: FeasibilityIssue[];
  candidates: CandidateResult[];
  lex: number[];
  timeMs: number;
  iterations: number;
  frozenUntil: number;
}

export const LEX_LABELS = [
  "P0 violações obrigatórias (min)",
  "P1 reencontros (min)",
  "P2 MUST_MEET não atendidos (min)",
  "P3 HIGH_PRIORITY atendidos (max)",
  "P4 satisfação mínima (max)",
  "P5 satisfação P10 (max)",
  "P6 preferências atendidas (max)",
  "P7 contatos únicos (max)",
  "P8 diversidade (max)",
  "P9 desequilíbrio de ocupação (min)",
  "P10 repetição de mesa física (min)",
];
