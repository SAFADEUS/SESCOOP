import { Section, StatusBadge } from './ui';

const flow = [
  { t: 'Cooperado', d: 'Usuário e proprietário. Integraliza capital social e tem direito a um voto, independentemente do capital.' },
  { t: 'Capital + depósitos + relacionamento', d: 'Recursos e operações do cooperado são a base de funding e de receitas da cooperativa.' },
  { t: 'Cooperativa', d: 'Transforma poupança local em crédito local; opera sem finalidade de lucro para terceiros.' },
  { t: 'Crédito + produtos + serviços', d: 'Crédito, investimentos, seguros, consórcios, cartões, pagamentos — muitas vezes via Banco e empresas do sistema.' },
  { t: 'Resultado (sobras)', d: 'Excedente do exercício após custos, provisões e tributos sobre atos não cooperativos.' },
  { t: 'Reservas + FATES + capital + distribuição', d: 'Reserva legal (≥ 10%) e FATES (≥ 5%) são obrigatórios; a assembleia decide o restante: distribuição proporcional às operações ou capitalização.' },
  { t: 'Cooperado / comunidade', d: 'O valor retorna em sobras, taxas menores, melhor remuneração e investimento social local.' },
];

const contrasts = [
  { dim: 'Propriedade', bank: 'Acionistas, que podem não ser clientes', coop: 'Cooperados, que são os próprios usuários' },
  { dim: 'Voto', bank: 'Proporcional ao número de ações', coop: 'Uma pessoa, um voto' },
  { dim: 'Destino do resultado', bank: 'Dividendos/JCP a acionistas; lucro retido', coop: 'Reservas indivisíveis, FATES e distribuição proporcional às operações' },
  { dim: 'Capital', bank: 'Pode captar no mercado acionário', coop: 'Cresce por retenção de sobras e integralização dos cooperados' },
  { dim: 'Tributação', bank: 'Incidente sobre o lucro', coop: 'Atos cooperativos com tratamento específico; atos não cooperativos tributados' },
  { dim: 'Território', bank: 'Rede orientada por rentabilidade da praça', coop: 'Vínculo com a comunidade; presença onde há cooperados' },
];

export function BusinessModel() {
  return (
    <Section id="estrategia" kicker="14 · Modelo de negócio cooperativo" title="Por que o modelo econômico do Sicoob é diferente de um banco tradicional?"
      lead="O cooperado é, ao mesmo tempo, cliente e dono. Isso muda o destino do resultado, a forma de crescer o capital e a lógica de presença territorial.">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <ol className="space-y-0" aria-label="Fluxo de geração de valor cooperativo">
          {flow.map((f, i) => (
            <li key={f.t} className="relative pl-10 pb-5 last:pb-0">
              {i < flow.length - 1 && <span className="absolute left-[13px] top-7 h-full w-0.5 bg-coop-200" aria-hidden />}
              <span className={`absolute left-0 top-0 grid h-7 w-7 place-items-center rounded-full text-[12px] font-bold ${i === 0 || i === flow.length - 1 ? 'bg-coop-900 text-white' : 'bg-coop-100 text-coop-800'}`}>{i + 1}</span>
              <p className="font-semibold text-ink-900">{f.t}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-700">{f.d}</p>
            </li>
          ))}
        </ol>
        <div className="overflow-hidden rounded-2xl border border-ink-100">
          <div className="grid grid-cols-[110px_1fr_1fr] bg-ink-50 px-4 py-2 text-[12px] font-semibold uppercase tracking-wider text-ink-500 sm:grid-cols-[140px_1fr_1fr]">
            <span /> <span>Banco</span> <span className="text-coop-700">Cooperativa</span>
          </div>
          {contrasts.map((c) => (
            <div key={c.dim} className="grid grid-cols-[110px_1fr_1fr] gap-3 border-t border-ink-100 px-4 py-3 text-sm sm:grid-cols-[140px_1fr_1fr]">
              <span className="font-semibold text-ink-900">{c.dim}</span>
              <span className="text-ink-500">{c.bank}</span>
              <span className="text-ink-900">{c.coop}</span>
            </div>
          ))}
          <p className="border-t border-ink-100 px-4 py-3 text-[12px] text-ink-500">
            Base: Lei 5.764/71 e Lei Complementar 130/2009 (cooperativas de crédito). Descrição conceitual; percentuais estatutários variam por cooperativa. <StatusBadge status="analysis" compact />
          </p>
        </div>
      </div>
    </Section>
  );
}
