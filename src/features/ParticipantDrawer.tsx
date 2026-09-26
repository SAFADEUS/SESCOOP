import { Badge, Drawer, Stat } from "@/components/ui";
import { computeMetrics, explainHub } from "@/engine";
import { useMemo } from "react";
import { useEvent } from "./EventContext";
import { DemandBadge, ipdText, PrefBadge } from "./shared";
import { pct } from "@/lib/utils";

export function ParticipantDrawer({ participantId, onClose, onOpenParticipant }: { participantId: string | null; onClose: () => void; onOpenParticipant: (id: string) => void }) {
  const { ev, P, selectedRun } = useEvent();
  const i = participantId ? P.idx.get(participantId) : undefined;
  const metrics = useMemo(() => (selectedRun ? computeMetrics(P, selectedRun.schedule) : null), [selectedRun, P]);
  const hubRows = useMemo(() => (selectedRun && participantId ? explainHub(P, selectedRun.schedule, participantId) : []), [selectedRun, participantId, P]);
  if (!participantId || i === undefined) return <Drawer open={!!participantId} onClose={onClose} title="Participante">Participante inativo ou inexistente.</Drawer>;
  const p = P.participants[i];
  const d = P.demand[i];
  const r = metrics?.perParticipant[i];
  const name = (id: string) => P.participants[P.idx.get(id) ?? -1]?.name ?? id;
  const prefOf = (target: string) => ev.input.preferences.find((x) => x.sourceId === p.id && x.targetId === target);
  const contacts = new Set<string>();
  const repeats: { id: string; count: number }[] = [];
  if (selectedRun) {
    const cnt = new Map<string, number>();
    for (const sess of selectedRun.schedule)
      for (const t of sess)
        if (t.includes(p.id)) for (const q of t) if (q !== p.id) cnt.set(q, (cnt.get(q) ?? 0) + 1);
    for (const [q, c] of cnt) {
      contacts.add(q);
      if (c > 1) repeats.push({ id: q, count: c });
    }
  }
  const isHub = d.demandClass !== "NORMAL";
  return (
    <Drawer open onClose={onClose} title={`${p.name} — ${p.company}`} wide>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2 text-sm text-slate-600">
          <span>{p.role}</span>·<span>{p.segment}</span>·<span>{p.category}</span>
          {p.kind !== "PARTICIPANT" && <Badge tone="violet">{p.kind}</Badge>}
          {!p.countsTowardCapacity && <Badge tone="slate">fora da capacidade</Badge>}
          {(p.fixed || p.fixedTableId) && <Badge tone="blue">mesa fixa</Badge>}
          {p.institutionalPriority > 0 && <Badge tone="amber">prioridade institucional {p.institutionalPriority}</Badge>}
          <DemandBadge cls={d.demandClass} />
        </div>
        {p.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {p.tags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Stat label="Inbound demand" value={d.inbound} hint="quem quer encontrá-lo" />
          <Stat label="Outbound demand" value={d.outbound} hint="quem ele quer encontrar" />
          <Stat label="Capacidade de contatos" value={d.contactCapacity} hint={`${d.availableSessions} sessões disponíveis`} />
          <Stat label="IPD" value={ipdText(d.ipd)} tone={d.demandClass === "SOBREDEMANDA" ? "bad" : d.demandClass === "CRITICA" ? "warn" : "default"} hint={d.excess ? `excesso ${d.excess}` : undefined} />
          <Stat label="Satisfação" value={r ? pct(r.satisfaction) : "—"} hint={r ? `${r.fulfilled}/${r.possible} atendidas` : undefined} />
        </div>

        {selectedRun && r && (
          <div>
            <div className="mb-1 text-sm font-semibold">Agenda (v{selectedRun.version})</div>
            <div className="grid grid-cols-2 gap-1 text-sm sm:grid-cols-3">
              {r.tables.map((t, s) => (
                <div key={s} className="rounded border border-slate-200 px-2 py-1">
                  <span className="text-slate-500">{ev.sessionNames[s] ?? `Sessão ${s + 1}`} → </span>
                  <span className="font-medium">{t === null ? "ausente" : ev.input.tables[t]?.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {r && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-sm font-semibold text-coop-700">Preferências atendidas ({r.fulfilledTargets.length})</div>
              <ul className="space-y-0.5 text-sm">
                {r.fulfilledTargets.map((id) => (
                  <li key={id} className="flex items-center gap-2">
                    <button className="text-left hover:underline" onClick={() => onOpenParticipant(id)}>
                      {name(id)}
                    </button>
                    {prefOf(id) && <PrefBadge type={prefOf(id)!.type} />}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-1 text-sm font-semibold text-amber-700">Preferências pendentes ({r.pendingTargets.length})</div>
              <ul className="space-y-0.5 text-sm">
                {r.pendingTargets.map((id) => (
                  <li key={id} className="flex items-center gap-2">
                    <button className="text-left hover:underline" onClick={() => onOpenParticipant(id)}>
                      {name(id)}
                    </button>
                    {prefOf(id) && <PrefBadge type={prefOf(id)!.type} />}
                    {P.demand[P.idx.get(id) ?? 0]?.demandClass === "SOBREDEMANDA" && <Badge tone="red">alvo sobredemandado</Badge>}
                  </li>
                ))}
              </ul>
              {r.requested > r.possible && (
                <p className="mt-1 text-xs text-slate-500">
                  Deseja {r.requested} contatos, mas pode encontrar no máximo {d.contactCapacity}: a satisfação usa min(preferências, capacidade) = {r.possible}.
                </p>
              )}
            </div>
          </div>
        )}

        {selectedRun && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-sm font-semibold">Contatos realizados ({contacts.size})</div>
              <div className="flex flex-wrap gap-1">
                {[...contacts].map((id) => (
                  <button key={id} onClick={() => onOpenParticipant(id)} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs hover:bg-coop-100">
                    {name(id)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-sm font-semibold">Reencontros ({repeats.length})</div>
              {repeats.length === 0 ? (
                <div className="text-sm text-coop-700">Nenhum.</div>
              ) : (
                <ul className="text-sm">
                  {repeats.map((x) => (
                    <li key={x.id}>
                      {name(x.id)} — {x.count}×
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {isHub && hubRows.length > 0 && (
          <div>
            <div className="mb-1 text-sm font-semibold">
              Como as oportunidades foram distribuídas ({hubRows.filter((x) => x.met).length} de {hubRows.length} solicitantes atendidos; capacidade {d.contactCapacity})
            </div>
            <p className="mb-2 text-xs text-slate-500">
              Critérios (seção 12): MUST_MEET → interesse mútuo → HIGH_PRIORITY → prioridade institucional → solicitante com menor satisfação → menos oportunidades futuras →
              ainda não atendido → desempate determinístico. Nunca “os primeiros cadastrados”.
            </p>
            <div className="max-h-80 overflow-y-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Solicitante</th>
                    <th>Tipo</th>
                    <th>Mútuo</th>
                    <th className="text-right">Prior. inst.</th>
                    <th className="text-right">Sessões disp.</th>
                    <th className="text-right">Satisfação do solicitante</th>
                    <th>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {hubRows.map((x) => (
                    <tr key={x.requesterId}>
                      <td>
                        <button className="hover:underline" onClick={() => onOpenParticipant(x.requesterId)}>
                          {name(x.requesterId)}
                        </button>
                      </td>
                      <td>
                        <PrefBadge type={x.type as never} />
                      </td>
                      <td>{x.mutual ? "sim" : ""}</td>
                      <td className="text-right">{x.institutionalPriority || ""}</td>
                      <td className="text-right">{x.requesterAvailableSessions}</td>
                      <td className="text-right tabular-nums">{pct(x.requesterSatisfaction)}</td>
                      <td>{x.met ? <Badge tone="green">atendido na {ev.sessionNames[x.session!] ?? `sessão ${x.session! + 1}`}</Badge> : <Badge tone="amber">não atendido</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {p.description && <p className="text-sm text-slate-600">{p.description}</p>}
        {p.notes && <p className="text-sm text-slate-500">Obs.: {p.notes}</p>}
      </div>
    </Drawer>
  );
}
