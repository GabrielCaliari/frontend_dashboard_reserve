# Endpoints órfãos do domínio `leads`

Os 8 arquivos abaixo, movidos de `common/services/` sem alteração de comportamento,
chamam rotas que **não existem** em `backend_reserve` (confirmado por busca exaustiva
em `src/modules/reserve-leads` — nenhum controller expõe `/auth/leads/qualification`,
`/auth/leads/:id/complete-screening`, `/auth/leads/temperature-analysis/:id`, ou
`/brand-analysis`). Chamá-los em produção resulta em 404. Não foram removidos nesta
fase porque removê-los é uma decisão de produto (a feature nunca foi implementada no
backend, ou foi descontinuada — não dá para saber sem o time de produto), fora do
escopo de uma migração de arquitetura.

- `listLeadQualification` (`GET /auth/leads/qualification`)
- `updateLeadQualification` (`PATCH /auth/leads/:id/...`)
- `listLeadsLegacy` (`GET /auth/leads` — nota: a rota real e funcional é
  `GET /leads`, já coberta por `leadCollectionFindAll`/`leadFindAll` no serviço
  gerado; `listLeadsLegacy` é provavelmente dead code substituído por
  `leads/list-leads-service.ts`, que chama `/leads` corretamente)
- `completeScreening` (`POST /auth/leads/:id/complete-screening`)
- `temperatureAnalysisByMessageId` (`POST /auth/leads/temperature-analysis/:id`)
- `getBrandAnalytics` / `getBrandAnalyticsDetail` / `createBrandAnalytics`
  (`/brand-analysis`)

Próximo passo recomendado (fora desta fase): confirmar com o time de produto se essas
8 funções ainda são chamadas por algum componente ativo; se não forem, remover em vez
de portar.

## Nota de implementação (Task 13)

Os nomes exportados em `adapters.ts` usam o sufixo `...Service` (ex.:
`listLeadQualificationService`, `completeScreeningService`), preservando os nomes
originais de `common/services/*.ts` — a lista acima usa nomes curtos apenas como
referência descritiva. A única renomeação real foi `listLeadsService` (órfão) →
`listLeadsLegacy`, necessária porque o nome colidia com o `listLeadsService`
funcional do domínio (que também vive em `adapters.ts` e chama `GET /leads`
corretamente). O único call site do órfão
(`src/presentation/actions/list-leads.ts`) foi atualizado para o novo nome.

`brandAnalyticsService`, `brandAnalyticsDetailService` e `createBrandAnalytics`
não têm nenhum consumidor no código atual (busca exaustiva por
`brandAnalyticsService|brandAnalyticsDetailService|createBrandAnalytics` fora do
próprio arquivo de definição não retornou resultados) — são dead code, mas foram
movidos sem alteração por não haver instrução explícita para removê-los.
