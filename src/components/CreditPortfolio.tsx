import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { sncc25, sys25, sys1s25, sys23, sys26 } from '../data/metrics';
import { ratios } from '../lib/derived';
import { fmtNum } from '../lib/format';
import { Callout, ChartFrame, DataTable, KpiCard, Section, SubHead } from './ui';
import { SERIES, axisProps, GRID, tooltipStyle } from './chartTheme';

const concepts = [
  { k: 'Empréstimos e financiamentos (jun/25)', v: sys1s25.emprestimos.value, src: 'Comunicado 1S2025' },
  { k: 'Operações de crédito (dez/25)', v: sys25.opCredito.value, src: 'Relatório de Sustentabilidade' },
  { k: '"Carteira de crédito" (jun/25, base 2026)', v: 240, src: 'Comunicado 1S2026' },
  { k: 'Carteira ampliada líquida (dez/25)', v: sys25.carteiraAmpliada.value, src: 'Comunicado 2025' },
  { k: '"Carteira de crédito" (jun/26)', v: sys26.credito.value, src: 'Comunicado 1S2026' },
];

const problem = [
  { k: 'SNCC dez/25', v: sncc25.ativosProblematicos.value },
  { k: 'SNCC pico ago/25', v: sncc25.ativosProblematicosPico.value },
];

export function CreditPortfolio() {
  return (
    <Section
      id="credito"
      kicker="12 · Carteira de crédito e risco"
      title="A carteira cresce menos — e o risco do setor subiu"
      lead={<>
        O Sicoob não divulga, nos comunicados consultados, indicadores consolidados de inadimplência, estágios de risco ou provisão. Onde só há
        dado do SNCC, ele aparece identificado como <strong>referência setorial</strong> — e nunca como indicador do Sicoob.
      </>}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard metric={sys26.credito} emphasis />
        <KpiCard metric={sys25.agro} />
        <KpiCard metric={ratios.agroShareAmpliada} />
        <KpiCard metric={sys1s25.ruralShare} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ChartFrame title="Um mesmo nome, cinco conceitos de carteira (R$ bi)" subtitle="Valores não são uma série temporal — ilustram por que comparar conceitos diferentes induz a erro"
          sourceIds={['sicoob-1s25', 'sicoob-rs-2025', 'sicoob-2025-balanco', 'sicoob-1s26']} scope="Sistema Sicoob (combinado)" dataBase="jun/2025, dez/2025, jun/2026"
          table={<DataTable columns={['Conceito', 'R$ bi', 'Documento']} rows={concepts.map((c) => [c.k, fmtNum(c.v, 1), c.src])} />}>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={concepts} layout="vertical" margin={{ top: 0, right: 48, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" {...axisProps} />
                <YAxis type="category" dataKey="k" {...axisProps} width={170} tick={{ fill: '#5f6b6d', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [`R$ ${fmtNum(v, 1)} bi`, 'Valor']} cursor={{ fill: '#f6f8f8' }} />
                <Bar dataKey="v" fill={SERIES.c} radius={[0, 4, 4, 0]} maxBarSize={24}>
                  <LabelList dataKey="v" position="right" formatter={(v: number) => fmtNum(v, 1)} className="fill-ink-700 text-[12px]" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>
        <ChartFrame title="Ativos problemáticos / carteira (%)" subtitle="○ Referência setorial — SNCC, não Sicoob" sourceIds={['bcb-sncc-2025']} scope="Sistema Nacional de Crédito Cooperativo" dataBase="ago/2025 e dez/2025"
          table={<DataTable columns={['Recorte', '%']} rows={problem.map((p) => [p.k, `${fmtNum(p.v, 1)}%`])} />}>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={problem} margin={{ top: 24, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="k" {...axisProps} />
                <YAxis {...axisProps} unit="%" domain={[0, 10]} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [`${fmtNum(v, 1)}%`, 'Ativos problemáticos']} cursor={{ fill: '#f6f8f8' }} />
                <Bar dataKey="v" fill="#7c8789" radius={[4, 4, 0, 0]} maxBarSize={56}>
                  <LabelList dataKey="v" position="top" formatter={(v: number) => `${fmtNum(v, 1)}%`} className="fill-ink-700 text-[12px]" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>
      </div>

      <SubHead>Segmentos e exposições</SubHead>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard metric={sys23.creditoPJ} sub="Dado mais recente localizado por segmento" />
        <KpiCard metric={sncc25.ruralPF} />
        <KpiCard metric={sncc25.ruralShareSFN} />
        <KpiCard metric={sncc25.ruralSemSeguro} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Callout tone="analysis" title="Concentração agro">
          Com ≈ 36% da carteira ampliada no agro, o risco do Sicoob é correlacionado a safra, preços de commodities e clima. No cooperativismo,
          88% da carteira rural não tem seguro agrícola — o Sicoob não divulga o dado próprio.
        </Callout>
        <Callout tone="analysis" title="Heterogeneidade">
          A Moody’s Local registrou que as singulares têm patamares distintos de inadimplência, algumas mais pressionadas. O indicador combinado
          pode ocultar concentrações locais.
        </Callout>
        <Callout tone="sector" title="O que falta para concluir">
          Inadimplência &gt; 90 dias, carteira por estágio (1/2/3), cobertura de provisão, concentração por maiores devedores, PF × PJ atualizado.
          Todos constam, em regra, das notas explicativas das DC combinadas e do Pilar 3.
        </Callout>
      </div>
    </Section>
  );
}
