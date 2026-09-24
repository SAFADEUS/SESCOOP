import { useState } from 'react';
import { canvas } from '../data/analysis';
import { Section, StatusBadge } from './ui';

/** Layout clássico do Canvas em 5 colunas (desktop); blocos empilhados no celular. */
const area: Record<string, string> = {
  parceiros: 'lg:col-start-1 lg:row-start-1 lg:row-span-2',
  atividades: 'lg:col-start-2 lg:row-start-1',
  recursos: 'lg:col-start-2 lg:row-start-2',
  proposta: 'lg:col-start-3 lg:row-start-1 lg:row-span-2',
  relacionamento: 'lg:col-start-4 lg:row-start-1',
  canais: 'lg:col-start-4 lg:row-start-2',
  segmentos: 'lg:col-start-5 lg:row-start-1 lg:row-span-2',
  custos: 'lg:col-start-1 lg:col-span-2 lg:row-start-3',
  receitas: 'lg:col-start-3 lg:col-span-3 lg:row-start-3',
};

export function BusinessModelCanvas() {
  const [sel, setSel] = useState('proposta');
  const b = canvas.find((c) => c.key === sel)!;
  return (
    <Section id="canvas" kicker="17 · Business Model Canvas" title="O modelo de negócio do Sicoob real, bloco a bloco" tone="mist"
      lead="Cada bloco reúne evidências públicas, análise e implicação estratégica. Blocos marcados com ▲ contêm interpretação analítica baseada em informações públicas.">
      <div className="grid gap-2 lg:grid-cols-5 lg:grid-rows-[auto_auto_auto]">
        {canvas.map((c) => (
          <button key={c.key} onClick={() => setSel(c.key)} aria-pressed={sel === c.key}
            className={`rounded-xl border p-4 text-left transition ${area[c.key]} ${sel === c.key ? 'border-coop-600 bg-white shadow-sm ring-1 ring-coop-600' : 'border-ink-200 bg-white hover:border-coop-400'}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-bold uppercase tracking-wider text-coop-800">{c.title}</p>
              {c.interpretive && <StatusBadge status="analysis" compact />}
            </div>
            <ul className="mt-2 space-y-1 text-[13px] leading-snug text-ink-700">
              {c.evidence.map((e) => <li key={e}>· {e}</li>)}
            </ul>
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-4 rounded-2xl border border-coop-200 bg-white p-5 md:grid-cols-3" aria-live="polite">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-500">Evidência</p>
          <ul className="mt-1 space-y-1 text-sm text-ink-900">{b.evidence.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-500">Análise</p>
          <p className="mt-1 text-sm text-ink-700">{b.analysis}</p>
        </div>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-500">Implicação estratégica</p>
          <p className="mt-1 text-sm text-ink-700">{b.implication}</p>
          {b.interpretive && <p className="mt-2 text-[12px] text-[#8a5518]">▲ Interpretação analítica SESCOOP baseada em informações públicas.</p>}
        </div>
      </div>
    </Section>
  );
}
