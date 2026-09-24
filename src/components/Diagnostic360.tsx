import { useState } from 'react';
import { diagnostic360 } from '../data/analysis';
import { Section, StatusBadge } from './ui';

export function Diagnostic360() {
  const [sel, setSel] = useState(diagnostic360[0].key);
  const d = diagnostic360.find((x) => x.key === sel)!;
  return (
    <Section id="diagnostico" kicker="27 · Diagnóstico 360°" title="Dez dimensões, uma leitura integrada" tone="mist"
      lead="Selecione uma dimensão para ver a situação observada, os dados, os pontos fortes, os pontos de atenção, os indicadores e as questões estratégicas.">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="tablist" aria-label="Dimensões do diagnóstico">
        {diagnostic360.map((x) => (
          <button key={x.key} role="tab" aria-selected={sel === x.key} onClick={() => setSel(x.key)}
            className={`rounded-xl px-3 py-3 text-[13px] font-semibold uppercase tracking-wider transition ${sel === x.key ? 'bg-coop-900 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-200 hover:ring-coop-400'}`}>
            {x.area}
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-ink-100 bg-white p-5 sm:p-6" role="tabpanel" aria-live="polite">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-2xl text-ink-900">{d.area}</p>
          <StatusBadge status="analysis" />
        </div>
        <p className="mt-2 text-[15px] text-ink-700">{d.observed}</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <Col t="Dados" items={d.data} />
          <Col t="Pontos fortes" items={d.strengths} accent="text-coop-700" />
          <Col t="Pontos de atenção" items={d.attention} accent="text-[#a14a3a]" />
          <Col t="Indicadores" items={d.indicators} />
          <Col t="Questões estratégicas" items={d.questions} />
        </div>
      </div>
    </Section>
  );
}

function Col({ t, items, accent = 'text-ink-500' }: { t: string; items: string[]; accent?: string }) {
  return (
    <div>
      <p className={`text-[12px] font-bold uppercase tracking-wider ${accent}`}>{t}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-ink-900">{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </div>
  );
}
