import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { banco26, basileiaSeries, sncc25, sys26 } from '../data/metrics';
import { ratios } from '../lib/derived';
import { fmtNum } from '../lib/format';
import { Callout, ChartFrame, DataTable, KpiCard, Section, SourceButton, StatusBadge } from './ui';
import { SERIES, axisProps, GRID, tooltipStyle } from './chartTheme';

const data = [
  ...basileiaSeries.map((b) => ({ k: b.label.replace('Sicoob ', 'Sistema '), v: b.value, kind: 'sys' })),
  { k: 'SNCC dez/2025', v: sncc25.basileia.value, kind: 'sector' },
  { k: 'Banco jun/2026', v: banco26.basileia.value, kind: 'bank' },
];

export function CapitalAdequacy() {
  return (
    <Section id="capital" kicker="13 · Capital e Índice de Basileia" title="Capital acima do setor, e em trajetória de alta" tone="mist">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          <div className="rounded-2xl bg-coop-900 p-6 text-white">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-coop-200">Índice de Basileia</p>
            <p className="mt-2 font-display text-6xl tabular-nums">{fmtNum(sys26.basileia.value, 2)}%</p>
            <p className="mt-1 text-sm text-coop-100">jun/2026 · Sistema Sicoob</p>
            <p className="mt-3 text-[12px] text-coop-200 [&_button]:text-coop-100"><SourceButton sourceId={sys26.basileia.sourceId} metric={sys26.basileia} /></p>
          </div>
          <KpiCard metric={ratios.folgaBasileia} sub="Leitura ilustrativa — ver nota" />
        </div>
        <ChartFrame title="Índice de Basileia (%)" subtitle="Linha tracejada: referência de 11% citada pelo Banco Central no Panorama SNCC"
          sourceIds={['moodys-2025', 'sicoob-1s26', 'bcb-sncc-2025']} scope="Sistema Sicoob (aglutinado/combinado), SNCC, Banco Sicoob" dataBase="dez/2023, dez/2024, dez/2025, jun/2026"
          table={<DataTable columns={['Entidade / data', 'Basileia']} rows={data.map((d) => [d.k, `${fmtNum(d.v, 2)}%`])} />}>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 24, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="k" {...axisProps} tick={{ fill: '#7c8789', fontSize: 11 }} interval={0} />
                <YAxis {...axisProps} unit="%" domain={[0, 24]} />
                <ReferenceLine y={sncc25.basileiaRef.value} stroke="#a14a3a" strokeDasharray="5 4" label={{ value: '11%', position: 'right', fill: '#a14a3a', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [`${fmtNum(v, 2)}%`, 'Basileia']} cursor={{ fill: '#f6f8f8' }} />
                <Bar dataKey="v" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {data.map((d) => <Cell key={d.k} fill={d.kind === 'sys' ? SERIES.a : d.kind === 'bank' ? SERIES.b : '#7c8789'} />)}
                  <LabelList dataKey="v" position="top" formatter={(v: number) => fmtNum(v, 1)} className="fill-ink-700 text-[12px]" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-ink-700">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES.a }} />Sistema Sicoob</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#7c8789]" />SNCC (setorial)</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES.b }} />Banco Sicoob</span>
          </div>
        </ChartFrame>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Explainer q="O que é Basileia?" a="Relação entre o Patrimônio de Referência (capital regulatório) e os ativos ponderados pelo risco (RWA). Um índice de 20,58% significa ≈ R$ 20,58 de capital para cada R$ 100 de exposição ponderada." />
        <Explainer q="Por que importa?" a="O capital absorve perdas inesperadas. Em cooperativas, sem acesso a mercado acionário, ele só cresce por retenção de sobras e integralização dos cooperados — por isso é recurso escasso." />
        <Explainer q="Qual o limite aplicável?" a="O Panorama SNCC cita 11% como referência. O requerimento efetivo depende do segmento prudencial (S1–S5), da metodologia (completa ou simplificada) e de adicionais — varia por entidade do sistema." />
        <Explainer q="Índice alto = seguro?" a="Não isoladamente. O índice sobe se o capital cresce OU se o RWA cai. No Sicoob, a alta coincide com crédito/ativos em queda — parte da melhora vem de um ativo menos arriscado, não só de mais capital." />
      </div>
      <div className="mt-4">
        <Callout tone="analysis" title="Leitura">
          A trajetória 17,0% → 18,6% → 20,58% indica fortalecimento do colchão de capital. Os números de 2023–2024 (aglutinado, via Moody’s Local) e de 2026
          (combinado, via Sicoob) podem ter critérios de agregação distintos; a tendência é consistente, a precisão ponto a ponto não é garantida.
          A margem sobre a referência regulatória dá espaço para retomada do crédito — o limitante é risco, não capital. <StatusBadge status="analysis" compact />
        </Callout>
      </div>
    </Section>
  );
}

function Explainer({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4">
      <p className="font-semibold text-ink-900">{q}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-700">{a}</p>
    </div>
  );
}
