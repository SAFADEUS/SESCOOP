/** Paleta categórica validada (dataviz validator, modo claro): teal, roxo, laranja — ordem fixa. */
export const SERIES = { a: '#00897B', b: '#5B57A6', c: '#C0782A' } as const;
export const GRID = '#eceff0';
export const AXIS = '#7c8789';
export const axisProps = {
  tick: { fill: AXIS, fontSize: 12 },
  axisLine: false,
  tickLine: false,
} as const;
export const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: '1px solid #d9dedf', boxShadow: '0 8px 24px rgba(0,0,0,.08)', fontSize: 13 },
  labelStyle: { color: '#1c2426', fontWeight: 600 },
} as const;
