import { useState } from 'react';
import { risks } from '../data/analysis';
import { Section, StatusBadge } from './ui';

const lvlCls: Record<string, string> = {
  Elevado: 'bg-[#a14a3a] text-white',
  Relevante: 'bg-[#C0782A] text-white',
  Moderado: 'bg-[#e9d7b9] text-[#6b4413]',
  Monitorar: 'bg-ink-100 text-ink-700',
};

export function RiskAnalysis() {
  const [open, setOpen] = useState<string | null>('credito');
  return (
    <Section id="riscos" kicker="24 · Riscos e pontos de atenção" title="Crescimento também exige controle."
      lead={<>
        Classificação baseada em evidências e em dois critérios: <strong>materialidade</strong> (efeito potencial sobre resultado e capital) e
        <strong> sinal recente</strong> (há dado indicando piora?). “Elevado” = alta materialidade e sinal recente de deterioração; “Relevante” = alta
        materialidade sem sinal conclusivo; “Moderado” = mitigantes documentados; “Monitorar” = risco estrutural sem evidência de materialização.
      </>}>
      <div className="mb-4 flex flex-wrap gap-2 text-[12px]">
        {Object.keys(lvlCls).map((k) => <span key={k} className={`rounded-full px-2.5 py-1 font-medium ${lvlCls[k]}`}>{k}</span>)}
        <StatusBadge status="analysis" />
      </div>
      <ul className="divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-100">
        {risks.map((r) => (
          <li key={r.key}>
            <button onClick={() => setOpen(open === r.key ? null : r.key)} aria-expanded={open === r.key}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-ink-50">
              <span className="flex items-center gap-3">
                <span className={`w-24 shrink-0 rounded-full px-2 py-0.5 text-center text-[11px] font-semibold ${lvlCls[r.level]}`}>{r.level}</span>
                <span className="font-semibold text-ink-900">{r.risk}</span>
              </span>
              <span className="flex items-center gap-3 text-[12px] text-ink-500">
                <span className="hidden sm:inline">Escopo da evidência: {r.scope}</span>
                <span aria-hidden>{open === r.key ? '−' : '+'}</span>
              </span>
            </button>
            {open === r.key && (
              <div className="grid gap-4 bg-ink-50 px-4 pb-4 pt-1 text-sm md:grid-cols-3">
                <div><p className="font-semibold text-ink-900">Evidência</p><p className="text-ink-700">{r.evidence}</p></div>
                <div><p className="font-semibold text-ink-900">Mitigantes</p><p className="text-ink-700">{r.mitigants}</p></div>
                <div><p className="font-semibold text-ink-900">O que monitorar</p><p className="text-ink-700">{r.watch}</p></div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
