import { useState } from 'react';
import { ANALYSIS_DATE } from '../data/sources';

const DISCLAIMER = 'Esta análise utiliza exclusivamente informações públicas. Dados financeiros podem possuir diferentes critérios de consolidação e escopo. Sempre consulte a fonte, a data-base e a metodologia associada a cada indicador.';

export function Footer({ onMethodology }: { onMethodology: () => void }) {
  const [bar, setBar] = useState(true);
  return (
    <>
      <footer className="bg-coop-900 pb-24 text-coop-100">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="font-display text-2xl text-white">SICOOB — Diagnóstico Estratégico e Econômico-Financeiro</p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed">
            Estudo técnico demonstrativo desenvolvido sob perspectiva metodológica do SESCOOP/RJ, com base exclusivamente em informações públicas.
            Não constitui publicação oficial do SESCOOP/RJ, do Sistema OCB ou do Sicoob, nem recomendação de investimento.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed">{DISCLAIMER}</p>
          <p className="mt-6 text-[12px] text-coop-200">Dados atualizados até: {ANALYSIS_DATE} · Data-base financeira mais recente: 30/06/2026.</p>
        </div>
      </footer>
      {bar && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-2 text-[11px] leading-snug text-ink-500 sm:items-center sm:px-6 sm:text-[12px]">
            <p className="flex-1"><span className="sm:hidden">Somente informações públicas; escopos e critérios de consolidação variam. Confira fonte e data-base de cada indicador.</span><span className="hidden sm:inline">{DISCLAIMER}</span></p>
            <button onClick={onMethodology} className="shrink-0 font-medium text-coop-700 underline underline-offset-2">Metodologia</button>
            <button onClick={() => setBar(false)} className="shrink-0 px-1 text-ink-400 hover:text-ink-900" aria-label="Ocultar aviso">✕</button>
          </div>
        </div>
      )}
    </>
  );
}
