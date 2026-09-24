import type { Metric } from './types';

/* =====================================================================
 * CAMADA CENTRAL DE DADOS
 * Nenhum componente visual deve conter números "soltos": tudo vem daqui.
 * Valores em R$ bilhões salvo indicação contrária.
 * ===================================================================== */

const m = (x: Metric): Metric => x;

// ---------------------------------------------------------------------
// SISTEMA SICOOB — junho/2026 (dado mais recente disponível)
// ---------------------------------------------------------------------
export const sys26 = {
  cooperados: m({ id: 'sys26-coop', label: 'Cooperados', value: 10, unit: 'mi', entity: 'Sistema Sicoob', period: 'jun/2026', sourceId: 'sicoob-1s26', status: 'official', decimals: 0 }),
  ativos: m({ id: 'sys26-ativos', label: 'Ativos totais', value: 471, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'jun/2026', sourceId: 'sicoob-1s26', status: 'official', decimals: 0 }),
  credito: m({ id: 'sys26-cred', label: 'Carteira de crédito', value: 263, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'jun/2026', sourceId: 'sicoob-1s26', status: 'official', decimals: 0, note: 'Conceito de "carteira de crédito" do comunicado de jun/2026. A série do comunicado (jun/2025 = R$ 240 bi) difere do valor de "empréstimos e financiamentos" divulgado em 2025 (R$ 205,8 bi): indica conceito ampliado.' }),
  captacoes: m({ id: 'sys26-capt', label: 'Captações', value: 346, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'jun/2026', sourceId: 'sicoob-1s26', status: 'official', decimals: 0, note: 'Captações totais (depósitos + letras como LCA/LCI). Não confundir com "depósitos totais".' }),
  pl: m({ id: 'sys26-pl', label: 'Patrimônio líquido', value: 67, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'jun/2026', sourceId: 'sicoob-1s26', status: 'official', decimals: 0 }),
  resultado: m({ id: 'sys26-res', label: 'Resultado combinado (1º semestre)', value: 4.577, unit: 'R$ bi', entity: 'Sistema Sicoob', period: '1S2026', sourceId: 'sicoob-1s26', status: 'official', decimals: 3, note: 'Resultado do semestre (jan–jun/2026). Não anualizado.' }),
  basileia: m({ id: 'sys26-bas', label: 'Índice de Basileia', value: 20.58, unit: '%', entity: 'Sistema Sicoob', period: 'jun/2026', sourceId: 'sicoob-1s26', status: 'official', decimals: 2 }),
};

export const sysGrowth26 = {
  ativos: m({ id: 'g-ativos', label: 'Ativos', value: 18.06, unit: '%', entity: 'Sistema Sicoob', period: 'jun/25 → jun/26', sourceId: 'sicoob-1s26', status: 'official', decimals: 2 }),
  credito: m({ id: 'g-cred', label: 'Carteira de crédito', value: 9.54, unit: '%', entity: 'Sistema Sicoob', period: 'jun/25 → jun/26', sourceId: 'sicoob-1s26', status: 'official', decimals: 2 }),
  captacoes: m({ id: 'g-capt', label: 'Captações', value: 18.09, unit: '%', entity: 'Sistema Sicoob', period: 'jun/25 → jun/26', sourceId: 'sicoob-1s26', status: 'official', decimals: 2 }),
  pl: m({ id: 'g-pl', label: 'Patrimônio líquido', value: 14.72, unit: '%', entity: 'Sistema Sicoob', period: 'jun/25 → jun/26', sourceId: 'sicoob-1s26', status: 'official', decimals: 2 }),
};

// ---------------------------------------------------------------------
// BANCO SICOOB — junho/2026
// ---------------------------------------------------------------------
export const banco26 = {
  ativos: m({ id: 'bk-ativos', label: 'Ativos totais', value: 223, unit: 'R$ bi', entity: 'Banco Sicoob', period: 'jun/2026', sourceId: 'sicoob-1s26', status: 'official', decimals: 0 }),
  credito: m({ id: 'bk-cred', label: 'Carteira de crédito', value: 81, unit: 'R$ bi', entity: 'Banco Sicoob', period: 'jun/2026', sourceId: 'sicoob-1s26', status: 'official', decimals: 0 }),
  captacoes: m({ id: 'bk-capt', label: 'Captações', value: 159, unit: 'R$ bi', entity: 'Banco Sicoob', period: 'jun/2026', sourceId: 'sicoob-1s26', status: 'official', decimals: 0 }),
  pl: m({ id: 'bk-pl', label: 'Patrimônio líquido', value: 7, unit: 'R$ bi', entity: 'Banco Sicoob', period: 'jun/2026', sourceId: 'sicoob-1s26', status: 'official', decimals: 0 }),
  resultado: m({ id: 'bk-res', label: 'Resultado / sobras (1º semestre)', value: 0.459, unit: 'R$ bi', entity: 'Banco Sicoob', period: '1S2026', sourceId: 'sicoob-1s26', status: 'official', decimals: 3 }),
  basileia: m({ id: 'bk-bas', label: 'Índice de Basileia', value: 19.66, unit: '%', entity: 'Banco Sicoob', period: 'jun/2026', sourceId: 'sicoob-1s26', status: 'official', decimals: 2 }),
};

// ---------------------------------------------------------------------
// SISTEMA SICOOB — 31/12/2025
// ---------------------------------------------------------------------
export const sys25 = {
  ativos: m({ id: 'sys25-ativos', label: 'Ativos totais', value: 430.1, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'dez/2025', sourceId: 'sicoob-2025-balanco', status: 'official', decimals: 1 }),
  ativosVar: m({ id: 'sys25-ativos-var', label: 'Ativos — variação anual', value: 19.6, unit: '%', entity: 'Sistema Sicoob', period: '2025/2024', sourceId: 'sicoob-2025-balanco', status: 'official', decimals: 1 }),
  opCredito: m({ id: 'sys25-opcred', label: 'Operações de crédito', value: 216.4, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'dez/2025', sourceId: 'sicoob-rs-2025', status: 'official', decimals: 1 }),
  carteiraAmpliada: m({ id: 'sys25-amp', label: 'Carteira ampliada líquida', value: 256, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'dez/2025', sourceId: 'sicoob-2025-balanco', status: 'official', decimals: 0, note: 'Inclui instrumentos além das operações de crédito clássicas (ex.: CPR financeira).' }),
  carteiraAmpliadaVar: m({ id: 'sys25-amp-var', label: 'Carteira ampliada — variação anual', value: 16.2, unit: '%', entity: 'Sistema Sicoob', period: '2025/2024', sourceId: 'sicoob-2025-balanco', status: 'official', decimals: 1 }),
  agro: m({ id: 'sys25-agro', label: 'Carteira agro (crédito rural + CPRF)', value: 92.8, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'dez/2025', sourceId: 'sicoob-2025-balanco', status: 'official', decimals: 1 }),
  depositos: m({ id: 'sys25-dep', label: 'Depósitos totais', value: 266.1, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'dez/2025', sourceId: 'sicoob-2025-balanco', status: 'official', decimals: 1, note: 'O Relatório de Sustentabilidade 2025 apresenta R$ 266,9 bi. Diferença de R$ 0,8 bi (0,3%) — possível arredondamento/critério; ver Divergências.' }),
  depositosVar: m({ id: 'sys25-dep-var', label: 'Depósitos — variação anual', value: 15.8, unit: '%', entity: 'Sistema Sicoob', period: '2025/2024', sourceId: 'sicoob-2025-balanco', status: 'official', decimals: 1 }),
  captacoes: m({ id: 'sys25-capt', label: 'Captações totais (depósitos + LCA + LCI)', value: 319.1, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'dez/2025', sourceId: 'sicoob-2025-balanco', status: 'official', decimals: 1 }),
  captacoesVar: m({ id: 'sys25-capt-var', label: 'Captações — variação anual', value: 20.6, unit: '%', entity: 'Sistema Sicoob', period: '2025/2024', sourceId: 'sicoob-2025-balanco', status: 'official', decimals: 1 }),
  pl: m({ id: 'sys25-pl', label: 'Patrimônio líquido', value: 62.8, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'dez/2025', sourceId: 'sicoob-2025-balanco', status: 'official', decimals: 1 }),
  plVar: m({ id: 'sys25-pl-var', label: 'PL — variação anual', value: 15.3, unit: '%', entity: 'Sistema Sicoob', period: '2025/2024', sourceId: 'sicoob-2025-balanco', status: 'official', decimals: 1 }),
  sobrasAntesJcp: m({ id: 'sys25-sobras', label: 'Resultado do exercício (sobras antes de JCP)', value: 11.2, unit: 'R$ bi', entity: 'Sistema Sicoob', period: '2025', sourceId: 'sicoob-2025-resultado', status: 'official', decimals: 1, note: 'Material de referência inicial citava R$ 11,3 bi; o comunicado institucional localizado publica R$ 11,2 bi.' }),
  resultadoFinanceiroRS: m({ id: 'sys25-resfin', label: '"Resultados financeiros" (Relatório de Sustentabilidade)', value: 7.8, unit: 'R$ bi', entity: 'Sistema Sicoob', period: '2025', sourceId: 'sicoob-rs-2025', status: 'official', decimals: 1, note: 'Referências consultadas apresentam R$ 7,7 bi e R$ 7,8 bi. Conceito distinto do resultado antes de JCP — ver Divergências.' }),
  cooperadosRS: m({ id: 'sys25-coop', label: 'Cooperados', value: 9.5, unit: 'mi', entity: 'Sistema Sicoob', period: 'dez/2025', sourceId: 'sicoob-rs-2025', status: 'official', decimals: 1 }),
  singulares: m({ id: 'sys25-sing', label: 'Cooperativas singulares', value: 322, unit: 'un', entity: 'Sistema Sicoob', period: '2025', sourceId: 'sicoob-sistema', status: 'official', decimals: 0 }),
  centrais: m({ id: 'sys25-cent', label: 'Cooperativas centrais', value: 14, unit: 'un', entity: 'Sistema Sicoob', period: '2025', sourceId: 'sicoob-sistema', status: 'official', decimals: 0 }),
  municipios: m({ id: 'sys25-mun', label: 'Municípios com presença física', value: 2486, unit: 'un', entity: 'Sistema Sicoob', period: 'dez/2025', sourceId: 'sicoob-rs-2025', status: 'official', decimals: 0 }),
  municipiosExclusivos: m({ id: 'sys25-mun-ex', label: 'Municípios onde é a única instituição financeira física', value: 423, unit: 'un', entity: 'Sistema Sicoob', period: 'dez/2025', sourceId: 'sicoob-rs-2025', status: 'official', decimals: 0 }),
  municipiosPequenos: m({ id: 'sys25-mun-peq', label: 'Municípios atendidos com até 50 mil habitantes', value: 78, unit: '%', entity: 'Sistema Sicoob', period: 'dez/2025', sourceId: 'sicoob-rs-2025', status: 'official', decimals: 0 }),
  unidades: m({ id: 'sys25-und', label: 'Unidades de atendimento próprias', value: 4727, unit: 'un', entity: 'Sistema Sicoob', period: 'dez/2025', sourceId: 'sicoob-rs-2025', status: 'official', decimals: 0, note: 'A página institucional informa "mais de 4,7 mil pontos de atendimento".' }),
  empregos: m({ id: 'sys25-emp', label: 'Empregos diretos', value: 60991, unit: 'un', entity: 'Sistema Sicoob', period: 'dez/2025', sourceId: 'sicoob-rs-2025', status: 'official', decimals: 0 }),
  investSocial: m({ id: 'sys25-social', label: 'Investimento social', value: 567.8, unit: 'R$ mi', entity: 'Sistema Sicoob', period: '2025', sourceId: 'sicoob-rs-2025', status: 'official', decimals: 1 }),
  beneficio: m({ id: 'sys25-benef', label: 'Benefício econômico total aos cooperados', value: 49.8, unit: 'R$ bi', entity: 'Sistema Sicoob', period: '2025', sourceId: 'sicoob-beneficio-2025', status: 'official', decimals: 1, note: 'O Relatório de Sustentabilidade apresenta R$ 49,7 bi (diferença de arredondamento).' }),
  beneficioPorCooperado: m({ id: 'sys25-benef-coop', label: 'Vantagem média por cooperado', value: 7352, unit: 'R$', entity: 'Sistema Sicoob', period: '2025', sourceId: 'sicoob-beneficio-2025', status: 'official', decimals: 0 }),
  bed: m({ id: 'sys25-bed', label: 'Benefício Econômico dos Depósitos (BED)', value: 5.8, unit: 'R$ bi', entity: 'Sistema Sicoob', period: '2025', sourceId: 'sicoob-beneficio-2025', status: 'official', decimals: 1, note: 'Divulgado como "superior a R$ 5,8 bilhões".' }),
};

// ---------------------------------------------------------------------
// SISTEMA SICOOB — 30/06/2025 (comunicado do próprio semestre)
// ---------------------------------------------------------------------
export const sys1s25 = {
  ativos: m({ id: '1s25-ativos', label: 'Ativos totais', value: 398.9, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'jun/2025', sourceId: 'sicoob-1s25', status: 'official', decimals: 1 }),
  emprestimos: m({ id: '1s25-emp', label: 'Empréstimos e financiamentos', value: 205.8, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'jun/2025', sourceId: 'sicoob-1s25', status: 'official', decimals: 1 }),
  ruralShare: m({ id: '1s25-rural', label: 'Crédito rural / carteira total', value: 26.06, unit: '%', entity: 'Sistema Sicoob', period: 'jun/2025', sourceId: 'sicoob-1s25', status: 'official', decimals: 2 }),
  depositos: m({ id: '1s25-dep', label: 'Depósitos totais', value: 248.2, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'jun/2025', sourceId: 'sicoob-1s25', status: 'official', decimals: 1 }),
  pl: m({ id: '1s25-pl', label: 'Patrimônio líquido', value: 58.2, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'jun/2025', sourceId: 'sicoob-1s25', status: 'official', decimals: 1 }),
  resultado: m({ id: '1s25-res', label: 'Resultado do semestre antes de JCP', value: 5.8, unit: 'R$ bi', entity: 'Sistema Sicoob', period: '1S2025', sourceId: 'sicoob-1s25', status: 'official', decimals: 1 }),
  digitalShare: m({ id: '1s25-dig', label: 'Transações via Super App e internet banking', value: 87, unit: '%', entity: 'Sistema Sicoob', period: '2025', sourceId: 'sicoob-1s25', status: 'official', decimals: 0, note: 'Divulgado como "mais de 87%" das transações.' }),
  acessosDiarios: m({ id: '1s25-acc', label: 'Acessos diários (média) aos canais digitais', value: 8, unit: 'mi', entity: 'Sistema Sicoob', period: '2025', sourceId: 'sicoob-1s25', status: 'official', decimals: 0 }),
};

// ---------------------------------------------------------------------
// ANOS ANTERIORES
// ---------------------------------------------------------------------
export const sys24 = {
  ativos: m({ id: 'sys24-ativos', label: 'Ativos combinados', value: 359.7, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'dez/2024', sourceId: 'moodys-2025', status: 'official', decimals: 1 }),
  pl: m({ id: 'sys24-pl', label: 'PL combinado', value: 54.4, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'dez/2024', sourceId: 'moodys-2025', status: 'official', decimals: 1 }),
  sobras: m({ id: 'sys24-sobras', label: 'Resultado antes de JCP', value: 8.3, unit: 'R$ bi', entity: 'Sistema Sicoob', period: '2024', sourceId: 'moodys-2025', status: 'official', decimals: 1 }),
  credito: m({ id: 'sys24-cred', label: 'Carteira de crédito', value: 193.9, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'dez/2024', sourceId: 'moodys-2025', status: 'official', decimals: 1 }),
  basileia: m({ id: 'sys24-bas', label: 'Índice de Basileia aglutinado', value: 18.6, unit: '%', entity: 'Sistema Sicoob', period: 'dez/2024', sourceId: 'moodys-2025', status: 'official', decimals: 1 }),
  beneficio: m({ id: 'sys24-benef', label: 'Benefício econômico total', value: 39.96, unit: 'R$ bi', entity: 'Sistema Sicoob', period: '2024', sourceId: 'sicoob-beneficio-2024', status: 'official', decimals: 2 }),
};

export const sys23 = {
  ativos: m({ id: 'sys23-ativos', label: 'Ativos totais', value: 298.4, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'dez/2023', sourceId: 'sicoob-2023', status: 'official', decimals: 1 }),
  ativosVar: m({ id: 'sys23-ativos-var', label: 'Ativos — variação anual', value: 25, unit: '%', entity: 'Sistema Sicoob', period: '2023/2022', sourceId: 'sicoob-2023', status: 'official', decimals: 0 }),
  credito: m({ id: 'sys23-cred', label: 'Carteira de crédito', value: 168, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'dez/2023', sourceId: 'sicoob-2023', status: 'official', decimals: 0 }),
  creditoPJ: m({ id: 'sys23-pj', label: 'Carteira de crédito — empresas', value: 80.7, unit: 'R$ bi', entity: 'Sistema Sicoob', period: 'dez/2023', sourceId: 'sicoob-2023', status: 'official', decimals: 1 }),
  cooperados: m({ id: 'sys23-coop', label: 'Cooperados', value: 8, unit: 'mi', entity: 'Sistema Sicoob', period: 'dez/2023', sourceId: 'sicoob-2023', status: 'official', decimals: 1 }),
  sobras: m({ id: 'sys23-sobras', label: 'Resultado do exercício', value: 8.4, unit: 'R$ bi', entity: 'Sistema Sicoob', period: '2023', sourceId: 'sicoob-2023', status: 'official', decimals: 1 }),
  sobrasVar: m({ id: 'sys23-sobras-var', label: 'Resultado — variação anual', value: 16.4, unit: '%', entity: 'Sistema Sicoob', period: '2023/2022', sourceId: 'sicoob-2023', status: 'official', decimals: 1 }),
  basileia: m({ id: 'sys23-bas', label: 'Índice de Basileia aglutinado', value: 17.0, unit: '%', entity: 'Sistema Sicoob', period: 'dez/2023', sourceId: 'moodys-2025', status: 'official', decimals: 1 }),
};

// ---------------------------------------------------------------------
// SÉRIE DE LONGO PRAZO DIVULGADA PELO SICOOB (base: junho)
// ---------------------------------------------------------------------
export interface JuneSeriesPoint {
  period: string;
  ativos: number;
  credito: number;
  captacoes: number;
  pl: number;
}
/** Pontos publicados no comunicado de jun/2026 (jun/22, jun/25 e jun/26). */
export const juneSeries: JuneSeriesPoint[] = [
  { period: 'jun/2022', ativos: 215, credito: 139, captacoes: 156, pl: 34 },
  { period: 'jun/2025', ativos: 399, credito: 240, captacoes: 293, pl: 58 },
  { period: 'jun/2026', ativos: 471, credito: 263, captacoes: 346, pl: 67 },
];
export const juneSeriesCagrOfficial = {
  ativos: m({ id: 'cagr-ativos', label: 'Ativos — crescimento médio anual jun/22–jun/26', value: 21.7, unit: '%', entity: 'Sistema Sicoob', period: 'jun/22 → jun/26', sourceId: 'sicoob-1s26', status: 'official', decimals: 1 }),
  credito: m({ id: 'cagr-cred', label: 'Crédito — crescimento médio anual jun/22–jun/26', value: 17.3, unit: '%', entity: 'Sistema Sicoob', period: 'jun/22 → jun/26', sourceId: 'sicoob-1s26', status: 'official', decimals: 1 }),
  pl: m({ id: 'cagr-pl', label: 'PL — crescimento médio anual jun/22–jun/26', value: 18.5, unit: '%', entity: 'Sistema Sicoob', period: 'jun/22 → jun/26', sourceId: 'sicoob-1s26', status: 'official', decimals: 1 }),
};

// ---------------------------------------------------------------------
// SÉRIE ANUAL (dezembro) — para o seletor de evolução histórica
// null = não localizado de forma consistente nas fontes consultadas.
// ---------------------------------------------------------------------
export type SeriesKey = 'ativos' | 'credito' | 'captacoes' | 'pl' | 'resultado' | 'cooperados';

export interface AnnualPoint {
  period: string;
  value: number | null;
  status: 'official' | 'calculated';
  sourceId: string;
  note?: string;
}

export interface SeriesDef {
  key: SeriesKey;
  label: string;
  unit: 'R$ bi' | 'mi';
  points: AnnualPoint[];
  concept: string;
  commentary: string;
}

export const annualSeries: SeriesDef[] = [
  {
    key: 'ativos',
    label: 'Ativos',
    unit: 'R$ bi',
    concept: 'Ativos totais combinados do Sistema Sicoob (cooperativas singulares, centrais, Banco Sicoob e demais entidades, com eliminação de operações intrassistema).',
    points: [
      { period: '2022', value: 238.7, status: 'calculated', sourceId: 'sicoob-2023', note: 'Derivado: R$ 298,4 bi ÷ 1,25 (crescimento de 25% divulgado para 2023). Arredondamento do percentual limita a precisão.' },
      { period: '2023', value: 298.4, status: 'official', sourceId: 'sicoob-2023' },
      { period: '2024', value: 359.7, status: 'official', sourceId: 'moodys-2025' },
      { period: '2025', value: 430.1, status: 'official', sourceId: 'sicoob-2025-balanco' },
      { period: 'jun/2026', value: 471, status: 'official', sourceId: 'sicoob-1s26' },
    ],
    commentary: 'Os ativos mais que dobraram entre jun/2022 e jun/2026 (R$ 215 bi → R$ 471 bi), com crescimento anual consistentemente próximo de 20% (19,6% em 2025; 18,06% em 12 meses até jun/2026). O ritmo é superior ao do SNCC em 2025 (17,0%), o que indica ganho de participação do Sicoob no segmento cooperativo. A leitura de sustentabilidade depende de observar a composição do crescimento: desde 2025, a expansão do ativo é liderada por captações e liquidez, não por crédito.',
  },
  {
    key: 'credito',
    label: 'Crédito',
    unit: 'R$ bi',
    concept: 'Carteira de crédito conforme divulgada em cada período. ATENÇÃO: os comunicados utilizam conceitos distintos (operações de crédito, carteira ampliada, carteira classificada). A série abaixo usa o conceito "carteira de crédito" de cada comunicado anual.',
    points: [
      { period: '2022', value: null, status: 'official', sourceId: 'sicoob-2023', note: 'Não localizado de forma comparável.' },
      { period: '2023', value: 168, status: 'official', sourceId: 'sicoob-2023' },
      { period: '2024', value: 193.9, status: 'official', sourceId: 'moodys-2025' },
      { period: '2025', value: 216.4, status: 'official', sourceId: 'sicoob-rs-2025', note: 'Operações de crédito (Relatório de Sustentabilidade). A carteira ampliada líquida foi de R$ 256 bi.' },
      { period: 'jun/2026', value: 263, status: 'official', sourceId: 'sicoob-1s26', note: 'Conceito do comunicado de jun/2026 — aparentemente ampliado (jun/2025 = R$ 240 bi nesse conceito vs. R$ 205,8 bi em empréstimos e financiamentos). Não comparar diretamente com 2025 (R$ 216,4 bi).' },
    ],
    commentary: 'A carteira cresce em ritmo inferior ao dos ativos e das captações desde 2025: em 12 meses até jun/2026, +9,54% contra +18,09% nas captações. O movimento é compatível com seletividade na concessão em um ambiente de juros elevados e de alta dos ativos problemáticos no SNCC — interpretação que precisa ser confirmada nas notas explicativas (política de crédito, estágios de risco).',
  },
  {
    key: 'captacoes',
    label: 'Captações',
    unit: 'R$ bi',
    concept: 'Captações totais = depósitos (à vista, poupança, a prazo) + letras (LCA, LCI) e outros instrumentos. Depósitos totais são um subconjunto: R$ 266,1 bi de R$ 319,1 bi em dez/2025.',
    points: [
      { period: '2022', value: null, status: 'official', sourceId: 'sicoob-2023', note: 'Não localizado de forma comparável.' },
      { period: '2023', value: null, status: 'official', sourceId: 'sicoob-2023', note: 'Não localizado de forma comparável.' },
      { period: '2024', value: 264.6, status: 'calculated', sourceId: 'sicoob-2025-balanco', note: 'Derivado: R$ 319,1 bi ÷ 1,206 (crescimento de 20,6% divulgado para 2025).' },
      { period: '2025', value: 319.1, status: 'official', sourceId: 'sicoob-2025-balanco' },
      { period: 'jun/2026', value: 346, status: 'official', sourceId: 'sicoob-1s26' },
    ],
    commentary: 'As captações são o vetor mais dinâmico do balanço (+20,6% em 2025; +18,09% em 12 meses até jun/2026). Com crescimento acima da carteira, a relação crédito/captações cai — o sistema acumula funding e liquidez. Esse excesso relativo de recursos precisa ser remunerado; em cenário de Selic elevada, isso pressiona o custo de captação e a margem.',
  },
  {
    key: 'pl',
    label: 'Patrimônio',
    unit: 'R$ bi',
    concept: 'Patrimônio líquido combinado: capital social integralizado pelos cooperados, reservas (legal e estatutárias) e sobras/perdas acumuladas.',
    points: [
      { period: '2022', value: null, status: 'official', sourceId: 'sicoob-2023', note: 'Não localizado de forma comparável.' },
      { period: '2023', value: null, status: 'official', sourceId: 'sicoob-2023', note: 'Não localizado de forma comparável.' },
      { period: '2024', value: 54.4, status: 'official', sourceId: 'moodys-2025' },
      { period: '2025', value: 62.8, status: 'official', sourceId: 'sicoob-2025-balanco' },
      { period: 'jun/2026', value: 67, status: 'official', sourceId: 'sicoob-1s26' },
    ],
    commentary: 'O PL cresce de forma robusta (+15,3% em 2025; +14,72% em 12 meses), mas abaixo dos ativos. A consequência é uma redução gradual da relação PL/ativos (15,8% em jun/2022 → 14,2% em jun/2026). O nível segue confortável, e o Índice de Basileia subiu no período — sinal de que a expansão se concentrou em ativos de menor ponderação de risco (liquidez), e não em crédito.',
  },
  {
    key: 'resultado',
    label: 'Resultado',
    unit: 'R$ bi',
    concept: 'Resultado do exercício antes dos juros sobre o capital próprio (JCP), conforme comunicados anuais. Não inclui o "resultado financeiro" de R$ 7,7–7,8 bi do Relatório de Sustentabilidade (conceito distinto).',
    points: [
      { period: '2022', value: 7.2, status: 'calculated', sourceId: 'sicoob-2023', note: 'Derivado: R$ 8,4 bi ÷ 1,164 (variação de 16,4% divulgada para 2023).' },
      { period: '2023', value: 8.4, status: 'official', sourceId: 'sicoob-2023' },
      { period: '2024', value: 8.3, status: 'official', sourceId: 'moodys-2025', note: 'Resultado antes de destinações de JCP.' },
      { period: '2025', value: 11.2, status: 'official', sourceId: 'sicoob-2025-resultado' },
      { period: 'jun/2026', value: null, status: 'official', sourceId: 'sicoob-1s26', note: 'O 1º semestre de 2026 (R$ 4,577 bi) é semestral e com conceito não confirmado; não é plotado na série anual e não é anualizado.' },
    ],
    commentary: 'O resultado ficou estável entre 2023 e 2024 (R$ 8,4 bi → R$ 8,3 bi), mesmo com forte expansão do balanço, e saltou para R$ 11,2 bi em 2025. O resultado de 2025 foi obtido com carteira crescendo menos que o ativo — sugere contribuição relevante da tesouraria/liquidez em cenário de Selic alta. O resultado combinado do 1S2026 (R$ 4,577 bi) é menor que o do 1S2025 antes de JCP (R$ 5,8 bi); como os conceitos não estão confirmados como idênticos, a queda não pode ser afirmada — é o principal ponto a verificar nas demonstrações de jun/2026.',
  },
  {
    key: 'cooperados',
    label: 'Cooperados',
    unit: 'mi',
    concept: 'Número de cooperados do Sistema Sicoob divulgado pela instituição (metodologia própria; não equivale à contagem de CPFs/CNPJs únicos do Banco Central).',
    points: [
      { period: '2022', value: null, status: 'official', sourceId: 'sicoob-2023', note: 'Não localizado de forma comparável.' },
      { period: '2023', value: 8.0, status: 'official', sourceId: 'sicoob-2023' },
      { period: '2024', value: null, status: 'official', sourceId: 'moodys-2025', note: 'Valor consolidado de dez/2024 não localizado em fonte primária.' },
      { period: '2025', value: 9.5, status: 'official', sourceId: 'sicoob-rs-2025', note: 'Comunicado de abr/2026 menciona "mais de 9,7 milhões" (provável data posterior a dez/2025).' },
      { period: 'jun/2026', value: 10, status: 'official', sourceId: 'sicoob-1s26' },
    ],
    commentary: 'A base passou de 8 para 10 milhões de cooperados em cerca de dois anos e meio (≈ +25%, indicador derivado). O crescimento da base é mais lento que o dos ativos, o que eleva os ativos por cooperado — sinal de aprofundamento do relacionamento e de maior participação de pessoas jurídicas e do agro, a ser confirmado por dados de segmentação.',
  },
];

// ---------------------------------------------------------------------
// SETOR — SNCC (Banco Central) e AnuárioCoop (Sistema OCB)
// ---------------------------------------------------------------------
export const sncc25 = {
  ativos: m({ id: 'sncc-ativos', label: 'Ativos do SNCC', value: 1036, unit: 'R$ bi', display: 'R$ 1,036 tri', entity: 'SNCC', period: 'dez/2025', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 0 }),
  ativosVar: m({ id: 'sncc-ativos-var', label: 'Ativos do SNCC — variação anual', value: 17.0, unit: '%', entity: 'SNCC', period: '2025/2024', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 1 }),
  ativos2021: m({ id: 'sncc-ativos-21', label: 'Ativos do SNCC 2021', value: 458.9, unit: 'R$ bi', entity: 'SNCC', period: 'dez/2021', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 1 }),
  ativos2024: m({ id: 'sncc-ativos-24', label: 'Ativos do SNCC 2024', value: 885.3, unit: 'R$ bi', entity: 'SNCC', period: 'dez/2024', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 1 }),
  captacoes: m({ id: 'sncc-capt', label: 'Captações do SNCC', value: 834.4, unit: 'R$ bi', entity: 'SNCC', period: 'dez/2025', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 1 }),
  cooperados: m({ id: 'sncc-coop', label: 'Cooperados (CPF/CNPJ únicos)', value: 21.2, unit: 'mi', entity: 'SNCC', period: 'dez/2025', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 1 }),
  cooperadosPF: m({ id: 'sncc-coop-pf', label: 'Cooperados pessoas físicas', value: 17.8, unit: 'mi', entity: 'SNCC', period: 'dez/2025', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 1 }),
  cooperadosPJ: m({ id: 'sncc-coop-pj', label: 'Cooperados pessoas jurídicas', value: 3.4, unit: 'mi', entity: 'SNCC', period: 'dez/2025', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 1 }),
  municipios: m({ id: 'sncc-mun', label: 'Municípios com presença', value: 3287, unit: 'un', entity: 'SNCC', period: 'dez/2025', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 0 }),
  municipiosPct: m({ id: 'sncc-mun-pct', label: 'Municípios brasileiros com presença', value: 59.0, unit: '%', entity: 'SNCC', period: 'dez/2025', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 1 }),
  municipiosExclusivos: m({ id: 'sncc-mun-ex', label: 'Municípios em que cooperativas são a única IF com presença física', value: 1072, unit: 'un', entity: 'SNCC', period: '2025', sourceId: 'ocb-sncc-2025', status: 'sector', decimals: 0 }),
  novosMunicipios: m({ id: 'sncc-novos', label: 'Novos municípios atendidos pelo SNCC em 2025', value: 56, unit: 'un', entity: 'SNCC', period: '2025', sourceId: 'ocb-sncc-2025', status: 'sector', decimals: 0 }),
  saidaSFN: m({ id: 'sncc-saida', label: 'Municípios em que o restante do SFN deixou de ter agência em 2025', value: 85, unit: 'un', entity: 'SNCC', period: '2025', sourceId: 'ocb-sncc-2025', status: 'sector', decimals: 0 }),
  shareAtivos: m({ id: 'sncc-sh-at', label: 'Participação nos ativos do SFN', value: 6.3, unit: '%', entity: 'SNCC', period: 'dez/2025', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 1 }),
  shareCredito: m({ id: 'sncc-sh-cr', label: 'Participação na carteira de crédito do SFN', value: 8.0, unit: '%', entity: 'SNCC', period: 'dez/2025', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 1 }),
  shareCredito24: m({ id: 'sncc-sh-cr24', label: 'Participação na carteira de crédito do SFN (2024)', value: 7.0, unit: '%', entity: 'SNCC', period: 'dez/2024', sourceId: 'ocb-sncc-2025', status: 'sector', decimals: 1 }),
  shareDepositos: m({ id: 'sncc-sh-dp', label: 'Participação nos depósitos do SFN', value: 9.8, unit: '%', entity: 'SNCC', period: 'dez/2025', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 1 }),
  shareDepositos24: m({ id: 'sncc-sh-dp24', label: 'Participação nos depósitos do SFN (2024)', value: 8.3, unit: '%', entity: 'SNCC', period: 'dez/2024', sourceId: 'ocb-sncc-2025', status: 'sector', decimals: 1 }),
  ativosProblematicos: m({ id: 'sncc-ap', label: 'Ativos problemáticos / carteira', value: 7.8, unit: '%', entity: 'SNCC', period: 'dez/2025', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 1 }),
  ativosProblematicosPico: m({ id: 'sncc-ap-pico', label: 'Ativos problemáticos — pico (ago/2025)', value: 8.3, unit: '%', entity: 'SNCC', period: 'ago/2025', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 1 }),
  basileia: m({ id: 'sncc-bas', label: 'Índice de Basileia médio', value: 18.1, unit: '%', entity: 'SNCC', period: 'dez/2025', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 1 }),
  basileiaRef: m({ id: 'sncc-bas-ref', label: 'Referência regulatória citada no Panorama', value: 11, unit: '%', entity: 'SNCC', period: 'dez/2025', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 0 }),
  pr: m({ id: 'sncc-pr', label: 'Patrimônio de Referência', value: 103.9, unit: 'R$ bi', entity: 'SNCC', period: 'dez/2025', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 1 }),
  ruralPF: m({ id: 'sncc-rural', label: 'Carteira rural e agroindustrial PF das cooperativas', value: 153.3, unit: 'R$ bi', entity: 'SNCC', period: 'dez/2025', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 1 }),
  ruralPFVar: m({ id: 'sncc-rural-var', label: 'Carteira rural PF — variação anual', value: 16.9, unit: '%', entity: 'SNCC', period: '2025/2024', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 1 }),
  ruralShareSFN: m({ id: 'sncc-rural-sh', label: 'Participação no crédito rural PF do SFN', value: 22, unit: '%', entity: 'SNCC', period: 'dez/2025', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 0 }),
  ruralSemSeguro: m({ id: 'sncc-rural-seg', label: 'Carteira rural sem seguro agrícola', value: 88, unit: '%', entity: 'SNCC', period: 'dez/2025', sourceId: 'bcb-sncc-2025', status: 'sector', decimals: 0 }),
};

export const anuario26 = {
  cooperadosBrasil: m({ id: 'an-coop', label: 'Cooperados — todos os ramos', value: 29, unit: 'mi', entity: 'Cooperativismo brasileiro', period: '2025', sourceId: 'anuariocoop-2026', status: 'sector', decimals: 0 }),
  cooperadosBrasilVar: m({ id: 'an-coop-var', label: 'Cooperados — variação anual', value: 12.5, unit: '%', entity: 'Cooperativismo brasileiro', period: '2025/2024', sourceId: 'anuariocoop-2026', status: 'sector', decimals: 1 }),
  populacaoPct: m({ id: 'an-pop', label: 'Cooperados / população brasileira', value: 13.6, unit: '%', entity: 'Cooperativismo brasileiro', period: '2025', sourceId: 'anuariocoop-2026', status: 'sector', decimals: 1 }),
  movimentacao: m({ id: 'an-mov', label: 'Movimentação econômica do cooperativismo', value: 848, unit: 'R$ bi', entity: 'Cooperativismo brasileiro', period: '2025', sourceId: 'anuariocoop-2026', status: 'sector', decimals: 0 }),
  cooperadosCredito: m({ id: 'an-cred-coop', label: 'Cooperados/vínculos — ramo Crédito', value: 22.96, unit: 'mi', entity: 'Cooperativismo brasileiro', period: '2025', sourceId: 'anuariocoop-2026', status: 'sector', decimals: 2 }),
  cooperadosCreditoVar: m({ id: 'an-cred-var', label: 'Ramo Crédito — variação anual de cooperados', value: 14.1, unit: '%', entity: 'Cooperativismo brasileiro', period: '2025/2024', sourceId: 'anuariocoop-2026', status: 'sector', decimals: 1 }),
  ativosCredito: m({ id: 'an-cred-at', label: 'Ativos — ramo Crédito', value: 1100, unit: 'R$ bi', entity: 'Cooperativismo brasileiro', period: '2025', sourceId: 'anuariocoop-2026', status: 'sector', decimals: 0, note: 'Divulgado como "R$ 1,1 trilhão".' }),
  plShare: m({ id: 'an-cred-pl', label: 'Participação do ramo Crédito no PL do cooperativismo', value: 72, unit: '%', entity: 'Cooperativismo brasileiro', period: '2025', sourceId: 'anuariocoop-2026', status: 'sector', decimals: 0, note: 'Divulgado como "mais de 72%".' }),
};

export const sicredi25 = {
  ativos: m({ id: 'scr-ativos', label: 'Ativos totais', value: 455, unit: 'R$ bi', entity: 'Sistema Sicredi', period: 'dez/2025', sourceId: 'sicredi-2025', status: 'official', decimals: 0 }),
  ativosVar: m({ id: 'scr-ativos-var', label: 'Ativos — variação anual', value: 14.6, unit: '%', entity: 'Sistema Sicredi', period: '2025/2024', sourceId: 'sicredi-2025', status: 'official', decimals: 1 }),
  pl: m({ id: 'scr-pl', label: 'Patrimônio líquido', value: 49.8, unit: 'R$ bi', entity: 'Sistema Sicredi', period: 'dez/2025', sourceId: 'sicredi-2025', status: 'official', decimals: 1 }),
  plVar: m({ id: 'scr-pl-var', label: 'PL — variação anual', value: 12.4, unit: '%', entity: 'Sistema Sicredi', period: '2025/2024', sourceId: 'sicredi-2025', status: 'official', decimals: 1 }),
  captacoes: m({ id: 'scr-capt', label: 'Depósitos totais e captações', value: 272, unit: 'R$ bi', entity: 'Sistema Sicredi', period: 'dez/2025', sourceId: 'sicredi-2025', status: 'official', decimals: 0 }),
  captacoesVar: m({ id: 'scr-capt-var', label: 'Captações — variação anual', value: 17.8, unit: '%', entity: 'Sistema Sicredi', period: '2025/2024', sourceId: 'sicredi-2025', status: 'official', decimals: 1 }),
  resultado: m({ id: 'scr-res', label: 'Resultado líquido', value: 7.5, unit: 'R$ bi', entity: 'Sistema Sicredi', period: '2025', sourceId: 'sicredi-2025', status: 'official', decimals: 1, note: 'Conceito "resultado líquido" — não comparável diretamente com o resultado antes de JCP do Sicoob.' }),
};

export const macro = {
  selic: m({ id: 'mc-selic', label: 'Selic (meta)', value: 13.75, unit: '%', entity: 'Economia brasileira', period: '16/09/2026', sourceId: 'bcb-copom', status: 'official', decimals: 2, note: 'Corte de 0,25 p.p.; quinto corte consecutivo de um ciclo iniciado em março/2026 (redução acumulada de 1,25 p.p.).' }),
  selicCiclo: m({ id: 'mc-selic-ciclo', label: 'Redução acumulada no ciclo', value: 1.25, unit: 'p.p.', entity: 'Economia brasileira', period: 'mar–set/2026', sourceId: 'bcb-copom', status: 'official', decimals: 2 }),
  ipca12m: m({ id: 'mc-ipca', label: 'IPCA acumulado em 12 meses', value: 4.22, unit: '%', entity: 'Economia brasileira', period: 'ago/2026', sourceId: 'ibge-ipca', status: 'official', decimals: 2 }),
  ipcaMes: m({ id: 'mc-ipca-mes', label: 'IPCA do mês', value: -0.32, unit: '%', entity: 'Economia brasileira', period: 'ago/2026', sourceId: 'ibge-ipca', status: 'official', decimals: 2 }),
  municipiosBrasil: m({ id: 'mc-mun', label: 'Municípios brasileiros', value: 5570, unit: 'un', entity: 'Brasil', period: '2025', sourceId: 'ibge-municipios', status: 'official', decimals: 0 }),
};

// ---------------------------------------------------------------------
// ÍNDICE DE BASILEIA — série
// ---------------------------------------------------------------------
export const basileiaSeries = [
  { label: 'Sicoob dez/2023', value: 17.0, sourceId: 'moodys-2025', entity: 'Sistema Sicoob (aglutinado)' },
  { label: 'Sicoob dez/2024', value: 18.6, sourceId: 'moodys-2025', entity: 'Sistema Sicoob (aglutinado)' },
  { label: 'Sicoob jun/2026', value: 20.58, sourceId: 'sicoob-1s26', entity: 'Sistema Sicoob' },
];
