import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { sys24, sys25 } from '../data/metrics';
import { ratios } from '../lib/derived';
import { fmtNum } from '../lib/format';
import { Callout, ChartFrame, DataTable, KpiCard, Section } from './ui';
import { SERIES, axisProps, GRID, tooltipStyle } from './chartTheme';

const comps = [
  { k: 'BEC', n: 'Benefício Econômico do Crédito', d: 'Diferença entre as taxas praticadas pelo Sicoob e a média de mercado nas mesmas modalidades, aplicada ao volume do cooperado.' },
  { k: 'BED', n: 'Benefício Econômico dos Depósitos', d: 'Remuneração superior de aplicações a prazo em relação à referência de mercado. Divulgado como superior a R$ 5,8 bi em 2025.' },
  { k: 'BEP', n: 'Benefício Econômico de Produtos e Serviços', d: 'Tarifas e preços menores que os praticados pelo mercado em produtos e serviços.' },
  { k: 'BEE', n: 'Benefício Econômico do Exercício', d: 'Participação do cooperado no resultado contábil das cooperativas no exercício, proporcional às suas operações.' },
];

const evo = [
  { ano: '2024', v: sys24.beneficio.value },
  { ano: '2025', v: sys25.beneficio.value },
];

export function CooperativeEconomics() {
  return (
    <Section id="beneficio" kicker="15 · Benefício econômico ao cooperado" title="R$ 49,8 bilhões de vantagem comparativa — que não é receita nem lucro" tone="mist"
      lead={<>
        O Sicoob mensura, com metodologia própria, quanto o cooperado deixou de pagar ou passou a receber a mais por operar com a cooperativa, em relação a
        preços médios de mercado. É uma métrica de <strong>valor transferido ao cooperado</strong>, calculada fora da contabilidade.
      </>}>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="grid content-start grid-cols-2 gap-3">
          <KpiCard metric={sys25.beneficio} emphasis />
          <KpiCard metric={sys25.beneficioPorCooperado} sub="+29,3% sobre 2024 (divulgado)" />
          <KpiCard metric={sys25.bed} />
          <KpiCard metric={ratios.beneficioSobreResultado} sub="vezes o resultado antes de JCP" />
        </div>
        <ChartFrame title="Benefício econômico total (R$ bi)" subtitle="Divulgado como crescimento de “mais de 25%”; o cálculo com os valores publicados resulta em 24,6% — possível revisão do valor de 2024" sourceIds={['sicoob-beneficio-2024', 'sicoob-beneficio-2025']} scope="Sistema Sicoob" dataBase="exercícios 2024 e 2025"
          table={<DataTable columns={['Ano', 'R$ bi']} rows={evo.map((e) => [e.ano, fmtNum(e.v, 2)])} />}>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={evo} margin={{ top: 24, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="ano" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [`R$ ${fmtNum(v, 2)} bi`, 'Benefício']} cursor={{ fill: '#f6f8f8' }} />
                <Bar dataKey="v" fill={SERIES.a} radius={[4, 4, 0, 0]} maxBarSize={72}>
                  <LabelList dataKey="v" position="top" formatter={(v: number) => fmtNum(v, 1)} className="fill-ink-700 text-[12px]" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {comps.map((c) => (
          <div key={c.k} className="rounded-xl border border-ink-100 bg-white p-4">
            <p className="font-display text-2xl text-coop-700">{c.k}</p>
            <p className="text-sm font-semibold text-ink-900">{c.n}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-700">{c.d}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[12px] text-ink-500">Valores individuais de BEC, BEP e BEE não foram localizados nas fontes acessadas; não são estimados.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Callout tone="analysis" title="Como ler">
          O benefício depende da referência de mercado escolhida e da metodologia do Sicoob; não é auditado como as demonstrações contábeis.
          Serve para comparar a evolução ao longo do tempo e para comunicar ao cooperado o valor do modelo — não para somar ao resultado.
        </Callout>
        <Callout tone="analysis" title="Implicação estratégica">
          A vantagem média de R$ 7.352 por cooperado é o principal argumento de retenção frente a bancos digitais. Seu efeito depende de o cooperado
          conhecer o próprio benefício — hoje comunicado como média sistêmica.
        </Callout>
      </div>
    </Section>
  );
}
