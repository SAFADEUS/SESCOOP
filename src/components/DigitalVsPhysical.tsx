import { sys1s25, sys25 } from '../data/metrics';
import { ratios } from '../lib/derived';
import { fmtNum } from '../lib/format';
import { Callout, KpiCard, Section } from './ui';

export function DigitalVsPhysical() {
  return (
    <Section id="canais" kicker="21 · Canais digitais × presença física" title="Digitalização reduz ou complementa a capilaridade física?" tone="mist"
      lead="Os dados indicam complementaridade: a transação migrou para o digital, enquanto a rede física continuou relevante para originação, relacionamento e presença em municípios pequenos.">
      <div className="grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <p className="text-[12px] font-bold uppercase tracking-wider text-coop-800">Presença física</p>
          <p className="mt-3 font-display text-4xl tabular-nums text-ink-900">{fmtNum(sys25.unidades.value, 0)}</p>
          <p className="text-sm text-ink-500">unidades de atendimento (dez/25)</p>
          <p className="mt-3 font-display text-2xl tabular-nums text-ink-900">{fmtNum(sys25.municipios.value, 0)}</p>
          <p className="text-sm text-ink-500">municípios · {fmtNum(ratios.coberturaMunicipal.value, 1)}% do país ◆</p>
        </div>
        <div className="grid place-items-center font-display text-3xl text-coop-600" aria-hidden>+</div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <p className="text-[12px] font-bold uppercase tracking-wider text-[#4a4790]">Ecossistema digital</p>
          <p className="mt-3 font-display text-4xl tabular-nums text-ink-900">&gt; {fmtNum(sys1s25.digitalShare.value, 0)}%</p>
          <p className="text-sm text-ink-500">das transações via Super App e internet banking</p>
          <p className="mt-3 font-display text-2xl tabular-nums text-ink-900">{fmtNum(sys1s25.acessosDiarios.value, 0)} mi</p>
          <p className="text-sm text-ink-500">acessos diários em média</p>
        </div>
        <div className="grid place-items-center font-display text-3xl text-coop-600" aria-hidden>=</div>
        <div className="rounded-2xl bg-coop-900 p-5 text-white">
          <p className="text-[12px] font-bold uppercase tracking-wider text-coop-200">Modelo híbrido de relacionamento</p>
          <p className="mt-3 text-[15px] leading-relaxed text-coop-50">
            Transações simples no digital liberam a rede física para atividades de maior valor: crédito, agro, aconselhamento, relacionamento societário.
          </p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard metric={sys1s25.digitalShare} />
        <KpiCard metric={sys1s25.acessosDiarios} />
        <KpiCard metric={sys25.unidades} />
        <KpiCard metric={ratios.ativosPorUnidade} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Callout tone="analysis" title="Leitura">
          A rede cresceu (de “mais de 4.600” pontos em meados de 2025 para 4.727 unidades no fim de 2025) mesmo com &gt; 87% das transações no digital.
          Isso sugere que a rede física não é mantida por volume transacional, mas por sua função de originação e presença territorial.
        </Callout>
        <Callout tone="sector" title="Dados não localizados">
          Número de ATMs, correspondentes, usuários ativos do app e participação do digital na contratação de crédito não constam de forma consolidada nas
          fontes consultadas. Sem eles, não é possível medir a produtividade relativa de cada canal.
        </Callout>
      </div>
    </Section>
  );
}
