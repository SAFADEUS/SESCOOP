import { useEffect, useRef } from 'react';
import { ANALYSIS_DATE, DATA_UNTIL } from '../data/sources';
import { STATUS_META } from './ui';
import type { Status } from '../data/types';

export function DataLegend() {
  const order: Status[] = ['official', 'calculated', 'analysis', 'sector'];
  return (
    <div className="grid gap-3 rounded-2xl border border-ink-100 bg-ink-50 p-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Legenda de classificação dos dados">
      {order.map((s) => (
        <div key={s} className="flex gap-3">
          <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm ring-1 ring-inset ${STATUS_META[s].cls}`} aria-hidden>{STATUS_META[s].symbol}</span>
          <div>
            <p className="text-[13px] font-semibold text-ink-900">{STATUS_META[s].label}</p>
            <p className="text-[12px] leading-snug text-ink-500">{STATUS_META[s].desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MethodologyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink-900/40 sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Metodologia" onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-coop-700">Transparência metodológica</p>
            <h2 className="mt-1 font-display text-2xl text-ink-900">Metodologia</h2>
          </div>
          <button ref={ref} onClick={onClose} className="rounded-full p-2 text-ink-500 hover:bg-ink-50" aria-label="Fechar">✕</button>
        </div>
        <div className="prose-sm mt-6 space-y-5 text-[15px] leading-relaxed text-ink-700">
          <Block t="Natureza do estudo">
            Estudo técnico demonstrativo desenvolvido sob perspectiva metodológica do SESCOOP/RJ, com base exclusivamente em informações públicas.
            Não constitui publicação oficial do SESCOOP/RJ nem do Sicoob, e não foi validado por nenhuma das instituições. Não é recomendação de investimento.
          </Block>
          <Block t="Data da análise e período">
            Informações consultadas até {ANALYSIS_DATE}. Dado financeiro mais recente: {DATA_UNTIL} (1º semestre de 2026). Série histórica: 2022 a jun/2026.
          </Block>
          <Block t="Hierarquia de fontes">
            Nível 1 — Banco Central, Sicoob (comunicados, Relatório de Sustentabilidade, demonstrações), Sistema OCB/AnuárioCoop, IBGE.
            Nível 2 — agências de rating, OCBs estaduais e reproduções institucionais. Nível 3 — imprensa econômica, apenas como apoio.
            Quando o documento primário não pôde ser acessado diretamente, o link aponta para reprodução institucional ou setorial do mesmo comunicado, e isso é indicado no painel de fonte.
          </Block>
          <Block t="Critérios">
            (1) Cada número é associado a entidade, período, fonte e data-base. (2) Não se misturam períodos ou conceitos em um mesmo indicador.
            (3) Não se anualizam resultados semestrais. (4) Indicadores de SNCC nunca são atribuídos ao Sicoob. (5) Na ausência de dado, a lacuna é declarada.
          </Block>
          <Block t="Sistema × entidades">
            "Sistema Sicoob" refere-se às demonstrações combinadas (singulares, centrais, Banco Sicoob e demais entidades, com eliminações intrassistema).
            "Banco Sicoob" é uma entidade específica. Números do Banco não podem ser somados aos do Sistema nem expressos como participação dele.
          </Block>
          <Block t="Indicadores derivados">
            Calculados pela aplicação com fórmula explícita (botão "Fórmula"). Quando os insumos vêm de fontes distintas, isso é indicado.
            Variações derivadas de percentuais divulgados (ex.: valor de 2022 obtido a partir do crescimento de 2023) herdam o arredondamento do percentual.
          </Block>
          <Block t="Tratamento de divergências">
            Divergências entre documentos não são resolvidas silenciosamente. São listadas na seção "Divergências", com hipóteses de explicação identificadas como hipóteses.
          </Block>
          <Block t="Limitações">
            As Demonstrações Contábeis Combinadas completas (rubricas detalhadas de balanço e DSO, notas explicativas) e os relatórios de Pilar 3 não puderam ser
            processados nesta versão. Por isso, a estrutura patrimonial e a demonstração de resultado mostram apenas as rubricas publicadas nos comunicados,
            e as demais aparecem como "não reproduzido — consultar DC combinadas". Não há dados regionais por estado nas fontes consultadas.
            Indicadores de eficiência, inadimplência específica do Sicoob e composição de receitas não foram localizados de forma consolidada.
          </Block>
        </div>
      </div>
    </div>
  );
}

function Block({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-ink-900">{t}</h3>
      <p className="mt-1">{children}</p>
    </div>
  );
}
