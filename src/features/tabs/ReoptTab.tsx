import { Play, Snowflake, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Button, Card, Empty, Field, Input, Progress, Select } from "@/components/ui";
import { compileProblem, comparePlans, type EventInput, type OptimizationResult, type ReoptimizationComparison, type Schedule } from "@/engine";
import { useEvent } from "@/features/EventContext";
import { IssueList } from "@/features/shared";
import { pct } from "@/lib/utils";
import { runOptimizer } from "@/lib/runOptimizer";

type FromMap = Record<string, number>;

export function ReoptTab() {
  const { ev, runs, selectedRun, update, saveResult, canEdit } = useEvent();
  const S = ev.input.config.sessionCount;
  const defaultBase = runs.find((r) => r.status === "PUBLISHED") ?? selectedRun ?? runs[0] ?? null;
  const [baseId, setBaseId] = useState<string>(defaultBase?.id ?? "");
  const base = runs.find((r) => r.id === baseId) ?? defaultBase;
  const [k, setK] = useState(Math.max(ev.frozenUntil, Math.min(2, S - 1)));
  const [absentFrom, setAbsentFrom] = useState<FromMap>({});
  const [lateUntil, setLateUntil] = useState<FromMap>({});
  const [closedFrom, setClosedFrom] = useState<FromMap>({});
  const [cap, setCap] = useState<number | "">("");
  const [pick, setPick] = useState({ absent: "", late: "", table: "" });
  const [iterations, setIterations] = useState(120000);
  const [seeds, setSeeds] = useState(6);
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<{ r: OptimizationResult; cmp: ReoptimizationComparison; input: EventInput } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const people = [...ev.input.participants].filter((p) => p.active).sort((a, b) => a.name.localeCompare(b.name));
  const name = (id: string) => ev.input.participants.find((p) => p.id === id)?.name ?? id;
  const tname = (id: string) => ev.input.tables.find((t) => t.id === id)?.name ?? id;

  const staged = useMemo((): EventInput | null => {
    if (!base) return null;
    const availability: Record<string, boolean[]> = {};
    for (const [id, arr] of Object.entries(ev.input.availability ?? {})) availability[id] = [...arr];
    const ensure = (id: string) => (availability[id] ??= Array.from({ length: S }, () => true));
    for (const [id, from] of Object.entries(absentFrom)) for (let s = from; s < S; s++) ensure(id)[s] = false;
    for (const [id, until] of Object.entries(lateUntil)) for (let s = 0; s < until; s++) ensure(id)[s] = false;
    const tableAvailability: Record<string, boolean[]> = {};
    for (const [id, arr] of Object.entries(ev.input.tableAvailability ?? {})) tableAvailability[id] = [...arr];
    for (const [id, from] of Object.entries(closedFrom)) {
      tableAvailability[id] ??= Array.from({ length: S }, () => true);
      for (let s = from; s < S; s++) tableAvailability[id][s] = false;
    }
    const sessionOverrides = { ...(ev.input.config.sessionOverrides ?? {}) };
    if (cap !== "") for (let s = k; s < S; s++) sessionOverrides[s] = { ...(sessionOverrides[s] ?? {}), maxCapacity: cap };
    // Encontros REALMENTE ocorridos: sessões já congeladas + programação-base menos quem não compareceu.
    const realized: Schedule = [];
    for (let s = 0; s < k; s++) {
      if (s < ev.frozenUntil && ev.input.realizedSchedule?.[s]) {
        realized.push(ev.input.realizedSchedule[s].map((m) => [...m]));
        continue;
      }
      realized.push((base.schedule[s] ?? []).map((m) => m.filter((id) => availability[id]?.[s] !== false)));
    }
    return {
      ...ev.input,
      config: { ...ev.input.config, sessionOverrides },
      availability,
      tableAvailability,
      frozenUntil: k,
      realizedSchedule: realized,
    };
  }, [base, ev, absentFrom, lateUntil, closedFrom, cap, k, S]);

  const issues = useMemo(() => (staged ? compileProblem(staged).issues.filter((i) => i.severity !== "INFO") : []), [staged]);
  const capIssue = issues.find((i) => i.code === "CAPACITY_EXCEEDED");

  if (!base) return <Empty>Gere e selecione uma programação antes de simular imprevistos.</Empty>;

  const applyScenarioE = () => {
    const inc = ev.incident;
    if (!inc) return;
    setK(inc.afterSession);
    setAbsentFrom({ [inc.absentId]: inc.afterSession });
    setLateUntil({ [inc.lateId]: inc.afterSession });
    setClosedFrom({ [inc.closedTableId]: inc.afterSession });
    setCap(inc.capacityOverride);
    setResult(null);
  };

  const run = async () => {
    if (!staged) return;
    setMsg(null);
    setProgress(0);
    try {
      const r = await runOptimizer(staged, { mode: "MNBD_V2", baseSeed: 1, seeds, iterations, fairnessRepair: true }, (p) => setProgress(p));
      setResult({ r, cmp: comparePlans(staged, base.schedule, r.schedule), input: staged });
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setProgress(null);
    }
  };

  const accept = async () => {
    if (!result) return;
    const { r, cmp, input } = result;
    const attendance: Record<number, string[]> = {};
    input.realizedSchedule!.forEach((sess, s) => (attendance[s] = sess.flat()));
    const summary = [
      ...Object.entries(absentFrom).map(([id, s]) => `${name(id)} ausente a partir da sessão ${s + 1}`),
      ...Object.entries(lateUntil).map(([id, s]) => `${name(id)} chega na sessão ${s + 1}`),
      ...Object.entries(closedFrom).map(([id, s]) => `${tname(id)} fechada a partir da sessão ${s + 1}`),
      ...(cap !== "" ? [`capacidade máx. ${cap} nas sessões ${k + 1}–${S}`] : []),
    ].join("; ");
    await update(
      (e) => ({
        ...e,
        status: e.status === "PUBLISHED" ? "RUNNING" : e.status,
        frozenUntil: k,
        attendance,
        input: { ...input },
      }),
      "imprevistos registrados + sessões congeladas",
      `sessões 1–${k} congeladas. ${summary}`,
    );
    const { beforeMetrics: _drop, ...comparison } = cmp;
    void _drop;
    await saveResult(r, { label: `Reotimização sessões ${k + 1}–${S}`, mode: "REOPTIMIZATION", parentRunId: base.id, comparison });
    setResult(null);
    setAbsentFrom({});
    setLateUntil({});
    setClosedFrom({});
    setMsg("Reotimização aceita e salva como nova versão (SIMULATED). Valide, aprove e publique para substituir a programação vigente.");
  };

  const sessionOptions = (min = 0) =>
    Array.from({ length: S }, (_, s) => s)
      .filter((s) => s >= min)
      .map((s) => (
        <option key={s} value={s}>
          {ev.sessionNames[s] ?? `Sessão ${s + 1}`}
        </option>
      ));

  return (
    <div className="space-y-4">
      <Card
        title="Imprevistos durante o evento"
        actions={
          ev.incident && (
            <Button size="sm" variant="secondary" onClick={applyScenarioE}>
              <Wand2 size={13} /> Carregar imprevisto do cenário E
            </Button>
          )
        }
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3">
            <Field label="Programação-base (o que foi publicado/realizado)">
              <Select className="w-full" value={base.id} onChange={(e) => setBaseId(e.target.value)}>
                {runs.map((r) => (
                  <option key={r.id} value={r.id}>
                    v{r.version} · {r.label} · {r.status}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Sessões já concluídas (congelar)" hint="Sessões concluídas nunca são recalculadas.">
              <Select className="w-full" value={k} onChange={(e) => setK(Number(e.target.value))}>
                {Array.from({ length: S }, (_, s) => s)
                  .filter((s) => s >= ev.frozenUntil && s >= 1)
                  .map((s) => (
                    <option key={s} value={s}>
                      Sessões 1–{s} concluídas; reotimizar {s + 1}–{S}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Capacidade máxima nas sessões futuras (alterar capacidade)">
              <Input type="number" min={1} placeholder={`padrão ${ev.input.config.maxTableCapacity}`} value={cap} onChange={(e) => setCap(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))} />
            </Field>
            {capIssue && cap === "" && (
              <Button size="sm" variant="outline" onClick={() => setCap(ev.input.config.maxTableCapacity + 1)}>
                Ampliar capacidade para {ev.input.config.maxTableCapacity + 1}
              </Button>
            )}
          </div>
          <div className="space-y-3">
            <Field label="Registrar ausência (falta / saiu do evento)">
              <div className="flex gap-1">
                <Select className="min-w-0 flex-1" value={pick.absent} onChange={(e) => setPick({ ...pick, absent: e.target.value })}>
                  <option value="">participante…</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
                <Button size="sm" variant="outline" disabled={!pick.absent} onClick={() => setAbsentFrom({ ...absentFrom, [pick.absent]: k })}>
                  a partir da sessão {k + 1}
                </Button>
              </div>
            </Field>
            <Field label="Registrar chegada tardia">
              <div className="flex gap-1">
                <Select className="min-w-0 flex-1" value={pick.late} onChange={(e) => setPick({ ...pick, late: e.target.value })}>
                  <option value="">participante…</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
                <Button size="sm" variant="outline" disabled={!pick.late} onClick={() => setLateUntil({ ...lateUntil, [pick.late]: k })}>
                  chega na sessão {k + 1}
                </Button>
              </div>
            </Field>
            <Field label="Fechar mesa">
              <div className="flex gap-1">
                <Select className="min-w-0 flex-1" value={pick.table} onChange={(e) => setPick({ ...pick, table: e.target.value })}>
                  <option value="">mesa…</option>
                  {ev.input.tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
                <Button size="sm" variant="outline" disabled={!pick.table} onClick={() => setClosedFrom({ ...closedFrom, [pick.table]: k })}>
                  a partir da sessão {k + 1}
                </Button>
              </div>
            </Field>
          </div>
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">Alterações registradas</div>
            <ul className="space-y-1 text-sm">
              {Object.entries(absentFrom).map(([id, s]) => (
                <li key={`a${id}`} className="flex items-center justify-between gap-2">
                  <span>
                    <Badge tone="red">ausente</Badge> {name(id)} — sessão {s + 1} em diante
                  </span>
                  <Select className="py-0.5 text-xs" value={s} onChange={(e) => setAbsentFrom({ ...absentFrom, [id]: Number(e.target.value) })}>
                    {sessionOptions()}
                  </Select>
                  <button className="text-xs text-slate-400 hover:text-red-600" onClick={() => setAbsentFrom(omit(absentFrom, id))}>
                    remover
                  </button>
                </li>
              ))}
              {Object.entries(lateUntil).map(([id, s]) => (
                <li key={`l${id}`} className="flex items-center justify-between gap-2">
                  <span>
                    <Badge tone="amber">atrasado</Badge> {name(id)} — chega na sessão {s + 1}
                  </span>
                  <Select className="py-0.5 text-xs" value={s} onChange={(e) => setLateUntil({ ...lateUntil, [id]: Number(e.target.value) })}>
                    {sessionOptions(1)}
                  </Select>
                  <button className="text-xs text-slate-400 hover:text-red-600" onClick={() => setLateUntil(omit(lateUntil, id))}>
                    remover
                  </button>
                </li>
              ))}
              {Object.entries(closedFrom).map(([id, s]) => (
                <li key={`t${id}`} className="flex items-center justify-between gap-2">
                  <span>
                    <Badge>mesa fechada</Badge> {tname(id)} — sessão {s + 1} em diante
                  </span>
                  <button className="text-xs text-slate-400 hover:text-red-600" onClick={() => setClosedFrom(omit(closedFrom, id))}>
                    remover
                  </button>
                </li>
              ))}
              {!Object.keys(absentFrom).length && !Object.keys(lateUntil).length && !Object.keys(closedFrom).length && <li className="text-slate-400">Nenhuma.</li>}
            </ul>
            <p className="mt-2 text-xs text-slate-500">
              <Snowflake size={11} className="inline" /> As sessões 1–{k} serão congeladas com os encontros realmente ocorridos (programação-base menos ausentes/atrasados).
            </p>
          </div>
        </div>
        <div className="mt-4">
          <IssueList issues={issues} max={6} />
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Field label="Seeds">
            <Input type="number" className="w-20" min={1} max={30} value={seeds} onChange={(e) => setSeeds(Math.max(1, Number(e.target.value) || 1))} />
          </Field>
          <Field label="Iterações">
            <Input type="number" className="w-28" min={1000} step={10000} value={iterations} onChange={(e) => setIterations(Math.max(1000, Number(e.target.value) || 1000))} />
          </Field>
          <Button disabled={!canEdit || progress !== null} onClick={run}>
            <Play size={14} /> Reotimizar sessões {k + 1}–{S}
          </Button>
          {progress !== null && (
            <div className="w-64">
              <Progress value={progress} />
            </div>
          )}
        </div>
        {msg && <div className="mt-3 rounded bg-slate-100 p-2 text-sm">{msg}</div>}
      </Card>

      {result && (
        <Card
          title="Comparação ANTES × DEPOIS (o operador decide)"
          actions={
            <>
              <Button variant="outline" onClick={() => setResult(null)}>
                Descartar
              </Button>
              <Button onClick={accept} disabled={!canEdit}>
                Aceitar reotimização
              </Button>
            </>
          }
        >
          <table className="tbl max-w-2xl">
            <thead>
              <tr>
                <th>Métrica</th>
                <th className="text-right">ANTES (programação atual ajustada)</th>
                <th className="text-right">DEPOIS (reotimizada)</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Violações obrigatórias", "hardViolations", false],
                  ["Reencontros previstos", "repeats", false],
                  ["Preferências atendidas", "preferencesMet", false],
                  ["Satisfação mínima", "minSatisfaction", true],
                  ["Satisfação P10", "p10", true],
                  ["Satisfação média", "avgSatisfaction", true],
                  ["Contatos únicos", "uniqueContacts", false],
                  ["MUST_MEET pendentes", "mustMeetUnmet", false],
                ] as const
              ).map(([label, key, isPct]) => (
                <tr key={key}>
                  <td>{label}</td>
                  <td className="text-right tabular-nums">{isPct ? pct(result.cmp.before[key]) : result.cmp.before[key]}</td>
                  <td className="text-right tabular-nums">{isPct ? pct(result.cmp.after[key]) : result.cmp.after[key]}</td>
                </tr>
              ))}
              <tr>
                <td className="font-medium">Pessoas que trocarão de mesa</td>
                <td colSpan={2} className="text-right font-medium tabular-nums">
                  {result.cmp.movedParticipants} pessoas ({result.cmp.movedAssignments} alocações)
                </td>
              </tr>
              <tr>
                <td>Sessões concluídas preservadas</td>
                <td colSpan={2} className="text-right">
                  {result.cmp.frozenUnchanged ? <Badge tone="green">intactas</Badge> : <Badge tone="red">ALTERADAS</Badge>}
                </td>
              </tr>
            </tbody>
          </table>
          {result.cmp.before.hardViolations > 0 && (
            <div className="mt-3 text-xs text-slate-600">
              Problemas da programação atual diante da nova realidade:
              <ul className="list-disc pl-5 text-red-700">
                {result.cmp.beforeMetrics.hardViolationDetails.slice(0, 6).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function omit(m: FromMap, id: string): FromMap {
  const c = { ...m };
  delete c[id];
  return c;
}
