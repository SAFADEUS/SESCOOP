import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { sysGrowth26, sys26, sncc25, sys23, sys24 } from '../data/metrics';
import { structureRatios, ratios } from '../lib/derived';
import { fmtNum } from '../lib/format';
import { ChartFrame, DataTable, Section, StatusBadge } from './ui';
import { SERIES, axisProps, GRID, tooltipStyle } from './chartTheme';

const growth = [sysGrowth26.ativos, sysGrowth26.captacoes, sysGrowth26.pl, sysGrowth26.credito].map((m) => ({ k: m.label, v: m.value }));

const qa = [
  { q: 'O patrimônio acompanha a expansão dos ativos?', a: `Parcialmente. PL cresceu ${fmtNum(sysGrowth26.pl.value, 1)}% contra ${fmtNum(sysGrowth26.ativos.value, 1)}% dos ativos em 12 meses; PL/ativos caiu de 15,8% (jun/22) para ${fmtNum(ratios.plAtivos.value, 1)}% (jun/26). A queda é gradual e compensada, em termos regulatórios, pela menor participação do crédito no ativo.`, tone: 'Atenção moderada' },
  { q: 'As captações sustentam a expansão da carteira?', a: `Sim, com folga. Crédito/captações caiu de 89,1% para ${fmtNum(ratios.creditoCaptacoes.value, 1)}%: para cada R$ 100 captados, R$ 76 viram crédito. O risco não é falta de funding, e sim o custo de remunerar recursos excedentes.`, tone: 'Favorável' },
  { q: 'A carteira cresce acima ou abaixo dos ativos?', a: `Abaixo: +${fmtNum(sysGrowth26.credito.value, 1)}% contra +${fmtNum(sysGrowth26.ativos.value, 1)}%. Crédito/ativos recuou de 64,7% para ${fmtNum(ratios.creditoAtivos.value, 1)}%. O ativo cresce principalmente em aplicações de liquidez.`, tone: 'Ponto de leitura' },
  { q: 'O capital regulatório oferece margem adequada?', a: `Sim. Basileia de ${fmtNum(sys26.basileia.value, 2)}% (jun/26), acima de ${fmtNum(sys24.basileia.value, 1)}% (dez/24), ${fmtNum(sys23.basileia.value, 1)}% (dez/23) e da média do SNCC (${fmtNum(sncc25.basileia.value, 1)}%).`, tone: 'Favorável' },
  { q: 'O resultado cresce de forma consistente?', a: 'Não de forma linear: estável em 2023–2024 (R$ 8,4 bi → R$ 8,3 bi), forte alta em 2025 (R$ 11,2 bi) e sinal inconclusivo no 1S2026 (R$ 4,577 bi vs R$ 5,8 bi no 1S2025, conceitos a conciliar).', tone: 'Atenção' },
];

export function FinancialOverview() {
  return (
    <Section
      id="sustentacao"
      kicker="06 · Rentabilidade e solidez"
      title="Crescimento com sustentação financeira?"
      tone="mist"
      lead="Crescimento isolado não significa melhoria. A pergunta é se patrimônio, captações, capital e resultado acompanham a expansão — e com que composição."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartFrame title="Crescimento em 12 meses (jun/25 → jun/26, %)" subtitle="Ordenado do maior para o menor" sourceIds={['sicoob-1s26']} scope="Sistema Sicoob (combinado)" dataBase="30/06/2026"
          table={<DataTable columns={['Indicador', 'Variação']} rows={growth.map((g) => [g.k, `${fmtNum(g.v, 2)}%`])} />}>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={growth} layout="vertical" margin={{ top: 0, right: 48, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" {...axisProps} unit="%" />
                <YAxis type="category" dataKey="k" {...axisProps} width={120} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [`${fmtNum(v, 2)}%`, 'Variação']} cursor={{ fill: '#f6f8f8' }} />
                <Bar dataKey="v" fill={SERIES.a} radius={[0, 4, 4, 0]} maxBarSize={28}>
                  <LabelList dataKey="v" position="right" formatter={(v: number) => `${fmtNum(v, 2)}%`} className="fill-ink-700 text-[12px]" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>

        <ChartFrame title="Razões de estrutura (%)" subtitle="Calculadas sobre a série de junho publicada pelo Sicoob (jun/23 e jun/24 não publicados)" sourceIds={['sicoob-1s26', 'sescoop-analise']} scope="Sistema Sicoob (combinado)" dataBase="30/06/2022, 2025, 2026"
          table={<DataTable columns={['Período', 'Crédito/Captações', 'Crédito/Ativos', 'PL/Ativos']} rows={structureRatios.map((r) => [r.period, `${fmtNum(r.creditoCaptacoes, 1)}%`, `${fmtNum(r.creditoAtivos, 1)}%`, `${fmtNum(r.plAtivos, 1)}%`])} />}>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={structureRatios.map((r) => ({ ...r, t: Number(r.period.slice(4)) + 0.5 }))} margin={{ top: 12, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="t" type="number" domain={[2022.5, 2026.5]} ticks={[2022.5, 2023.5, 2024.5, 2025.5, 2026.5]} tickFormatter={(t: number) => `jun/${Math.floor(t)}`} {...axisProps} />
                <YAxis {...axisProps} unit="%" domain={[0, 100]} />
                <Tooltip {...tooltipStyle} labelFormatter={(t: number) => `jun/${Math.floor(t)}`} formatter={(v: number, n) => [`${fmtNum(v, 1)}%`, n]} />
                <Line dataKey="creditoCaptacoes" name="Crédito / Captações" stroke={SERIES.a} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="creditoAtivos" name="Crédito / Ativos" stroke={SERIES.b} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="plAtivos" name="PL / Ativos" stroke={SERIES.c} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-ink-700">
            {[['Crédito / Captações', SERIES.a], ['Crédito / Ativos', SERIES.b], ['PL / Ativos', SERIES.c]].map(([l, c]) => (
              <span key={l} className="flex items-center gap-1.5"><i className="h-0.5 w-4" style={{ background: c }} />{l}</span>
            ))}
            <StatusBadge status="calculated" />
          </div>
        </ChartFrame>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {qa.map((x) => (
          <div key={x.q} className="rounded-2xl border border-ink-100 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-coop-700">{x.tone}</span>
              <StatusBadge status="analysis" compact />
            </div>
            <p className="mt-2 font-semibold text-ink-900">{x.q}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">{x.a}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
