import { opportunities } from '../data/analysis';
import { Section, StatusBadge } from './ui';

export function StrategicOpportunities() {
  return (
    <Section id="oportunidades" kicker="28 · Agenda de oportunidades" title="Oportunidades que nascem da análise — não de uma lista genérica"
      lead="Cada oportunidade segue a cadeia: evidência → leitura → oportunidade → indicador de acompanhamento.">
      <div className="grid gap-4 lg:grid-cols-2">
        {opportunities.map((o, idx) => (
          <article key={o.key} className="rounded-2xl border border-ink-100 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-lg text-ink-900"><span className="mr-2 text-coop-600">{String(idx + 1).padStart(2, '0')}</span>{o.title}</p>
              <StatusBadge status="analysis" compact />
            </div>
            <ol className="mt-4 space-y-2 text-sm">
              {[['Evidência', o.evidence], ['Leitura', o.reading], ['Oportunidade', o.opportunity], ['Indicador', o.indicator]].map(([t, d], i) => (
                <li key={t} className="grid grid-cols-[100px_1fr] gap-3">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${i === 2 ? 'text-coop-700' : 'text-ink-500'}`}>{t}</span>
                  <span className={i === 2 ? 'font-medium text-ink-900' : 'text-ink-700'}>{d}</span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </Section>
  );
}
