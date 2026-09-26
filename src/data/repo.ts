import type { AuditEntry, EventSummary, RunRecord, SandboxEvent } from "./types";

/** Camada de persistência: local (IndexedDB) ou Supabase — a UI não sabe qual. */
export interface Repo {
  kind: "local" | "supabase";
  listEvents(): Promise<EventSummary[]>;
  getEvent(id: string): Promise<SandboxEvent | null>;
  /** Retorna o evento salvo (no Supabase, ids são normalizados para UUID). */
  saveEvent(ev: SandboxEvent): Promise<SandboxEvent>;
  deleteEvent(id: string): Promise<void>;
  listRuns(eventId: string): Promise<RunRecord[]>;
  /** Execuções nunca são apagadas; cada execução é uma nova versão. */
  insertRun(run: Omit<RunRecord, "version">): Promise<RunRecord>;
  updateRunStatus(id: string, patch: Pick<RunRecord, "status"> & Partial<Pick<RunRecord, "approvedAt" | "publishedAt" | "label">>): Promise<void>;
  addAudit(entry: Omit<AuditEntry, "id" | "at">): Promise<void>;
  listAudit(eventId: string): Promise<AuditEntry[]>;
}
