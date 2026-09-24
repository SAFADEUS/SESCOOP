import { macro, sncc25, sys25 } from '../data/metrics';
import { ratios } from '../lib/derived';
import { fmtNum } from '../lib/format';
import { Callout, ChartFrame, DataTable, KpiCard, Section } from './ui';
import { SERIES } from './chartTheme';

const TOTAL = macro.municipiosBrasil.value;
const sicoobExcl = sys25.municipiosExclusivos.value;
const sicoobOther = sys25.municipios.value - sicoobExcl;
const snccOnly = Math.max(sncc25.municipios.value - sys25.municipios.value, 0);
const none = TOTAL - sncc25.municipios.value;

const cats = [
  { k: 'Sicoob é a única instituição financeira física', n: sicoobExcl, color: '#003641' },
  { k: 'Sicoob presente, com outras instituições', n: sicoobOther, color: SERIES.a },
  { k: 'Outras cooperativas, sem Sicoob (derivado)', n: snccOnly, color: '#8fd3c8' },
  { k: 'Sem cooperativa de crédito', n: none, color: '#eceff0' },
];

/** Waffle 100 células: cada célula ≈ 55,7 municípios. Arredondamento por maiores restos. */
function waffle() {
  const raw = cats.map((c) => (c.n / TOTAL) * 100);
  const floor = raw.map(Math.floor);
  let rest = 100 - floor.reduce((a, b) => a + b, 0);
  raw.map((r, i) => ({ i, f: r - Math.floor(r) })).sort((a, b) => b.f - a.f).forEach(({ i }) => { if (rest > 0) { floor[i]++; rest--; } });
  return floor.flatMap((n, i) => Array.from({ length: n }, () => cats[i]));
}

export function GeographicPresence() {
  const cells = waffle();
  return (
    <Section id="territorio" kicker="22 · Capilaridade e interiorização" title="Presença onde o sistema financeiro tradicional recua"
      lead={<>
        Os 5.570 municípios brasileiros, classificados pela presença do Sicoob e do cooperativismo de crédito. A leitura é de <strong>interiorização financeira</strong>:
        78% dos municípios atendidos pelo Sicoob têm até 50 mil habitantes.
      </>}>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <ChartFrame title="Municípios brasileiros por tipo de presença" subtitle="Cada quadrado ≈ 56 municípios (100 quadrados = 5.570)"
          sourceIds={['sicoob-rs-2025', 'bcb-sncc-2025', 'ibge-municipios']} scope="Brasil — municípios" dataBase="dez/2025"
          table={<DataTable columns={['Categoria', 'Municípios', '% do total']} rows={cats.map((c) => [c.k, fmtNum(c.n, 0), `${fmtNum((c.n / TOTAL) * 100, 1)}%`])} />}>
          <div className="grid grid-cols-10 gap-[3px] sm:gap-1" role="img" aria-label="Waffle de presença municipal">
            {cells.map((c, i) => <span key={i} title={c.k} className="aspect-square rounded-[3px]" style={{ background: c.color }} />)}
          </div>
          <ul className="mt-4 space-y-1.5 text-sm">
            {cats.map((c) => (
              <li key={c.k} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-ink-700"><i className="h-3 w-3 rounded-sm ring-1 ring-ink-200" style={{ background: c.color }} />{c.k}</span>
                <span className="tabular-nums text-ink-900">{fmtNum(c.n, 0)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-ink-500">
            “Outras cooperativas, sem Sicoob” = 3.287 (SNCC, BC) − 2.486 (Sicoob, RS 2025), assumindo que todo município com Sicoob está contido no total do SNCC.
            Fontes distintas; leitura aproximada.
          </p>
        </ChartFrame>
        <div className="grid content-start gap-3">
          <KpiCard metric={sys25.municipios} emphasis sub={`${fmtNum(ratios.coberturaMunicipal.value, 1)}% dos municípios do país (cálculo próprio)`} />
          <KpiCard metric={sys25.municipiosExclusivos} sub="O Sicoob é o único ponto físico de acesso ao sistema financeiro" />
          <KpiCard metric={sys25.municipiosPequenos} />
          <KpiCard metric={sncc25.saidaSFN} sub={`enquanto o SNCC passou a atender ${sncc25.novosMunicipios.value} novos municípios`} />
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Callout tone="analysis" title="Municípios pequenos">
          Em 423 municípios, fechar a unidade do Sicoob significaria deixar a população sem acesso físico a serviços financeiros. Isso cria
          uma responsabilidade institucional e, ao mesmo tempo, uma posição competitiva protegida. A viabilidade econômica dessas unidades
          não é divulgada e deve ser acompanhada.
        </Callout>
        <Callout tone="sector" title="Mapa por estado">
          A distribuição de unidades e cooperados por UF não foi localizada de forma consolidada nas fontes consultadas. Em vez de um mapa com dados
          inferidos, esta seção mostra a cobertura municipal agregada. A versão estadual depende do Relatório de Sustentabilidade completo ou de dados das centrais.
        </Callout>
      </div>
    </Section>
  );
}
