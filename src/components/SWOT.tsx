import { useState } from 'react';
import { swot, type SwotItem } from '../data/analysis';
import { Section, StatusBadge } from './ui';

const quad = [
  { k: 'forcas', t: 'Forças', sub: 'Internas · positivas', cls: 'border-coop-600', head: 'text-coop-800' },
  { k: 'fraquezas', t: 'Fraquezas / desafios internos', sub: 'Internas · a endereçar', cls: 'border-[#C0782A]', head: 'text-[#8a5518]' },
  { k: 'oportunidades', t: 'Oportunidades', sub: 'Externas · positivas', cls: 'border-[#5B57A6]', head: 'text-[#4a4790]' },
  { k: 'ameacas', t: 'Ameaças', sub: 'Externas · a mitigar', cls: 'border-[#a14a3a]', head: 'text-[#a14a3a]' },
] as const;

export function SWOT() {
  const [sel, setSel] = useState<{ q: keyof typeof swot; i: number }>({ q: 'forcas', i: 0 });
  const item: SwotItem = swot[sel.q][sel.i];
  return (
    <Section id="swot" kicker="20 · SWOT baseada em evidências" title="Forças, fraquezas, oportunidades e ameaças — cada uma com sua prova"
      lead={<>
        A relevância (Alta/Média/Baixa) é atribuída por dois critérios explícitos: <strong>força da evidência</strong> (dado oficial do Sicoob &gt; dado setorial &gt;
        ausência de dado) e <strong>materialidade</strong> (tamanho da exposição ou do efeito sobre resultado e capital). Não se atribui probabilidade estatística.
      </>}>
      <div className="grid gap-4 md:grid-cols-2">
        {quad.map((q) => (
          <div key={q.k} className={`rounded-2xl border-t-4 bg-white p-4 shadow-sm ring-1 ring-ink-100 ${q.cls}`}>
            <p className={`text-[13px] font-bold uppercase tracking-wider ${q.head}`}>{q.t}</p>
            <p className="text-[12px] text-ink-500">{q.sub}</p>
            <ul className="mt-3 space-y-1.5">
              {swot[q.k].map((it, i) => (
                <li key={it.title}>
                  <button onClick={() => setSel({ q: q.k, i })} aria-pressed={sel.q === q.k && sel.i === i}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${sel.q === q.k && sel.i === i ? 'bg-ink-900 text-white' : 'bg-ink-50 text-ink-900 hover:bg-ink-100'}`}>
                    <span>{it.title}</span>
                    <span className={`shrink-0 text-[11px] ${sel.q === q.k && sel.i === i ? 'text-ink-200' : 'text-ink-500'}`}>{it.relevance}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-5 sm:p-6" aria-live="polite">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-xl text-ink-900">{item.title}</p>
          <StatusBadge status="analysis" />
          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-700">Relevância: {item.relevance}</span>
        </div>
        <p className="mt-1 text-[13px] text-ink-500">Por que essa relevância: {item.relevanceWhy}</p>
        <p className="mt-5 text-[12px] font-semibold uppercase tracking-wider text-ink-500">Da SWOT para a ação</p>
        <ol className="mt-3 grid gap-2 md:grid-cols-5">
          {[['Evidência', item.evidence], ['Diagnóstico / impacto', item.impact], ['Implicação', item.implication], ['Indicador a monitorar', item.monitor], ['Possível linha de ação', item.action]].map(([t, d], i) => (
            <li key={t} className="relative rounded-xl bg-ink-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-coop-700">{i + 1}. {t}</p>
              <p className="mt-1 text-sm leading-snug text-ink-900">{d}</p>
              {i < 4 && <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-ink-400 md:block" aria-hidden>→</span>}
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
