import type { Metric } from '../data/types';
import {
  sys26, sys25, sys24, juneSeries, sncc25, macro, sicredi25, sys1s25,
} from '../data/metrics';

/* =====================================================================
 * INDICADORES DERIVADOS
 * Todos calculados nesta aplicação a partir de dados públicos.
 * status = 'calculated' + fórmula explícita.
 * ===================================================================== */

const calc = (
  id: string, label: string, value: number, unit: Metric['unit'], entity: Metric['entity'],
  period: string, formula: string, decimals = 1, note?: string,
): Metric => ({ id, label, value, unit, entity, period, sourceId: 'sescoop-analise', status: 'calculated', formula, decimals, note });

const pct = (a: number, b: number) => (a / b) * 100;
const cagr = (end: number, start: number, years: number) => (Math.pow(end / start, 1 / years) - 1) * 100;

const [j22, j25, j26] = juneSeries;

/** Razões de estrutura em cada ponto da série de junho (mesma fonte, mesmo conceito). */
export const structureRatios = juneSeries.map((p) => ({
  period: p.period,
  creditoAtivos: pct(p.credito, p.ativos),
  captacoesAtivos: pct(p.captacoes, p.ativos),
  creditoCaptacoes: pct(p.credito, p.captacoes),
  plAtivos: pct(p.pl, p.ativos),
}));

export const ratios = {
  creditoAtivos: calc('r-cred-at', 'Crédito / Ativos', pct(j26.credito, j26.ativos), '%', 'Sistema Sicoob', 'jun/2026', 'Carteira de crédito ÷ Ativos totais'),
  captacoesAtivos: calc('r-capt-at', 'Captações / Ativos', pct(j26.captacoes, j26.ativos), '%', 'Sistema Sicoob', 'jun/2026', 'Captações ÷ Ativos totais'),
  creditoCaptacoes: calc('r-cred-capt', 'Crédito / Captações', pct(j26.credito, j26.captacoes), '%', 'Sistema Sicoob', 'jun/2026', 'Carteira de crédito ÷ Captações'),
  plAtivos: calc('r-pl-at', 'Patrimônio / Ativos', pct(j26.pl, j26.ativos), '%', 'Sistema Sicoob', 'jun/2026', 'Patrimônio líquido ÷ Ativos totais'),
  roa25: calc('r-roa', 'Resultado / Ativos médios (2025)', pct(sys25.sobrasAntesJcp.value, (sys24.ativos.value + sys25.ativos.value) / 2), '%', 'Sistema Sicoob', '2025',
    'Resultado antes de JCP 2025 ÷ média dos ativos de dez/2024 e dez/2025', 2,
    'Fontes diferentes para dez/2024 (Moody\'s Local) e dez/2025 (Sicoob). Resultado antes de JCP; não é lucro líquido.'),
  roe25: calc('r-roe', 'Resultado / PL médio (2025)', pct(sys25.sobrasAntesJcp.value, (sys24.pl.value + sys25.pl.value) / 2), '%', 'Sistema Sicoob', '2025',
    'Resultado antes de JCP 2025 ÷ média do PL de dez/2024 e dez/2025', 1,
    'Em cooperativas, o "retorno" não é destinado a acionistas: retorna aos cooperados e reforça reservas. Uso apenas como medida de geração de capital.'),
  ativosPorCooperado: calc('r-at-coop', 'Ativos por cooperado', (j26.ativos * 1e9) / (sys26.cooperados.value * 1e6) / 1000, 'R$ mil', 'Sistema Sicoob', 'jun/2026', 'Ativos totais ÷ número de cooperados', 1),
  creditoPorCooperado: calc('r-cred-coop', 'Crédito por cooperado', (j26.credito * 1e9) / (sys26.cooperados.value * 1e6) / 1000, 'R$ mil', 'Sistema Sicoob', 'jun/2026', 'Carteira de crédito ÷ número de cooperados', 1),
  resultadoPorCooperado: calc('r-res-coop', 'Resultado por cooperado (2025)', (sys25.sobrasAntesJcp.value * 1e9) / (sys25.cooperadosRS.value * 1e6), 'R$', 'Sistema Sicoob', '2025', 'Resultado antes de JCP 2025 ÷ cooperados em dez/2025', 0),
  ativosPorUnidade: calc('r-at-und', 'Ativos por unidade de atendimento', (sys25.ativos.value * 1e3) / sys25.unidades.value, 'R$ mi', 'Sistema Sicoob', 'dez/2025', 'Ativos totais ÷ unidades de atendimento próprias', 0),
  ativosPorEmpregado: calc('r-at-emp', 'Ativos por empregado direto', (sys25.ativos.value * 1e3) / sys25.empregos.value, 'R$ mi', 'Sistema Sicoob', 'dez/2025', 'Ativos totais ÷ empregos diretos', 2),
  resultadoPorEmpregado: calc('r-res-emp', 'Resultado por empregado direto', (sys25.sobrasAntesJcp.value * 1e6) / sys25.empregos.value, 'R$ mil', 'Sistema Sicoob', '2025', 'Resultado antes de JCP ÷ empregos diretos', 0),
  folgaBasileia: calc('r-folga', 'Distância da referência regulatória de 11%', sys26.basileia.value - sncc25.basileiaRef.value, 'p.p.', 'Sistema Sicoob', 'jun/2026', 'Índice de Basileia do Sistema − 11% (referência citada pelo BC no Panorama SNCC)', 2,
    'O requerimento efetivo varia conforme segmento prudencial (S1–S5), metodologia (completa ou simplificada) e adicionais de capital de cada entidade. A distância é ilustrativa.'),
  beneficioSobreResultado: calc('r-benef-res', 'Benefício econômico ÷ resultado', sys25.beneficio.value / sys25.sobrasAntesJcp.value, 'un', 'Sistema Sicoob', '2025', 'Benefício econômico total ÷ resultado antes de JCP', 1,
    'Grandezas de natureza diferente — ver seção Benefício ao cooperado.'),
  agroShareAmpliada: calc('r-agro', 'Carteira agro / carteira ampliada', pct(sys25.agro.value, sys25.carteiraAmpliada.value), '%', 'Sistema Sicoob', 'dez/2025', 'Carteira agro (crédito rural + CPRF) ÷ carteira ampliada líquida'),
  coberturaMunicipal: calc('r-cob', 'Municípios brasileiros com presença física do Sicoob', pct(sys25.municipios.value, macro.municipiosBrasil.value), '%', 'Sistema Sicoob', 'dez/2025', 'Municípios com presença ÷ 5.570 municípios (IBGE)'),
  exclusivosShare: calc('r-excl', 'Participação do Sicoob nos municípios com presença exclusiva do cooperativismo', pct(sys25.municipiosExclusivos.value, sncc25.municipiosExclusivos.value), '%', 'Sistema Sicoob', '2025', '423 (Sicoob, RS 2025) ÷ 1.072 (SNCC, dados BC via OCB)', 1,
    'Fontes e recortes distintos: leitura aproximada.'),
  shareAtivosSncc: calc('r-sh-sncc', 'Ativos do Sicoob / ativos do SNCC', pct(sys25.ativos.value, sncc25.ativos.value), '%', 'Sistema Sicoob', 'dez/2025', 'Ativos combinados do Sicoob ÷ ativos do SNCC', 1,
    'Aproximação: critérios de consolidação do Banco Central (SNCC) e de combinação do Sicoob não são idênticos; o SNCC inclui cooperativas, e o Sicoob combinado inclui o Banco Sicoob e outras entidades não cooperativas.'),
  plAtivosSicredi: calc('r-pl-scr', 'PL / Ativos — Sicredi', pct(sicredi25.pl.value, sicredi25.ativos.value), '%', 'Sistema Sicredi', 'dez/2025', 'PL ÷ Ativos totais (Sicredi)'),
  plAtivosSicoob25: calc('r-pl-sc25', 'PL / Ativos — Sicoob', pct(sys25.pl.value, sys25.ativos.value), '%', 'Sistema Sicoob', 'dez/2025', 'PL ÷ Ativos totais (Sicoob)'),
  resultadoSemestralVar: calc('r-sem', 'Variação hipotética 1S2026 vs 1S2025', pct(sys26.resultado.value - sys1s25.resultado.value, sys1s25.resultado.value), '%', 'Sistema Sicoob', '1S26/1S25',
    '(R$ 4,577 bi − R$ 5,8 bi) ÷ R$ 5,8 bi', 1, 'Válido SOMENTE se os dois conceitos forem idênticos — o que não está confirmado.'),
};

export const cagrs = {
  ativos: calc('c-at', 'Ativos', cagr(j26.ativos, j22.ativos, 4), '%', 'Sistema Sicoob', 'jun/22 → jun/26', '(Ativos jun/26 ÷ Ativos jun/22)^(1/4) − 1'),
  credito: calc('c-cr', 'Crédito', cagr(j26.credito, j22.credito, 4), '%', 'Sistema Sicoob', 'jun/22 → jun/26', '(Crédito jun/26 ÷ Crédito jun/22)^(1/4) − 1'),
  captacoes: calc('c-cp', 'Captações', cagr(j26.captacoes, j22.captacoes, 4), '%', 'Sistema Sicoob', 'jun/22 → jun/26', '(Captações jun/26 ÷ Captações jun/22)^(1/4) − 1'),
  pl: calc('c-pl', 'Patrimônio', cagr(j26.pl, j22.pl, 4), '%', 'Sistema Sicoob', 'jun/22 → jun/26', '(PL jun/26 ÷ PL jun/22)^(1/4) − 1'),
};

export const accumulated = {
  ativos: pct(j26.ativos - j22.ativos, j22.ativos),
  credito: pct(j26.credito - j22.credito, j22.credito),
  captacoes: pct(j26.captacoes - j22.captacoes, j22.captacoes),
  pl: pct(j26.pl - j22.pl, j22.pl),
};

export { j22, j25, j26 };
