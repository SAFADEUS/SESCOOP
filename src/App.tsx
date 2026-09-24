import { useCallback, useState } from 'react';
import { SourceProvider } from './components/ui';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { MethodologyModal } from './components/DataMethodology';
import { CooperativePanorama } from './components/CooperativePanorama';
import { SicoobStructure } from './components/SicoobStructure';
import { MarketPosition } from './components/MarketPosition';
import { HistoricalEvolution } from './components/HistoricalEvolution';
import { FinancialOverview } from './components/FinancialOverview';
import { BalanceSheetAnalysis } from './components/BalanceSheetAnalysis';
import { IncomeStatementAnalysis } from './components/IncomeStatementAnalysis';
import { FinancialRatios, Efficiency } from './components/FinancialRatios';
import { GrowthAnalysis } from './components/GrowthAnalysis';
import { CreditPortfolio } from './components/CreditPortfolio';
import { CapitalAdequacy } from './components/CapitalAdequacy';
import { BusinessModel } from './components/BusinessModel';
import { CooperativeEconomics } from './components/CooperativeEconomics';
import { BusinessPortfolio } from './components/BusinessPortfolio';
import { BusinessModelCanvas } from './components/BusinessModelCanvas';
import { CompetitiveAnalysis } from './components/CompetitiveAnalysis';
import { Porter } from './components/Porter';
import { SWOT } from './components/SWOT';
import { DigitalVsPhysical } from './components/DigitalVsPhysical';
import { GeographicPresence } from './components/GeographicPresence';
import { Governance } from './components/Governance';
import { RiskAnalysis } from './components/RiskAnalysis';
import { MacroScenario } from './components/MacroScenario';
import { ESG } from './components/ESG';
import { Diagnostic360 } from './components/Diagnostic360';
import { StrategicOpportunities } from './components/StrategicOpportunities';
import { ImpactComplexityMatrix } from './components/ImpactComplexityMatrix';
import { ExecutiveConclusion } from './components/ExecutiveConclusion';
import { Sources } from './components/Sources';
import { Footer } from './components/Footer';

/**
 * Narrativa: cooperativismo financeiro → dimensão do mercado → onde o Sicoob está → estrutura → escala →
 * evolução → situação financeira → crédito → capital → geração de valor → vantagens → riscos → oportunidades → diagnóstico.
 */
export default function App() {
  const [methodology, setMethodology] = useState(false);
  const openM = useCallback(() => setMethodology(true), []);
  const closeM = useCallback(() => setMethodology(false), []);
  return (
    <SourceProvider>
      <a href="#visao-geral" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded focus:bg-white focus:px-3 focus:py-2">Pular para o conteúdo</a>
      <Hero onMethodology={openM} />
      <Nav onMethodology={openM} />
      <main>
        <ExecutiveSummary />
        <CooperativePanorama />
        <SicoobStructure />
        <MarketPosition />
        <HistoricalEvolution />
        <FinancialOverview />
        <BalanceSheetAnalysis />
        <IncomeStatementAnalysis />
        <FinancialRatios />
        <Efficiency />
        <GrowthAnalysis />
        <CreditPortfolio />
        <CapitalAdequacy />
        <BusinessModel />
        <CooperativeEconomics />
        <BusinessPortfolio />
        <BusinessModelCanvas />
        <CompetitiveAnalysis />
        <Porter />
        <SWOT />
        <DigitalVsPhysical />
        <GeographicPresence />
        <Governance />
        <RiskAnalysis />
        <MacroScenario />
        <ESG />
        <Diagnostic360 />
        <StrategicOpportunities />
        <ImpactComplexityMatrix />
        <ExecutiveConclusion />
        <Sources onMethodology={openM} />
      </main>
      <Footer onMethodology={openM} />
      <MethodologyModal open={methodology} onClose={closeM} />
    </SourceProvider>
  );
}
