import { ratios, cagrs } from '../lib/derived';
import { sys26, sysGrowth26, sys25 } from '../data/metrics';
import { fmtMetric } from '../lib/format';
import { InfoTip, KpiCard, Section, StatusBadge, SubHead } from './ui';
import type { Metric } from '../data/types';

const groups: { title: string; items: Metric[] }[] = [
  { title: 'Crescimento', items: [sysGrowth26.ativos, sysGrowth26.credito, sysGrowth26.captacoes, sysGrowth26.pl] },
  { title: 'Estrutura e liquidez', items: [ratios.creditoAtivos, ratios.captacoesAtivos, ratios.creditoCaptacoes, ratios.plAtivos] },
  { title: 'Resultado e capital', items: [ratios.roa25, ratios.roe25, sys26.basileia, ratios.folgaBasileia] },
  { title: 'Por cooperado', items: [ratios.ativosPorCooperado, ratios.creditoPorCooperado, ratios.resultadoPorCooperado, sys25.beneficioPorCooperado] },
];

export function FinancialRatios() {
  return (
    <Section
      id="indicadores"
      kicker="09 · Indicadores financeiros"
      title="Indicadores tecnicamente defensáveis — e só eles"
      lead={<>
        Indicadores marcados com ◆ foram calculados nesta análise; use o botão “Fórmula” para ver o cálculo e as ressalvas. Indicadores que exigiriam dados
        não publicados (eficiência, inadimplência específica, margem) não são estimados.
      </>}
    >
      {groups.map((g) => (
        <div key={g.title}>
          <SubHead>{g.title}</SubHead>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {g.items.map((m) => <KpiCard key={m.id} metric={m} sub={m.formula ? <span className="text-[12px] text-ink-500">{m.formula}</span> : undefined} />)}
          </div>
        </div>
      ))}
      <p className="mt-6 text-[12px] text-ink-500">Taxa média anual de crescimento dos ativos (jun/22–jun/26): {fmtMetric(cagrs.ativos)} ◆.</p>
    </Section>
  );
}

const efficiency: { label: string; value?: Metric; available: boolean; why: string }[] = [
  { label: 'Índice de eficiência', available: false, why: 'Não divulgado de forma consolidada nos comunicados; depende de despesas administrativas e receitas combinadas.' },
  { label: 'Despesas administrativas', available: false, why: 'Rubrica das DC combinadas não reproduzida nesta versão.' },
  { label: 'Receitas de serviços', available: false, why: 'Rubrica das DC combinadas não reproduzida nesta versão.' },
  { label: 'Resultado por empregado', value: ratios.resultadoPorEmpregado, available: true, why: 'Calculado com empregos diretos do Relatório de Sustentabilidade.' },
  { label: 'Ativos por empregado', value: ratios.ativosPorEmpregado, available: true, why: 'Calculado com empregos diretos do Relatório de Sustentabilidade.' },
  { label: 'Ativos por unidade de atendimento', value: ratios.ativosPorUnidade, available: true, why: 'Unidades próprias; não inclui correspondentes.' },
  { label: 'Ativos por cooperado', value: ratios.ativosPorCooperado, available: true, why: 'Cooperados na metodologia do Sicoob.' },
  { label: 'Resultado por cooperado', value: ratios.resultadoPorCooperado, available: true, why: 'Resultado antes de JCP ÷ cooperados.' },
];

export function Efficiency() {
  return (
    <Section id="eficiencia" kicker="10 · Eficiência" title="Eficiência: o que é possível medir com dados públicos" tone="mist"
      lead="A escala só gera valor se vier acompanhada de produtividade. Os indicadores abaixo separam o que pode ser calculado do que não está disponível — a lacuna é, ela mesma, um achado.">
      <div className="grid gap-3 md:grid-cols-2">
        {efficiency.map((e) => (
          <div key={e.label} className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${e.available ? 'border-ink-100 bg-white' : 'border-dashed border-ink-200 bg-transparent'}`}>
            <div>
              <p className="font-semibold text-ink-900">{e.label} {e.value?.formula && <InfoTip text={`${e.value.formula}. ${e.value.note ?? ''}`} />}</p>
              <p className="mt-1 text-[13px] text-ink-500">{e.available ? e.why : `Indicador não disponibilizado de forma consolidada nas fontes analisadas. ${e.why}`}</p>
            </div>
            <div className="shrink-0 text-right">
              {e.value ? (<><p className="font-display text-xl tabular-nums text-ink-900">{fmtMetric(e.value)}</p><StatusBadge status="calculated" compact /></>) : <span className="text-sm text-ink-400">n.d.</span>}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
