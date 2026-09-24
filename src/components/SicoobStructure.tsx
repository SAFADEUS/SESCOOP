import { useState } from 'react';
import { banco26, sys26, sys25 } from '../data/metrics';
import { fmtMetric } from '../lib/format';
import { Callout, KpiCard, Section, Segmented, SourceButton, SubHead } from './ui';

const entities = [
  { name: 'Cooperativas singulares', count: `${sys25.singulares.value}`, role: 'Atendem diretamente os cooperados: captam, concedem crédito, prestam serviços. Cada uma é uma instituição financeira autorizada pelo Banco Central, com assembleia, conselho e diretoria próprios.' },
  { name: 'Cooperativas centrais', count: `${sys25.centrais.value}`, role: 'Congregam singulares de uma região: centralização financeira (gestão da liquidez), supervisão auxiliar, padronização e capacitação.' },
  { name: 'Centro Cooperativo Sicoob (CCS) / Sicoob Confederação', count: '1', role: 'Holding sistêmica controlada pelas centrais: define diretrizes, marca, tecnologia e padrões de governança e risco; controla o Banco Sicoob e demais empresas.' },
  { name: 'Banco Sicoob', count: '1', role: 'Banco cooperativo (sociedade anônima) que dá às cooperativas acesso a produtos e mercados restritos a bancos: compensação, câmbio, cartões, repasses (ex.: BNDES), captação no mercado e tesouraria.' },
  { name: 'Empresas do ecossistema', count: '—', role: 'Sicoob DTVM (gestão de recursos), Sicoob Seguradora, Sicoob Pagamentos/adquirência, Sicoob Consórcios, Sicoob Previ (previdência complementar fechada) e Instituto Sicoob (investimento social).' },
];

const compare = [
  { k: 'ativos', label: 'Ativos' },
  { k: 'credito', label: 'Carteira de crédito' },
  { k: 'captacoes', label: 'Captações' },
  { k: 'pl', label: 'Patrimônio líquido' },
  { k: 'resultado', label: 'Resultado 1S2026' },
  { k: 'basileia', label: 'Basileia' },
] as const;

export function SicoobStructure() {
  const [view, setView] = useState<'sistema' | 'banco' | 'lado'>('lado');
  return (
    <Section
      id="sicoob"
      kicker="03 · Estrutura institucional"
      title="O que é “Sicoob”? Um sistema, não uma empresa"
      lead={<>
        O Sicoob é um sistema cooperativo organizado em níveis. Cada cooperativa singular é juridicamente autônoma; centrais e
        CCS coordenam o conjunto; o Banco Sicoob e as empresas do ecossistema prestam serviços às cooperativas. Os números
        do “Sistema Sicoob” resultam da <strong>combinação</strong> dessas demonstrações, com eliminação das operações entre elas.
      </>}
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <ol className="relative space-y-3" aria-label="Arquitetura do Sistema Sicoob">
          <li className="rounded-xl bg-coop-900 px-4 py-3 text-white">
            <p className="text-[12px] uppercase tracking-wider text-coop-200">Nível sistêmico</p>
            <p className="font-semibold">Sistema Sicoob — {sys26.cooperados.value} mi cooperados</p>
          </li>
          {entities.map((e, i) => (
            <li key={e.name} className="relative rounded-xl border border-ink-100 bg-white p-4" style={{ marginLeft: `${Math.min(i, 3) * 12}px` }}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold text-ink-900">{e.name}</p>
                <span className="font-display text-xl text-coop-700 tabular-nums">{e.count}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-ink-700">{e.role}</p>
            </li>
          ))}
          <li className="text-[11px] text-ink-500">
            Quantidades: <SourceButton sourceId="sicoob-sistema" label="Sicoob — página “Sistema Sicoob”" />. Funções: descrição institucional; relações societárias detalhadas devem ser conferidas nas notas das DC combinadas.
          </li>
        </ol>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-xl text-ink-900 sm:text-2xl">Sistema Sicoob e Banco Sicoob: o que estamos analisando?</h3>
            <Segmented label="Entidade" value={view} onChange={setView} options={[
              { value: 'lado', label: 'Comparar' }, { value: 'sistema', label: 'Sistema' }, { value: 'banco', label: 'Banco' },
            ]} />
          </div>
          <p className="mt-2 text-sm text-ink-500">Data-base: jun/2026. Fonte: comunicado de resultados do Sicoob.</p>

          {view === 'lado' ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-ink-100">
              <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-ink-50 px-4 py-2 text-[12px] font-semibold uppercase tracking-wider text-ink-500">
                <span>Indicador</span><span className="text-right">Sistema</span><span className="text-right">Banco</span>
              </div>
              {compare.map((c) => (
                <div key={c.k} className="grid grid-cols-[1.2fr_1fr_1fr] border-t border-ink-100 px-4 py-2.5 text-sm">
                  <span className="text-ink-700">{c.label}</span>
                  <span className="text-right font-medium tabular-nums text-ink-900">{fmtMetric(sys26[c.k])}</span>
                  <span className="text-right font-medium tabular-nums text-[#4a4790]">{fmtMetric(banco26[c.k])}</span>
                </div>
              ))}
              <div className="flex items-center justify-center gap-3 border-t border-ink-100 bg-[#fbf0ee] px-4 py-3 text-center">
                <span className="font-display text-lg text-ink-900">BANCO SICOOB ≠ SISTEMA SICOOB</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {compare.map((c) => <KpiCard key={c.k} metric={(view === 'sistema' ? sys26 : banco26)[c.k]} emphasis={view === 'sistema'} />)}
            </div>
          )}

          <div className="mt-4 space-y-3">
            <Callout tone="analysis" title="Por que não somar nem dividir">
              Os ativos do Banco (R$ 223 bi) equivalem a quase metade dos ativos do Sistema (R$ 471 bi), mas <strong>não</strong> representam 47% do Sistema:
              boa parte do balanço do Banco decorre de recursos das próprias cooperativas (centralização financeira), que são eliminados na combinação.
              Somar as duas entidades duplicaria valores; dividir uma pela outra produziria uma “participação” sem significado econômico.
            </Callout>
            <Callout tone="analysis" title="Implicação para a análise">
              Ratings, Basileia e resultados do Banco Sicoob (ex.: rating AA+.br da Moody’s Local) descrevem o Banco. Conclusões sobre ele não se
              transferem automaticamente para o Sistema — e vice-versa. O Banco tem PL de R$ 7 bi para R$ 223 bi de ativos (≈ 3%), perfil típico de
              instituição que opera recursos do sistema; o Sistema tem ≈ 14%.
            </Callout>
          </div>
        </div>
      </div>

      <SubHead>Escala do Sistema em 31/12/2025</SubHead>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <KpiCard metric={sys25.ativos} />
        <KpiCard metric={sys25.opCredito} />
        <KpiCard metric={sys25.depositos} />
        <KpiCard metric={sys25.pl} />
        <KpiCard metric={sys25.cooperadosRS} />
        <KpiCard metric={sys25.municipios} />
        <KpiCard metric={sys25.unidades} />
        <KpiCard metric={sys25.empregos} />
      </div>
    </Section>
  );
}
