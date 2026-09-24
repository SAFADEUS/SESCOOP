import { divergences, glossary } from '../data/analysis';
import { sources, ANALYSIS_DATE } from '../data/sources';
import { Section, SubHead, StatusBadge } from './ui';

export function Sources({ onMethodology }: { onMethodology: () => void }) {
  return (
    <Section id="fontes" kicker="31 · Metodologia e fontes" title="Transparência: de onde vem cada número" tone="mist"
      lead={<>Dados atualizados até: <strong>{ANALYSIS_DATE}</strong>. Todas as fontes abaixo foram consultadas nesta data. <button onClick={onMethodology} className="font-medium text-coop-700 underline underline-offset-2">Abrir metodologia completa</button>.</>}>
      <SubHead>Divergências entre documentos</SubHead>
      <div className="space-y-3">
        {divergences.map((d) => (
          <details key={d.topic} className="group rounded-xl border border-ink-100 bg-white p-4 open:shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-ink-900">
              {d.topic}<span className="text-ink-400 group-open:rotate-45 transition" aria-hidden>+</span>
            </summary>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
              <p className="rounded-lg bg-ink-50 p-3 text-ink-700"><strong className="text-ink-900">A. </strong>{d.a}</p>
              <p className="rounded-lg bg-ink-50 p-3 text-ink-700"><strong className="text-ink-900">B. </strong>{d.b}</p>
            </div>
            <p className="mt-3 text-sm text-ink-700"><StatusBadge status="analysis" compact /> {d.reading}</p>
          </details>
        ))}
      </div>

      <SubHead>Painel de fontes</SubHead>
      <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-ink-50 text-[12px] uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-4 py-2 font-semibold">Fonte / documento</th>
              <th className="px-3 py-2 font-semibold">Entidade analisada</th>
              <th className="px-3 py-2 font-semibold">Tipo</th>
              <th className="px-3 py-2 font-semibold">Data-base</th>
              <th className="px-3 py-2 font-semibold">Consulta</th>
              <th className="px-3 py-2 font-semibold">Nível</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id} className="border-t border-ink-100 align-top">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-900">{s.org}</p>
                  {s.url.startsWith('http')
                    ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-coop-700 underline decoration-coop-200 underline-offset-2 hover:decoration-coop-600">{s.title} ↗</a>
                    : <span className="text-ink-700">{s.title}</span>}
                  {s.note && <p className="mt-1 text-[12px] text-ink-500">{s.note}</p>}
                </td>
                <td className="px-3 py-3 text-ink-700">{s.entity}</td>
                <td className="px-3 py-3 text-ink-700">{s.kind}</td>
                <td className="px-3 py-3 tabular-nums text-ink-700">{s.dataBase}</td>
                <td className="px-3 py-3 tabular-nums text-ink-700">{s.accessDate}</td>
                <td className="px-3 py-3 text-ink-700">{s.level ?? 'Cálculo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubHead>Glossário</SubHead>
      <dl className="grid gap-3 md:grid-cols-2">
        {glossary.map((g) => (
          <div key={g.term} className="rounded-xl border border-ink-100 bg-white p-4">
            <dt className="font-semibold text-ink-900">{g.term}</dt>
            <dd className="mt-1 text-sm text-ink-700">{g.def}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
