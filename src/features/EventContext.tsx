import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { compileProblem, computeMetrics, OPTIMIZER_VERSION, type Metrics, type OptimizationResult, type Problem, type Schedule } from "@/engine";
import type { RunMode, RunRecord, RunStatus, SandboxEvent } from "@/data/types";
import { useApp } from "./AppContext";

interface EventCtx {
  ev: SandboxEvent;
  runs: RunRecord[];
  P: Problem;
  selectedRun: RunRecord | null;
  selectRun: (id: string | null) => void;
  /** Métricas da execução selecionada recalculadas com o cadastro ATUAL. */
  liveMetrics: Metrics | null;
  canEdit: boolean;
  isAdmin: boolean;
  update: (mutate: (ev: SandboxEvent) => SandboxEvent, action: string, details?: string) => Promise<void>;
  saveResult: (r: OptimizationResult, meta: { label: string; mode?: RunMode; parentRunId?: string | null; comparison?: RunRecord["comparison"] }) => Promise<RunRecord>;
  saveSchedule: (schedule: Schedule, meta: { label: string; mode: RunMode; parentRunId?: string | null }) => Promise<RunRecord>;
  setRunStatus: (run: RunRecord, status: RunStatus) => Promise<void>;
  audit: (action: string, details?: string) => Promise<void>;
  reload: () => Promise<void>;
}

const Ctx = createContext<EventCtx | null>(null);

export function EventProvider({ initial, initialRuns, children }: { initial: SandboxEvent; initialRuns: RunRecord[]; children: ReactNode }) {
  const { repo, role, user } = useApp();
  const [ev, setEv] = useState(initial);
  const [runs, setRuns] = useState(initialRuns);
  const [selectedId, setSelectedId] = useState<string | null>(initialRuns.find((r) => r.status === "PUBLISHED")?.id ?? initialRuns[0]?.id ?? null);

  useEffect(() => setEv(initial), [initial]);

  const P = useMemo(() => compileProblem({ ...ev.input, frozenUntil: ev.frozenUntil }), [ev]);
  const selectedRun = runs.find((r) => r.id === selectedId) ?? null;
  const liveMetrics = useMemo(() => (selectedRun ? computeMetrics(P, selectedRun.schedule) : null), [P, selectedRun]);

  const audit = useCallback(
    async (action: string, details?: string) => {
      await repo.addAudit({ eventId: ev.id, user, role, action, details });
    },
    [repo, ev.id, user, role],
  );

  const reload = useCallback(async () => {
    const [e, r] = await Promise.all([repo.getEvent(ev.id), repo.listRuns(ev.id)]);
    if (e) setEv(e);
    setRuns(r);
  }, [repo, ev.id]);

  const update = useCallback(
    async (mutate: (ev: SandboxEvent) => SandboxEvent, action: string, details?: string) => {
      if (role === "VIEWER") throw new Error("VIEWER possui acesso somente leitura.");
      const next = mutate(ev);
      const saved = await repo.saveEvent(next);
      setEv(saved);
      await repo.addAudit({ eventId: saved.id, user, role, action, details });
    },
    [ev, repo, role, user],
  );

  const insert = useCallback(
    async (run: Omit<RunRecord, "version">, action: string) => {
      if (role === "VIEWER") throw new Error("VIEWER possui acesso somente leitura.");
      const rec = await repo.insertRun(run);
      setRuns((rs) => [rec, ...rs]);
      setSelectedId(rec.id);
      if (ev.status === "DRAFT") {
        const saved = await repo.saveEvent({ ...ev, status: "SIMULATED" });
        setEv(saved);
      }
      await repo.addAudit({
        eventId: ev.id,
        user,
        role,
        action,
        details: `v${rec.version} ${rec.label} · seed ${rec.seed ?? "—"} · reencontros ${rec.metrics.repeats} · pref. ${rec.metrics.preferencesMet}/${rec.metrics.preferencesRegistered} · mín ${(rec.metrics.satisfaction.min * 100).toFixed(1)}%`,
      });
      return rec;
    },
    [repo, role, user, ev],
  );

  const saveResult: EventCtx["saveResult"] = useCallback(
    (r, meta) =>
      insert(
        {
          id: "",
          eventId: ev.id,
          label: meta.label,
          mode: meta.mode ?? r.mode,
          status: "SIMULATED",
          parentRunId: meta.parentRunId ?? null,
          optimizerVersion: r.optimizerVersion,
          seed: r.bestSeed,
          seeds: r.candidates.length,
          iterations: r.iterations,
          frozenUntil: r.frozenUntil,
          schedule: r.schedule,
          metrics: r.metrics,
          demand: r.demand,
          feasibility: r.feasibility,
          candidates: r.candidates,
          lex: r.lex,
          timeMs: r.timeMs,
          configSnapshot: ev.input.config,
          comparison: meta.comparison ?? null,
          createdAt: new Date().toISOString(),
          createdBy: user,
        },
        meta.mode === "REOPTIMIZATION" ? "reotimização" : "otimização",
      ),
    [insert, ev, user],
  );

  const saveSchedule: EventCtx["saveSchedule"] = useCallback(
    (schedule, meta) => {
      const metrics = computeMetrics(P, schedule);
      return insert(
        {
          id: "",
          eventId: ev.id,
          label: meta.label,
          mode: meta.mode,
          status: "DRAFT",
          parentRunId: meta.parentRunId ?? null,
          optimizerVersion: OPTIMIZER_VERSION,
          seed: null,
          seeds: null,
          iterations: null,
          frozenUntil: ev.frozenUntil,
          schedule,
          metrics,
          demand: P.demand,
          feasibility: P.issues,
          candidates: [],
          lex: [],
          timeMs: 0,
          configSnapshot: ev.input.config,
          createdAt: new Date().toISOString(),
          createdBy: user,
        },
        "edição manual salva",
      );
    },
    [insert, P, ev, user],
  );

  const setRunStatus = useCallback(
    async (run: RunRecord, status: RunStatus) => {
      if ((status === "APPROVED" || status === "PUBLISHED") && role !== "ADMIN") throw new Error("Somente ADMIN pode aprovar ou publicar.");
      if (role === "VIEWER") throw new Error("VIEWER possui acesso somente leitura.");
      if (status === "PUBLISHED" && run.status !== "APPROVED") throw new Error("Somente execuções APROVADAS podem ser publicadas.");
      if (status === "APPROVED" && !["SIMULATED", "VALIDATED"].includes(run.status)) throw new Error("Aprove uma execução simulada ou validada.");
      const now = new Date().toISOString();
      await repo.updateRunStatus(run.id, {
        status,
        ...(status === "APPROVED" ? { approvedAt: now } : {}),
        ...(status === "PUBLISHED" ? { publishedAt: now } : {}),
      });
      setRuns((rs) =>
        rs.map((r) =>
          r.id === run.id
            ? { ...r, status, ...(status === "APPROVED" ? { approvedAt: now } : {}), ...(status === "PUBLISHED" ? { publishedAt: now } : {}) }
            : status === "PUBLISHED" && r.status === "PUBLISHED"
              ? { ...r, status: "SUPERSEDED" }
              : r,
        ),
      );
      if (status === "PUBLISHED" || status === "APPROVED" || status === "VALIDATED") {
        const evStatus = status === "PUBLISHED" ? "PUBLISHED" : ev.status === "PUBLISHED" ? ev.status : status;
        const saved = await repo.saveEvent({ ...ev, status: evStatus, publishedRunId: status === "PUBLISHED" ? run.id : ev.publishedRunId });
        setEv(saved);
      }
      await repo.addAudit({ eventId: ev.id, user, role, action: `status → ${status}`, details: `v${run.version} ${run.label}` });
    },
    [repo, role, user, ev],
  );

  const value: EventCtx = {
    ev,
    runs,
    P,
    selectedRun,
    selectRun: setSelectedId,
    liveMetrics,
    canEdit: role !== "VIEWER",
    isAdmin: role === "ADMIN",
    update,
    saveResult,
    saveSchedule,
    setRunStatus,
    audit,
    reload,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEvent() {
  const c = useContext(Ctx);
  if (!c) throw new Error("EventProvider ausente");
  return c;
}
