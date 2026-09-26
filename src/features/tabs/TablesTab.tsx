import { ChevronLeft, ChevronRight, Lock, Snowflake, Star, Unlock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Empty, Input } from "@/components/ui";
import { computeMetrics, type Lock as LockT, type Problem, type Schedule } from "@/engine";
import { useEvent } from "@/features/EventContext";
import { cn, pct } from "@/lib/utils";

type DragData = { s: number; pid: string };

export function TablesTab({ onOpenParticipant }: { onOpenParticipant: (id: string) => void }) {
  const { ev, P, selectedRun, saveSchedule, update, canEdit } = useEvent();
  const [draft, setDraft] = useState<Schedule | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const S = ev.input.config.sessionCount;
  const T = ev.input.tables.length;

  useEffect(() => {
    setDraft(selectedRun ? normalize(selectedRun.schedule, S, T) : null);
  }, [selectedRun, S, T]);

  const metrics = useMemo(() => (draft ? computeMetrics(P, draft) : null), [draft, P]);
  const base = useMemo(() => (selectedRun ? computeMetrics(P, selectedRun.schedule) : null), [selectedRun, P]);
  const dirty = useMemo(() => !!draft && !!selectedRun && JSON.stringify(draft) !== JSON.stringify(normalize(selectedRun.schedule, S, T)), [draft, selectedRun, S, T]);

  // Informações por participante/sessão: preferências cumpridas pela 1ª vez, reencontros, conflitos.
  const cellInfo = useMemo(() => {
    const fulfilled = new Map<string, number>(); // `${s}|${pid}` → nº de preferências próprias cumpridas nesta sessão
    const repeat = new Set<string>();
    const conflict = new Set<string>();
    if (!draft) return { fulfilled, repeat, conflict };
    const n = P.n;
    const seen = new Set<number>();
    for (let s = 0; s < S; s++)
      draft[s].forEach((mem) => {
        const ps = mem.map((id) => P.idx.get(id)).filter((x): x is number => x !== undefined && !P.staff[x]);
        for (let x = 0; x < ps.length; x++)
          for (let y = x + 1; y < ps.length; y++) {
            const i = ps[x];
            const j = ps[y];
            const k = Math.min(i, j) * n + Math.max(i, j);
            const flags = P.pairFlags[i * n + j];
            if (flags & 1) {
              conflict.add(`${s}|${P.ids[i]}`);
              conflict.add(`${s}|${P.ids[j]}`);
            }
            if (seen.has(k)) {
              if (!(flags & 8)) {
                repeat.add(`${s}|${P.ids[i]}`);
                repeat.add(`${s}|${P.ids[j]}`);
              }
              continue;
            }
            seen.add(k);
            if (P.wants[i * n + j] > 0) fulfilled.set(`${s}|${P.ids[i]}`, (fulfilled.get(`${s}|${P.ids[i]}`) ?? 0) + 1);
            if (P.wants[j * n + i] > 0) fulfilled.set(`${s}|${P.ids[j]}`, (fulfilled.get(`${s}|${P.ids[j]}`) ?? 0) + 1);
          }
      });
    return { fulfilled, repeat, conflict };
  }, [draft, P, S]);

  if (!selectedRun || !draft || !metrics)
    return <Empty>Selecione ou gere uma execução em “Simulação & versões” para ver as mesas.</Empty>;

  const locks = ev.input.locks ?? [];
  const isLocked = (s: number, pid: string) => locks.some((l) => l.session === s && l.participantId === pid);
  const frozen = (s: number) => s < ev.frozenUntil;
  const tableOf = (s: number, pid: string) => draft[s].findIndex((m) => m.includes(pid));
  const unseated = (s: number) => P.ids.filter((id, p) => P.avail[s][p] && tableOf(s, id) < 0);
  const q = search.trim().toLowerCase();
  const matches = (pid: string) => {
    if (!q) return false;
    const p = P.participants[P.idx.get(pid) ?? -1];
    return !!p && (p.name.toLowerCase().includes(q) || p.company.toLowerCase().includes(q));
  };

  const move = (d: DragData, toTable: number, swapWith?: string) => {
    if (!canEdit) return setMsg("VIEWER não pode alterar mesas.");
    if (frozen(d.s)) return setMsg("Sessão congelada: já ocorreu.");
    if (isLocked(d.s, d.pid)) return setMsg("Participante bloqueado nesta mesa. Desbloqueie antes de mover.");
    if (swapWith && isLocked(d.s, swapWith)) return setMsg("O participante de destino está bloqueado.");
    setMsg(null);
    setDraft((cur) => {
      if (!cur) return cur;
      const next = cur.map((sess) => sess.map((m) => [...m]));
      const from = next[d.s].findIndex((m) => m.includes(d.pid));
      if (from === toTable && !swapWith) return cur;
      if (from >= 0) next[d.s][from] = next[d.s][from].filter((x) => x !== d.pid);
      if (swapWith) {
        next[d.s][toTable] = next[d.s][toTable].filter((x) => x !== swapWith);
        if (from >= 0) next[d.s][from].push(swapWith);
      }
      next[d.s][toTable].push(d.pid);
      return next;
    });
  };

  const toggleLock = async (s: number, pid: string) => {
    if (!canEdit || frozen(s)) return;
    const t = tableOf(s, pid);
    if (t < 0) return;
    const has = isLocked(s, pid);
    const name = P.participants[P.idx.get(pid)!].name;
    await update(
      (e) => ({
        ...e,
        input: {
          ...e.input,
          locks: has
            ? (e.input.locks ?? []).filter((l) => !(l.session === s && l.participantId === pid))
            : [...(e.input.locks ?? []), { participantId: pid, session: s, tableId: e.input.tables[t].id } as LockT],
        },
      }),
      has ? "desbloqueio manual" : "bloqueio manual (manual_lock)",
      `${name} · sessão ${s + 1} · ${ev.input.tables[t].name}`,
    );
  };

  const lockSession = async (s: number) => {
    const all: LockT[] = [];
    draft[s].forEach((mem, t) => mem.forEach((pid) => all.push({ participantId: pid, session: s, tableId: ev.input.tables[t].id })));
    await update(
      (e) => ({ ...e, input: { ...e.input, locks: [...(e.input.locks ?? []).filter((l) => l.session !== s), ...all] } }),
      "bloqueio de sessão inteira",
      `sessão ${s + 1}`,
    );
  };
  const unlockSession = async (s: number) => {
    await update((e) => ({ ...e, input: { ...e.input, locks: (e.input.locks ?? []).filter((l) => l.session !== s) } }), "desbloqueio de sessão", `sessão ${s + 1}`);
  };

  const swapSessions = (a: number, b: number) => {
    if (!canEdit || frozen(a) || frozen(b) || b < 0 || b >= S) return;
    if (locks.some((l) => l.session === a || l.session === b)) return setMsg("Remova os bloqueios das sessões antes de reordená-las.");
    setDraft((cur) => {
      if (!cur) return cur;
      const next = [...cur];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
    setMsg(`Conteúdo das sessões ${a + 1} e ${b + 1} trocado. A disponibilidade de cada participante é revalidada abaixo.`);
  };

  const save = async () => {
    const rec = await saveSchedule(draft, { label: "Edição manual", mode: "MANUAL", parentRunId: selectedRun.id });
    setMsg(`Salvo como nova versão v${rec.version} (DRAFT). A versão original foi preservada.`);
  };

  const hard = metrics.hardViolations + (ev.input.config.mustMeetPriority === "HARD" ? metrics.mustMeetUnmetViable : 0);
  const delta = (a: number, b: number, fmt = (x: number) => String(x)) => (a === b ? "" : ` (${a > b ? "+" : ""}${fmt(a - b)})`);

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Input className="max-w-xs" placeholder="Destacar participante ou empresa…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge tone={hard ? "red" : "green"}>Violações obrigatórias: {hard}</Badge>
            <Badge tone={metrics.repeats ? "amber" : "green"}>
              Reencontros: {metrics.repeats}
              {base && delta(metrics.repeats, base.repeats)}
            </Badge>
            <Badge tone="blue">
              Preferências: {metrics.preferencesMet}/{metrics.preferencesRegistered}
              {base && delta(metrics.preferencesMet, base.preferencesMet)}
            </Badge>
            <Badge tone="slate">
              Sat. mín {pct(metrics.satisfaction.min)} · P10 {pct(metrics.satisfaction.p10)} · média {pct(metrics.satisfaction.avg)}
            </Badge>
            <Badge tone="slate">Contatos únicos: {metrics.uniqueContacts}</Badge>
          </div>
          <div className="ml-auto flex gap-2">
            {dirty && (
              <Button variant="outline" onClick={() => setDraft(normalize(selectedRun.schedule, S, T))}>
                Descartar alterações
              </Button>
            )}
            <Button disabled={!dirty || !canEdit} onClick={save}>
              Salvar como nova versão
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Arraste um participante para outra mesa da mesma sessão (mover) ou sobre outro participante (trocar). Clique no cadeado para BLOQUEAR a decisão — novas otimizações preservam
          alocações bloqueadas. ★ = preferências próprias atendidas pela primeira vez nesta sessão.
        </p>
        {msg && <div className="mt-2 rounded bg-slate-100 p-2 text-sm text-slate-700">{msg}</div>}
        {hard > 0 && (
          <ul className="mt-2 list-disc pl-5 text-xs text-red-700">
            {metrics.hardViolationDetails.slice(0, 8).map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        )}
      </Card>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-20 border-b border-r bg-slate-50 p-2 text-left">Mesa</th>
              {Array.from({ length: S }, (_, s) => (
                <th key={s} className="min-w-[190px] border-b border-r bg-slate-50 p-1.5 text-left">
                  <div className="flex items-center gap-1">
                    {!frozen(s) && canEdit && (
                      <button className="rounded p-0.5 hover:bg-slate-200 disabled:opacity-30" disabled={s === 0 || frozen(s - 1)} onClick={() => swapSessions(s, s - 1)} title="Trocar com a sessão anterior">
                        <ChevronLeft size={14} />
                      </button>
                    )}
                    <span className="font-semibold">{ev.sessionNames[s] ?? `Sessão ${s + 1}`}</span>
                    {frozen(s) && (
                      <Badge tone="slate">
                        <Snowflake size={11} className="mr-0.5" /> realizada
                      </Badge>
                    )}
                    {!frozen(s) && canEdit && (
                      <button className="rounded p-0.5 hover:bg-slate-200 disabled:opacity-30" disabled={s === S - 1} onClick={() => swapSessions(s, s + 1)} title="Trocar com a próxima sessão">
                        <ChevronRight size={14} />
                      </button>
                    )}
                    {!frozen(s) && canEdit && (
                      <span className="ml-auto flex gap-0.5">
                        <button className="rounded p-0.5 text-slate-400 hover:bg-slate-200" title="Bloquear toda a sessão" onClick={() => lockSession(s)}>
                          <Lock size={12} />
                        </button>
                        <button className="rounded p-0.5 text-slate-400 hover:bg-slate-200" title="Desbloquear sessão" onClick={() => unlockSession(s)}>
                          <Unlock size={12} />
                        </button>
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ev.input.tables.map((table, t) => (
              <tr key={table.id}>
                <td className="sticky left-0 z-10 border-b border-r bg-slate-50 p-2 font-medium">{table.name}</td>
                {Array.from({ length: S }, (_, s) => {
                  const mem = draft[s][t] ?? [];
                  const cap = mem.filter((id) => P.countsCap[P.idx.get(id) ?? -1]).length;
                  const closed = !P.tableAvail[s][t];
                  const over = cap > P.maxCap[s];
                  const under = cap > 0 && cap < P.minCap[s];
                  return (
                    <td
                      key={s}
                      className={cn(
                        "border-b border-r p-1 align-top",
                        closed && "bg-slate-100",
                        over && "bg-red-50",
                        under && "bg-amber-50",
                        frozen(s) && "bg-slate-50",
                      )}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const d = JSON.parse(e.dataTransfer.getData("text/plain")) as DragData;
                        if (d.s !== s) return setMsg("Só é possível mover dentro da mesma sessão.");
                        if (closed) return setMsg("Mesa indisponível nesta sessão.");
                        move(d, t);
                      }}
                    >
                      <div className="mb-0.5 flex justify-between text-[10px] text-slate-400">
                        <span>{closed ? "fechada" : `${cap}/${P.maxCap[s]}`}</span>
                        {(over || under) && <span className={over ? "text-red-600" : "text-amber-600"}>{over ? "acima do máx." : "abaixo do mín."}</span>}
                      </div>
                      <div className="space-y-0.5">
                        {mem.map((pid) => (
                          <Chip
                            P={P}
                            key={pid}
                            pid={pid}
                            s={s}
                            locked={isLocked(s, pid)}
                            frozen={frozen(s)}
                            hover={hover === pid}
                            match={matches(pid)}
                            fulfilled={cellInfo.fulfilled.get(`${s}|${pid}`) ?? 0}
                            repeat={cellInfo.repeat.has(`${s}|${pid}`)}
                            conflict={cellInfo.conflict.has(`${s}|${pid}`)}
                            onHover={setHover}
                            onOpen={onOpenParticipant}
                            onToggleLock={() => toggleLock(s, pid)}
                            onDropOn={(d) => (d.s === s ? move(d, t, pid) : setMsg("Só é possível trocar dentro da mesma sessão."))}
                            canEdit={canEdit}
                          />
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td className="sticky left-0 z-10 border-r bg-slate-50 p-2 font-medium text-red-700">Sem mesa</td>
              {Array.from({ length: S }, (_, s) => (
                <td key={s} className="border-r p-1 align-top">
                  {unseated(s).map((pid) => (
                    <Chip
                            P={P}
                      key={pid}
                      pid={pid}
                      s={s}
                      locked={false}
                      frozen={frozen(s)}
                      hover={hover === pid}
                      match={matches(pid)}
                      fulfilled={0}
                      repeat={false}
                      conflict
                      onHover={setHover}
                      onOpen={onOpenParticipant}
                      onToggleLock={() => undefined}
                      onDropOn={() => undefined}
                      canEdit={canEdit}
                    />
                  ))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Chip(props: {
  P: Problem;
  pid: string;
  s: number;
  locked: boolean;
  frozen: boolean;
  hover: boolean;
  match: boolean;
  fulfilled: number;
  repeat: boolean;
  conflict: boolean;
  canEdit: boolean;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
  onToggleLock: () => void;
  onDropOn: (d: DragData) => void;
}) {
  const P = props.P;
  const p = P.participants[P.idx.get(props.pid) ?? -1];
  if (!p) return <div className="rounded bg-red-100 px-1 text-red-700">{props.pid} (inativo)</div>;
  const d = P.demand[P.idx.get(props.pid)!];
  const unavailable = !P.avail[props.s][P.idx.get(props.pid)!];
  const draggable = props.canEdit && !props.frozen && !props.locked;
  return (
    <div
      draggable={draggable}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", JSON.stringify({ s: props.s, pid: props.pid }))}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        props.onDropOn(JSON.parse(e.dataTransfer.getData("text/plain")));
      }}
      onMouseEnter={() => props.onHover(props.pid)}
      onMouseLeave={() => props.onHover(null)}
      className={cn(
        "group flex items-center gap-1 rounded border px-1 py-0.5",
        draggable && "cursor-grab",
        props.hover ? "border-coop-500 bg-coop-100" : "border-slate-200 bg-white",
        props.match && "ring-2 ring-amber-400",
        props.repeat && "border-amber-400 bg-amber-50",
        (props.conflict || unavailable) && "border-red-400 bg-red-50",
        p.kind !== "PARTICIPANT" && "border-dashed",
      )}
      title={`${p.name} — ${p.company} · ${p.segment}\nSolicitações recebidas: ${d.inbound} · IPD ${Number.isFinite(d.ipd) ? (d.ipd * 100).toFixed(0) + "%" : "∞"}${
        props.repeat ? "\nREENCONTRO nesta mesa" : ""
      }${props.conflict ? "\nConflito (MUST_NOT_MEET ou sem mesa)" : ""}${unavailable ? "\nIndisponível nesta sessão" : ""}`}
    >
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          d.demandClass === "SOBREDEMANDA" ? "bg-red-500" : d.demandClass === "CRITICA" ? "bg-amber-500" : d.demandClass === "ALTA" ? "bg-sky-500" : "bg-slate-300",
        )}
      />
      <button className="min-w-0 flex-1 truncate text-left" onClick={() => props.onOpen(props.pid)}>
        <span className="font-medium">{p.name}</span>
        <span className="ml-1 text-[10px] text-slate-400">{p.company.slice(0, 18)}</span>
      </button>
      <span className="hidden shrink-0 text-[10px] text-slate-400 xl:inline">{p.segment.slice(0, 8)}</span>
      {props.fulfilled > 0 && (
        <span className="flex shrink-0 items-center text-[10px] text-coop-700" title={`${props.fulfilled} preferência(s) atendida(s) aqui`}>
          <Star size={10} className="fill-coop-500 text-coop-500" />
          {props.fulfilled}
        </span>
      )}
      {!props.frozen && props.canEdit && (
        <button onClick={props.onToggleLock} className={cn("shrink-0 rounded p-0.5", props.locked ? "text-coop-700" : "text-slate-300 opacity-0 group-hover:opacity-100")} title={props.locked ? "Desbloquear" : "Bloquear decisão"}>
          {props.locked ? <Lock size={11} /> : <Unlock size={11} />}
        </button>
      )}
      {props.frozen && props.locked && <Lock size={11} className="text-slate-400" />}
    </div>
  );
}

function normalize(s: Schedule, S: number, T: number): Schedule {
  return Array.from({ length: S }, (_, i) => Array.from({ length: T }, (_, t) => [...(s[i]?.[t] ?? [])]));
}
