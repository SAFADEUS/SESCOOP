import { sys25, sys1s25, sys23, sys26 } from '../data/metrics';
import { fmtMetric } from '../lib/format';
import { Section, StatusBadge } from './ui';

const nodes = [
  { k: 'Crédito', ent: 'Singulares; Banco Sicoob (repasses)', data: `${fmtMetric(sys26.credito)} (jun/26)` },
  { k: 'Crédito rural', ent: 'Singulares; Banco Sicoob', data: `${fmtMetric(sys25.agro)} agro (dez/25)` },
  { k: 'Captação e investimentos', ent: 'Singulares; Banco Sicoob', data: `${fmtMetric(sys26.captacoes)} (jun/26)` },
  { k: 'Gestão de recursos', ent: 'Sicoob DTVM', data: 'n.d. nas fontes consultadas' },
  { k: 'Cartões', ent: 'Banco Sicoob', data: 'n.d.' },
  { k: 'Pagamentos e adquirência', ent: 'Sicoob Pagamentos', data: 'n.d.' },
  { k: 'Seguros', ent: 'Sicoob Seguradora', data: 'n.d.' },
  { k: 'Previdência', ent: 'Sicoob Previ', data: 'n.d.' },
  { k: 'Consórcios', ent: 'Sicoob Consórcios', data: 'n.d.' },
  { k: 'Repasses (ex.: BNDES)', ent: 'Banco Sicoob', data: 'n.d.' },
];

const segments = [
  { s: 'Pessoa física', ev: 'Maior parte dos cooperados (no SNCC, 17,8 de 21,2 mi são PF).', prod: 'Conta, cartões, crédito pessoal/consignado, imobiliário, investimentos, seguros, previdência, consórcios.', st: 'sector' as const },
  { s: 'Empresas e MPEs', ev: `${fmtMetric(sys23.creditoPJ)} de carteira PJ em dez/23.`, prod: 'Capital de giro, investimento, cobrança, adquirência, folha, repasses BNDES.', st: 'official' as const },
  { s: 'Produtor rural / agro', ev: `${fmtMetric(sys25.agro)} (dez/25); rural = ${fmtMetric(sys1s25.ruralShare)} da carteira (jun/25).`, prod: 'Custeio, investimento, comercialização, CPR, seguro rural, consórcio de máquinas.', st: 'official' as const },
  { s: 'Investidores', ev: `Depósitos de ${fmtMetric(sys25.depositos)} (dez/25).`, prod: 'Depósitos a prazo (RDC), LCA, LCI, fundos, previdência.', st: 'official' as const },
  { s: 'Municípios e comunidades', ev: `${fmtMetric(sys25.municipios)} municípios; ${fmtMetric(sys25.municipiosExclusivos)} com presença exclusiva.`, prod: 'Relacionamento com prefeituras, arrecadação, crédito produtivo local, investimento social.', st: 'official' as const },
];

export function BusinessPortfolio() {
  return (
    <Section id="portfolio" kicker="16 · Segmentos e portfólio" title="Um ecossistema completo — com escala conhecida apenas no núcleo"
      lead="O núcleo (crédito e captação) é medido e divulgado. Os negócios adjacentes existem e são operados por empresas do sistema, mas sua escala não é publicada de forma consolidada nos documentos consultados — e, por isso, não é estimada aqui.">
      <div className="relative mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 flex flex-col items-center justify-center rounded-2xl bg-coop-900 p-6 text-center text-white sm:col-span-3 lg:col-span-5">
          <p className="font-display text-3xl">SICOOB</p>
          <p className="text-sm text-coop-200">{fmtMetric(sys26.cooperados)} de cooperados · jun/2026</p>
        </div>
        {nodes.map((n) => (
          <div key={n.k} className={`rounded-xl border p-3 ${n.data.startsWith('n.d') ? 'border-dashed border-ink-200 bg-white' : 'border-coop-200 bg-coop-50'}`}>
            <p className="text-sm font-semibold text-ink-900">{n.k}</p>
            <p className="mt-0.5 text-[12px] text-ink-500">{n.ent}</p>
            <p className={`mt-2 text-[13px] tabular-nums ${n.data.startsWith('n.d') ? 'text-ink-400' : 'font-medium text-coop-800'}`}>{n.data}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[12px] text-ink-500">n.d. = escala não divulgada de forma consolidada nas fontes analisadas.</p>

      <div className="mt-10 overflow-hidden rounded-2xl border border-ink-100">
        {segments.map((g) => (
          <div key={g.s} className="grid gap-2 border-t border-ink-100 px-4 py-4 first:border-t-0 md:grid-cols-[180px_1fr_1.2fr] md:gap-6">
            <p className="font-semibold text-ink-900">{g.s}</p>
            <p className="text-sm text-ink-700"><StatusBadge status={g.st} compact /> {g.ev}</p>
            <p className="text-sm text-ink-500">{g.prod}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
