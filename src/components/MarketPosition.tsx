import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { sicredi25, sys25, sncc25 } from '../data/metrics';
import { ratios } from '../lib/derived';
import { fmtBi, fmtNum } from '../lib/format';
import { Callout, ChartFrame, DataTable, KpiCard, Section } from './ui';
import { SERIES, axisProps, GRID, tooltipStyle } from './chartTheme';

const rows = [
  { k: 'Ativos (R$ bi)', sicoob: sys25.ativos.value, sicredi: sicredi25.ativos.value },
  { k: 'Captações (R$ bi)', sicoob: sys25.captacoes.value, sicredi: sicredi25.captacoes.value },
  { k: 'PL (R$ bi)', sicoob: sys25.pl.value, sicredi: sicredi25.pl.value },
];

export function MarketPosition() {
  return (
    <Section
      id="posicionamento"
      kicker="04 · Sicoob dentro do cooperativismo financeiro"
      title="Um dos dois grandes sistemas do SNCC"
      tone="mist"
      lead={<>
        Comparações só são feitas quando entidade, período e conceito são equivalentes. Por isso, a comparação com o Sicredi limita-se a
        ativos, captações e patrimônio de dez/2025 — e o resultado não é comparado (Sicredi divulga “resultado líquido”; Sicoob, “resultado antes de JCP”).
      </>}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="grid content-start gap-3">
          <KpiCard metric={ratios.shareAtivosSncc} emphasis sub="dos ativos do SNCC em dez/2025 (aproximação)" />
          <KpiCard metric={ratios.exclusivosShare} sub="dos municípios em que o cooperativismo é a única IF física" />
          <KpiCard metric={sys25.ativosVar} sub={<>vs {fmtNum(sncc25.ativosVar.value, 1)}% do SNCC — Sicoob cresce acima do setor</>} />
        </div>
        <ChartFrame
          title="Sicoob × Sicredi — dez/2025 (R$ bi)"
          subtitle="Sistemas combinados/consolidados, conforme divulgação de cada instituição"
          sourceIds={['sicoob-2025-balanco', 'sicredi-2025']}
          scope="Sistema Sicoob; Sistema Sicredi"
          dataBase="31/12/2025"
          table={<DataTable columns={['Indicador', 'Sicoob', 'Sicredi']} rows={rows.map((r) => [r.k, fmtNum(r.sicoob, 1), fmtNum(r.sicredi, 1)])} />}
        >
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={rows} margin={{ top: 24, right: 8, left: -12, bottom: 0 }} barGap={2}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="k" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip {...tooltipStyle} formatter={(v: number, n) => [fmtBi(v), n]} cursor={{ fill: '#f6f8f8' }} />
                <Bar dataKey="sicoob" name="Sicoob" fill={SERIES.a} radius={[4, 4, 0, 0]} maxBarSize={44}>
                  <LabelList dataKey="sicoob" position="top" formatter={(v: number) => fmtNum(v, 1)} className="fill-ink-700 text-[12px]" />
                </Bar>
                <Bar dataKey="sicredi" name="Sicredi" fill={SERIES.b} radius={[4, 4, 0, 0]} maxBarSize={44}>
                  <LabelList dataKey="sicredi" position="top" formatter={(v: number) => fmtNum(v, 1)} className="fill-ink-700 text-[12px]" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-ink-700">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES.a }} />Sicoob</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES.b }} />Sicredi</span>
            <span className="text-ink-500">Captações Sicredi: “depósitos totais e captações”. Sicoob: depósitos + LCA + LCI.</span>
          </div>
        </ChartFrame>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Callout tone="calculated" title="Capitalização relativa">
          PL/ativos em dez/2025: Sicoob {fmtNum(ratios.plAtivosSicoob25.value, 1)}% × Sicredi {fmtNum(ratios.plAtivosSicredi.value, 1)}%.
          Os ativos são de porte semelhante, mas o Sicoob opera com colchão patrimonial proporcionalmente maior. Critérios de combinação/consolidação
          podem diferir entre os sistemas.
        </Callout>
        <Callout tone="sector" title="Outros sistemas">
          Unicred, Ailos, Cresol, Credisis e cooperativas independentes compõem o restante do SNCC. Não foram incluídos na comparação porque dados
          comparáveis de dez/2025 não foram verificados nesta versão do estudo — não se constrói ranking sem fonte.
        </Callout>
      </div>
    </Section>
  );
}
