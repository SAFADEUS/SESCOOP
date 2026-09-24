import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { annualSeries, juneSeries, type SeriesKey } from '../data/metrics';
import { accumulated, cagrs } from '../lib/derived';
import { fmtNum } from '../lib/format';
import { Callout, ChartFrame, DataTable, KpiCard, Section, Segmented, SourceButton, StatusBadge, SubHead } from './ui';
import { SERIES, axisProps, GRID, tooltipStyle } from './chartTheme';

type Mode = 'abs' | 'var';

/** Eixo temporal proporcional: jun/23 e jun/24 não publicados, mas o espaçamento respeita o tempo. */
const juneTimed = juneSeries.map((p) => ({ ...p, t: Number(p.period.slice(4)) + 0.5 }));
type Range = 'all' | 'recent';

export function HistoricalEvolution() {
  const [key, setKey] = useState<SeriesKey>('ativos');
  const [mode, setMode] = useState<Mode>('abs');
  const [range, setRange] = useState<Range>('all');
  const def = annualSeries.find((s) => s.key === key)!;

  const data = useMemo(() => {
    const pts = def.points.filter((p) => range === 'all' || ['2024', '2025', 'jun/2026'].includes(p.period));
    return pts.map((p, i) => {
      const prev = i > 0 ? pts[i - 1] : null;
      const variation = prev && prev.value != null && p.value != null ? ((p.value / prev.value) - 1) * 100 : null;
      return { ...p, variation, semestral: p.period.startsWith('jun') };
    });
  }, [def, range]);

  const unitLabel = def.unit === 'mi' ? 'milhões' : 'R$ bilhões';
  const srcIds = Array.from(new Set(def.points.filter((p) => p.value != null).map((p) => p.sourceId)));

  return (
    <Section
      id="financeiro"
      kicker="05 · Evolução"
      title="Quatro anos de expansão: o que cresceu, e em que ritmo"
      lead={<>
        Duas séries complementares: a série anual (dezembro), montada a partir de comunicados de cada exercício, e a série de junho
        divulgada pelo próprio Sicoob no comunicado do 1º semestre de 2026 — esta última com conceitos internamente consistentes.
      </>}
    >
      <ChartFrame
        title={`${def.label} — ${unitLabel}`}
        subtitle="Selecione o indicador, o período e a forma de leitura"
        sourceIds={srcIds}
        scope="Sistema Sicoob (combinado)"
        dataBase="31/12 de cada ano; 30/06/2026"
        controls={
          <>
            <Segmented label="Período" value={range} onChange={setRange} options={[{ value: 'all', label: '2022–2026' }, { value: 'recent', label: '2024–2026' }]} />
            <Segmented label="Leitura" value={mode} onChange={setMode} options={[{ value: 'abs', label: 'Valor' }, { value: 'var', label: 'Variação' }]} />
          </>
        }
        table={<DataTable columns={['Período', 'Valor', 'Variação s/ ponto anterior', 'Status', 'Nota']} rows={data.map((d) => [
          d.period, d.value == null ? 'n.d.' : fmtNum(d.value, 1), d.variation == null ? '—' : `${fmtNum(d.variation, 1)}%${d.semestral ? ' (semestral)' : ''}`,
          <StatusBadge key="s" status={d.value == null ? 'official' : d.status} compact />, d.note ?? '',
        ])} />}
      >
        <div role="radiogroup" aria-label="Indicador" className="mb-4 flex flex-wrap gap-2">
          {annualSeries.map((s) => (
            <button key={s.key} role="radio" aria-checked={key === s.key} onClick={() => setKey(s.key)}
              className={`rounded-md border px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider transition ${key === s.key ? 'border-coop-700 bg-coop-700 text-white' : 'border-ink-200 text-ink-500 hover:border-coop-600 hover:text-coop-700'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 24, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="period" {...axisProps} />
              <YAxis {...axisProps} unit={mode === 'var' ? '%' : ''} />
              <Tooltip {...tooltipStyle} cursor={{ fill: '#f6f8f8' }}
                formatter={(raw, _n, item) => {
                  const v = raw as number | null;
                  const p = item.payload as (typeof data)[number];
                  if (v == null) return ['não disponível', def.label];
                  return mode === 'abs'
                    ? [`${fmtNum(v, 1)} ${def.unit === 'mi' ? 'mi' : 'bi'}${p.status === 'calculated' ? ' ◆ calculado' : ''}`, def.label]
                    : [`${fmtNum(v, 1)}%${p.semestral ? ' (dez→jun, semestral)' : ''}`, 'Variação'];
                }} />
              <Bar dataKey={mode === 'abs' ? 'value' : 'variation'} radius={[4, 4, 0, 0]} maxBarSize={64}>
                {data.map((d) => (
                  <Cell key={d.period} fill={d.status === 'calculated' ? '#b9b7e0' : d.semestral ? '#2bb5a3' : SERIES.a} />
                ))}
                <LabelList dataKey={mode === 'abs' ? 'value' : 'variation'} position="top"
                  formatter={(v: number | null) => (v == null ? 'n.d.' : mode === 'abs' ? fmtNum(v, 1) : `${fmtNum(v, 1)}%`)} className="fill-ink-700 text-[12px]" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-700">
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES.a }} />Dado oficial (dezembro)</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#2bb5a3]" />Dado oficial (junho — posição semestral)</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#b9b7e0]" />◆ Derivado de percentual divulgado</span>
          <span className="text-ink-500">n.d. = não localizado de forma comparável</span>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.3fr]">
          <div className="rounded-xl bg-ink-50 p-4 text-sm leading-relaxed text-ink-700">
            <p className="font-semibold text-ink-900">Conceito</p>
            <p className="mt-1">{def.concept}</p>
            {data.filter((d) => d.note).map((d) => <p key={d.period} className="mt-2 text-[13px] text-ink-500"><strong>{d.period}:</strong> {d.note}</p>)}
          </div>
          <Callout tone="analysis" title="Comentário analítico">{def.commentary}</Callout>
        </div>
      </ChartFrame>

      <SubHead>Série divulgada pelo Sicoob: junho/2022 → junho/2026</SubHead>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <ChartFrame title="Ativos, captações, crédito e PL — posições de junho (R$ bi)" subtitle="Eixo temporal proporcional. Jun/2023 e jun/2024 não constam do comunicado; as linhas apenas ligam os pontos publicados"
          sourceIds={['sicoob-1s26']} scope="Sistema Sicoob (combinado)" dataBase="30/06 de 2022, 2025 e 2026"
          table={<DataTable columns={['Período', 'Ativos', 'Captações', 'Crédito', 'PL']} rows={juneSeries.map((p) => [p.period, p.ativos, p.captacoes, p.credito, p.pl])} />}>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={juneTimed} margin={{ top: 16, right: 104, left: -8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="t" type="number" domain={[2022.5, 2026.5]} ticks={[2022.5, 2023.5, 2024.5, 2025.5, 2026.5]} tickFormatter={(t: number) => `jun/${Math.floor(t)}`} {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip {...tooltipStyle} labelFormatter={(t: number) => `jun/${Math.floor(t)}`} formatter={(v: number, n) => [`R$ ${fmtNum(v, 0)} bi`, n]} />
                <Line dataKey="ativos" name="Ativos" stroke={SERIES.a} strokeWidth={2} dot={{ r: 4 }}>
                  <LabelList dataKey="ativos" position="right" content={endLabel('Ativos', 2)} />
                </Line>
                <Line dataKey="captacoes" name="Captações" stroke={SERIES.b} strokeWidth={2} dot={{ r: 4 }}>
                  <LabelList dataKey="captacoes" position="right" content={endLabel('Captações', 2)} />
                </Line>
                <Line dataKey="credito" name="Crédito" stroke={SERIES.c} strokeWidth={2} dot={{ r: 4 }}>
                  <LabelList dataKey="credito" position="right" content={endLabel('Crédito', 2)} />
                </Line>
                <Line dataKey="pl" name="PL" stroke="#3b4648" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 4 }}>
                  <LabelList dataKey="pl" position="right" content={endLabel('PL', 2)} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-ink-700">
            {[['Ativos', SERIES.a], ['Captações', SERIES.b], ['Crédito', SERIES.c], ['PL (tracejado)', '#3b4648']].map(([l, c]) => (
              <span key={l} className="flex items-center gap-1.5"><i className="h-0.5 w-4" style={{ background: c }} />{l}</span>
            ))}
          </div>
        </ChartFrame>
        <div className="grid content-start gap-3">
          {(['ativos', 'captacoes', 'credito', 'pl'] as const).map((k) => (
            <div key={k} className="flex items-center justify-between rounded-xl border border-ink-100 bg-white p-4">
              <div>
                <p className="text-sm font-semibold text-ink-900">{cagrs[k].label}</p>
                <p className="text-[12px] text-ink-500">Acumulado jun/22→jun/26: +{fmtNum(accumulated[k], 0)}%</p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl tabular-nums text-ink-900">{fmtNum(cagrs[k].value, 1)}% a.a.</p>
                <p className="flex items-center justify-end gap-1 text-[11px] text-ink-500"><StatusBadge status="calculated" compact /> <SourceButton sourceId="sescoop-analise" metric={cagrs[k]} label="Fórmula" /></p>
              </div>
            </div>
          ))}
          <p className="text-[12px] leading-relaxed text-ink-500">
            O comunicado do Sicoob informa 21,7% a.a. (ativos), 17,3% (crédito) e 18,5% (PL) — valores reproduzidos pelo cálculo acima, o que confirma a consistência da série.
          </p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard metric={{ ...cagrs.captacoes, label: 'Captações — média anual' }} sub="O vetor mais rápido do balanço" />
        <KpiCard metric={{ ...cagrs.credito, label: 'Crédito — média anual' }} sub="O vetor mais lento" />
        <KpiCard metric={{ ...cagrs.pl, label: 'PL — média anual' }} sub="Abaixo dos ativos" />
        <KpiCard metric={{ ...cagrs.ativos, label: 'Ativos — média anual' }} sub="Dobro em quatro anos" />
      </div>
    </Section>
  );
}

/** Rótulo direto apenas no último ponto de cada linha. */
function endLabel(name: string, lastIndex: number) {
  return (props: { x?: number | string; y?: number | string; value?: number | string; index?: number }) => {
    if (props.index !== lastIndex) return null;
    return (
      <text x={Number(props.x) + 8} y={Number(props.y) + 4} fontSize={12} fill="#3b4648">
        {name} {props.value}
      </text>
    );
  };
}
