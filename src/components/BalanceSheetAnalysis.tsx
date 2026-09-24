import { useState } from 'react';
import { sys25, juneSeries } from '../data/metrics';
import { fmtNum } from '../lib/format';
import { Callout, ChartFrame, Section, Segmented, StatusBadge } from './ui';
import { SERIES } from './chartTheme';
import type { Status } from '../data/types';

interface Line { label: string; value: number; status: Status; var?: number; note?: string }

const A = sys25.ativos.value;
const outrosAtivos = A - sys25.opCredito.value;
const outrasCaptacoes = sys25.captacoes.value - sys25.depositos.value;
const outrosPassivos = A - sys25.captacoes.value - sys25.pl.value;

const ativo: Line[] = [
  { label: 'Operações de crédito', value: sys25.opCredito.value, status: 'official', note: 'Relatório de Sustentabilidade 2025.' },
  { label: 'Demais ativos (aplicações interfinanceiras, TVM, disponibilidades, outros)', value: outrosAtivos, status: 'calculated', note: 'Residual: ativos totais − operações de crédito. Composição não publicada nas fontes acessadas.' },
];
const passivo: Line[] = [
  { label: 'Depósitos totais', value: sys25.depositos.value, status: 'official', var: sys25.depositosVar.value },
  { label: 'Outras captações (LCA, LCI e demais)', value: outrasCaptacoes, status: 'calculated', note: 'Captações totais (R$ 319,1 bi) − depósitos (R$ 266,1 bi).' },
  { label: 'Demais obrigações', value: outrosPassivos, status: 'calculated', note: 'Residual: ativos − captações − PL (inclui repasses, obrigações diversas, provisões).' },
  { label: 'Patrimônio líquido', value: sys25.pl.value, status: 'official', var: sys25.plVar.value },
];

const notReproduced = ['Disponibilidades', 'Aplicações interfinanceiras de liquidez', 'Títulos e valores mobiliários', 'Provisão para perdas esperadas', 'Imobilizado e intangível', 'Relações interfinanceiras', 'Instrumentos financeiros derivativos', 'Capital social', 'Reservas (legal, FATES, estatutárias)', 'Sobras ou perdas acumuladas'];

export function BalanceSheetAnalysis() {
  const [mode, setMode] = useState<'rs' | 'pct'>('pct');
  const show = (v: number) => (mode === 'rs' ? `R$ ${fmtNum(v, 1)} bi` : `${fmtNum((v / A) * 100, 1)}%`);
  const j25 = juneSeries[1], j26 = juneSeries[2];

  return (
    <Section
      id="balanco"
      kicker="07 · Estrutura patrimonial"
      title="Um balanço financiado por depósitos e cada vez mais líquido"
      lead={<>
        Análise vertical (participação no ativo total) e horizontal (variação anual) do Sistema Sicoob em 31/12/2025, com as rubricas efetivamente
        divulgadas. As linhas residuais são indicadores calculados e estão identificadas.
      </>}
    >
      <ChartFrame title="Balanço combinado — 31/12/2025" subtitle={`Ativo total: R$ ${fmtNum(A, 1)} bi`} sourceIds={['sicoob-2025-balanco', 'sicoob-rs-2025', 'sescoop-analise']} scope="Sistema Sicoob (combinado)" dataBase="31/12/2025"
        controls={<Segmented label="Unidade" value={mode} onChange={setMode} options={[{ value: 'pct', label: '% do ativo' }, { value: 'rs', label: 'R$' }]} />}>
        <div className="grid gap-6 md:grid-cols-2">
          <Side title="Ativo" lines={ativo} show={show} total={A} color={SERIES.a} />
          <Side title="Passivo + PL" lines={passivo} show={show} total={A} color={SERIES.b} />
        </div>
      </ChartFrame>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <p className="font-semibold text-ink-900">Análise horizontal — variações anuais divulgadas (2025/2024)</p>
          <ul className="mt-3 space-y-2 text-sm">
            {[sys25.ativosVar, sys25.captacoesVar, sys25.carteiraAmpliadaVar, sys25.depositosVar, sys25.plVar].map((m) => (
              <li key={m.id} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-ink-700 sm:w-56">{m.label.replace(' — variação anual', '')}</span>
                <span className="h-2 flex-1 rounded-full bg-ink-100"><span className="block h-2 rounded-full" style={{ width: `${(m.value / 25) * 100}%`, background: SERIES.a }} /></span>
                <span className="w-14 text-right font-medium tabular-nums text-ink-900">{fmtNum(m.value, 1)}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-ink-500">Fonte: comunicado de resultados 2025 do Sicoob. Escala da barra: 0–25%.</p>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <p className="font-semibold text-ink-900">Comparação jun/2025 × jun/2026 (conceitos do comunicado de 2026)</p>
          <table className="mt-3 w-full text-sm">
            <thead><tr className="text-left text-[12px] uppercase tracking-wider text-ink-500"><th className="py-1">R$ bi</th><th className="text-right">jun/25</th><th className="text-right">jun/26</th><th className="text-right">% ativo 26</th></tr></thead>
            <tbody>
              {(['ativos', 'credito', 'captacoes', 'pl'] as const).map((k) => (
                <tr key={k} className="border-t border-ink-100">
                  <td className="py-2 capitalize text-ink-700">{k === 'pl' ? 'PL' : k === 'captacoes' ? 'Captações' : k === 'credito' ? 'Crédito' : 'Ativos'}</td>
                  <td className="text-right tabular-nums">{j25[k]}</td>
                  <td className="text-right tabular-nums font-medium text-ink-900">{j26[k]}</td>
                  <td className="text-right tabular-nums text-ink-500">{fmtNum((j26[k] / j26.ativos) * 100, 1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Callout tone="analysis" title="Leitura">
          Metade do ativo é crédito; a outra metade, aplicações de liquidez e títulos. O passivo é majoritariamente de depósitos (≈ 62% do ativo),
          funding pulverizado e de origem local — característica de solidez do modelo cooperativo. O PL financia ≈ 15% do ativo, patamar elevado
          para instituições financeiras.
        </Callout>
        <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-sm text-ink-700">
          <p className="font-semibold text-ink-900">Rubricas não reproduzidas nesta versão</p>
          <p className="mt-1 text-[13px]">Indicador não disponibilizado de forma consolidada nas fontes analisadas — consultar as Demonstrações Contábeis Combinadas:</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {notReproduced.map((n) => <span key={n} className="rounded-full bg-white px-2 py-0.5 text-[12px] ring-1 ring-ink-200">{n}</span>)}
          </div>
        </div>
      </div>
    </Section>
  );
}

function Side({ title, lines, show, total, color }: { title: string; lines: Line[]; show: (v: number) => string; total: number; color: string }) {
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-500">{title}</p>
      <div className="mt-2 flex h-4 overflow-hidden rounded-full bg-ink-100" aria-hidden>
        {lines.map((l, i) => (
          <span key={l.label} style={{ width: `${(l.value / total) * 100}%`, background: color, opacity: 1 - i * 0.22 }} className="border-r-2 border-white last:border-r-0" />
        ))}
      </div>
      <ul className="mt-3 divide-y divide-ink-100">
        {lines.map((l, i) => (
          <li key={l.label} className="py-2.5">
            <div className="flex items-start justify-between gap-3">
              <span className="flex items-start gap-2 text-sm text-ink-900">
                <i className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: color, opacity: 1 - i * 0.22 }} />
                {l.label}
              </span>
              <span className="shrink-0 font-medium tabular-nums text-ink-900">{show(l.value)}</span>
            </div>
            <div className="ml-4 mt-1 flex flex-wrap items-center gap-2 text-[12px] text-ink-500">
              <StatusBadge status={l.status} compact />
              {l.var != null && <span>+{fmtNum(l.var, 1)}% a/a</span>}
              {l.note && <span>{l.note}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
