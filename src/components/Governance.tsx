import { Section, StatusBadge } from './ui';

const levels = [
  { t: 'Cooperado', d: 'Integraliza capital, vota (uma pessoa, um voto) e elege os órgãos da singular.' },
  { t: 'Assembleia geral', d: 'Órgão supremo da cooperativa: aprova contas, destinação das sobras, estatuto e elege conselhos.' },
  { t: 'Cooperativa singular', d: 'Conselho de administração (estratégia), diretoria executiva (gestão) e conselho fiscal (fiscalização).' },
  { t: 'Cooperativa central', d: 'Supervisão auxiliar das singulares, centralização financeira, padronização e apoio técnico.' },
  { t: 'Sistema / CCS', d: 'Diretrizes sistêmicas, gestão integrada de riscos e capital, tecnologia, marca; controle do Banco Sicoob e das empresas.' },
];

const external = [
  { t: 'Banco Central do Brasil', d: 'Autoriza, regula e supervisiona cada cooperativa e o Banco Sicoob; define requerimentos prudenciais por segmento.' },
  { t: 'FGCoop', d: 'Fundo Garantidor do Cooperativismo de Crédito: garante depósitos dos cooperados até o limite regulamentar e pode prestar assistência financeira.' },
  { t: 'Auditoria independente', d: 'Audita as demonstrações individuais e combinadas.' },
  { t: 'Gestão de riscos e controles', d: 'Estrutura sistêmica de gerenciamento de riscos e capital, incluindo riscos social, ambiental e climático (GRSAC) e divulgação de Pilar 3.' },
];

export function Governance() {
  return (
    <Section id="governanca" kicker="23 · Governança" title="Governança cooperativa: de baixo para cima, com supervisão de fora para dentro" tone="mist"
      lead="O poder de decisão nasce no cooperado e sobe pelas assembleias; as normas prudenciais e a supervisão vêm do Banco Central. A particularidade é que cada nível é uma pessoa jurídica autônoma, e a coordenação sistêmica se faz por contratos, estatutos e participação societária.">
      <div className="grid gap-8 lg:grid-cols-2">
        <ol className="space-y-2" aria-label="Estrutura decisória">
          {levels.map((l, i) => (
            <li key={l.t}>
              <div className="rounded-xl border border-ink-100 bg-white p-4" style={{ marginLeft: `${i * 10}px` }}>
                <p className="font-semibold text-ink-900">{l.t}</p>
                <p className="mt-0.5 text-sm text-ink-700">{l.d}</p>
              </div>
              {i < levels.length - 1 && <p className="py-0.5 pl-6 text-ink-400" aria-hidden>↓</p>}
            </li>
          ))}
        </ol>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-500">Supervisão, garantia e controle</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {external.map((e) => (
              <div key={e.t} className="rounded-xl border border-ink-100 bg-white p-4">
                <p className="font-semibold text-ink-900">{e.t}</p>
                <p className="mt-1 text-sm text-ink-700">{e.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-[#efd9bf] bg-[#fbf3ea] p-4 text-sm text-ink-700">
            <div className="mb-1"><StatusBadge status="analysis" /></div>
            <strong>Particularidades.</strong> (1) Dupla condição do cooperado — dono e usuário — cria alinhamento, mas também potencial conflito entre preço baixo e
            retenção de capital. (2) A governança multinível dá legitimidade local, com custo de coordenação. (3) A heterogeneidade entre singulares torna a
            supervisão auxiliar das centrais uma função crítica de risco.
          </div>
        </div>
      </div>
    </Section>
  );
}
