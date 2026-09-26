import type { DemandClass, FeasibilityIssue, PreferenceType } from "@/engine";
import { Badge } from "@/components/ui";
import { pct } from "@/lib/utils";

export const PREF_LABEL: Record<PreferenceType, string> = {
  NORMAL: "Normal",
  PREFER: "Prefere",
  HIGH_PRIORITY: "Alta prioridade",
  MUST_MEET: "Deve encontrar",
  AVOID: "Evitar",
  MUST_NOT_MEET: "Não pode encontrar",
};
export const PREF_TONE: Record<PreferenceType, "slate" | "green" | "amber" | "red" | "blue" | "violet"> = {
  NORMAL: "slate",
  PREFER: "blue",
  HIGH_PRIORITY: "violet",
  MUST_MEET: "green",
  AVOID: "amber",
  MUST_NOT_MEET: "red",
};
export const PREF_TYPES: PreferenceType[] = ["NORMAL", "PREFER", "HIGH_PRIORITY", "MUST_MEET", "AVOID", "MUST_NOT_MEET"];

export function PrefBadge({ type }: { type: PreferenceType }) {
  return <Badge tone={PREF_TONE[type]}>{PREF_LABEL[type]}</Badge>;
}

export const DEMAND_LABEL: Record<DemandClass, string> = {
  NORMAL: "Normal",
  ALTA: "Alta demanda",
  CRITICA: "Crítica",
  SOBREDEMANDA: "Sobredemanda",
};
export function DemandBadge({ cls }: { cls: DemandClass }) {
  const tone = cls === "SOBREDEMANDA" ? "red" : cls === "CRITICA" ? "amber" : cls === "ALTA" ? "blue" : "slate";
  return <Badge tone={tone}>{DEMAND_LABEL[cls]}</Badge>;
}

export const ipdText = (ipd: number) => (Number.isFinite(ipd) ? pct(ipd) : "∞");

export function IssueList({ issues, max = 50 }: { issues: FeasibilityIssue[]; max?: number }) {
  if (!issues.length) return <div className="text-sm text-coop-700">Nenhum problema de viabilidade detectado.</div>;
  const order = { ERROR: 0, WARNING: 1, INFO: 2 };
  const sorted = [...issues].sort((a, b) => order[a.severity] - order[b.severity]);
  return (
    <ul className="space-y-1 text-sm">
      {sorted.slice(0, max).map((i, k) => (
        <li key={k} className="flex gap-2">
          <Badge tone={i.severity === "ERROR" ? "red" : i.severity === "WARNING" ? "amber" : "slate"} className="shrink-0">
            {i.severity === "ERROR" ? "Erro" : i.severity === "WARNING" ? "Atenção" : "Info"}
          </Badge>
          <span className="text-slate-700">{i.message}</span>
        </li>
      ))}
      {sorted.length > max && <li className="text-xs text-slate-500">… e mais {sorted.length - max}.</li>}
    </ul>
  );
}

/** Histograma simples da satisfação (10 faixas). */
export function SatHistogram({ values }: { values: number[] }) {
  const bins = new Array(10).fill(0);
  for (const v of values) bins[Math.min(9, Math.floor(v * 10))]++;
  const max = Math.max(1, ...bins);
  return (
    <div>
      <div className="flex h-28 items-end gap-1">
        {bins.map((b, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end">
            <div className="text-[10px] tabular-nums text-slate-500">{b || ""}</div>
            <div className={`w-full rounded-t ${i < 3 ? "bg-red-400" : i < 5 ? "bg-amber-400" : "bg-coop-500"}`} style={{ height: `${(b / max) * 90}%`, minHeight: b ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1 text-[10px] text-slate-500">
        {bins.map((_, i) => (
          <div key={i} className="flex-1 text-center">
            {i * 10}–{i === 9 ? 100 : i * 10 + 9}%
          </div>
        ))}
      </div>
    </div>
  );
}
