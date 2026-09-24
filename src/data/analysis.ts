/* =====================================================================
 * CONTEÚDO ANALÍTICO
 * Interpretações (status "analysis") baseadas exclusivamente nas métricas
 * registradas em metrics.ts / derived.ts. Cada item referencia evidências.
 * ===================================================================== */

export const executiveSummary: { key: string; title: string; text: string }[] = [
  { key: 'escala', title: 'Escala', text: 'Com R$ 471 bi em ativos e 10 milhões de cooperados em jun/2026, o Sicoob é um dos maiores sistemas financeiros cooperativos do país. Em dez/2025, seus ativos combinados (R$ 430,1 bi) equivaliam a cerca de 41% dos ativos do SNCC (R$ 1,036 tri) — aproximação, pois os critérios de consolidação diferem.' },
  { key: 'crescimento', title: 'Crescimento', text: 'Entre jun/2022 e jun/2026 os ativos passaram de R$ 215 bi para R$ 471 bi (+119%; 21,7% a.a.). Nos 12 meses até jun/2026, captações (+18,1%) cresceram quase o dobro da carteira (+9,5%): a expansão recente é puxada por funding e liquidez, não por crédito.' },
  { key: 'solidez', title: 'Solidez', text: 'O Índice de Basileia subiu de 17,0% (dez/2023) para 20,58% (jun/2026), acima da média do SNCC (18,1% em dez/2025). A relação PL/ativos recua levemente (15,8% → 14,2%), mas o capital regulatório melhora — coerente com um balanço mais líquido e menos ponderado a risco.' },
  { key: 'capilaridade', title: 'Capilaridade', text: 'Presença física em 2.486 municípios (≈ 44,6% dos municípios brasileiros), 78% deles com até 50 mil habitantes, e posição de única instituição financeira presente em 423 municípios. A rede física é um ativo estratégico de difícil replicação.' },
  { key: 'modelo', title: 'Modelo cooperativo', text: 'O cooperado é simultaneamente usuário e dono. O resultado (R$ 11,2 bi antes de JCP em 2025) retorna ao quadro social e às reservas, e o Sicoob mensura um benefício econômico de R$ 49,8 bi em 2025 — métrica de vantagem comparativa, que não se confunde com receita ou resultado.' },
  { key: 'digital', title: 'Digitalização', text: 'Mais de 87% das transações passam pelo Super App e pelo internet banking, com média de 8 milhões de acessos diários. O digital concentra transações; a rede física concentra relacionamento, crédito e originação — o modelo é híbrido.' },
  { key: 'valor', title: 'Geração de valor', text: 'O resultado cresceu de R$ 8,3 bi (2024) para R$ 11,2 bi (2025). Resultado/PL médio de ≈ 19% (indicador derivado) indica elevada capacidade de geração interna de capital, essencial para um modelo que não acessa mercado acionário.' },
  { key: 'riscos', title: 'Riscos', text: 'O SNCC registrou alta de ativos problemáticos (7,8% da carteira em dez/2025, pico de 8,3% em ago/2025). A exposição agro é elevada (R$ 92,8 bi; ≈ 36% da carteira ampliada) e 88% da carteira rural do cooperativismo não tem seguro agrícola. O resultado semestral de 2026 exige verificação.' },
  { key: 'oportunidades', title: 'Oportunidades', text: 'Excesso relativo de funding (crédito/captações em 76%) abre espaço para expansão seletiva de crédito com a queda da Selic; a base de 10 milhões sustenta cross-sell em seguros, previdência, consórcios e investimentos; a capilaridade em pequenos municípios é plataforma para inclusão financeira e crédito produtivo.' },
];

export interface SwotItem {
  title: string;
  evidence: string;
  impact: string;
  relevance: 'Alta' | 'Média' | 'Baixa';
  relevanceWhy: string;
  implication: string;
  monitor: string;
  action: string;
}

export const swot: Record<'forcas' | 'fraquezas' | 'oportunidades' | 'ameacas', SwotItem[]> = {
  forcas: [
    { title: 'Escala e ritmo de crescimento', evidence: 'Ativos de R$ 471 bi (jun/26); crescimento médio anual de 21,7% desde jun/22; ativos cresceram 19,6% em 2025 contra 17,0% do SNCC.', impact: 'Diluição de custos fixos sistêmicos (tecnologia, compliance, Banco Sicoob) e maior poder de negociação com parceiros.', relevance: 'Alta', relevanceWhy: 'Evidência quantitativa direta, consistente em todos os períodos analisados.', implication: 'Escala permite investir em plataforma única de tecnologia e dados sem onerar cada singular.', monitor: 'Ativos/SNCC; custo administrativo por R$ de ativo (quando divulgado).', action: 'Converter escala em eficiência mensurável e divulgada.' },
    { title: 'Capilaridade e presença exclusiva', evidence: '2.486 municípios; 4.727 unidades; única IF em 423 municípios; 78% dos municípios atendidos com até 50 mil habitantes.', impact: 'Barreira competitiva em mercados onde bancos reduzem presença (o SFN não cooperativo saiu de 85 municípios em 2025).', relevance: 'Alta', relevanceWhy: 'Dados oficiais do Relatório de Sustentabilidade e do BC; difícil replicação por concorrentes.', implication: 'A rede física é o principal canal de originação de crédito relacional (agro, MPE).', monitor: 'Municípios atendidos; municípios exclusivos; crédito por unidade.', action: 'Modelo de unidade de menor custo para expansão em municípios pequenos.' },
    { title: 'Capitalização acima do setor', evidence: 'Basileia de 20,58% (jun/26) vs 18,1% do SNCC (dez/25); PL de R$ 67 bi.', impact: 'Capacidade de absorver perdas e de crescer crédito sem restrição de capital no curto prazo.', relevance: 'Alta', relevanceWhy: 'Indicador regulatório oficial; trajetória crescente desde 2023.', implication: 'Existe margem de capital para retomada de crédito quando a demanda e o risco permitirem.', monitor: 'Basileia; PL/ativos; retenção de sobras em reservas.', action: 'Plano de alocação de capital por segmento (agro, MPE, PF).' },
    { title: 'Ecossistema integrado de produtos', evidence: 'Estrutura com Banco Sicoob, DTVM, seguradora, consórcios, previdência, pagamentos e adquirência.', impact: 'Permite oferecer portfólio completo sem depender de terceiros e reter receitas no sistema.', relevance: 'Média', relevanceWhy: 'Existência comprovada; escala individual de cada negócio não está consolidada nas fontes analisadas.', implication: 'Potencial de cross-sell sobre base de 10 mi de cooperados.', monitor: 'Produtos por cooperado; receitas de serviços / receitas totais.', action: 'Divulgar métricas por linha de negócio.' },
  ],
  fraquezas: [
    { title: 'Complexidade de governança multinível', evidence: '322 singulares, 14 centrais, CCS, Banco Sicoob e empresas controladas.', impact: 'Decisões sistêmicas (tecnologia, padrões de risco, marca) exigem coordenação entre centenas de entidades com autonomia jurídica.', relevance: 'Média', relevanceWhy: 'Característica estrutural comprovada; o efeito sobre eficiência não é mensurável com os dados públicos disponíveis.', implication: 'Velocidade de execução pode ser inferior à de concorrentes centralizados.', monitor: 'Prazo de adoção de padrões sistêmicos; dispersão de indicadores entre singulares.', action: 'Indicadores sistêmicos obrigatórios e transparência por central.' },
    { title: 'Heterogeneidade de risco entre singulares', evidence: "A Moody's Local observa que as cooperativas filiadas possuem patamares distintos de inadimplência, com algumas singulares mais pressionadas.", impact: 'O número combinado pode esconder concentrações de risco em entidades específicas.', relevance: 'Média', relevanceWhy: 'Fonte de agência de rating; dados por singular não foram analisados neste estudo.', implication: 'A análise consolidada precisa ser complementada por distribuição de indicadores.', monitor: 'Dispersão de inadimplência e Basileia entre singulares.', action: 'Painel sistêmico de dispersão, e não apenas de médias.' },
    { title: 'Baixa comparabilidade da divulgação', evidence: 'Comunicados usam conceitos diferentes de carteira (R$ 205,8 bi × R$ 240 bi em jun/25) e de resultado (R$ 11,2 bi × R$ 7,8 bi em 2025).', impact: 'Dificulta leitura por conselheiros, cooperados e mercado; aumenta risco de interpretação equivocada.', relevance: 'Média', relevanceWhy: 'Divergências documentadas nesta análise.', implication: 'Transparência é um ativo reputacional de uma instituição de propriedade coletiva.', monitor: 'Existência de glossário de indicadores e conciliação entre documentos.', action: 'Publicar ficha técnica de cada indicador divulgado.' },
    { title: 'Indicadores de eficiência não divulgados de forma consolidada', evidence: 'Índice de eficiência, despesas administrativas e receitas de serviços do sistema não foram localizados nas fontes acessadas.', impact: 'Impossibilita avaliar se a escala está se traduzindo em produtividade.', relevance: 'Baixa', relevanceWhy: 'Ausência de dado — não indica, por si, ineficiência.', implication: 'Lacuna de informação, não conclusão de desempenho.', monitor: 'Índice de eficiência combinado (DC combinadas).', action: 'Incluir indicadores de eficiência no comunicado semestral.' },
  ],
  oportunidades: [
    { title: 'Retomada seletiva de crédito com a queda da Selic', evidence: 'Crédito/captações caiu de 89,1% (jun/22) para 76,0% (jun/26); Selic em 13,75% após cinco cortes consecutivos.', impact: 'Há funding disponível e capital regulatório para ampliar crédito.', relevance: 'Alta', relevanceWhy: 'Combinação de liquidez e capital documentados com mudança de ciclo monetário oficial.', implication: 'Expansão deve priorizar segmentos com melhor relação risco/retorno.', monitor: 'Crédito/captações; crescimento da carteira; novos ativos problemáticos.', action: 'Política de crédito calibrada por segmento e região.' },
    { title: 'Cross-sell sobre base de 10 milhões', evidence: 'Base de 10 mi de cooperados; ecossistema próprio de seguros, previdência, consórcios, investimentos.', impact: 'Aumento de receitas de serviços menos sensíveis a ciclo de crédito.', relevance: 'Alta', relevanceWhy: 'Base e portfólio comprovados; intensidade atual de cross-sell não divulgada.', implication: 'Diversificação de receitas reduz dependência da margem financeira.', monitor: 'Produtos por cooperado; receitas de serviços / resultado.', action: 'Uso de dados e IA para ofertas personalizadas.' },
    { title: 'Interiorização em mercados desassistidos', evidence: 'SFN não cooperativo deixou 85 municípios em 2025; SNCC entrou em 56 novos; Sicoob é exclusivo em 423.', impact: 'Captura de relacionamento completo onde há pouca concorrência física.', relevance: 'Média', relevanceWhy: 'Tendência documentada pelo BC; potencial econômico por município varia.', implication: 'Expansão com modelo de baixo custo e forte componente digital.', monitor: 'Municípios atendidos; resultado por unidade nova.', action: 'Critérios de viabilidade para abertura de pontos.' },
    { title: 'Agro e crédito sustentável', evidence: 'Carteira agro de R$ 92,8 bi; cooperativismo responde por 22% do crédito rural PF do SFN.', impact: 'Liderança no segmento com maior crescimento do SNCC (+16,9% no rural PF).', relevance: 'Média', relevanceWhy: 'Oportunidade real, mas com risco climático relevante (ver ameaças).', implication: 'Crescimento no agro deve vir acompanhado de mitigação (seguro, garantias).', monitor: 'Carteira agro; % com seguro; perdas em eventos climáticos.', action: 'Vincular crédito rural a seguro e a critérios socioambientais.' },
  ],
  ameacas: [
    { title: 'Deterioração do risco de crédito', evidence: 'Ativos problemáticos do SNCC em 7,8% da carteira (dez/25), com pico de 8,3% em ago/25.', impact: 'Maior provisão reduz resultado e, por consequência, sobras e capital.', relevance: 'Alta', relevanceWhy: 'Referência setorial oficial; o dado específico do Sicoob não foi localizado — por isso a ameaça é setorial.', implication: 'Acompanhar provisões e estágios de risco nas DC combinadas.', monitor: 'Ativos problemáticos; despesas de provisão / carteira.', action: 'Divulgar indicadores de qualidade de carteira no comunicado semestral.' },
    { title: 'Risco climático na carteira agro', evidence: '88% da carteira rural do cooperativismo sem seguro agrícola; carteira agro Sicoob de R$ 92,8 bi.', impact: 'Eventos climáticos regionais podem gerar perdas concentradas em singulares.', relevance: 'Alta', relevanceWhy: 'Exposição relevante e dado setorial oficial de baixa cobertura de seguro.', implication: 'Risco de correlação entre inadimplência e geografia.', monitor: '% da carteira rural com seguro; concentração regional.', action: 'Metas de cobertura de seguro e testes de estresse climático.' },
    { title: 'Competição de bancos digitais e fintechs', evidence: 'Canais digitais já concentram mais de 87% das transações do Sicoob — o terreno transacional é digital e disputado.', impact: 'Pressão sobre tarifas, spreads e principalidade em PF.', relevance: 'Média', relevanceWhy: 'Tendência de mercado evidente; efeito mensurável sobre o Sicoob não foi isolado.', implication: 'Diferenciação precisa vir do relacionamento e do retorno econômico ao cooperado.', monitor: 'Cooperados ativos; principalidade; churn.', action: 'Comunicar o benefício econômico individual ao cooperado.' },
    { title: 'Custo de funding e pressão sobre margens', evidence: 'O BC registrou aumento do custo de captação e compressão de margens de crédito no SNCC em 2025.', impact: 'Captações crescendo acima do crédito aumentam o custo de carregar liquidez.', relevance: 'Média', relevanceWhy: 'Diagnóstico setorial oficial; efeito sobre o Sicoob a confirmar nas DC.', implication: 'A queda da Selic pode aliviar custo, mas também reduz a renda de tesouraria.', monitor: 'Margem financeira; resultado da intermediação.', action: 'Gestão ativa de ALM e de mix de captação.' },
    { title: 'Riscos cibernéticos e de fraude', evidence: '8 milhões de acessos digitais diários em média.', impact: 'Superfície de ataque ampla; incidentes afetam confiança e custo.', relevance: 'Média', relevanceWhy: 'Risco inerente à escala digital; não há evento específico documentado nas fontes analisadas.', implication: 'Investimento contínuo em segurança é custo estrutural.', monitor: 'Perdas com fraude; incidentes reportados.', action: 'Programa sistêmico de prevenção e educação do cooperado.' },
  ],
};

export interface PorterForce {
  key: string;
  force: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  label: 'Baixa' | 'Moderada' | 'Alta' | 'Muito alta';
  evidence: string;
  why: string;
  impact: string;
}

/** Escala 1–5 atribuída analiticamente com justificativa explícita. */
export const porter: PorterForce[] = [
  { key: 'rival', force: 'Rivalidade entre instituições', intensity: 4, label: 'Alta', evidence: 'Mercado com grandes bancos, bancos digitais, outros sistemas cooperativos (Sicredi com R$ 455 bi em ativos) e crescente presença de fintechs; SNCC detém 8,0% do crédito e 9,8% dos depósitos do SFN.', why: 'Produtos financeiros são pouco diferenciados em preço e a disputa por depósitos se intensificou (custo de captação crescente no SNCC).', impact: 'Pressão sobre spreads e custo de captação; diferenciação depende do modelo cooperativo e do relacionamento.' },
  { key: 'entrantes', force: 'Novos entrantes / fintechs', intensity: 3, label: 'Moderada', evidence: 'Transações migraram para o digital (> 87% no Sicoob); barreiras regulatórias à entrada foram reduzidas nos últimos anos (pagamentos, SCD, Open Finance).', why: 'Entrada é fácil em pagamentos e contas; é mais difícil em crédito relacional para agro e MPE em municípios pequenos, onde capilaridade física e conhecimento local contam.', impact: 'Ameaça maior na PF urbana transacional; menor no crédito rural e em municípios exclusivos.' },
  { key: 'fornecedores', force: 'Poder dos fornecedores estratégicos', intensity: 3, label: 'Moderada', evidence: 'Dependência de provedores de tecnologia, nuvem, bandeiras de cartão, infraestrutura de pagamentos e funding repassado (ex.: BNDES).', why: 'Escala do sistema aumenta o poder de negociação, mas certos fornecedores (bandeiras, infraestrutura crítica) são concentrados.', impact: 'Custos de tecnologia e de meios de pagamento relevantes; centralização via CCS/Banco Sicoob mitiga.' },
  { key: 'clientes', force: 'Poder e mobilidade dos cooperados', intensity: 3, label: 'Moderada', evidence: 'Portabilidade de crédito, Pix e Open Finance reduzem custos de troca; ao mesmo tempo, o cooperado é dono e recebe sobras e benefícios (R$ 7.352 por cooperado em 2025).', why: 'Mobilidade técnica é alta, mas o vínculo societário e o retorno econômico elevam o custo percebido de saída.', impact: 'Retenção depende de tornar visível o benefício econômico individual.' },
  { key: 'substitutos', force: 'Produtos substitutos', intensity: 3, label: 'Moderada', evidence: 'Mercado de capitais (CRA, debêntures, fundos), crédito de fornecedores/tradings no agro, carteiras digitais.', why: 'Substitutos são relevantes para empresas maiores e investidores; menos acessíveis para MPEs e pequenos produtores.', impact: 'Limita crescimento em PJ de maior porte; reforça foco em MPE e produtor rural.' },
];

export interface CanvasBlock {
  key: string;
  title: string;
  evidence: string[];
  analysis: string;
  implication: string;
  interpretive: boolean;
}

export const canvas: CanvasBlock[] = [
  { key: 'parceiros', title: 'Parceiros-chave', evidence: ['Banco Sicoob, CCS e centrais (estrutura sistêmica)', 'FGCoop (garantia de depósitos)', 'Fundos de repasse (ex.: BNDES) e bandeiras de cartão'], analysis: 'Parte dos "parceiros" está dentro do próprio sistema, o que reduz dependência externa e mantém receitas no ecossistema.', implication: 'Governança sistêmica é também gestão de cadeia de valor.', interpretive: true },
  { key: 'atividades', title: 'Atividades-chave', evidence: ['Intermediação financeira: captação (R$ 346 bi) e crédito (R$ 263 bi)', 'Gestão de risco e capital (Basileia 20,58%)', 'Educação cooperativista e financeira'], analysis: 'A atividade central é transformar poupança local em crédito local, com a gestão de liquidez sistêmica feita pelas centrais e pelo Banco Sicoob.', implication: 'Descasamento crescente entre captação e crédito exige gestão ativa de liquidez.', interpretive: false },
  { key: 'recursos', title: 'Recursos principais', evidence: ['PL de R$ 67 bi', '4.727 unidades e 60.991 empregos diretos', 'Plataforma digital com 8 mi de acessos diários'], analysis: 'Capital próprio, rede física e plataforma tecnológica comum formam a base de vantagem.', implication: 'Recurso escasso não é capital, e sim capacidade de originar crédito de qualidade.', interpretive: false },
  { key: 'proposta', title: 'Proposta de valor', evidence: ['Benefício econômico de R$ 49,8 bi em 2025 (taxas, remuneração, tarifas e sobras)', 'Presença onde outras IFs não estão', 'Cooperado como dono (sobras e voto)'], analysis: 'A proposta combina preço (vantagem econômica mensurada) com pertencimento e proximidade.', implication: 'Proposta só é percebida se o cooperado enxergar o benefício individual.', interpretive: false },
  { key: 'relacionamento', title: 'Relacionamento', evidence: ['Atendimento presencial em 2.486 municípios', 'Assembleias e participação societária', 'Canais digitais com > 87% das transações'], analysis: 'Relacionamento é societário e comercial ao mesmo tempo — diferencial frente a bancos.', implication: 'Participação em assembleias é indicador de engajamento a acompanhar.', interpretive: true },
  { key: 'canais', title: 'Canais', evidence: ['Unidades de atendimento próprias', 'Super App e internet banking', 'Correspondentes e rede de terceiros (dados não consolidados)'], analysis: 'Modelo híbrido: transação no digital, aconselhamento e crédito complexo no físico.', implication: 'Rede física precisa evoluir para formato consultivo.', interpretive: true },
  { key: 'segmentos', title: 'Segmentos de cooperados', evidence: ['10 mi de cooperados (PF e PJ)', 'Empresas: R$ 80,7 bi da carteira em 2023', 'Agro: R$ 92,8 bi em 2025; rural = 26,06% da carteira (jun/25)'], analysis: 'Base diversificada, com peso relevante de PJ e agro — o que eleva ticket médio e complexidade de risco.', implication: 'Segmentação de risco e oferta por perfil é central.', interpretive: false },
  { key: 'custos', title: 'Estrutura de custos', evidence: ['Custo de captação (remuneração de depósitos e letras)', 'Provisões para perdas', 'Pessoal, rede física e tecnologia'], analysis: 'Não foram localizados dados consolidados de despesas; a estrutura é inferida do modelo de negócio financeiro.', implication: 'A divulgação de despesas por natureza é necessária para avaliar eficiência.', interpretive: true },
  { key: 'receitas', title: 'Fontes de receita / geração econômica', evidence: ['Margem de intermediação (crédito e tesouraria)', 'Receitas de serviços, cartões, seguros, consórcios', 'Resultado de R$ 11,2 bi antes de JCP em 2025'], analysis: 'A composição das receitas não foi localizada; a relação crédito/ativos em queda sugere peso crescente de tesouraria em 2025.', implication: 'Com Selic em queda, diversificação de receitas torna-se mais importante.', interpretive: true },
];

export interface Diag360 {
  key: string;
  area: string;
  observed: string;
  data: string[];
  strengths: string[];
  attention: string[];
  indicators: string[];
  questions: string[];
}

export const diagnostic360: Diag360[] = [
  { key: 'estrategia', area: 'Estratégia', observed: 'Crescimento de escala acima do setor com modelo híbrido físico-digital e ecossistema de produtos próprio.', data: ['Ativos +19,6% em 2025 vs +17,0% do SNCC'], strengths: ['Escala crescente', 'Posicionamento em mercados pouco atendidos'], attention: ['Crescimento recente puxado por captação'], indicators: ['Ativos/SNCC', 'Crédito/captações'], questions: ['Qual o ritmo desejado de crédito para os próximos ciclos?'] },
  { key: 'financas', area: 'Finanças', observed: 'Resultado recorde em 2025 com alta geração interna de capital.', data: ['Resultado R$ 11,2 bi (2025)', 'Resultado/PL médio ≈ 19%'], strengths: ['Geração de capital', 'Captação crescente'], attention: ['1S2026 (R$ 4,577 bi) abaixo do 1S2025 (R$ 5,8 bi) — conceito a confirmar'], indicators: ['Resultado semestral', 'Margem financeira'], questions: ['Quanto do resultado de 2025 veio de tesouraria?'] },
  { key: 'cooperados', area: 'Cooperados', observed: 'Base de 10 mi com vantagem econômica mensurada.', data: ['10 mi (jun/26)', 'R$ 7.352 de vantagem média por cooperado (2025)'], strengths: ['Crescimento da base', 'Benefício mensurado'], attention: ['Metodologia do benefício depende de preços de mercado de referência'], indicators: ['Cooperados ativos', 'Produtos por cooperado'], questions: ['O cooperado percebe o benefício individual?'] },
  { key: 'credito', area: 'Crédito', observed: 'Carteira cresce abaixo do ativo; forte exposição agro.', data: ['+9,54% em 12 meses', 'Agro R$ 92,8 bi'], strengths: ['Liderança em crédito rural cooperativo'], attention: ['Ativos problemáticos em alta no SNCC', 'Baixa cobertura de seguro rural no setor'], indicators: ['Ativos problemáticos', 'Provisão/carteira', '% rural com seguro'], questions: ['Qual a inadimplência e o estágio 3 do Sicoob combinado?'] },
  { key: 'processos', area: 'Processos', observed: 'Sistema padronizado por CCS e centrais, com autonomia das singulares.', data: ['322 singulares, 14 centrais'], strengths: ['Padronização via CCS'], attention: ['Coordenação multinível'], indicators: ['Dispersão de indicadores entre singulares'], questions: ['Quão homogêneas são as práticas de crédito entre centrais?'] },
  { key: 'tecnologia', area: 'Tecnologia', observed: 'Digital como canal transacional dominante.', data: ['> 87% das transações no digital', '8 mi de acessos diários'], strengths: ['Plataforma única'], attention: ['Cibersegurança e fraude'], indicators: ['Disponibilidade', 'Perdas com fraude', 'Vendas digitais'], questions: ['Qual a participação do digital na originação de crédito?'] },
  { key: 'governanca', area: 'Governança', observed: 'Governança cooperativa multinível com supervisão do BC e garantia do FGCoop.', data: ['Assembleias por singular', 'Rating AA+.br do Banco Sicoob (Moody\'s Local)'], strengths: ['Estrutura regulada e auditada'], attention: ['Complexidade decisória'], indicators: ['Participação em assembleias', 'Apontamentos de auditoria'], questions: ['Como a governança sistêmica trata singulares com indicadores fora do padrão?'] },
  { key: 'riscos', area: 'Riscos', observed: 'Capital confortável; risco de crédito setorial em alta.', data: ['Basileia 20,58%', 'SNCC: ativos problemáticos 7,8%'], strengths: ['Capital acima da média do SNCC'], attention: ['Crédito, clima, funding'], indicators: ['Basileia', 'Estágios de risco', 'LCR/liquidez (quando divulgado)'], questions: ['Qual o resultado de testes de estresse climático?'] },
  { key: 'presenca', area: 'Presença', observed: 'Interiorização financeira expressiva.', data: ['2.486 municípios', '423 com presença exclusiva', '78% até 50 mil hab.'], strengths: ['Barreira competitiva física'], attention: ['Custo de rede física'], indicators: ['Resultado por unidade', 'Municípios exclusivos'], questions: ['Quais unidades são estratégicas mesmo com baixo resultado?'] },
  { key: 'impacto', area: 'Impacto', observed: 'Investimento social relevante e benefício econômico mensurado.', data: ['R$ 567,8 mi em investimento social', 'R$ 49,8 bi de benefício econômico'], strengths: ['Métrica própria de benefício'], attention: ['Mensuração de impacto (resultado social), não só de investimento'], indicators: ['Investimento social / resultado', 'Indicadores de impacto'], questions: ['Como medir a transformação local gerada?'] },
];

export interface Opportunity {
  key: string;
  title: string;
  evidence: string;
  reading: string;
  opportunity: string;
  indicator: string;
  impact: number; // 1–5
  complexity: number; // 1–5
}

/** Oportunidades derivadas da análise, com posição na matriz impacto × complexidade. */
export const opportunities: Opportunity[] = [
  { key: 'credito', title: 'Retomada seletiva do crédito', evidence: 'Crédito/captações caiu de 89,1% para 76,0% entre jun/22 e jun/26; Basileia de 20,58%.', reading: 'O sistema tem funding e capital ociosos relativamente ao crédito, num ciclo de queda da Selic.', opportunity: 'Existe espaço para reacelerar crédito em segmentos com risco controlado (MPE com garantias, rural segurado).', indicator: 'Crédito/captações; crescimento da carteira; novos ativos problemáticos.', impact: 5, complexity: 3 },
  { key: 'crosssell', title: 'Cross-sell e principalidade', evidence: '10 mi de cooperados; portfólio completo (seguros, previdência, consórcios, investimentos).', reading: 'A base cresce menos que os ativos — o aprofundamento por cooperado é o vetor de valor.', opportunity: 'Ampliar produtos por cooperado com ofertas baseadas em dados.', indicator: 'Produtos por cooperado; receitas de serviços / resultado.', impact: 4, complexity: 2 },
  { key: 'beneficio', title: 'Tornar visível o benefício individual', evidence: 'Benefício de R$ 49,8 bi; R$ 7.352 por cooperado em 2025.', reading: 'A vantagem existe, mas é média sistêmica; a percepção individual determina retenção.', opportunity: 'Extrato individual de benefício econômico no app.', indicator: 'Retenção; NPS; participação em assembleias.', impact: 4, complexity: 1 },
  { key: 'seguro-rural', title: 'Seguro vinculado ao crédito rural', evidence: '88% da carteira rural do cooperativismo sem seguro; agro Sicoob R$ 92,8 bi.', reading: 'Risco climático é a principal vulnerabilidade de uma carteira relevante.', opportunity: 'Elevar a cobertura de seguro com produtos da própria seguradora do sistema.', indicator: '% da carteira rural segurada; perdas por evento climático.', impact: 5, complexity: 3 },
  { key: 'dados-ia', title: 'Dados e IA para risco e oferta', evidence: '8 mi de acessos diários; > 87% das transações no digital.', reading: 'O volume de interações digitais gera dados para modelagem de risco e personalização.', opportunity: 'Modelos sistêmicos de risco e propensão compartilhados pelas singulares.', indicator: 'Performance de modelos (Gini/KS); conversão de ofertas.', impact: 4, complexity: 4 },
  { key: 'interior', title: 'Expansão em municípios desassistidos', evidence: 'SFN não cooperativo saiu de 85 municípios em 2025; SNCC entrou em 56.', reading: 'Há espaço deixado por bancos em municípios pequenos.', opportunity: 'Formatos de unidade enxuta + digital para novos municípios.', indicator: 'Municípios atendidos; ponto de equilíbrio por unidade.', impact: 3, complexity: 3 },
  { key: 'transparencia', title: 'Ficha técnica dos indicadores', evidence: 'Divergências de conceito entre comunicados (carteira e resultado).', reading: 'Falta de comparabilidade enfraquece a leitura de desempenho.', opportunity: 'Publicar glossário e conciliação entre comunicados, RS e DC combinadas.', indicator: 'Existência de conciliação publicada.', impact: 2, complexity: 1 },
  { key: 'eficiencia', title: 'Divulgação e gestão de eficiência', evidence: 'Índice de eficiência combinado não localizado nas fontes.', reading: 'Escala sem métrica pública de eficiência impede avaliar ganhos de produtividade.', opportunity: 'Meta sistêmica de eficiência com divulgação semestral.', indicator: 'Índice de eficiência; despesas administrativas / ativos.', impact: 3, complexity: 4 },
];

export interface RiskItem {
  key: string;
  risk: string;
  level: 'Elevado' | 'Relevante' | 'Moderado' | 'Monitorar';
  evidence: string;
  scope: 'Sicoob' | 'SNCC' | 'Sicoob + SNCC' | 'Mercado';
  mitigants: string;
  watch: string;
}

export const risks: RiskItem[] = [
  { key: 'credito', risk: 'Risco de crédito', level: 'Elevado', evidence: 'Ativos problemáticos do SNCC subiram para 7,8% da carteira (dez/25), com pico de 8,3% (ago/25); Moody\'s Local projetava inadimplência do Sicoob acima do histórico.', scope: 'Sicoob + SNCC', mitigants: 'Capital elevado; crescimento da carteira desacelerado.', watch: 'Estágio 3, provisão/carteira, write-offs nas DC combinadas.' },
  { key: 'agro', risk: 'Concentração agro e risco climático', level: 'Elevado', evidence: 'Carteira agro de R$ 92,8 bi (≈ 36% da carteira ampliada); 88% da carteira rural do cooperativismo sem seguro.', scope: 'Sicoob + SNCC', mitigants: 'Diversificação geográfica nacional; garantias reais típicas do crédito rural.', watch: '% segurado; concentração por cultura/região; eventos climáticos.' },
  { key: 'resultado', risk: 'Rentabilidade em 2026', level: 'Relevante', evidence: 'Resultado combinado do 1S2026 (R$ 4,577 bi) inferior ao resultado antes de JCP do 1S2025 (R$ 5,8 bi) — conceitos não confirmados como iguais.', scope: 'Sicoob', mitigants: 'Resultado de 2025 recorde; capital elevado.', watch: 'DC combinadas de jun/2026: margem, provisões, despesas.' },
  { key: 'funding', risk: 'Custo de captação e margens', level: 'Relevante', evidence: 'BC aponta aumento do custo de captação e compressão de margens no SNCC em 2025; captações do Sicoob crescem ~2x o crédito.', scope: 'Sicoob + SNCC', mitigants: 'Queda da Selic reduz custo nominal de funding.', watch: 'Margem financeira; mix de captação (depósitos × letras).' },
  { key: 'capital', risk: 'Capital', level: 'Moderado', evidence: 'Basileia de 20,58% (jun/26), crescente desde 2023 e acima da média do SNCC.', scope: 'Sicoob', mitigants: 'Retenção de sobras e integralização de capital pelos cooperados.', watch: 'Basileia por entidade; PL/ativos.' },
  { key: 'liquidez', risk: 'Liquidez', level: 'Moderado', evidence: 'Captações/ativos em 73,5% e crédito/captações em 76% indicam balanço líquido.', scope: 'Sicoob', mitigants: 'Centralização financeira nas centrais e no Banco Sicoob; FGCoop.', watch: 'Indicadores de liquidez (LCR/NSFR, quando aplicáveis) e concentração de depositantes.' },
  { key: 'ciber', risk: 'Cibersegurança e fraudes', level: 'Relevante', evidence: 'Mais de 87% das transações no digital; 8 mi de acessos diários.', scope: 'Mercado', mitigants: 'Plataforma tecnológica centralizada.', watch: 'Perdas com fraude; incidentes.' },
  { key: 'governanca', risk: 'Governança e integração sistêmica', level: 'Monitorar', evidence: '322 singulares com autonomia jurídica e patamares distintos de risco.', scope: 'Sicoob', mitigants: 'Supervisão auxiliar pelas centrais, auditoria e supervisão do BC.', watch: 'Dispersão de indicadores entre singulares; intervenções/incorporações.' },
  { key: 'regulatorio', risk: 'Regulatório', level: 'Monitorar', evidence: 'Setor sujeito a mudanças prudenciais e contábeis (ex.: perda esperada).', scope: 'Mercado', mitigants: 'Estrutura de compliance sistêmica.', watch: 'Normas do CMN/BC aplicáveis a cooperativas.' },
  { key: 'reputacao', risk: 'Reputação', level: 'Monitorar', evidence: 'Marca única compartilhada por centenas de entidades.', scope: 'Sicoob', mitigants: 'Padrões sistêmicos de conduta.', watch: 'Reclamações no BC; eventos em singulares.' },
];

export const conclusions: string[] = [
  'Os dados indicam uma expansão de escala consistente: os ativos do Sistema Sicoob mais que dobraram entre jun/2022 e jun/2026 (R$ 215 bi → R$ 471 bi), com crescimento anual acima do SNCC em 2025.',
  'A expansão recente é acompanhada por mudança de composição: captações (+18,1%) crescem quase o dobro da carteira (+9,5%) nos 12 meses até jun/2026. O balanço ficou mais líquido e menos alavancado em crédito (crédito/captações de 89% para 76%).',
  'A solidez de capital melhorou: o Índice de Basileia passou de 17,0% (dez/2023) para 20,58% (jun/2026), acima da média do SNCC. A redução gradual de PL/ativos (15,8% → 14,2%) não compromete essa leitura, pois o crescimento se deu em ativos de menor risco.',
  'O principal ponto de atenção está na qualidade do crédito e na rentabilidade de 2026: o setor registrou alta de ativos problemáticos, a exposição agro é elevada e com baixa cobertura de seguro no cooperativismo, e o resultado combinado do 1S2026 precisa ser conciliado com o do 1S2025.',
  'O modelo apresenta vantagens estruturais de difícil replicação — capilaridade em 2.486 municípios, presença exclusiva em 423 e retorno econômico mensurado de R$ 49,8 bi aos cooperados — que o diferenciam de bancos e fintechs.',
  'A principal oportunidade identificada é converter liquidez e capital excedentes em crédito seletivo no ciclo de queda da Selic, combinada a cross-sell sobre a base de 10 milhões de cooperados e à vinculação de seguro ao crédito rural.',
  'O acompanhamento futuro deve observar: ativos problemáticos e provisões do Sicoob combinado; relação crédito/captações; resultado semestral em conceito homogêneo; cobertura de seguro da carteira agro; e divulgação de indicadores de eficiência.',
];

export const divergences = [
  { topic: 'Resultado de 2025', a: 'R$ 11,2 bi — "resultado do exercício" antes de JCP (comunicado institucional, abr/2026)', b: 'R$ 7,7–7,8 bi — "resultados financeiros" (destaques do Relatório de Sustentabilidade 2025)', reading: 'Os documentos utilizam conceitos/escopos distintos. Hipóteses a verificar nas DC combinadas: (i) valor após JCP, destinações estatutárias (reserva legal, FATES) e/ou tributos sobre atos não cooperativos; (ii) diferença de perímetro (sistema combinado × cooperativas); (iii) eliminações de combinação. Não se adota nenhuma hipótese como fato. O material de referência inicial citava R$ 11,3 bi; o comunicado localizado publica R$ 11,2 bi.' },
  { topic: 'Carteira de crédito em jun/2025', a: 'R$ 205,8 bi — "empréstimos e financiamentos" (comunicado do 1S2025)', b: 'R$ 240 bi — "carteira de crédito" usada como base de comparação no comunicado do 1S2026', reading: 'Diferença de R$ 34 bi (≈ 17%) é grande demais para arredondamento; indica conceito ampliado (possível inclusão de CPR, títulos privados de crédito, garantias prestadas ou carteira bruta). A série de jun/2022–jun/2026 é usada apenas internamente consistente.' },
  { topic: 'Captações × depósitos', a: 'R$ 293 bi — captações jun/2025 (comunicado 1S2026)', b: 'R$ 248,2 bi — depósitos totais jun/2025 (comunicado 1S2025)', reading: 'Não é divergência: captações incluem letras (LCA/LCI) além de depósitos. Em dez/2025: depósitos R$ 266,1 bi dentro de captações de R$ 319,1 bi.' },
  { topic: 'Depósitos em dez/2025', a: 'R$ 266,1 bi (comunicado de resultados)', b: 'R$ 266,9 bi (Relatório de Sustentabilidade)', reading: 'Diferença de 0,3%: provável arredondamento ou critério de apuração. Adota-se o comunicado de resultados, com registro da diferença.' },
  { topic: 'Cooperados em dez/2025', a: '9,5 milhões (Relatório de Sustentabilidade)', b: '"mais de 9,7 milhões" (comunicado de abr/2026)', reading: 'Provável diferença de data de referência. Adota-se 9,5 mi para dez/2025.' },
  { topic: 'Cooperados do crédito cooperativo', a: '21,2 mi — Banco Central (CPFs/CNPJs únicos, SNCC)', b: '22,96 mi — AnuárioCoop 2026 (vínculos, ramo Crédito)', reading: 'Bases diferentes podem considerar CPFs/CNPJs únicos, vínculos cooperativos ou critérios cadastrais distintos. Não se trata de erro.' },
  { topic: 'Resultado semestral', a: 'R$ 5,8 bi — 1S2025, "antes do JCP"', b: 'R$ 4,577 bi — 1S2026, "resultado combinado"', reading: 'Se o conceito fosse idêntico, haveria queda de ≈ 21%. Como o comunicado de 2026 não qualifica o conceito, a comparação não é conclusiva e é registrada como ponto prioritário de verificação.' },
];

export const glossary = [
  { term: 'Sistema Sicoob (combinado)', def: 'Soma das demonstrações das entidades do sistema com eliminação de operações entre elas. Não é uma empresa única nem um grupo societário com controlador.' },
  { term: 'Sobras', def: 'Resultado positivo do exercício em uma cooperativa. Após destinações legais e estatutárias, a assembleia decide sua distribuição aos cooperados, proporcional às operações de cada um.' },
  { term: 'JCP (juros sobre o capital)', def: 'Remuneração do capital social integralizado pelos cooperados, limitada pela legislação cooperativa. É registrada antes das sobras líquidas.' },
  { term: 'FATES', def: 'Fundo de Assistência Técnica, Educacional e Social — destinação obrigatória (mínimo de 5% das sobras líquidas, Lei 5.764/71), indivisível, para assistência e educação.' },
  { term: 'Reserva legal', def: 'Destinação obrigatória (mínimo de 10% das sobras, Lei 5.764/71) para reparar perdas e atender ao desenvolvimento da cooperativa. Indivisível.' },
  { term: 'Índice de Basileia', def: 'Patrimônio de Referência ÷ ativos ponderados pelo risco (RWA). Mede quanto capital a instituição possui para cada unidade de risco assumido.' },
  { term: 'Captações × depósitos', def: 'Depósitos (à vista, poupança, a prazo) são um subconjunto das captações, que incluem também letras de crédito (LCA, LCI) e outros instrumentos.' },
  { term: 'Ativos problemáticos', def: 'Conceito regulatório que inclui operações com atraso superior a 90 dias e operações com indícios de que não serão honradas integralmente (ex.: reestruturadas).' },
];
