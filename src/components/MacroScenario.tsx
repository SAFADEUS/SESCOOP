import { macro, sncc25 } from '../data/metrics';
import { KpiCard, Section, StatusBadge } from './ui';

const effects = [
  { v: 'Custo de captação', e: 'Selic ainda elevada mantém caro o funding a prazo (RDC, LCA, LCI). Cortes graduais reduzem o custo com defasagem.' },
  { v: 'Demanda por crédito', e: 'Juros reais altos (Selic 13,75% vs IPCA 12m de 4,22%) tendem a conter demanda e elevar seletividade.' },
  { v: 'Inadimplência', e: 'Juros altos por período prolongado pressionam capacidade de pagamento — coerente com a alta de ativos problemáticos do SNCC em 2025.' },
  { v: 'Margens e tesouraria', e: 'Com balanço líquido, a renda de aplicações se beneficia de juros altos; a queda da Selic reduz esse componente.' },
  { v: 'Resultado', e: 'Efeito líquido depende do ritmo de queda da Selic versus recuperação do crédito e da qualidade da carteira.' },
];

export function MacroScenario() {
  return (
    <Section id="macro" kicker="25 · Cenário macroeconômico" title="Juros em queda, ainda em patamar restritivo" tone="mist"
      lead="Painel externo resumido. Os efeitos descritos são canais de transmissão usuais, não relações causais comprovadas para o Sicoob.">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard metric={macro.selic} />
        <KpiCard metric={macro.selicCiclo} sub="cinco cortes consecutivos" />
        <KpiCard metric={macro.ipca12m} />
        <KpiCard metric={sncc25.ativosProblematicos} sub="referência de crédito cooperativo" />
      </div>
      <p className="mt-3 text-[12px] text-ink-500">PIB, desemprego, crédito e inadimplência do SFN e indicadores de MPE não foram incorporados nesta versão — serão adicionados apenas com fonte oficial e data-base verificadas.</p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white">
        {effects.map((x) => (
          <div key={x.v} className="grid gap-1 border-t border-ink-100 px-4 py-3 first:border-t-0 md:grid-cols-[200px_1fr] md:gap-6">
            <p className="font-semibold text-ink-900">{x.v}</p>
            <p className="text-sm text-ink-700"><StatusBadge status="analysis" compact /> {x.e}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
