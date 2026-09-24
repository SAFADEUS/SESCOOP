import { useState } from 'react';
import { sys25, sys24, sys23, sys26, sys1s25 } from '../data/metrics';
import { fmtNum } from '../lib/format';
import { ratios } from '../lib/derived';
import { Callout, KpiCard, Section, SourceButton, StatusBadge } from './ui';

interface DsoLine { key: string; label: string; level: 0 | 1 | 2; kind: 'rev' | 'exp' | 'sub' | 'dest'; meaning: string; watch: string; value?: string; sourceId?: string }

/** Estrutura típica da Demonstração de Sobras ou Perdas (padrão COSIF para cooperativas de crédito). */
const lines: DsoLine[] = [
  { key: 'rif', label: 'Receitas da intermediação financeira', level: 0, kind: 'rev', meaning: 'Rendas de operações de crédito, de aplicações interfinanceiras e de títulos e valores mobiliários. É a principal fonte de receita de uma cooperativa de crédito.', watch: 'Participação das rendas de crédito versus tesouraria: com crédito/ativos em queda, a tesouraria tende a ganhar peso.' },
  { key: 'dif', label: 'Despesas da intermediação financeira', level: 0, kind: 'exp', meaning: 'Remuneração de depósitos e letras (LCA/LCI), despesas de repasses e — conforme a norma vigente — provisões para perdas esperadas associadas ao risco de crédito.', watch: 'Custo de captação: captações crescem acima do crédito, e o BC apontou alta do custo de funding no SNCC em 2025.' },
  { key: 'pcld', label: 'Provisões para perdas esperadas (risco de crédito)', level: 1, kind: 'exp', meaning: 'Reconhecimento antecipado de perdas prováveis da carteira. Cresce quando a inadimplência sobe ou quando a carteira migra para estágios de maior risco.', watch: 'Principal variável de risco para 2026, dada a alta de ativos problemáticos no SNCC.' },
  { key: 'rbif', label: 'Resultado bruto da intermediação financeira', level: 0, kind: 'sub', meaning: 'Margem financeira após o custo de captação e as provisões. Mede quanto a atividade-fim gera antes das despesas de estrutura.', watch: 'Sensível a Selic, spread e qualidade da carteira.' },
  { key: 'serv', label: 'Receitas de prestação de serviços e tarifas', level: 1, kind: 'rev', meaning: 'Cartões, cobrança, conta, consórcios, seguros (comissões), adquirência. Receita menos dependente do ciclo de juros.', watch: 'Diversificação de receitas: dado consolidado não localizado.' },
  { key: 'pess', label: 'Despesas de pessoal', level: 1, kind: 'exp', meaning: 'Remuneração, encargos e benefícios de 60.991 empregados diretos (2025).', watch: 'Produtividade por empregado.' },
  { key: 'adm', label: 'Outras despesas administrativas', level: 1, kind: 'exp', meaning: 'Rede física, tecnologia, processamento, comunicação, serviços de terceiros.', watch: 'Custo da rede de 4.727 unidades e da plataforma digital.' },
  { key: 'trib', label: 'Despesas tributárias e outras receitas/despesas operacionais', level: 1, kind: 'exp', meaning: 'Tributos incidentes (atos cooperativos têm tratamento específico) e demais itens operacionais.', watch: '—' },
  { key: 'rop', label: 'Resultado operacional', level: 0, kind: 'sub', meaning: 'Resultado da atividade após despesas de estrutura.', watch: 'Eficiência operacional.' },
  { key: 'antes', label: 'Sobras antes de tributação, participações e JCP', level: 0, kind: 'sub', meaning: 'Inclui resultado não operacional. IR/CSLL incidem apenas sobre atos não cooperativos.', watch: '—' },
  { key: 'res', label: 'Resultado do exercício antes de JCP (divulgado)', level: 0, kind: 'sub', value: `R$ ${fmtNum(sys25.sobrasAntesJcp.value, 1)} bi (2025)`, sourceId: 'sicoob-2025-resultado', meaning: 'Métrica utilizada nos comunicados anuais do Sicoob. Equivale ao “lucro” de uma empresa convencional, mas pertence aos cooperados.', watch: `Evolução: R$ ${fmtNum(sys23.sobras.value, 1)} bi (2023) → R$ ${fmtNum(sys24.sobras.value, 1)} bi (2024) → R$ ${fmtNum(sys25.sobrasAntesJcp.value, 1)} bi (2025).` },
  { key: 'jcp', label: '(−) Juros sobre o capital próprio', level: 1, kind: 'dest', meaning: 'Remuneração do capital social integralizado pelos cooperados, limitada pela legislação cooperativa.', watch: 'Valor combinado não localizado nas fontes acessadas.' },
  { key: 'dest', label: '(−) Destinações legais e estatutárias', level: 1, kind: 'dest', meaning: 'Reserva legal (mín. 10%) e FATES (mín. 5%) — Lei 5.764/71 — além de reservas estatutárias. Parcelas indivisíveis que reforçam o patrimônio e financiam educação e assistência.', watch: 'Parte relevante do resultado permanece no patrimônio — daí o crescimento do PL.' },
  { key: 'sobras', label: 'Sobras à disposição da assembleia', level: 0, kind: 'sub', meaning: 'Parcela que a assembleia de cada cooperativa pode distribuir aos cooperados (proporcional às operações), capitalizar ou destinar a outros fundos.', watch: 'Valor combinado não localizado.' },
];

export function IncomeStatementAnalysis() {
  const [open, setOpen] = useState<string>('res');
  const current = lines.find((l) => l.key === open)!;
  return (
    <Section
      id="resultado"
      kicker="08 · Demonstração de sobras ou perdas"
      title="Da intermediação às sobras: onde o resultado é formado"
      tone="mist"
      lead={<>
        Cooperativas de crédito publicam a <strong>Demonstração de Sobras ou Perdas</strong>, não uma DRE empresarial. A estrutura abaixo segue as
        rubricas do padrão contábil aplicável (COSIF). Os valores combinados de cada rubrica não puderam ser reproduzidos nesta versão;
        apenas os agregados publicados nos comunicados são exibidos. Clique em cada linha para ver seu significado e o que acompanhar.
      </>}
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <ol className="rounded-2xl border border-ink-100 bg-white p-2">
          {lines.map((l) => (
            <li key={l.key}>
              <button onClick={() => setOpen(l.key)} aria-expanded={open === l.key}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${open === l.key ? 'bg-coop-50' : 'hover:bg-ink-50'}`}
                style={{ paddingLeft: `${12 + l.level * 18}px` }}>
                <span className={`${l.kind === 'sub' ? 'font-semibold text-ink-900' : 'text-ink-700'}`}>
                  {l.kind === 'rev' && <span className="mr-1 text-coop-700" aria-label="receita">+</span>}
                  {l.kind === 'exp' && <span className="mr-1 text-[#a14a3a]" aria-label="despesa">−</span>}
                  {l.kind === 'sub' && <span className="mr-1 text-ink-400" aria-hidden>=</span>}
                  {l.label}
                </span>
                <span className={`shrink-0 text-[12px] tabular-nums ${l.value ? 'font-semibold text-ink-900' : 'text-ink-400'}`}>{l.value ?? 'não reproduzido'}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-coop-200 bg-white p-5">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-coop-700">Rubrica selecionada</p>
            <p className="mt-1 font-display text-xl text-ink-900">{current.label}</p>
            {current.value && <p className="mt-1 flex items-center gap-2 text-sm"><StatusBadge status="official" /> {current.value} {current.sourceId && <SourceButton sourceId={current.sourceId} />}</p>}
            <p className="mt-3 text-sm leading-relaxed text-ink-700"><strong>O que significa. </strong>{current.meaning}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-700"><strong>O que acompanhar. </strong>{current.watch}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <KpiCard metric={sys25.sobrasAntesJcp} />
            <KpiCard metric={sys25.resultadoFinanceiroRS} />
            <KpiCard metric={sys1s25.resultado} />
            <KpiCard metric={sys26.resultado} />
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Callout tone="warn" title="R$ 11,2 bi × R$ 7,8 bi: os documentos utilizam conceitos/escopos distintos">
          O comunicado anual informa R$ 11,2 bi de resultado do exercício antes de JCP; o Relatório de Sustentabilidade destaca R$ 7,7–7,8 bi em
          “resultados financeiros”. A diferença (≈ R$ 3,4 bi) pode refletir JCP, destinações a reservas e FATES, tributos sobre atos não cooperativos,
          perímetro de entidades ou eliminações de combinação. <strong>Nenhuma hipótese é adotada como fato</strong>; a conciliação exige as DC combinadas.
        </Callout>
        <Callout tone="calculated" title="Rentabilidade derivada de 2025">
          Resultado antes de JCP ÷ PL médio = {fmtNum(ratios.roe25.value, 1)}%; ÷ ativos médios = {fmtNum(ratios.roa25.value, 2)}%. Não é retorno ao acionista:
          em cooperativas, mede a capacidade de gerar capital e de devolver valor aos cooperados. Semestres não são anualizados.
        </Callout>
      </div>
    </Section>
  );
}
