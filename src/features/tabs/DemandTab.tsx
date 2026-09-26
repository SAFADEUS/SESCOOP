import { useMemo, useState } from "react";
import { Badge, Card, Select, Stat } from "@/components/ui";
import { useEvent } from "@/features/EventContext";
import { DemandBadge, ipdText } from "@/features/shared";
import { cn, pct } from "@/lib/utils";

export function DemandTab({ onOpenParticipant }: { onOpenParticipant: (id: string) => void }) {
  const { P, liveMetrics, ev } = useEvent();
  const [sort, setSort] = useState<"inbound" | "ipd" | "outbound" | "pending">("inbound");
  const per = useMemo(() => new Map(liveMetrics?.perParticipant.map((p) => [p.participantId, p]) ?? []), [liveMetrics]);
  const rows = useMemo(() => {
    const r = P.demand.map((d) => {
      const m = per.get(d.participantId);
      const met = m?.inboundMet ?? null;
      return { d, p: P.participants[P.idx.get(d.participantId)!], met, pending: met === null ? null : d.inbound - met };
    });
    const key = {
      inbound: (x: (typeof r)[0]) => x.d.inbound,
      ipd: (x: (typeof r)[0]) => (Number.isFinite(x.d.ipd) ? x.d.ipd : 99),
      outbound: (x: (typeof r)[0]) => x.d.outbound,
      pending: (x: (typeof r)[0]) => x.pending ?? 0,
    }[sort];
    return r.sort((a, b) => key(b) - key(a) || a.p.name.localeCompare(b.p.name));
  }, [P, per, sort]);
  const count = (c: string) => P.demand.filter((d) => d.demandClass === c).length;
  const th = ev.input.config.demandThresholds;
  const maxIpd = Math.max(1.4, ...P.demand.map((d) => (Number.isFinite(d.ipd) ? d.ipd : 0)));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={`Normal (IPD < ${pct(th.high, 0)})`} value={count("NORMAL")} />
        <Stat label={`Alta demanda (≥ ${pct(th.high, 0)})`} value={count("ALTA")} />
        <Stat label={`Crítica (≥ ${pct(th.critical, 0)})`} value={count("CRITICA")} tone={count("CRITICA") ? "warn" : "default"} />
        <Stat label={`Sobredemanda (> ${pct(th.over, 0)})`} value={count("SOBREDEMANDA")} tone={count("SOBREDEMANDA") ? "bad" : "default"} />
      </div>
      <Card
        title="Mapa de demanda — ranking operacional (não avaliativo)"
        actions={
          <Select className="py-1 text-xs" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="inbound">Ordenar por solicitações recebidas</option>
            <option value="ipd">Ordenar por IPD</option>
            <option value="outbound">Ordenar por solicitações enviadas</option>
            <option value="pending">Ordenar por pendentes</option>
          </Select>
        }
      >
        <p className="mb-2 text-xs text-slate-500">
          IPD = solicitações recebidas ÷ capacidade de contatos (sessões disponíveis × (tamanho estimado da mesa − 1)). As classes servem à organização e à otimização; não são exibidas aos
          participantes.
        </p>
        <div className="max-h-[70vh] overflow-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Participante</th>
                <th>Empresa</th>
                <th className="text-right">Solicitações recebidas</th>
                <th>Por tipo</th>
                <th className="text-right">Enviadas</th>
                <th className="text-right">Capacidade</th>
                <th className="w-48">IPD</th>
                <th>Classe</th>
                <th className="text-right">Excesso</th>
                <th className="text-right">Atendidos</th>
                <th className="text-right">Pendentes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ d, p, met, pending }, k) => (
                <tr key={d.participantId} className={cn(d.ipd > th.over && "bg-red-50")}>
                  <td className="text-slate-400">{k + 1}</td>
                  <td>
                    <button className="font-medium text-coop-700 hover:underline" onClick={() => onOpenParticipant(d.participantId)}>
                      {p.name}
                    </button>
                  </td>
                  <td className="text-slate-600">{p.company}</td>
                  <td className="text-right font-semibold tabular-nums">{d.inbound}</td>
                  <td className="space-x-1 whitespace-nowrap text-[11px]">
                    {d.inboundByType.MUST_MEET > 0 && <Badge tone="green">MM {d.inboundByType.MUST_MEET}</Badge>}
                    {d.inboundByType.HIGH_PRIORITY > 0 && <Badge tone="violet">HP {d.inboundByType.HIGH_PRIORITY}</Badge>}
                    {d.inboundByType.PREFER > 0 && <Badge tone="blue">P {d.inboundByType.PREFER}</Badge>}
                    {d.inboundByType.NORMAL > 0 && <Badge>N {d.inboundByType.NORMAL}</Badge>}
                  </td>
                  <td className="text-right tabular-nums">{d.outbound}</td>
                  <td className="text-right tabular-nums">{d.contactCapacity}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="relative h-2 flex-1 rounded bg-slate-100">
                        <div
                          className={cn("absolute inset-y-0 left-0 rounded", d.ipd > th.over ? "bg-red-500" : d.ipd >= th.critical ? "bg-amber-500" : d.ipd >= th.high ? "bg-sky-500" : "bg-coop-400")}
                          style={{ width: `${Math.min(100, ((Number.isFinite(d.ipd) ? d.ipd : maxIpd) / maxIpd) * 100)}%` }}
                        />
                        <div className="absolute inset-y-[-2px] w-px bg-slate-500" style={{ left: `${(1 / maxIpd) * 100}%` }} title="100%" />
                      </div>
                      <span className="w-14 text-right tabular-nums">{ipdText(d.ipd)}</span>
                    </div>
                  </td>
                  <td>
                    <DemandBadge cls={d.demandClass} />
                  </td>
                  <td className="text-right tabular-nums">{d.excess || ""}</td>
                  <td className="text-right tabular-nums">{met ?? "—"}</td>
                  <td className="text-right tabular-nums">{pending ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
