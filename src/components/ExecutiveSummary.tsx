import { executiveSummary } from '../data/analysis';
import { sys26, sysGrowth26 } from '../data/metrics';
import { ratios } from '../lib/derived';
import { KpiCard, Section, StatusBadge } from './ui';
import { DataLegend } from './DataMethodology';

export function ExecutiveSummary() {
  return (
    <Section
      id="visao-geral"
      kicker="01 · Leitura executiva"
      title="O que os números dizem — e o que ainda precisam responder"
      lead={<>
        Síntese do diagnóstico. Cada bloco interpreta os dados apresentados ao longo da página; nenhum número aparece aqui
        sem estar registrado, com fonte e data-base, nas seções seguintes.
      </>}
    >
      <DataLegend />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard metric={sysGrowth26.ativos} sub="Crescimento dos ativos em 12 meses" />
        <KpiCard metric={sysGrowth26.credito} sub="Crescimento da carteira em 12 meses" />
        <KpiCard metric={ratios.creditoCaptacoes} sub="Quanto das captações vira crédito" />
        <KpiCard metric={sys26.resultado} sub="Semestral — não anualizado" />
      </div>
      <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
        {executiveSummary.map((b) => (
          <article key={b.key} className="border-l-2 border-coop-200 pl-4">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.14em] text-coop-800">{b.title}</h3>
              <StatusBadge status="analysis" compact />
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-700">{b.text}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
