import type { Metric } from '../data/types';

const nf = (d: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

export const fmtNum = (v: number, d = 1) => nf(d).format(v);

/** Formata valor + unidade no padrão brasileiro. */
export function fmtMetric(x: Pick<Metric, 'value' | 'unit' | 'decimals' | 'display'>): string {
  if (x.display) return x.display;
  const d = x.decimals ?? 1;
  const v = fmtNum(x.value, d);
  switch (x.unit) {
    case 'R$ bi': return `R$ ${v} bi`;
    case 'R$ mi': return `R$ ${v} mi`;
    case 'R$ mil': return `R$ ${v} mil`;
    case 'R$': return `R$ ${v}`;
    case '%': return `${v}%`;
    case 'p.p.': return `${v} p.p.`;
    case 'mi': return `${v} mi`;
    case 'un': return v;
  }
}

export const fmtBi = (v: number, d = 1) => `R$ ${fmtNum(v, d)} bi`;
export const fmtPct = (v: number, d = 1) => `${fmtNum(v, d)}%`;
