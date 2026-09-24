import { sys25, sncc25 } from '../data/metrics';
import { Callout, KpiCard, Section } from './ui';

const areas = [
  'Campanhas emergenciais', 'Cultura', 'Doações filantrópicas', 'Fundo voluntário', 'Educação cooperativista', 'Leis de incentivo',
  'Educação financeira', 'Empreendedorismo e responsabilidade social', 'Meio ambiente', 'Esporte',
];

export function ESG() {
  return (
    <Section id="impacto" kicker="26 · ESG, sustentabilidade e impacto" title="Impacto social mensurado em investimento; o próximo passo é medir resultado"
      lead={<>
        Esta seção trata de práticas ESG e investimento social, conforme o Relatório de Sustentabilidade 2025. O <strong>benefício econômico do cooperativismo</strong>
        (R$ 49,8 bi) é tratado separadamente, pois mede vantagem financeira ao cooperado, não impacto socioambiental.
      </>}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard metric={sys25.investSocial} emphasis />
        <KpiCard metric={sys25.empregos} />
        <KpiCard metric={sys25.municipiosExclusivos} sub="inclusão financeira territorial" />
        <KpiCard metric={sncc25.ruralSemSeguro} sub="risco climático no crédito rural (setor)" />
      </div>
      <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Frentes do investimento social em 2025</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {areas.map((a) => <span key={a} className="rounded-full bg-coop-50 px-3 py-1 text-sm text-coop-800 ring-1 ring-coop-200">{a}</span>)}
        </div>
        <p className="mt-3 text-[12px] text-ink-500">Fonte: Sicoob — Relatório de Sustentabilidade 2025 (divulgação institucional). Distribuição por frente em R$ não reproduzida.</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Callout tone="analysis" title="Social">
          A presença exclusiva em 423 municípios e a concentração em cidades de até 50 mil habitantes fazem da inclusão financeira territorial o principal impacto social do modelo.
        </Callout>
        <Callout tone="analysis" title="Ambiental e climático">
          O risco climático é, antes de tudo, um risco financeiro para uma carteira com forte peso agro. A gestão de riscos social, ambiental e climático (GRSAC)
          e metas de cobertura de seguro rural são os pontos de conexão entre ESG e solidez.
        </Callout>
        <Callout tone="sector" title="Lacunas">
          FATES combinado, horas de educação financeira, pessoas alcançadas, carteira de crédito sustentável, diversidade na governança e emissões financiadas
          não foram reproduzidos. Investimento (insumo) não equivale a impacto (resultado).
        </Callout>
      </div>
    </Section>
  );
}
