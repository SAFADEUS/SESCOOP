import { Badge, Button, Card, Empty, Stat } from "@/components/ui";
import { useEvent } from "@/features/EventContext";
import { IssueList, SatHistogram } from "@/features/shared";
import { pct } from "@/lib/utils";

export function DashboardTab({ onOpenParticipant, goTo }: { onOpenParticipant: (id: string) => void; goTo: (tab: string) => void }) {
  const { ev, P, selectedRun, liveMetrics: m } = useEvent();
  const active = ev.input.participants.filter((p) => p.active);
  const checkins = active.filter((p) => p.status === "CHECKED_IN").length;
  const overdemanded = P.demand.filter((d) => d.demandClass === "SOBREDEMANDA").length;
  const critical = P.demand.filter((d) => d.demandClass === "CRITICA").length;
  const positive = ev.input.preferences.filter((p) => ["NORMAL", "PREFER", "HIGH_PRIORITY", "MUST_MEET"].includes(p.type)).length;
  const hard = m ? m.hardViolations + (ev.input.config.mustMeetPriority === "HARD" ? m.mustMeetUnmetViable : 0) : 0;
  const lowest = m
    ? [...m.perParticipant].filter((p) => p.satisfaction !== null).sort((a, b) => a.satisfaction! - b.satisfaction!).slice(0, 8)
    : [];
  const name = (id: string) => P.participants[P.idx.get(id) ?? -1]?.name ?? id;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <Stat label="Participantes confirmados" value={active.length} hint={`meta ${ev.input.config.participantTarget}`} />
        <Stat label="Check-ins" value={checkins} />
        <Stat label="Mesas" value={ev.input.tables.length} />
        <Stat label="Sessões" value={ev.input.config.sessionCount} />
        <Stat label="Preferências cadastradas" value={positive} hint={`${ev.input.preferences.length - positive} restrições/evitar`} />
        <Stat label="Preferências atendidas" value={m ? m.preferencesMet : "—"} hint={m ? pct(m.preferencesMet / Math.max(1, m.preferencesRegistered)) : undefined} />
        <Stat label="Contatos únicos" value={m ? m.uniqueContacts : "—"} hint={m ? `de ${m.pairSlots} oportunidades` : undefined} />
        <Stat label="Reencontros" value={m ? m.repeats : "—"} tone={m ? (m.repeats === 0 ? "good" : "warn") : "default"} hint={m?.strategicRepeats ? `${m.strategicRepeats} estratégico(s)` : undefined} />
        <Stat label="Satisfação média" value={m ? pct(m.satisfaction.avg) : "—"} />
        <Stat label="Satisfação mínima" value={m ? pct(m.satisfaction.min) : "—"} tone={m && m.satisfaction.min < 0.25 ? "warn" : "default"} />
        <Stat label="Satisfação P10" value={m ? pct(m.satisfaction.p10) : "—"} />
        <Stat label="Sobredemandados / críticos" value={`${overdemanded} / ${critical}`} tone={overdemanded ? "warn" : "default"} />
        <Stat label="Violações obrigatórias" value={m ? hard : "—"} tone={m ? (hard === 0 ? "good" : "bad") : "default"} />
        <Stat label="MUST_MEET" value={m ? `${m.mustMeetMet}/${m.mustMeetTotal}` : "—"} />
        <Stat label="HIGH_PRIORITY" value={m ? `${m.highPriorityMet}/${m.highPriorityTotal}` : "—"} />
        <Stat label="Interesses mútuos" value={m ? `${m.mutualPairsMet}/${m.mutualPairs}` : "—"} />
        <Stat label="Mesma empresa juntos" value={m ? m.sameCompanyPairs : "—"} />
        <Stat label="Repetição de mesa física" value={m ? m.tableRevisits : "—"} hint="penalização baixa" />
      </div>

      {!selectedRun && (
        <Empty>
          Nenhuma execução ainda. <Button size="sm" onClick={() => goTo("otimizacao")}>Executar simulação</Button>
        </Empty>
      )}

      {m && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Distribuição da satisfação (não esconder desigualdade atrás da média)" className="lg:col-span-2">
            <SatHistogram values={m.perParticipant.filter((p) => p.satisfaction !== null).map((p) => p.satisfaction!)} />
            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs sm:grid-cols-8">
              {(
                [
                  ["Mín", m.satisfaction.min],
                  ["P10", m.satisfaction.p10],
                  ["P25", m.satisfaction.p25],
                  ["Mediana", m.satisfaction.median],
                  ["Média", m.satisfaction.avg],
                  ["P75", m.satisfaction.p75],
                  ["P90", m.satisfaction.p90],
                ] as const
              ).map(([l, v]) => (
                <div key={l} className="rounded bg-slate-50 p-1.5">
                  <div className="text-slate-500">{l}</div>
                  <div className="font-semibold tabular-nums">{pct(v)}</div>
                </div>
              ))}
              <div className="rounded bg-slate-50 p-1.5">
                <div className="text-slate-500">n</div>
                <div className="font-semibold tabular-nums">{m.satisfaction.count}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge tone={m.satisfaction.below25 ? "red" : "slate"}>{m.satisfaction.below25} abaixo de 25%</Badge>
              <Badge tone={m.satisfaction.below50 ? "amber" : "slate"}>{m.satisfaction.below50} abaixo de 50%</Badge>
              <Badge tone="green">{m.satisfaction.above80} acima de 80%</Badge>
              <Badge tone="green">{m.satisfaction.full} com 100%</Badge>
              <Badge tone={m.satisfaction.zero ? "red" : "slate"}>{m.satisfaction.zero} sem nenhuma preferência atendida</Badge>
            </div>
          </Card>
          <Card title="Menor satisfação (prioridade de recuperação)">
            <ul className="space-y-1 text-sm">
              {lowest.map((p) => (
                <li key={p.participantId} className="flex justify-between gap-2">
                  <button className="truncate text-left text-coop-700 hover:underline" onClick={() => onOpenParticipant(p.participantId)}>
                    {name(p.participantId)}
                  </button>
                  <span className="shrink-0 tabular-nums text-slate-600">
                    {p.fulfilled}/{p.possible} · {pct(p.satisfaction)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {m && hard > 0 && (
        <Card title="Violações obrigatórias">
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-red-700">
            {m.hardViolationDetails.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Análise de viabilidade (antes da otimização)">
        <IssueList issues={P.issues} />
      </Card>
      {ev.notes && ev.notes.length > 0 && (
        <Card title="Notas do cenário">
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {ev.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
