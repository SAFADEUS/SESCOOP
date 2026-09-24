# SICOOB — Diagnóstico Estratégico e Econômico-Financeiro

Página web executiva e interativa com um diagnóstico do **Sistema Sicoob**: panorama cooperativista, estrutura institucional,
evolução econômico-financeira, estrutura patrimonial, resultado, capital (Basileia), carteira de crédito, modelo cooperativo,
benefício econômico, Canvas, SWOT, Cinco Forças, posicionamento, capilaridade, governança, riscos, cenário macro, diagnóstico 360°,
oportunidades e conclusão.

> Estudo técnico demonstrativo desenvolvido sob perspectiva metodológica do SESCOOP/RJ, com base exclusivamente em informações
> públicas. **Não constitui publicação oficial** do SESCOOP/RJ nem do Sicoob. Remover esta ressalva somente após validação institucional formal.

## Executar

```bash
npm install
npm run dev          # desenvolvimento
npm run build        # produção em dist/
npm run build:single # um único index.html autocontido em dist-single/ (apresentação offline)
```

Stack: React 18 + TypeScript + Tailwind CSS + Recharts + Framer Motion (Vite).

## Arquitetura de dados

Nenhum número fica "solto" nos componentes.

| Arquivo | Conteúdo |
|---|---|
| `src/data/sources.ts` | Registro de fontes: documento, URL, data-base, publicação, data de consulta, entidade, nível hierárquico |
| `src/data/metrics.ts` | Todas as métricas (`value`, `unit`, `entity`, `period`, `sourceId`, `status`) e séries históricas |
| `src/lib/derived.ts` | Indicadores calculados, sempre com `status: 'calculated'` e fórmula explícita |
| `src/data/analysis.ts` | Conteúdo interpretativo (SWOT, Porter, Canvas, riscos, oportunidades, divergências, glossário) |

Status: `official` (● dado oficial), `calculated` (◆ indicador calculado), `analysis` (▲ interpretação analítica),
`sector` (○ referência setorial — SNCC/cooperativismo, nunca atribuída ao Sicoob), `estimate` (não utilizado).

## Atualização

1. Atualize/adicione a fonte em `sources.ts` (data-base e data de consulta).
2. Atualize os valores em `metrics.ts`; derivados são recalculados automaticamente.
3. Revise os textos de `analysis.ts` e os comentários das séries que citam números.
4. Atualize `ANALYSIS_DATE` / `DATA_UNTIL`.

## Limitações conhecidas (versão de 24/09/2026)

- As Demonstrações Contábeis Combinadas completas e o Pilar 3 não foram processados: o balanço e a DSO exibem apenas
  as rubricas divulgadas em comunicados; demais rubricas aparecem como "não reproduzido".
- Não há distribuição por UF nas fontes consultadas; a seção territorial mostra cobertura municipal agregada.
- Indicadores de eficiência, inadimplência específica do Sicoob e composição de receitas não foram localizados de forma consolidada.
- Alguns links apontam para reproduções institucionais/setoriais do comunicado original (indicado no painel de fonte).
- Divergências entre documentos estão documentadas na seção "Divergências" da página.
