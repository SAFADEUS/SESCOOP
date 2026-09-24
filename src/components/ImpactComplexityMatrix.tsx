import { useState } from 'react';
import { opportunities } from '../data/analysis';
import { Section, StatusBadge } from './ui';

const quadrants = [
  { t: 'Alto impacto · baixa complexidade', s: 'Prioridade imediata', pos: 'left-0 top-0' },
  { t: 'Alto impacto · alta complexidade', s: 'Projetos estruturantes', pos: 'right-0 top-0' },
  { t: 'Baixo impacto · baixa complexidade', s: 'Ganhos rápidos', pos: 'left-0 bottom-0' },
  { t: 'Baixo impacto · alta complexidade', s: 'Reavaliar', pos: 'right-0 bottom-0' },
];

export function ImpactComplexityMatrix() {
  const [hover, setHover] = useState<string | null>(null);
  // Escala 1–5; corte entre 3 e 4 (≤ 3 = baixo/baixa; ≥ 4 = alto/alta). Pontos iguais recebem leve deslocamento.
  const POS: Record<number, number> = { 1: 10, 2: 24, 3: 38, 4: 64, 5: 80 };
  const pts = opportunities.map((o, i) => {
    const same = opportunities.filter((x, j) => j < i && x.impact === o.impact && x.complexity === o.complexity).length;
    return { ...o, n: i + 1, x: POS[o.complexity] + same * 7, y: 100 - POS[o.impact] };
  });
  return (
    <Section id="matriz" kicker="29 · Matriz impacto × complexidade" title="Onde começar" tone="mist"
      lead="Matriz analítica — classificação derivada do estudo. Impacto = efeito esperado sobre resultado, capital ou retenção; complexidade = mudança em sistemas, governança multinível e dados necessários. Ambos em escala 1–5; notas até 3 ficam no quadrante “baixo/baixa”, notas 4 e 5 no “alto/alta”.">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-ink-100 bg-white p-4 sm:p-6">
          <div className="flex gap-3">
            <div className="flex w-5 items-center justify-center"><span className="-rotate-90 whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-ink-500">Impacto →</span></div>
            <div className="flex-1">
              <div className="relative aspect-square w-full sm:aspect-[4/3]">
                {quadrants.map((q, i) => (
                  <div key={q.t} className={`absolute h-1/2 w-1/2 p-2 ${q.pos} ${i === 0 ? 'bg-coop-50' : 'bg-ink-50'} border border-white`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 sm:text-[11px]">{q.t}</p>
                    <p className="text-[10px] text-ink-400 sm:text-[11px]">{q.s}</p>
                  </div>
                ))}
                {pts.map((p) => (
                  <button key={p.key} onMouseEnter={() => setHover(p.key)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(p.key)} onBlur={() => setHover(null)}
                    aria-label={`${p.title}: impacto ${p.impact}, complexidade ${p.complexity}`}
                    className={`absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[12px] font-bold ring-2 ring-white transition ${hover === p.key ? 'scale-110 bg-ink-900 text-white' : 'bg-coop-700 text-white'}`}
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                    {p.n}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-500">Complexidade →</p>
            </div>
          </div>
        </div>
        <ol className="space-y-1.5">
          {pts.map((p) => (
            <li key={p.key} onMouseEnter={() => setHover(p.key)} onMouseLeave={() => setHover(null)}
              className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition ${hover === p.key ? 'bg-white shadow-sm ring-1 ring-coop-400' : ''}`}>
              <span className="flex items-center gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-coop-700 text-[11px] font-bold text-white">{p.n}</span>{p.title}</span>
              <span className="shrink-0 text-[12px] tabular-nums text-ink-500">I {p.impact} · C {p.complexity}</span>
            </li>
          ))}
          <li className="pt-2"><StatusBadge status="analysis" /></li>
        </ol>
      </div>
    </Section>
  );
}
