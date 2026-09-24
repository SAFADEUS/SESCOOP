import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Metric, Status } from '../data/types';
import { sourceById, ANALYSIS_DATE } from '../data/sources';
import { fmtMetric } from '../lib/format';

/* ---------------------------------------------------------------------
 * Classificação visual: fato × cálculo × interpretação × setor
 * ------------------------------------------------------------------- */
export const STATUS_META: Record<Status, { symbol: string; label: string; desc: string; cls: string }> = {
  official: { symbol: '●', label: 'Dado oficial', desc: 'Informação diretamente publicada por fonte oficial.', cls: 'text-coop-700 bg-coop-50 ring-coop-200' },
  calculated: { symbol: '◆', label: 'Indicador calculado', desc: 'Cálculo realizado nesta análise a partir de dados públicos.', cls: 'text-[#4a4790] bg-[#f1f0fa] ring-[#d9d7ef]' },
  analysis: { symbol: '▲', label: 'Interpretação analítica', desc: 'Conclusão construída a partir dos dados; não é informação oficial.', cls: 'text-[#8a5518] bg-[#fbf3ea] ring-[#efd9bf]' },
  sector: { symbol: '○', label: 'Referência setorial', desc: 'Indicador do cooperativismo/SNCC, não específico do Sicoob.', cls: 'text-ink-700 bg-ink-50 ring-ink-200' },
  estimate: { symbol: '◌', label: 'Estimativa', desc: 'Estimativa — uso excepcional, com premissas explícitas.', cls: 'text-ink-700 bg-white ring-ink-200' },
};

export function StatusBadge({ status, compact = false }: { status: Status; compact?: boolean }) {
  const s = STATUS_META[status];
  return (
    <span
      title={`${s.label} — ${s.desc}`}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${s.cls}`}
    >
      <span aria-hidden>{s.symbol}</span>
      {!compact && <span>{s.label}</span>}
      {compact && <span className="sr-only">{s.label}</span>}
    </span>
  );
}

/* ---------------------------------------------------------------------
 * Painel de fonte (modal) — acessível globalmente
 * ------------------------------------------------------------------- */
interface SourceCtx { open: (sourceId: string, metric?: Metric) => void }
const Ctx = createContext<SourceCtx>({ open: () => undefined });
export const useSource = () => useContext(Ctx);

export function SourceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ id: string; metric?: Metric } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!state) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setState(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state]);

  const src = state ? sourceById(state.id) : null;
  return (
    <Ctx.Provider value={{ open: (id, metric) => setState({ id, metric }) }}>
      {children}
      {src && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink-900/40 p-0 sm:items-center sm:p-6" onClick={() => setState(null)}>
          <div
            role="dialog" aria-modal="true" aria-labelledby={titleId}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-coop-700">Fonte e metodologia</p>
                <h3 id={titleId} className="mt-1 font-display text-xl text-ink-900">{src.org}</h3>
              </div>
              <button ref={closeRef} onClick={() => setState(null)} className="rounded-full p-2 text-ink-500 hover:bg-ink-50" aria-label="Fechar">✕</button>
            </div>
            {state?.metric && (
              <div className="mt-4 rounded-xl bg-ink-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-ink-900">{state.metric.label}</span>
                  <StatusBadge status={state.metric.status} />
                </div>
                <p className="mt-1 font-display text-2xl text-ink-900">{fmtMetric(state.metric)}</p>
                <p className="text-xs text-ink-500">Escopo: {state.metric.entity} · Período: {state.metric.period}</p>
                {state.metric.formula && <p className="mt-2 text-sm text-ink-700"><span className="font-medium">Fórmula:</span> {state.metric.formula}</p>}
                {state.metric.note && <p className="mt-2 text-sm text-ink-700">{state.metric.note}</p>}
              </div>
            )}
            <dl className="mt-4 grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-ink-500">Documento</dt><dd className="text-ink-900">{src.title}</dd>
              <dt className="text-ink-500">Tipo</dt><dd className="text-ink-900">{src.kind}</dd>
              <dt className="text-ink-500">Entidade</dt><dd className="text-ink-900">{src.entity}</dd>
              <dt className="text-ink-500">Data-base</dt><dd className="text-ink-900">{src.dataBase}</dd>
              <dt className="text-ink-500">Publicação</dt><dd className="text-ink-900">{src.published}</dd>
              <dt className="text-ink-500">Consulta</dt><dd className="text-ink-900">{src.accessDate}</dd>
              {src.level && (<><dt className="text-ink-500">Hierarquia</dt><dd className="text-ink-900">Nível {src.level}</dd></>)}
            </dl>
            {src.note && <p className="mt-4 rounded-lg border border-[#efd9bf] bg-[#fbf3ea] p-3 text-sm text-ink-700">{src.note}</p>}
            {src.url.startsWith('http') && (
              <a href={src.url} target="_blank" rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-coop-700 px-4 py-2 text-sm font-medium text-white hover:bg-coop-800">
                Abrir documento original ↗
              </a>
            )}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function SourceButton({ sourceId, metric, label = 'Fonte' }: { sourceId: string; metric?: Metric; label?: string }) {
  const { open } = useSource();
  return (
    <button
      type="button"
      onClick={() => open(sourceId, metric)}
      className="inline text-left text-[11px] font-medium text-coop-700 underline decoration-coop-200 underline-offset-2 hover:decoration-coop-600"
    >
      {label}
    </button>
  );
}

/* ---------------------------------------------------------------------
 * KPI card orientado a dados
 * ------------------------------------------------------------------- */
export function KpiCard({ metric, emphasis = false, sub }: { metric: Metric; emphasis?: boolean; sub?: ReactNode }) {
  const src = sourceById(metric.sourceId);
  return (
    <div className={`flex min-w-0 flex-col justify-between rounded-2xl border p-4 sm:p-5 ${emphasis ? 'border-coop-200 bg-coop-50/60' : 'border-ink-100 bg-white'}`}>
      <div>
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 break-words text-[12px] font-semibold uppercase tracking-wider text-ink-500 [hyphens:auto]">{metric.label}</p>
          <StatusBadge status={metric.status} compact />
        </div>
        <p className="mt-2 font-display text-[28px] leading-none text-ink-900 sm:text-[32px] tabular-nums">{fmtMetric(metric)}</p>
        {sub && <div className="mt-2 text-sm text-ink-700">{sub}</div>}
      </div>
      <div className="mt-3 border-t border-ink-100 pt-2 text-[11px] leading-relaxed text-ink-500">
        <div>Data-base: {metric.period} · Escopo: {metric.entity}</div>
        <div className="flex flex-wrap items-center gap-x-2">
          <span>{metric.status === 'calculated' ? 'Cálculo próprio' : src.org}</span>
          <span aria-hidden>·</span>
          <SourceButton sourceId={metric.sourceId} metric={metric} label={metric.status === 'calculated' ? 'Fórmula' : 'Fonte'} />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
 * Seção
 * ------------------------------------------------------------------- */
export function Section({ id, kicker, title, lead, children, tone = 'white' }: {
  id: string; kicker: string; title: string; lead?: ReactNode; children: ReactNode; tone?: 'white' | 'mist';
}) {
  const reduce = useReducedMotion();
  return (
    <section id={id} className={`scroll-mt-20 border-t border-ink-100 ${tone === 'mist' ? 'bg-ink-50' : 'bg-white'}`}>
      <motion.div
        className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20"
        initial={reduce ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coop-700">{kicker}</p>
        <h2 className="mt-2 max-w-3xl font-display text-[28px] leading-tight text-ink-900 sm:text-4xl">{title}</h2>
        {lead && <div className="mt-4 max-w-3xl text-[16px] leading-relaxed text-ink-700 sm:text-[17px]">{lead}</div>}
        <div className="mt-8 sm:mt-10">{children}</div>
      </motion.div>
    </section>
  );
}

export function SubHead({ children }: { children: ReactNode }) {
  return <h3 className="mb-4 mt-12 font-display text-xl text-ink-900 first:mt-0 sm:text-2xl">{children}</h3>;
}

/* ---------------------------------------------------------------------
 * Moldura de gráfico com rodapé de fonte obrigatório
 * ------------------------------------------------------------------- */
export function ChartFrame({ title, subtitle, sourceIds, scope, dataBase, children, controls, table }: {
  title: string; subtitle?: string; sourceIds: string[]; scope: string; dataBase: string;
  children: ReactNode; controls?: ReactNode; table?: ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <figure className="rounded-2xl border border-ink-100 bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <figcaption className="text-[15px] font-semibold text-ink-900">{title}</figcaption>
          {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {controls}
          {table && (
            <button onClick={() => setShowTable((v) => !v)} className="rounded-full border border-ink-200 px-3 py-1 text-xs text-ink-700 hover:bg-ink-50" aria-pressed={showTable}>
              {showTable ? 'Ver gráfico' : 'Ver tabela'}
            </button>
          )}
        </div>
      </div>
      <div className="mt-4">{showTable && table ? table : children}</div>
      <div className="mt-4 border-t border-ink-100 pt-3 text-[11px] leading-relaxed text-ink-500">
        <span>Fonte: </span>
        {sourceIds.map((id, i) => {
          const s = sourceById(id);
          return (
            <span key={id}>
              {i > 0 && '; '}
              <SourceButton sourceId={id} label={`${s.org} — ${shortTitle(s.title)}`} />
            </span>
          );
        })}
        <span>. Escopo: {scope}. Data-base: {dataBase}. Consulta: {ANALYSIS_DATE}.</span>
      </div>
    </figure>
  );
}

const shortTitle = (t: string) => (t.length > 64 ? `${t.slice(0, 62).trimEnd()}…` : t);

/* ---------------------------------------------------------------------
 * Controles
 * ------------------------------------------------------------------- */
export function Segmented<T extends string>({ value, onChange, options, label }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-full bg-ink-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${value === o.value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function InfoTip({ text, label = 'Saiba mais' }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block align-middle">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-ink-200 text-[10px] font-semibold text-ink-500 hover:border-coop-600 hover:text-coop-700"
      >
        i
      </button>
      {open && (
        <span role="tooltip" className="absolute left-1/2 top-6 z-30 w-64 -translate-x-1/2 rounded-lg bg-ink-900 p-3 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-white shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}

export function Callout({ tone = 'analysis', title, children }: { tone?: Status | 'warn'; title?: string; children: ReactNode }) {
  const map: Record<string, string> = {
    analysis: 'border-[#efd9bf] bg-[#fbf3ea]',
    official: 'border-coop-200 bg-coop-50',
    calculated: 'border-[#d9d7ef] bg-[#f6f5fc]',
    sector: 'border-ink-200 bg-ink-50',
    estimate: 'border-ink-200 bg-white',
    warn: 'border-[#e8c3bd] bg-[#fbf0ee]',
  };
  return (
    <div className={`rounded-xl border p-4 text-[15px] leading-relaxed text-ink-700 ${map[tone]}`}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        {tone !== 'warn' && <StatusBadge status={tone as Status} />}
        {title && <span className="font-semibold text-ink-900">{title}</span>}
      </div>
      {children}
    </div>
  );
}

/** Tabela responsiva: vira cards no celular. */
export function DataTable({ columns, rows, caption }: { columns: string[]; rows: ReactNode[][]; caption?: string }) {
  return (
    <div>
      <table className="hidden w-full text-left text-sm md:table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-ink-200 text-[12px] uppercase tracking-wider text-ink-500">
            {columns.map((c) => <th key={c} className="py-2 pr-4 font-semibold">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-ink-100 align-top">
              {r.map((cell, j) => <td key={j} className={`py-2.5 pr-4 ${j === 0 ? 'font-medium text-ink-900' : 'text-ink-700'} tabular-nums`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="space-y-3 md:hidden">
        {rows.map((r, i) => (
          <div key={i} className="rounded-xl border border-ink-100 bg-white p-3">
            <div className="font-medium text-ink-900">{r[0]}</div>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
              {r.slice(1).map((cell, j) => (
                <div key={j} className="contents">
                  <dt className="text-ink-500">{columns[j + 1]}</dt>
                  <dd className="text-right text-ink-900 tabular-nums">{cell}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
