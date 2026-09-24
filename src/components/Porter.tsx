import { useState } from 'react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { porter } from '../data/analysis';
import { ChartFrame, DataTable, Section, StatusBadge } from './ui';
import { SERIES } from './chartTheme';

export function Porter() {
  const [sel, setSel] = useState(porter[0].key);
  const f = porter.find((p) => p.key === sel)!;
  const data = porter.map((p) => ({ force: p.force.replace(' / fintechs', '').replace('Poder dos fornecedores estratégicos', 'Fornecedores').replace('Poder e mobilidade dos cooperados', 'Cooperados').replace('Rivalidade entre instituições', 'Rivalidade').replace('Produtos substitutos', 'Substitutos').replace('Novos entrantes', 'Entrantes'), v: p.intensity }));
  return (
    <Section id="porter" kicker="19 · Cinco Forças de Porter" title="Pressão competitiva: alta na rivalidade, moderada nas demais forças" tone="mist"
      lead="Intensidade em escala de 1 (baixa) a 5 (muito alta), atribuída analiticamente com base nas evidências listadas. Nenhuma classificação é apresentada sem justificativa.">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <ChartFrame title="Intensidade das forças (1–5)" subtitle="▲ Classificação analítica" sourceIds={['sescoop-analise', 'bcb-sncc-2025', 'sicredi-2025']} scope="Mercado financeiro brasileiro — perspectiva do Sicoob" dataBase="2025–2026"
          table={<DataTable columns={['Força', 'Intensidade']} rows={porter.map((p) => [p.force, `${p.intensity} — ${p.label}`])} />}>
          <div className="h-72">
            <ResponsiveContainer>
              <RadarChart data={data} outerRadius="72%">
                <PolarGrid stroke="#d9dedf" />
                <PolarAngleAxis dataKey="force" tick={{ fill: '#3b4648', fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={{ fill: '#7c8789', fontSize: 10 }} axisLine={false} />
                <Radar dataKey="v" stroke={SERIES.a} fill={SERIES.a} fillOpacity={0.18} strokeWidth={2} dot={{ r: 4, fill: SERIES.a }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>
        <div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Forças">
            {porter.map((p) => (
              <button key={p.key} role="tab" aria-selected={sel === p.key} onClick={() => setSel(p.key)}
                className={`rounded-full px-3 py-1.5 text-[13px] transition ${sel === p.key ? 'bg-coop-900 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-200 hover:ring-coop-400'}`}>
                {p.force}
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-ink-100 bg-white p-5" role="tabpanel" aria-live="polite">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-xl text-ink-900">{f.force}</p>
              <StatusBadge status="analysis" compact />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex gap-1" aria-label={`Intensidade ${f.intensity} de 5`}>
                {[1, 2, 3, 4, 5].map((i) => <span key={i} className={`h-2 w-6 rounded-full ${i <= f.intensity ? 'bg-coop-600' : 'bg-ink-100'}`} />)}
              </div>
              <span className="text-sm font-semibold text-ink-900">{f.label}</span>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="font-semibold text-ink-900">Evidência</dt><dd className="text-ink-700">{f.evidence}</dd></div>
              <div><dt className="font-semibold text-ink-900">Justificativa da intensidade</dt><dd className="text-ink-700">{f.why}</dd></div>
              <div><dt className="font-semibold text-ink-900">Impacto sobre o Sicoob</dt><dd className="text-ink-700">{f.impact}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </Section>
  );
}
