import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { anuario26, sncc25, sys25 } from '../data/metrics';
import { fmtBi, fmtNum } from '../lib/format';
import { ChartFrame, DataTable, InfoTip, KpiCard, Section, SourceButton, StatusBadge, SubHead, Callout } from './ui';
import { SERIES, axisProps, GRID, tooltipStyle } from './chartTheme';

const layers = [
  { name: 'Cooperativismo brasileiro', tag: 'Todos os ramos · Sistema OCB', status: 'sector' as const, a: `${fmtNum(anuario26.cooperadosBrasil.value, 0)} mi cooperados`, b: `R$ ${fmtNum(anuario26.movimentacao.value, 0)} bi movimentados`, src: 'anuariocoop-2026', w: '100%' },
  { name: 'Ramo Crédito', tag: 'AnuárioCoop · vínculos', status: 'sector' as const, a: `${fmtNum(anuario26.cooperadosCredito.value, 2)} mi cooperados/vínculos`, b: 'R$ 1,1 tri em ativos', src: 'anuariocoop-2026', w: '88%' },
  { name: 'SNCC', tag: 'Banco Central · CPF/CNPJ únicos', status: 'sector' as const, a: `${fmtNum(sncc25.cooperados.value, 1)} mi cooperados únicos`, b: `${fmtBi(sncc25.ativos.value / 1000, 3).replace(' bi', ' tri')} em ativos`, src: 'bcb-sncc-2025', w: '76%' },
  { name: 'Sistema Sicoob', tag: 'Sicoob · combinado', status: 'official' as const, a: `${fmtNum(sys25.cooperadosRS.value, 1)} mi cooperados`, b: `${fmtBi(sys25.ativos.value)} em ativos`, src: 'sicoob-rs-2025', w: '58%' },
];

const snccGrowth = [
  { ano: '2021', ativos: sncc25.ativos2021.value },
  { ano: '2024', ativos: sncc25.ativos2024.value },
  { ano: '2025', ativos: sncc25.ativos.value },
];

const shares = [
  { k: 'Ativos', v25: sncc25.shareAtivos.value, v24: null as number | null },
  { k: 'Crédito', v25: sncc25.shareCredito.value, v24: sncc25.shareCredito24.value },
  { k: 'Depósitos', v25: sncc25.shareDepositos.value, v24: sncc25.shareDepositos24.value },
];

export function CooperativePanorama() {
  return (
    <Section
      id="cooperativismo"
      kicker="02 · Panorama cooperativista"
      title="O cooperativismo financeiro ultrapassou R$ 1 trilhão em ativos"
      tone="mist"
      lead={<>
        Três recortes diferentes, que não devem ser confundidos: o <strong>cooperativismo brasileiro</strong> (todos os ramos),
        o <strong>cooperativismo de crédito</strong> (ramo Crédito, na metodologia do Sistema OCB, e SNCC, na do Banco Central) e o <strong>Sicoob</strong>,
        um dos sistemas que compõem o SNCC.
      </>}
    >
      <div className="space-y-2" role="list" aria-label="Do cooperativismo brasileiro ao Sicoob">
        {layers.map((l, i) => (
          <div key={l.name} role="listitem" className="mx-auto" style={{ width: `min(100%, ${l.w})` }}>
            <div className={`flex flex-col gap-1 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${i === 3 ? 'border-coop-600 bg-coop-900 text-white' : 'border-ink-200 bg-white'}`}>
              <div>
                <p className={`text-[15px] font-semibold ${i === 3 ? 'text-white' : 'text-ink-900'}`}>{l.name}</p>
                <p className={`text-[12px] ${i === 3 ? 'text-coop-200' : 'text-ink-500'}`}>{l.tag}</p>
              </div>
              <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-sm tabular-nums ${i === 3 ? 'text-coop-50' : 'text-ink-700'}`}>
                <span>{l.a}</span><span>{l.b}</span>
                <span className={i === 3 ? '[&_button]:text-coop-100' : ''}><SourceButton sourceId={l.src} /></span>
              </div>
            </div>
            {i < 3 && <div className="py-0.5 text-center text-ink-400" aria-hidden>↓</div>}
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[12px] text-ink-500">
        Larguras ilustrativas da hierarquia (não proporcionais). Data-base: 2025.
        <InfoTip text="Bases diferentes podem considerar CPFs/CNPJs únicos, vínculos cooperativos ou critérios cadastrais distintos. Os 21,2 mi do Banco Central (CPF/CNPJ únicos) e os 22,96 mi do AnuárioCoop (vínculos) não são erro: medem coisas diferentes." />
      </p>

      <SubHead>Dimensão do SNCC</SubHead>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard metric={sncc25.ativos} sub={<>+{fmtNum(sncc25.ativosVar.value, 1)}% em 2025</>} />
        <KpiCard metric={sncc25.cooperados} sub={<>{fmtNum(sncc25.cooperadosPF.value, 1)} mi PF · {fmtNum(sncc25.cooperadosPJ.value, 1)} mi PJ</>} />
        <KpiCard metric={sncc25.municipiosPct} sub={<>{fmtNum(sncc25.municipios.value, 0)} municípios</>} />
        <KpiCard metric={sncc25.municipiosExclusivos} sub="única IF com presença física" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartFrame title="Ativos do SNCC (R$ bi)" subtitle="Mais que dobraram entre 2021 e 2025" sourceIds={['bcb-sncc-2025']} scope="Sistema Nacional de Crédito Cooperativo" dataBase="31/12 de cada ano"
          table={<DataTable columns={['Ano', 'Ativos (R$ bi)']} rows={snccGrowth.map((d) => [d.ano, fmtNum(d.ativos, 1)])} />}>
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={snccGrowth} margin={{ top: 24, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="ano" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [fmtBi(v), 'Ativos']} cursor={{ fill: '#f6f8f8' }} />
                <Bar dataKey="ativos" fill={SERIES.a} radius={[4, 4, 0, 0]} maxBarSize={56}>
                  <LabelList dataKey="ativos" position="top" formatter={(v: number) => fmtNum(v, 1)} className="fill-ink-700 text-[12px]" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[12px] text-ink-500">2022 e 2023 não exibidos: valores não localizados na mesma publicação. O eixo mostra apenas os anos disponíveis.</p>
        </ChartFrame>

        <ChartFrame title="Participação do SNCC no Sistema Financeiro Nacional (%)" subtitle="Ganho de participação em crédito e depósitos em um ano" sourceIds={['bcb-sncc-2025', 'ocb-sncc-2025']} scope="SNCC ÷ SFN" dataBase="dez/2024 e dez/2025"
          table={<DataTable columns={['Indicador', '2024', '2025']} rows={shares.map((s) => [s.k, s.v24 == null ? '—' : `${fmtNum(s.v24, 1)}%`, `${fmtNum(s.v25, 1)}%`])} />}>
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={shares} margin={{ top: 24, right: 8, left: -18, bottom: 0 }} barGap={2}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="k" {...axisProps} />
                <YAxis {...axisProps} unit="%" />
                <Tooltip {...tooltipStyle} formatter={(v: number, n) => [`${fmtNum(v, 1)}%`, n]} cursor={{ fill: '#f6f8f8' }} />
                <Bar dataKey="v24" name="2024" fill={SERIES.b} radius={[4, 4, 0, 0]} maxBarSize={36}>
                  <LabelList dataKey="v24" position="top" formatter={(v: number | null) => (v == null ? '' : fmtNum(v, 1))} className="fill-ink-700 text-[12px]" />
                </Bar>
                <Bar dataKey="v25" name="2025" fill={SERIES.a} radius={[4, 4, 0, 0]} maxBarSize={36}>
                  <LabelList dataKey="v25" position="top" formatter={(v: number) => fmtNum(v, 1)} className="fill-ink-700 text-[12px]" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex gap-4 text-[12px] text-ink-700">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES.b }} />2024</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES.a }} />2025</span>
            <span className="text-ink-500">Participação nos ativos em 2024 não localizada.</span>
          </div>
        </ChartFrame>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Callout tone="sector" title="Leitura setorial">
          O SNCC ganhou 1 p.p. de participação no crédito e 1,5 p.p. nos depósitos do SFN em um único ano. O avanço é mais forte em depósitos do que em
          crédito — padrão que se repete no Sicoob (captações crescendo acima da carteira).
        </Callout>
        <Callout tone="analysis" title="Por que importa para o Sicoob">
          O setor cresce em um ambiente de alta de ativos problemáticos (7,8% da carteira em dez/2025) e de maior custo de captação.
          Crescer acima do setor, portanto, não basta: é preciso verificar se o crescimento preserva qualidade de carteira e margem. <StatusBadge status="analysis" compact />
        </Callout>
      </div>
    </Section>
  );
}
