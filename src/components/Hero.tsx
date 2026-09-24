import { motion, useReducedMotion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { sys26, juneSeries } from '../data/metrics';
import { ANALYSIS_DATE } from '../data/sources';
import { fmtMetric } from '../lib/format';
import { SourceButton } from './ui';

const kpis = [
  { m: sys26.cooperados, short: '10M', label: 'Cooperados' },
  { m: sys26.ativos, short: 'R$ 471 bi', label: 'Ativos' },
  { m: sys26.credito, short: 'R$ 263 bi', label: 'Carteira de crédito' },
  { m: sys26.pl, short: 'R$ 67 bi', label: 'Patrimônio líquido' },
  { m: sys26.basileia, short: fmtMetric(sys26.basileia), label: 'Índice de Basileia' },
];

export function Hero({ onMethodology }: { onMethodology: () => void }) {
  const reduce = useReducedMotion();
  return (
    <section id="top" className="relative overflow-hidden bg-coop-900 text-white">
      {/* Linha discreta da trajetória de ativos (jun/22 → jun/26) como elemento de fundo com significado */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 opacity-25" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={juneSeries} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2bb5a3" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#2bb5a3" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="ativos" stroke="#7db61c" strokeWidth={2} fill="url(#heroFill)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
        <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-coop-200">
            Diagnóstico Estratégico e Econômico-Financeiro
          </p>
          <h1 className="mt-4 font-display text-6xl font-semibold tracking-tight sm:text-8xl">SICOOB</h1>
          <p className="mt-5 max-w-3xl font-display text-2xl leading-snug text-white sm:text-3xl">
            Escala financeira com lógica cooperativista.
          </p>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-coop-100 sm:text-[17px]">
            Uma análise da estrutura, do desempenho econômico-financeiro, do posicionamento competitivo e da geração de valor
            de um dos maiores sistemas financeiros cooperativos do Brasil.
          </p>
          <p className="mt-2 max-w-2xl text-sm text-coop-200">
            Panorama cooperativista, modelo de negócio, desempenho, posicionamento e perspectivas.
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((k, i) => (
            <motion.div
              key={k.label}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.06 }}
              className={`rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-sm ${i === 4 ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <p className="font-display text-3xl tabular-nums sm:text-[34px]">{k.short}</p>
              <p className="mt-1 text-[13px] text-coop-100">{k.label}</p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-coop-200">
                <span>jun/2026</span>
                <span className="[&_button]:text-coop-100 [&_button]:decoration-white/30"><SourceButton sourceId={k.m.sourceId} metric={k.m} /></span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-white/15 pt-6 text-sm text-coop-100 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-1">
            <p className="font-medium text-white">Estudo técnico demonstrativo desenvolvido sob perspectiva metodológica do SESCOOP/RJ, com base exclusivamente em informações públicas.</p>
            <p>Escopo dos KPIs: Sistema Sicoob (combinado). Data-base: 30/06/2026. Dados atualizados até: {ANALYSIS_DATE}.</p>
            <p className="pt-1 text-coop-200">Não constitui publicação oficial do SESCOOP/RJ nem do Sicoob.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={onMethodology} className="rounded-full border border-white/30 px-4 py-2 text-sm text-white hover:bg-white/10">Metodologia</button>
            <a href="#visao-geral" className="rounded-full bg-lime-500 px-4 py-2 text-sm font-semibold text-coop-900 hover:bg-[#8cc63f]">Explore o diagnóstico ↓</a>
          </div>
        </div>
      </div>
    </section>
  );
}
