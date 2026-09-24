import { Section, StatusBadge } from './ui';

type Level = 3 | 2 | 1;
const players = ['Sicoob', 'Grandes bancos', 'Outras cooperativas', 'Bancos digitais', 'Fintechs'] as const;

/** Leitura qualitativa (3 = forte, 2 = intermediário, 1 = limitado), com base na natureza de cada modelo. */
const dims: { d: string; v: Level[]; why: string }[] = [
  { d: 'Capilaridade física', v: [3, 2, 3, 1, 1], why: 'Sicoob: 4.727 unidades em 2.486 municípios; bancos vêm reduzindo presença (saída de 85 municípios em 2025).' },
  { d: 'Digitalização', v: [2, 3, 2, 3, 3], why: 'Sicoob: > 87% das transações no digital; bancos digitais e fintechs nasceram digitais.' },
  { d: 'Relacionamento local', v: [3, 1, 3, 1, 1], why: 'Governança local e vínculo societário das singulares.' },
  { d: 'Crédito agro', v: [3, 3, 3, 1, 1], why: 'Agro de R$ 92,8 bi no Sicoob; cooperativismo detém 22% do crédito rural PF do SFN.' },
  { d: 'PMEs', v: [3, 3, 3, 2, 2], why: 'Carteira PJ relevante (R$ 80,7 bi em 2023).' },
  { d: 'Capital', v: [3, 3, 2, 2, 1], why: 'Basileia de 20,58% no Sicoob vs 18,1% médio do SNCC.' },
  { d: 'Acesso a capital externo', v: [1, 3, 1, 3, 2], why: 'Cooperativas não emitem ações; capital cresce por sobras e cotas.' },
  { d: 'Retorno do resultado ao usuário', v: [3, 1, 3, 1, 1], why: 'Sobras e benefício econômico de R$ 49,8 bi aos cooperados em 2025.' },
  { d: 'Velocidade de decisão sistêmica', v: [2, 2, 2, 3, 3], why: 'Governança multinível exige coordenação entre centenas de entidades.' },
];

const label: Record<Level, string> = { 3: 'Forte', 2: 'Intermediário', 1: 'Limitado' };
const cls: Record<Level, string> = { 3: 'bg-coop-700 text-white', 2: 'bg-coop-100 text-coop-800', 1: 'bg-ink-100 text-ink-500' };

export function CompetitiveAnalysis() {
  return (
    <Section id="competicao" kicker="18 · Posicionamento competitivo" title="Onde o modelo Sicoob se diferencia — e onde não"
      lead="Mapa qualitativo por arquétipo de concorrente. Não é ranking: compara a natureza dos modelos, e cada linha traz a evidência que sustenta a leitura para o Sicoob.">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-[12px] text-ink-700">
        <StatusBadge status="analysis" />
        {([3, 2, 1] as Level[]).map((l) => <span key={l} className="flex items-center gap-1.5"><i className={`h-3 w-5 rounded ${cls[l]}`} />{label[l]}</span>)}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-ink-100">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-ink-50 text-left text-[12px] uppercase tracking-wider text-ink-500">
              <th className="px-4 py-2 font-semibold">Dimensão</th>
              {players.map((p) => <th key={p} className={`px-2 py-2 text-center font-semibold ${p === 'Sicoob' ? 'text-coop-800' : ''}`}>{p}</th>)}
              <th className="px-4 py-2 font-semibold">Evidência (Sicoob)</th>
            </tr>
          </thead>
          <tbody>
            {dims.map((r) => (
              <tr key={r.d} className="border-t border-ink-100">
                <td className="px-4 py-2.5 font-medium text-ink-900">{r.d}</td>
                {r.v.map((v, i) => (
                  <td key={i} className="px-2 py-2.5 text-center">
                    <span className={`inline-block min-w-[88px] rounded-md px-2 py-1 text-[11px] font-medium ${cls[v]}`}>{label[v]}</span>
                  </td>
                ))}
                <td className="px-4 py-2.5 text-[13px] text-ink-500">{r.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[12px] text-ink-500 md:hidden">Deslize a tabela lateralmente para ver todas as colunas.</p>
      <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-700">
        A vantagem distintiva do Sicoob está na combinação — presença física + relacionamento local + retorno do resultado ao usuário — que nenhum
        arquétipo concorrente reúne simultaneamente. As desvantagens estruturais estão no acesso a capital externo e na velocidade de decisão sistêmica.
      </p>
    </Section>
  );
}
