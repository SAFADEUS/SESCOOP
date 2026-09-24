import { Section, StatusBadge } from './ui';
import type { Status } from '../data/types';

const drivers: { driver: string; fact: string; factStatus: Status; interpretation: string }[] = [
  { driver: 'Captações e liquidez', fact: 'Captações +18,09% em 12 meses (jun/26); +20,6% em 2025; captações/ativos em 73,5%.', factStatus: 'official', interpretation: 'Principal vetor mecânico do crescimento do ativo desde 2025: recursos captados e ainda não convertidos em crédito são aplicados em liquidez e títulos.' },
  { driver: 'Carteira de crédito', fact: 'Crédito médio anual de 17,3% (jun/22–jun/26), mas apenas +9,54% nos últimos 12 meses.', factStatus: 'official', interpretation: 'Foi o motor do crescimento até 2024; perdeu ritmo relativo em 2025–2026, possivelmente por seletividade em cenário de juros altos e risco crescente.' },
  { driver: 'Agronegócio', fact: 'Carteira agro de R$ 92,8 bi em dez/25; crédito rural = 26,06% da carteira em jun/25.', factStatus: 'official', interpretation: 'Segmento de peso estrutural; o crescimento do rural PF no SNCC (+16,9%) sugere que o agro seguiu relevante na expansão.' },
  { driver: 'Empresas e MPEs', fact: 'R$ 80,7 bi da carteira destinados a empresas em dez/23.', factStatus: 'official', interpretation: 'Pessoa jurídica é fatia relevante da carteira; dado mais recente não localizado.' },
  { driver: 'Base de cooperados', fact: '8 mi (dez/23) → 10 mi (jun/26).', factStatus: 'official', interpretation: 'Crescimento da base (≈ 25%) é menor que o dos ativos (≈ 58% no mesmo intervalo, dez/23→jun/26) — o aprofundamento por cooperado explica mais que a aquisição.' },
  { driver: 'Expansão territorial', fact: '2.486 municípios; SFN não cooperativo saiu de 85 municípios em 2025.', factStatus: 'official', interpretation: 'A presença física em mercados deixados por bancos favorece captação local e relacionamento.' },
  { driver: 'Fortalecimento do patrimônio', fact: 'PL +15,3% em 2025, sustentado por resultado de R$ 11,2 bi.', factStatus: 'official', interpretation: 'A retenção de resultados permite crescer sem restrição de capital — condição para a expansão, não sua causa.' },
  { driver: 'Digitalização e cross-sell', fact: '> 87% das transações no digital; 8 mi de acessos diários.', factStatus: 'official', interpretation: 'Facilita escala transacional; o efeito sobre crescimento de negócios não é mensurável com os dados publicados.' },
];

export function GrowthAnalysis() {
  return (
    <Section id="expansao" kicker="11 · Análise de crescimento" title="O que explica a expansão?"
      lead="Cada vetor separa o fato comprovado (dado publicado) da interpretação (hipótese analítica). A decomposição exata do crescimento exigiria dados que o Sicoob não divulga de forma consolidada.">
      <div className="overflow-hidden rounded-2xl border border-ink-100">
        <div className="hidden grid-cols-[180px_1fr_1fr] bg-ink-50 px-4 py-2 text-[12px] font-semibold uppercase tracking-wider text-ink-500 md:grid">
          <span>Vetor</span><span>Fato comprovado</span><span>Interpretação</span>
        </div>
        {drivers.map((d) => (
          <div key={d.driver} className="grid gap-2 border-t border-ink-100 px-4 py-4 md:grid-cols-[180px_1fr_1fr] md:gap-6">
            <p className="font-semibold text-ink-900">{d.driver}</p>
            <p className="text-sm text-ink-700"><StatusBadge status={d.factStatus} compact /> {d.fact}</p>
            <p className="text-sm text-ink-700"><StatusBadge status="analysis" compact /> {d.interpretation}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
