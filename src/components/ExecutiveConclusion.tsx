import { conclusions } from '../data/analysis';
import { Section } from './ui';

const watch = ['Ativos problemáticos e provisões (Sicoob combinado)', 'Crédito / captações', 'Resultado semestral em conceito homogêneo', 'Índice de Basileia', 'Cobertura de seguro na carteira agro', 'Índice de eficiência', 'Produtos por cooperado', 'Municípios com presença exclusiva'];

export function ExecutiveConclusion() {
  return (
    <Section id="conclusao" kicker="30 · Conclusão executiva" title="Sete achados para a mesa de decisão">
      <ol className="space-y-5">
        {conclusions.map((c, i) => (
          <li key={i} className="grid grid-cols-[44px_1fr] gap-4 border-b border-ink-100 pb-5 last:border-0">
            <span className="font-display text-3xl text-coop-600 tabular-nums">{i + 1}</span>
            <p className="text-[16px] leading-relaxed text-ink-900 sm:text-[17px]">{c}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 rounded-2xl bg-coop-900 p-6 text-white">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-coop-200">Indicadores para acompanhamento</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {watch.map((w) => <li key={w} className="rounded-lg bg-white/10 px-3 py-2 text-sm">{w}</li>)}
        </ul>
      </div>
    </Section>
  );
}
