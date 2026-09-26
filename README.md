# NexaCoop — Conexão Cooperativista

Sistema inteligente de planejamento de **Sessões de Negócios** baseado na metodologia
**MNBD — Metodologia de Networking Balanceado por Demanda**.

Cenário de referência: 60 participantes · 10 mesas · 6 sessões · mesas de 5–6 pessoas
(C(60,2) = 1.770 pares possíveis; 6 × 10 × C(6,2) = 900 oportunidades de pares).
O objetivo **não** é todos conhecerem todos, e sim maximizar o valor das conexões sob
restrições de capacidade, prioridade, diversidade, equidade e tempo.

> Esta entrega cobre a **primeira etapa** pedida (seção 63): banco + sandbox + simulador de
> 60 participantes + motor baseline + métricas + MNBD Optimizer V2 — já com edição manual,
> versionamento, aprovação/publicação e reotimização por imprevistos.

---

## Como rodar

```bash
npm install
npm run dev          # interface em http://localhost:8080 (modo local, sem backend)
npm test             # testes do motor (TESTES 1–8 da seção 55 e outros)
npm run simulate     # roda os 6 cenários (Baseline × MNBD V2) no terminal
npm run build        # typecheck + build de produção
```

Sem variáveis de ambiente, a aplicação usa **modo local**: tudo fica no IndexedDB do
navegador — ideal para o SANDBOX. Com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
(veja `.env.example`), o seletor **Dados → Supabase** passa a usar o banco.

### Primeiro marco de validação (seção 64)

1. **Sandbox & Eventos → Criar cenário de teste** (A equilibrado, B uma estrela,
   C cinco muito demandados, D desigualdade, E imprevisto real, F restrições obrigatórias).
2. **Simulação & versões → Executar simulação** (modo “Baseline × MNBD V2”).
3. Veja as 10 mesas × 6 sessões, reencontros, contatos únicos, preferências atendidas, IPD,
   satisfação média, mínima e P10 — e a comparação lado a lado.

---

## Arquitetura

```
src/engine/            optimization-engine (TypeScript puro: navegador, Node e Deno)
  problem.ts           validateEvent, calculateDemand, IPD, dificuldade, plano de mesas, calculateFeasibility
  state.ts             solução com avaliação incremental (pares, reencontros, satisfação…)
  objective.ts         vetor lexicográfico P0–P11 + surrogates usados na busca
  optimizer.ts         buildInitialSolution, optimizeGlobalSchedule, fairnessRepair, multi-start
  metrics.ts           calculateMetrics + validateSolution (cálculo independente, verificação cruzada)
  reoptimize.ts        congelamento, encontros realizados, comparação antes × depois
  scenarios.ts         gerador determinístico dos cenários A–F
src/workers/           Web Worker que roda o motor sem travar a interface
src/data/              repositório local (IndexedDB) e Supabase (mesma interface)
src/features, pages/   interface (React + Vite + Tailwind; compatível com Lovable)
supabase/migrations/   schema, RLS, triggers de auditoria/isolamento/ciclo de vida
supabase/functions/    Edge Function `optimizer` (usa cópia sincronizada do motor)
supabase/tests/        testes SQL de RLS e teste de integração com PostgREST
```

### Lovable + Supabase

- A interface segue o padrão de projetos Lovable (Vite, React, TypeScript, Tailwind, alias `@/`).
  Conecte este repositório ao Lovable e habilite o Supabase (Lovable Cloud ou projeto próprio).
- Aplique `supabase/migrations/*.sql` (o Lovable/Supabase CLI faz isso a partir da pasta).
- Faça deploy da Edge Function `optimizer` (`supabase functions deploy optimizer`).
  Antes, rode `npm run sync:engine` sempre que alterar `src/engine` (a função usa a cópia em
  `supabase/functions/_shared/engine`; `npm run check:engine` acusa cópia desatualizada).
- **A SERVICE_ROLE nunca vai para o frontend**: o navegador só usa a chave `anon` + login;
  a função usa a service role do ambiente do Supabase.
- No primeiro login, informe o nome da organização: o usuário vira ADMIN (RPC `create_organization`).
  ADMIN atribui OPERATOR/VIEWER em `user_roles`.

Toda a operação (cadastro, importação CSV/XLSX, preferências, mesas, otimização, ausências,
simulação, aprovação, publicação, reotimização) acontece pela aplicação — sem abrir o painel
do Supabase.

### Onde o algoritmo roda

| Caminho | Uso |
|---|---|
| Web Worker no navegador | Simulações completas (ex.: 8 seeds × 150 mil iterações ≈ 6–8 s por modo). |
| Edge Function `optimizer` → `optimize` | Otimização 100% no servidor, com orçamento limitado (3 seeds × 40 mil) por causa do limite de CPU das Edge Functions. |
| Edge Function `optimizer` → `submit` | Recebe a programação calculada no navegador e **recalcula métricas e validação no servidor** antes de gravar. |
| Edge Function `optimizer` → `complete_session` | Registra encontros **realmente ocorridos**, atualiza `pair_history` e congela a sessão. |

---

## Metodologia MNBD implementada

**Demanda (antes de otimizar):** inbound e outbound separados; `contact_capacity =
sessões disponíveis × (tamanho estimado − 1)`; `IPD = inbound / capacidade`; classes
NORMAL (< 60%), ALTA (≥ 60%), CRÍTICA (≥ 90%), SOBREDEMANDA (> 100%) — limiares configuráveis.
Ex.: 40 solicitações, capacidade 30 → IPD 133,3%, excesso 10 (cenário B / TESTE 7).

**Plano de mesas:** divisão balanceada respeitando [mín, máx] sempre que possível
(60 → 10×6; 59 → 9×6 + 1×5; 58 → 8×6 + 2×5). Nunca falha por N não ser divisível.

**Seleção lexicográfica (seção 22)** — toda escolha entre soluções candidatas compara:

| | Critério |
|---|---|
| P0 | violações obrigatórias (MUST_NOT_MEET, capacidade, disponibilidade, duplicidade, locks) |
| P1 | reencontros involuntários (reencontro estratégico configurado não conta) |
| P2 | MUST_MEET não atendidos |
| P3 | HIGH_PRIORITY atendidas |
| P4 | satisfação mínima |
| P5 | satisfação P10 |
| P6 | preferências atendidas |
| P7 | contatos únicos |
| P8 | diversidade (segmentos por mesa) |
| P9 | equilíbrio de ocupação |
| P10 | repetição de mesa física (penalização baixa, desligável) |
| P11 | pessoas que trocam de mesa vs. programação vigente (só na reotimização) |

> **Decisão a validar:** a seção 7 define MUST_MEET como *restrição obrigatória* e o TESTE 5
> exige atendê-lo quando viável, mas a seção 22 o coloca em P2, depois dos reencontros.
> O padrão (`mustMeetPriority = "HARD"`) trata **MUST_MEET viável como P0**; MUST_MEET
> matematicamente impossível é detectado antes e nunca conta como violação. A ordem literal
> da seção 22 está disponível em *Configuração → Prioridade do MUST_MEET*.

**Busca (seção 27):** heurística própria em TypeScript, sem depender de solver externo.

1. *Construção “difíceis primeiro”* — pinados/locks → pares MUST_MEET distribuídos entre as
   sessões → sobredemandados espalhados em mesas diferentes → mesas deles preenchidas com
   quem mais precisa deles (MUST_MEET, mútuo, HIGH, prioridade institucional, menor
   satisfação, menos oportunidades futuras) → demais por dificuldade.
   Sessão 1 = diversidade estruturada; 2–4 = preferências; 5–6 = recuperação (fairness pesa
   mais), sem esperar a sessão 5 para cuidar de fairness.
2. *Simulated annealing sobre as 6 sessões simultaneamente* com trocas, ciclos de 3,
   movimentos dirigidos (colocar quem está pouco atendido com quem deseja), movimentos por
   conflito (min-conflicts) e “não desperdiçar sobredemandados”.
3. *Annealing lexicográfico em dois níveis* para zerar reencontros sem destruir preferências.
4. *Reparos exatos* (aceitam só melhora do vetor lexicográfico): conflitos, MUST_MEET,
   muito demandados, polimento e **FAIRNESS REPAIR** (P10, < 50%, zero atendidas; swaps,
   trocas entre mesas em todas as sessões futuras e ciclos de 3).
5. *Multi-start*: seeds `base..base+k-1`, alternando “preferências primeiro” e “reencontros
   primeiro”; guarda seed, tempo, métricas e vetor de cada candidata. **Mesmo input + mesma
   seed ⇒ mesmo resultado** (TESTE 6).

**Satisfação:** `atendidas / min(preferências positivas, capacidade de contatos)`; relatórios
com mínimo, P10, P25, mediana, média, P75, P90 e faixas (< 25%, < 50%, > 80%, 100%, zero).

**Baseline (seção 52):** só distribuição por sessão + redução de reencontros (ignora
preferências); serve apenas como referência — a interface mostra os dados, sem declarar vencedor.

---

## Resultados medidos (seed 1 de cada cenário, 8 seeds × 150 mil iterações)

| Cenário | Modo | Reencontros | Preferências | HIGH | MUST_MEET | Média | Mínima | P10 | Tempo |
|---|---|---|---|---|---|---|---|---|---|
| A equilibrado | Baseline | 0 | 199/387 | 43/81 | — | 51,4% | 14,3% | 28,6% | 2,4 s |
| | MNBD V2 | 0 | 274/387 | 77/81 | — | 70,7% | 14,3% | 50,0% | 5,9 s |
| B uma estrela | Baseline | 0 | 176/365 | 31/68 | — | 48,3% | 0,0% | 31,7% | 2,4 s |
| | MNBD V2 | 0 | 256/365 | 66/68 | — | 70,3% | 33,3% | 50,0% | 6,9 s |
| C cinco demandados | Baseline | 0 | 191/400 | 35/86 | — | 47,5% | 14,3% | 28,6% | 2,4 s |
| | MNBD V2 | 0 | 265/400 | 77/86 | — | 66,5% | 28,6% | 42,9% | 6,7 s |
| D desigualdade | Baseline | 0 | 243/474 | 45/103 | — | 51,4% | 25,0% | 25,0% | 2,5 s |
| | MNBD V2 | 0 | 316/474 | 92/103 | — | 66,8% | 12,5% | 49,3% | 6,9 s |
| E imprevisto (plano inicial) | Baseline | 0 | 208/388 | 45/77 | — | 53,8% | 0,0% | 32,9% | 2,4 s |
| | MNBD V2 | 0 | 263/388 | 74/77 | — | 67,7% | 28,6% | 50,0% | 5,3 s |
| F restrições | Baseline | 0 | 205/404 | 38/78 | 4/9 | 51,0% | 14,3% | 28,6% | 2,4 s |
| | MNBD V2 | 0 | 263/404 | 65/78 | 9/9 | 65,1% | 16,7% | 49,3% | 8,0 s |

Todas as soluções: 0 violações obrigatórias. Números reproduzíveis com `npm run simulate -- 8 150000`
(o tempo varia com a máquina).

Observações honestas:
- A satisfação **mínima** do V2 às vezes fica igual ou abaixo do baseline (D: 12,5%), porque a
  ordem lexicográfica coloca reencontros e HIGH_PRIORITY antes da mínima. O P10 e o número de
  pessoas abaixo de 50% melhoram muito.
- No cenário E, após o imprevisto, as sessões 3–6 ficam com mesas de 7 (59 pessoas, 9 mesas).
  A reotimização preserva as sessões 1–2 intactas e elimina as violações da programação antiga,
  mas passa a ter alguns reencontros (≈ 4–8, o baseline também fica em ≈ 4–5).
- Participantes muito demandados usam a maior parte das suas vagas com quem os solicitou
  (estrela do cenário B: 24–30 das 30 vagas conforme o orçamento), mas nem sempre todas —
  reencontros e fairness vêm antes na ordem lexicográfica.

---

## Testes

| Suíte | Comando | O que cobre |
|---|---|---|
| Motor | `npm test` | TESTES 1–8 da seção 55, métricas cruzadas, determinismo, cenários |
| SQL/RLS | `npm run test:sql` (Postgres local) | papéis, isolamento sandbox × produção, execuções imutáveis, aprovação/publicação só ADMIN, auditoria |
| Integração Supabase | `supabase/tests/it/run-it.sh` (Postgres + PostgREST) | repositório do frontend contra o banco real com RLS |

---

## Próximas etapas sugeridas

- Modo evento ao vivo (seção 57): cronômetro, check-in por mesa, Realtime.
- Botão “Concluir sessão” na interface usando `complete_session` da Edge Function.
- Calibrar pesos com dados reais de eventos e com o organizador (ex.: quanto sacrificar de
  preferências para zerar o último reencontro).
