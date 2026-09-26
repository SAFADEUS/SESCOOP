import { useMemo, useState } from "react";
import { Card, Select } from "@/components/ui";
import { useEvent } from "@/features/EventContext";

type State = "none" | "ab" | "ba" | "mutual" | "met" | "repeat" | "mustmeet" | "mustnot";

const STATES: { key: State; label: string; color: string }[] = [
  { key: "none", label: "sem preferência", color: "#ffffff" },
  { key: "ab", label: "preferência linha → coluna", color: "#60a5fa" },
  { key: "ba", label: "preferência coluna → linha", color: "#bfdbfe" },
  { key: "mutual", label: "interesse mútuo", color: "#8b5cf6" },
  { key: "met", label: "já se encontraram", color: "#86efac" },
  { key: "repeat", label: "reencontro", color: "#f97316" },
  { key: "mustmeet", label: "MUST_MEET", color: "#15803d" },
  { key: "mustnot", label: "MUST_NOT_MEET", color: "#dc2626" },
];

export function MatrixTab({ onOpenParticipant }: { onOpenParticipant: (id: string) => void }) {
  const { P, selectedRun } = useEvent();
  const [order, setOrder] = useState<"cadastro" | "empresa" | "demanda" | "segmento">("demanda");
  const [visible, setVisible] = useState<Set<State>>(new Set(STATES.map((s) => s.key)));
  const [segment, setSegment] = useState("");
  const [hover, setHover] = useState<string>("");
  const n = P.n;

  const meet = useMemo(() => {
    const m = new Int16Array(n * n);
    selectedRun?.schedule.forEach((sess) =>
      sess.forEach((mem) => {
        const ps = mem.map((id) => P.idx.get(id)).filter((x): x is number => x !== undefined);
        for (const a of ps) for (const b of ps) if (a !== b) m[a * n + b]++;
      }),
    );
    return m;
  }, [selectedRun, P, n]);

  const idx = useMemo(() => {
    let list = Array.from({ length: n }, (_, i) => i).filter((i) => !P.staff[i]);
    if (segment) list = list.filter((i) => P.participants[i].segment === segment);
    const by = {
      cadastro: (a: number, b: number) => a - b,
      empresa: (a: number, b: number) => P.participants[a].company.localeCompare(P.participants[b].company),
      demanda: (a: number, b: number) => P.demand[b].inbound - P.demand[a].inbound,
      segmento: (a: number, b: number) => P.participants[a].segment.localeCompare(P.participants[b].segment),
    }[order];
    return list.sort((a, b) => by(a, b) || a - b);
  }, [P, n, order, segment]);

  const stateOf = (i: number, j: number): State => {
    const k = i * n + j;
    const a = P.wants[k];
    const b = P.wants[j * n + i];
    const c = meet[k];
    const f = P.pairFlags[k];
    if (f & 1) return "mustnot";
    if (c > 1 && !(f & 8)) return "repeat";
    if (f & 2) return "mustmeet";
    if (a > 0 && b > 0) return "mutual";
    if (c > 0 && (a > 0 || b > 0)) return a > 0 ? "ab" : "ba";
    if (c > 0) return "met";
    if (a > 0) return "ab";
    if (b > 0) return "ba";
    return "none";
  };
  const color = Object.fromEntries(STATES.map((s) => [s.key, s.color])) as Record<State, string>;
  const size = idx.length > 90 ? 7 : idx.length > 60 ? 9 : 11;
  const segments = [...new Set(P.participants.map((p) => p.segment))].sort();

  return (
    <Card
      title="Matriz participante × participante"
      actions={
        <>
          <Select className="py-1 text-xs" value={order} onChange={(e) => setOrder(e.target.value as typeof order)}>
            <option value="demanda">Ordenar por demanda recebida</option>
            <option value="empresa">Ordenar por empresa</option>
            <option value="segmento">Ordenar por segmento</option>
            <option value="cadastro">Ordem de cadastro</option>
          </Select>
          <Select className="py-1 text-xs" value={segment} onChange={(e) => setSegment(e.target.value)}>
            <option value="">Todos os segmentos</option>
            {segments.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </>
      }
    >
      <div className="mb-3 flex flex-wrap gap-3 text-xs">
        {STATES.map((s) => (
          <label key={s.key} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={visible.has(s.key)}
              onChange={(e) => {
                const next = new Set(visible);
                if (e.target.checked) next.add(s.key);
                else next.delete(s.key);
                setVisible(next);
              }}
            />
            <span className="inline-block h-3 w-3 border border-slate-300" style={{ background: s.color }} /> {s.label}
          </label>
        ))}
      </div>
      <div className="mb-2 h-5 text-xs text-slate-600">{hover}</div>
      <div className="overflow-auto">
        <div className="inline-grid" style={{ gridTemplateColumns: `140px repeat(${idx.length}, ${size}px)` }} onMouseLeave={() => setHover("")}>
          {idx.flatMap((i) => [
            <button
              key={`h${i}`}
              className="truncate pr-1 text-left text-[10px] leading-none text-slate-700 hover:text-coop-700"
              style={{ height: size }}
              onClick={() => onOpenParticipant(P.ids[i])}
              title={`${P.participants[i].name} — ${P.participants[i].company}`}
            >
              {P.participants[i].name}
            </button>,
            ...idx.map((j) => {
              const st = i === j ? "none" : stateOf(i, j);
              const show = i !== j && visible.has(st);
              return (
                <div
                  key={`${i}-${j}`}
                  style={{ width: size, height: size, background: i === j ? "#e2e8f0" : show ? color[st] : "#ffffff" }}
                  className="border-b border-r border-slate-100"
                  onMouseEnter={() =>
                    setHover(
                      i === j
                        ? P.participants[i].name
                        : `${P.participants[i].name} × ${P.participants[j].name}: ${STATES.find((x) => x.key === st)!.label}${meet[i * n + j] ? ` · encontros: ${meet[i * n + j]}` : ""}`,
                    )
                  }
                />
              );
            }),
          ])}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">Linha = quem deseja; coluna = quem é desejado. Clique no nome para abrir o participante. Versão: {selectedRun ? `v${selectedRun.version}` : "nenhuma"}.</p>
    </Card>
  );

}
