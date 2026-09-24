import { useEffect, useState } from 'react';

export const NAV = [
  { id: 'visao-geral', label: 'Visão Geral' },
  { id: 'cooperativismo', label: 'Cooperativismo' },
  { id: 'sicoob', label: 'Sicoob' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'credito', label: 'Crédito' },
  { id: 'estrategia', label: 'Estratégia' },
  { id: 'riscos', label: 'Riscos' },
  { id: 'impacto', label: 'Impacto' },
  { id: 'diagnostico', label: 'Diagnóstico' },
  { id: 'fontes', label: 'Fontes' },
];

export function Nav({ onMethodology }: { onMethodology: () => void }) {
  const [active, setActive] = useState('visao-geral');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Seção ativa = último item do menu cujo topo já passou do terço superior da tela.
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const line = window.innerHeight * 0.33;
      let current = NAV[0].id;
      for (const n of NAV) {
        const el = document.getElementById(n.id);
        if (el && el.getBoundingClientRect().top <= line) current = n.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.getElementById(`nav-${active}`)?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [active]);

  return (
    <header className={`sticky top-0 z-50 border-b transition ${scrolled ? 'border-ink-100 bg-white/90 backdrop-blur' : 'border-transparent bg-white'}`}>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 sm:px-6">
        <a href="#top" className="flex shrink-0 items-center gap-2 py-3" aria-label="Início">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-coop-900 text-[11px] font-bold text-white">DX</span>
          <span className="hidden text-sm font-semibold text-ink-900 sm:inline">Diagnóstico Sicoob</span>
        </a>
        <nav aria-label="Seções" className="no-scrollbar -mx-1 flex flex-1 gap-1 overflow-x-auto py-2">
          {NAV.map((n) => (
            <a
              key={n.id}
              id={`nav-${n.id}`}
              href={`#${n.id}`}
              aria-current={active === n.id ? 'true' : undefined}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] transition ${active === n.id ? 'bg-coop-900 text-white' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900'}`}
            >
              {n.label}
            </a>
          ))}
        </nav>
        <button onClick={onMethodology} className="hidden shrink-0 rounded-full border border-ink-200 px-3 py-1.5 text-[13px] text-ink-700 hover:bg-ink-50 md:inline">
          Metodologia
        </button>
      </div>
    </header>
  );
}
