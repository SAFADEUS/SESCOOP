/** official = dado publicado por fonte oficial; calculated = indicador derivado nesta análise;
 *  sector = referência setorial (SNCC/cooperativismo), não específica do Sicoob;
 *  analysis = interpretação analítica; estimate = estimativa (uso excepcional). */
export type Status = 'official' | 'calculated' | 'sector' | 'analysis' | 'estimate';

export type Entity =
  | 'Sistema Sicoob'
  | 'Banco Sicoob'
  | 'SNCC'
  | 'Cooperativismo brasileiro'
  | 'Sistema Sicredi'
  | 'Economia brasileira'
  | 'Brasil';

export interface Source {
  id: string;
  org: string;
  title: string;
  url: string;
  dataBase: string;
  published: string;
  accessDate: string;
  entity: string;
  kind: string;
  /** Hierarquia de fontes (1 = primária). Ausente para cálculos próprios. */
  level?: 1 | 2 | 3;
  note?: string;
}

export interface Metric {
  id: string;
  label: string;
  value: number;
  unit: 'R$ bi' | 'R$ mi' | 'R$ mil' | 'R$' | '%' | 'mi' | 'un' | 'p.p.';
  entity: Entity;
  period: string;
  sourceId: string;
  status: Status;
  /** Fórmula, quando status = calculated */
  formula?: string;
  note?: string;
  /** Texto de exibição, quando a unidade padrão não é adequada (ex.: trilhões) */
  display?: string;
  /** Casas decimais para exibição */
  decimals?: number;
}
