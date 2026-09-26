import { CheckCircle2, Play, Send, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Button, Card, Empty, Field, Input, Progress, Select } from "@/components/ui";
import { computeMetrics, LEX_LABELS, validateSolution, type Metrics, type OptimizerMode } from "@/engine";
import type { RunRecord } from "@/data/types";
import { useEvent } from "@/features/EventContext";
import { IssueList } from "@/features/shared";
import { fmtDate, pct } from "@/lib/utils";
import { runOptimizer } from "@/lib/runOptimizer";

type Plan = OptimizerMode | "BOTH";

const ROWS: { label: string; get: (m: Metrics, r: RunRecord) => number; fmt?: (x: number) => string; better?: "min" | "max" }[] = [
  { label: "Violações obrigatórias", get: (m) => m.hardViolations + m.mustMeetUnmetViable, better: "min" },
  { label: "Reencontros", get: (m) => m.repeats, better: "min" },
  { label: "Contatos únicos", get: (m) => m.uniqueContacts, better: "max" },
  { label: "Preferências atendidas", get: (m) => m.preferencesMet, better: "max" },
  { label: "HIGH_PRIORITY atendidas", get: (m) => m.highPriorityMet, better: "max" },
  { label: "MUST_MEET atendidos", get: (m) => m.mustMeetMet, better: "max" },
  { label: "Interesses mútuos atendidos", get: (m) => m.mutualPairsMet, better: "max" },
  { label: "Satisfação média", get: (m) => m.satisfaction.avg, fmt: pct, better: "max" },
  { label: "Satisfação mínima", get: (m) => m.satisfaction.min, fmt: pct, better: "max" },
  { label: "Satisfação P10", get: (m) => m.satisfaction.p10, fmt: pct, better: "max" },
  { label: "Mediana", get: (m) => m.satisfaction.median, fmt: pct, better: "max" },
  { label: "Participantes < 50%", get: (m) => m.satisfaction.below50, better: "min" },
  { label: "Sem nenhuma preferência atendida", get: (m) => m.satisfaction.zero, better: "min" },
  { label: "Muito demandados juntos s/ interesse", get: (m) => m.highDemandClusters, better: "min" },
  { label: "Mesma empresa na mesa", get: (m) => m.sameCompanyPairs, better: "min" },
  { label: "Diversidade (segmentos/mesa)", get: (m) => m.diversity, fmt: (x) => x.toFixed(2), better: "max" },
  { label: "Repetição de mesa física", get: (m) => m.tableRevisits, better: "min" },
  { label: "Tempo de cálculo (ms)", get: (_m, r) => r.timeMs },
];

export function OptimizeTab({ onOpenParticipant, goTo }: { onOpenParticipant: (id: string) => void; goTo: (t: string) => void }) {
  const { ev, P, runs, selectedRun, selectRun, saveResult, setRunStatus, canEdit, isAdmin } = useEvent();
  const [plan, setPlan] = useState<Plan>("BOTH");
  const [seeds, setSeeds] = useState(8);
  const [iterations, setIterations] = useState(150000);
  const [baseSeed, setBaseSeed] = useState(1);
  const [repair, setRepair] = useState(true);
  const [progress, setProgress] = useState<{ p: number; label: string } | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const errors = P.issues.filter((i) => i.severity === "ERROR");

  const run = async () => {
    setMsg(null);
    const modes: OptimizerMode[] = plan === "BOTH" ? ["BASELINE", "MNBD_V2"] : [plan];
    const input = { ...ev.input, frozenUntil: ev.frozenUntil };
    try {
      for (let k = 0; k < modes.length; k++) {
        const mode = modes[k];
        setProgress({ p: 0, label: mode });
        const r = await runOptimizer(input, { mode, baseSeed, seeds, iterations, fairnessRepair: repair }, (p, label) =>
          setProgress({ p: (k + p) / modes.length, label: `${mode === "BASELINE" ? "Baseline" : "MNBD V2"} · ${label}` }),
        );
        await saveResult(r, { label: mode === "BASELINE" ? "Baseline" : "MNBD Optimizer V2" });
      }
      setMsg({ tone: "ok", text: "Simulação concluída. Nenhuma programação é publicada automaticamente: valide, aprove e publique." });
    } catch (e) {
      setMsg({ tone: "err", text: (e as Error).message });
    } finally {
      setProgress(null);
    }
  };

  const status = async (r: RunRecord, s: RunRecord["status"]) => {
    setMsg(null);
    try {
      if (s === "VALIDATED") {
        const v = validateSolution(P, r.schedule);
        if (!v.ok) throw new Error(`Validação falhou: ${v.details.slice(0, 3).join(" · ")}`);
      }
      await setRunStatus(r, s);
    } catch (e) {
      setMsg({ tone: "err", text: (e as Error).message });
    }
  };

  // Comparação: por padrão, a última Baseline × a última MNBD V2.
  const [cmpA, setCmpA] = useState<string>("");
  const [cmpB, setCmpB] = useState<string>("");
  const a = runs.find((r) => r.id === cmpA) ?? runs.find((r) => r.mode === "BASELINE") ?? null;
  const b = runs.find((r) => r.id === cmpB) ?? runs.find((r) => r.mode === "MNBD_V2" && r.id !== a?.id) ?? null;
  const ma = useMemo(() => (a ? computeMetrics(P, a.schedule) : null), [a, P]);
  const mb = useMemo(() => (b ? computeMetrics(P, b.schedule) : null), [b, P]);

  return (
    <div className="space-y-4">
      <Card title="OTIMIZAR EVENTO">
        <div className="grid gap-3 md:grid-cols-6">
          <Field label="Modo">
            <Select className="w-full" value={plan} onChange={(e) => setPlan(e.target.value as Plan)}>
              <option value="BOTH">Baseline × MNBD V2 (comparar)</option>
              <option value="MNBD_V2">MNBD Optimizer V2</option>
              <option value="BASELINE">Baseline</option>
            </Select>
          </Field>
          <Field label="Seeds (multi-start)" hint="candidatas comparadas lexicograficamente">
            <Input type="number" min={1} max={40} value={seeds} onChange={(e) => setSeeds(Math.max(1, Math.min(40, Number(e.target.value) || 1)))} />
          </Field>
          <Field label="Iterações por seed" hint="mais = melhor e mais lento">
            <Input type="number" min={1000} step={10000} value={iterations} onChange={(e) => setIterations(Math.max(1000, Number(e.target.value) || 1000))} />
          </Field>
          <Field label="Seed inicial" hint="mesmo input + mesma seed = mesmo resultado">
            <Input type="number" min={1} value={baseSeed} onChange={(e) => setBaseSeed(Math.max(1, Number(e.target.value) || 1))} />
          </Field>
          <Field label="Fairness repair">
            <label className="flex h-9 items-center gap-2 text-sm">
              <input type="checkbox" checked={repair} onChange={(e) => setRepair(e.target.checked)} /> ativo (MNBD V2)
            </label>
          </Field>
          <div className="flex items-end">
            <Button className="w-full" disabled={!canEdit || !!progress || P.n === 0} onClick={run}>
              <Play size={15} /> Executar simulação
            </Button>
          </div>
        </div>
        {ev.frozenUntil > 0 && (
          <p className="mt-2 text-xs text-slate-600">
            Sessões 1–{ev.frozenUntil} estão congeladas: o motor otimiza apenas as sessões {ev.frozenUntil + 1}–{ev.input.config.sessionCount}.
          </p>
        )}
        {(ev.input.locks?.length ?? 0) > 0 && <p className="mt-1 text-xs text-slate-600">{ev.input.locks!.length} alocação(ões) bloqueada(s) manualmente serão preservadas.</p>}
        {errors.length > 0 && (
          <div className="mt-3 rounded border border-red-200 bg-red-50 p-3">
            <div className="mb-1 text-sm font-medium text-red-700">Há erros de viabilidade — o motor executa, mas o resultado não será publicável até corrigir:</div>
            <IssueList issues={errors} max={8} />
          </div>
        )}
        {progress && (
          <div className="mt-3 space-y-1">
            <div className="text-xs text-slate-600">{progress.label}</div>
            <Progress value={progress.p} />
          </div>
        )}
        {msg && <div className={`mt-3 rounded p-2 text-sm ${msg.tone === "ok" ? "bg-coop-50 text-coop-800" : "bg-red-50 text-red-700"}`}>{msg.text}</div>}
      </Card>

      <Card title="Comparação (sem afirmar automaticamente qual é melhor — veja os dados)">
        {runs.length < 1 ? (
          <Empty>Execute uma simulação para comparar.</Empty>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-3 text-sm">
              <RunPicker runs={runs} value={a?.id ?? ""} onChange={setCmpA} label="A" />
              <RunPicker runs={runs} value={b?.id ?? ""} onChange={setCmpB} label="B" />
            </div>
            {a && ma && (
              <table className="tbl max-w-3xl">
                <thead>
                  <tr>
                    <th>Métrica</th>
                    <th className="text-right">A · v{a.version} {a.label}</th>
                    <th className="text-right">B · {b ? `v${b.version} ${b.label}` : "—"}</th>
                    <th className="text-right">B − A</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => {
                    const va = row.get(ma, a);
                    const vb = b && mb ? row.get(mb, b) : null;
                    const f = row.fmt ?? ((x: number) => x.toLocaleString("pt-BR"));
                    const d = vb === null ? null : vb - va;
                    const good = d !== null && d !== 0 && row.better ? (row.better === "max" ? d > 0 : d < 0) : null;
                    return (
                      <tr key={row.label}>
                        <td>{row.label}</td>
                        <td className="text-right tabular-nums">{f(va)}</td>
                        <td className="text-right tabular-nums">{vb === null ? "—" : f(vb)}</td>
                        <td className={`text-right tabular-nums ${good === null ? "text-slate-400" : good ? "text-coop-700" : "text-red-600"}`}>
                          {d === null ? "—" : d === 0 ? "=" : `${d > 0 ? "+" : ""}${row.fmt ? row.fmt(d) : d.toLocaleString("pt-BR", { maximumFractionDigits: 3 })}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <p className="mt-2 text-xs text-slate-500">
              Verde/vermelho indica apenas o sentido desejado de cada métrica isolada. As métricas são recalculadas com o cadastro atual. A seleção interna entre candidatos usa a ordem
              lexicográfica P0–P10.
            </p>
          </>
        )}
      </Card>

      <Card title={`Versões (${runs.length}) — nunca apagadas`}>
        {runs.length === 0 ? (
          <Empty>Nenhuma execução.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Versão</th>
                  <th>Modo</th>
                  <th>Status</th>
                  <th className="text-right">Seed</th>
                  <th className="text-right">Tempo</th>
                  <th className="text-right">Violações</th>
                  <th className="text-right">Reencontros</th>
                  <th className="text-right">Contatos</th>
                  <th className="text-right">Preferências</th>
                  <th className="text-right">Média</th>
                  <th className="text-right">Mín</th>
                  <th className="text-right">P10</th>
                  <th>Criada</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => {
                  const m = r.metrics;
                  return (
                    <tr key={r.id} className={selectedRun?.id === r.id ? "bg-coop-50" : ""}>
                      <td>
                        <button className="font-medium text-coop-700 hover:underline" onClick={() => selectRun(r.id)}>
                          v{r.version} {r.label}
                        </button>
                        {r.parentRunId && <div className="text-[11px] text-slate-400">derivada de v{runs.find((x) => x.id === r.parentRunId)?.version ?? "?"}</div>}
                      </td>
                      <td>
                        <Badge tone={r.mode === "MNBD_V2" ? "green" : r.mode === "BASELINE" ? "slate" : "violet"}>{r.mode}</Badge>
                      </td>
                      <td>
                        <Badge tone={r.status === "PUBLISHED" ? "green" : r.status === "APPROVED" ? "blue" : r.status === "SUPERSEDED" ? "slate" : "amber"}>{r.status}</Badge>
                      </td>
                      <td className="text-right tabular-nums">{r.seed ?? "—"}</td>
                      <td className="text-right tabular-nums">{r.timeMs ? `${(r.timeMs / 1000).toFixed(1)}s` : "—"}</td>
                      <td className={`text-right tabular-nums ${m.hardViolations + m.mustMeetUnmetViable ? "text-red-600" : ""}`}>{m.hardViolations + m.mustMeetUnmetViable}</td>
                      <td className="text-right tabular-nums">{m.repeats}</td>
                      <td className="text-right tabular-nums">{m.uniqueContacts}</td>
                      <td className="text-right tabular-nums">
                        {m.preferencesMet}/{m.preferencesRegistered}
                      </td>
                      <td className="text-right tabular-nums">{pct(m.satisfaction.avg)}</td>
                      <td className="text-right tabular-nums">{pct(m.satisfaction.min)}</td>
                      <td className="text-right tabular-nums">{pct(m.satisfaction.p10)}</td>
                      <td className="text-xs text-slate-500">{fmtDate(r.createdAt)}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {(r.status === "SIMULATED" || r.status === "DRAFT") && (
                            <Button size="sm" variant="outline" disabled={!canEdit} onClick={() => status(r, "VALIDATED")} title="Valida restrições obrigatórias">
                              <ShieldCheck size={13} /> Validar
                            </Button>
                          )}
                          {(r.status === "SIMULATED" || r.status === "VALIDATED") && (
                            <Button size="sm" variant="outline" disabled={!isAdmin} onClick={() => status(r, "APPROVED")} title={isAdmin ? "" : "Somente ADMIN"}>
                              <CheckCircle2 size={13} /> Aprovar
                            </Button>
                          )}
                          {r.status === "APPROVED" && (
                            <Button size="sm" disabled={!isAdmin} onClick={() => status(r, "PUBLISHED")} title={isAdmin ? "" : "Somente ADMIN"}>
                              <Send size={13} /> Publicar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              selectRun(r.id);
                              goTo("mesas");
                            }}
                          >
                            Ver mesas
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedRun && selectedRun.candidates.length > 0 && (
        <Card title={`Candidatas da v${selectedRun.version} (seed escolhida: ${selectedRun.seed})`}>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Seed</th>
                  <th className="text-right">Tempo</th>
                  <th className="text-right">Violações</th>
                  <th className="text-right">Reencontros</th>
                  <th className="text-right">MUST_MEET pend.</th>
                  <th className="text-right">HIGH atend.</th>
                  <th className="text-right">Sat. mín</th>
                  <th className="text-right">P10</th>
                  <th className="text-right">Preferências</th>
                  <th className="text-right">Contatos</th>
                  <th>Vetor lexicográfico</th>
                </tr>
              </thead>
              <tbody>
                {selectedRun.candidates.map((c) => (
                  <tr key={c.seed} className={c.seed === selectedRun.seed ? "bg-coop-50 font-medium" : ""}>
                    <td>{c.seed}</td>
                    <td className="text-right tabular-nums">{c.timeMs} ms</td>
                    <td className="text-right tabular-nums">{c.summary.hardViolations}</td>
                    <td className="text-right tabular-nums">{c.summary.repeats}</td>
                    <td className="text-right tabular-nums">{c.summary.mustMeetUnmet}</td>
                    <td className="text-right tabular-nums">{c.summary.highPriorityMet}</td>
                    <td className="text-right tabular-nums">{pct(c.summary.minSatisfaction)}</td>
                    <td className="text-right tabular-nums">{pct(c.summary.p10)}</td>
                    <td className="text-right tabular-nums">{c.summary.preferencesMet}</td>
                    <td className="text-right tabular-nums">{c.summary.uniqueContacts}</td>
                    <td className="font-mono text-[11px] text-slate-500">[{c.lex.map((x) => +x.toFixed(3)).join(", ")}]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="mt-2 text-xs text-slate-600">
            <summary className="cursor-pointer">Ordem lexicográfica usada na seleção</summary>
            <ol className="mt-1 list-inside list-decimal">
              {(selectedRun.mode === "BASELINE"
                ? ["violações obrigatórias (min)", "reencontros (min)", "contatos únicos (max)", "desequilíbrio de ocupação (min)", "repetição de mesa (min)"]
                : LEX_LABELS
              ).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ol>
            <p className="mt-1">MUST_MEET viável conta como violação obrigatória (P0) quando a prioridade está em “obrigatório” (Configuração).</p>
          </details>
          <OverdemandSummary run={selectedRun} onOpenParticipant={onOpenParticipant} />
        </Card>
      )}
    </div>
  );
}

function RunPicker({ runs, value, onChange, label }: { runs: RunRecord[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="flex items-center gap-2">
      <span className="font-medium">{label}:</span>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {runs.map((r) => (
          <option key={r.id} value={r.id}>
            v{r.version} · {r.label} · {r.mode}
          </option>
        ))}
      </Select>
    </label>
  );
}

function OverdemandSummary({ run, onOpenParticipant }: { run: RunRecord; onOpenParticipant: (id: string) => void }) {
  const { P } = useEvent();
  const over = P.demand.filter((d) => d.demandClass === "SOBREDEMANDA" || d.demandClass === "CRITICA");
  if (!over.length) return null;
  const per = new Map(computeMetrics(P, run.schedule).perParticipant.map((p) => [p.participantId, p]));
  return (
    <div className="mt-4">
      <div className="mb-1 text-sm font-semibold text-slate-700">Participantes sob pressão de demanda nesta versão</div>
      <ul className="space-y-1 text-sm">
        {over.map((d) => (
          <li key={d.participantId}>
            <button className="text-coop-700 hover:underline" onClick={() => onOpenParticipant(d.participantId)}>
              {P.participants[P.idx.get(d.participantId)!].name}
            </button>{" "}
            — {d.inbound} solicitações, capacidade {d.contactCapacity}, atendidas {per.get(d.participantId)?.inboundMet ?? 0} (ver seleção no detalhe do participante)
          </li>
        ))}
      </ul>
    </div>
  );
}
