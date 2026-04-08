# Fase 5 — Frontend: plataforma de UX e segurança de sessão Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar o vazamento de cache entre tenants, tornar a leitura de papel/capabilities determinística, e instalar no Reserve a plataforma de listas, ações e design tokens que a Zarp já tem — com testes.

**Architecture:** O cache do React Query passa a ser rotacionado por tenant (`TenantQueryProvider`), e a autorização de UI passa a vir de um único lugar (`GET /api/tenant-capabilities` → `normalizeTenantCapabilities` → `createAccessPolicy`), que alimenta menu, dashboard e botões. Sobre isso entra a plataforma `entity-list` (definição declarativa de lista: fonte de dados + capabilities + filtros + variante cards/tabela), `entity-actions` (confirmação/edição/ação em massa) e `resource-list` (lista operacional leve), com `create-optimistic-mutation` e `use-list-query-state` como helpers de query. Duas listas reais do Reserve são migradas para provar os dois modos de capability (servidor e local), e os tokens de layout/raio são alinhados com um `docs/DESIGN.md` próprio.

**Tech Stack:** Next 16.1.6 (App Router) · React 19.2.4 · TypeScript 5.9 · HeroUI 2.8.10 · Radix UI (shadcn atoms locais) · Tailwind CSS 4.3.0 · @tanstack/react-query 5.90 · Zustand 5 · next-intl 4.8 · sonner · lucide-react · Vitest 4 + @testing-library/react 16 + vitest-axe + fast-check

## Global Constraints

- **Gerenciador de pacotes: `npm`.** O repo tem `package-lock.json` (789 KB, mais recente) **e** `pnpm-lock.yaml` (592 KB, mais antigo). A Task 1 remove `pnpm-lock.yaml` para eliminar a ambiguidade. Todo comando neste plano é `npm`.
- **Testes: Vitest.** Configuração já existente: `vitest.config.ts` (environment `jsdom`, `globals: true`, `setupFiles: ['./vitest.setup.ts']`, alias `@` → raiz do repo) e `vitest.setup.ts` (`@testing-library/jest-dom` + `vitest-axe/extend-expect`). Nada disso muda.
- **Nomes de arquivo de teste:** `*.test.ts` / `*.test.tsx`, colocados **ao lado** do arquivo testado (não em `__tests__/`). Exceção herdada da Zarp: `types.test-d.ts` para asserções de tipo.
- **Comando de teste:** `npm run test:run -- <padrão>`. O padrão é casado contra o caminho do arquivo.
- **Nenhuma dependência nova.** Tudo que a plataforma precisa já está no `package.json`: `@tanstack/react-query`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `sonner`, `framer-motion`, `clsx`, `lucide-react`, `@heroui/react`, `zustand`, `next-intl`, `vitest-axe`, `fast-check`, `@testing-library/user-event`.
- **Versões travadas:** Next `16.1.6`, React `19.2.4`, React DOM `19.2.4`, HeroUI `2.8.10`, Tailwind `4.3.0`, Vitest `^4.0.18`. Não subir nenhuma.
- **Nomenclatura `zarp` → `reserve`:** classe CSS `.card-zarp` → `.card-reserve` (já existe no Reserve), pasta `atoms/zarp` → `atoms/reserve`. **Não** trocar a paleta por azul — ver a regra de superfície de admin abaixo.
- **Regra de superfície de admin (DESIGN.md §5), obrigatória em todo componente novo:** admin **não** usa azul como cor informativa, de link ou de série de gráfico (usa a família verde da marca); admin **não** usa decoração `blur-3xl` glow.
- **Raio de card em superfície de admin: `16px`.** `30px` é raio de landing page.
- **Todo arquivo portado vem com o teste que ele tem na origem.** Se existe `.test.tsx` na Zarp, este plano porta os dois.
- **Textos de interface em português**, na linguagem do usuário final (DESIGN.md §7): todo texto diz o que aconteceu ou o que fazer em seguida — nunca um label técnico, valor de enum ou placeholder não traduzido. Vale igualmente para estados de carregando, vazio, erro e proibido. Ex.: "Não foi possível carregar os itens" no lugar de "Error loading"; "Arquivar lead" no lugar de um ícone sem label.
- **Fronteira de camada:** `shared/` não importa de `modules/` nem de `presentation/`. `presentation/` não importa de `app/`. `modules/<x>/domain/` não importa React.
- **Após cada task:** `npm run build` passa **e** `npm run test:run` fica verde. Um commit por task, mensagem em inglês no formato `feat:` / `fix:` / `refactor:` / `test:` / `docs:`.
- **Dependência de fase:** as Tasks 2–33 rodam **depois da Fase 4** (que adota `src/{app,modules,presentation,shared,infraestructure}`). A **Task 1 não depende da Fase 4** e deve ser executada imediatamente, em paralelo às Fases 1–4 — ela corrige vazamento de dados entre tenants. A Task 1 traz o caminho alternativo na estrutura atual.

### Mapa de caminhos: estrutura atual → estrutura pós-Fase 4

Quem executar a Task 1 antes da Fase 4 usa a coluna da esquerda. Todas as outras tasks usam a coluna da direita.

| Estrutura atual (pré-Fase 4) | Estrutura pós-Fase 4 (usada neste plano) |
|---|---|
| `src/common/query/` | `src/shared/query/` |
| `src/common/stores/` | `src/shared/stores/` |
| `src/common/hooks/` | `src/shared/hooks/` |
| `src/common/@types/@auth.ts` | `src/shared/domain/types/@auth.ts` |
| `src/common/@types/@stats.ts` | `src/shared/domain/types/@stats.ts` |
| `src/common/@types/@lead.ts` | `src/shared/domain/types/@lead.ts` |
| `src/common/@types/@cms-article.ts` | `src/shared/domain/types/@cms-article.ts` |
| `src/common/@types/@cms-author.ts` | `src/shared/domain/types/@cms-author.ts` |
| `src/common/config/api.ts` | `src/infraestructure/axios/api.ts` |
| `src/common/config/get-auth-headers.ts` | `src/infraestructure/axios/get-auth-headers.ts` |
| `src/common/utils/` | `src/shared/utils/` |
| `src/common/lib/utils.ts` | `src/shared/utils/cn.ts` (mantém `cn` e `formatDate`) |
| `src/common/styles/globals.css` | `src/shared/styles/globals.css` |
| `src/components/ui/<atom>.tsx` | `src/presentation/components/atoms/shadcn-ui/<atom>.tsx` |
| `src/components/ui/aside.tsx`, `header.tsx` | `src/presentation/components/atoms/reserve/aside.tsx`, `header.tsx` |
| `src/components/tenant-selector.tsx` | `src/presentation/components/organisms/tenant-selector.tsx` |
| `src/components/notifications/` | `src/presentation/components/organisms/notifications/` |
| `src/components/cms/` | `src/presentation/components/organisms/cms/` |

## File Structure

**Segurança de sessão e cache**

| Arquivo | Responsabilidade |
|---|---|
| `src/shared/query/tenant-query-provider.tsx` | rotaciona o `QueryClient` por tenant; cancela e limpa o client antigo |
| `src/shared/query/tenant-query-provider.test.tsx` | prova que trocar de tenant descarta o cache anterior |
| `src/shared/query/test-query-provider.tsx` | fábrica de `QueryClient` e wrapper para testes |
| `src/app/providers.tsx` | passa a compor `TenantQueryProvider` no lugar do singleton |
| `src/shared/stores/tenant-store.ts` | store de tenant, `version: 3` + `migrateTenantStore` que descarta `dashboardScope` |
| `src/shared/stores/tenant-store.test.ts` | prova a migração e os selectors sem escopo |
| `src/infraestructure/axios/get-auth-headers.ts` | deixa de anular o tenant quando o escopo era global |
| `src/shared/utils/get-tenant-id-server.ts` | idem, no servidor |

**Autorização de UI**

| Arquivo | Responsabilidade |
|---|---|
| `src/shared/hooks/use-permissions.ts` | lê `session-role` com `useSyncExternalStore` (hidratação consistente) |
| `src/shared/hooks/use-permissions.test.tsx` | prova que o render de servidor não vê o cookie |
| `src/shared/domain/access-management/admin-role.ts` | `AdminRoleValue`, `ADMIN_ROLE_VALUES`, `normalizeAdminRole` |
| `src/shared/domain/access-management/access-policy.ts` | `createAccessPolicy`, `can()`, `canActOnAdmin()` |
| `src/modules/settings/domain/tenant-modules.ts` | `GATEABLE_MODULES`, `ModuleFlags`, `normalizeModuleFlags` |
| `src/modules/settings/domain/tenant-capabilities.ts` | normalização defensiva de `GET /api/tenant-capabilities` |
| `src/modules/settings/infrastructure/tenant-capabilities-adapter.ts` | chamada HTTP única para capabilities |
| `src/modules/settings/presentation/hooks/tenant-capabilities-provider.tsx` | contexto com capabilities + `policy` + `hasPermission` |
| `src/modules/settings/domain/navigation.ts` | filtra menu por módulo e por permissão de leitura |
| `src/modules/settings/domain/dashboard-visibility.ts` | filtra grupos/métricas do dashboard por módulo e permissão |

**Plataforma de listas** (`src/presentation/components/organisms/entity-list/`)

| Arquivo | Responsabilidade |
|---|---|
| `types.ts` | contrato da definição de lista, capabilities, colunas, filtros |
| `query-state.ts` | serializa/desserializa o estado da lista para `URLSearchParams` |
| `selection.ts` | seleção explícita e "todos que casam", com contagem |
| `local-query.ts` | busca/ordenação/paginação em memória com teto declarado |
| `capabilities.ts` | valida que operação local declara `localItemLimit` |
| `optimistic.ts` | snapshot/patch/remoção otimista em todas as páginas cacheadas |
| `use-entity-list-state.ts` | estado da lista em memória ou na URL, com debounce de busca |
| `use-entity-list-controller.ts` | junta estado + query + seleção, isolando por tenant |
| `entity-list-states.tsx` | carregando / vazio / erro |
| `entity-list-filters.tsx` | facetas |
| `entity-list-toolbar.tsx` | busca + ações primárias |
| `entity-list-pagination.tsx` | faixa visível + navegação |
| `entity-list-table.tsx` | variante tabela |
| `entity-list-item.tsx` | linha de card com trilha de status, seleção e ações |
| `entity-row-actions.tsx` | menu de ações da linha |
| `entity-list-layout.tsx` | grade filtros/conteúdo + gaveta de filtros no mobile |
| `entity-list.tsx` | composição pública |
| `index.ts` | barrel |

**Ações e lista operacional**

| Arquivo | Responsabilidade |
|---|---|
| `.../entity-actions/types.ts`, `entity-actions-reducer.ts` | descritores e máquina de estado de ação |
| `.../entity-actions/bulk-executor.ts` | execução em massa com concorrência e progresso |
| `.../entity-actions/entity-actions-context.ts`, `entity-actions-provider.tsx`, `use-entity-actions.ts` | API imperativa `openEdit`/`openDelete`/`openConfirm` |
| `.../entity-actions/entity-action-host.tsx` | diálogo de confirmação/edição, invalidação e toast |
| `.../resource-list/list-utils.ts` | `filterResources`, `paginateResources` |
| `.../resource-list/resource-list*.tsx` | lista semântica `ul`/`li` com estados |
| `.../resource-list/operational-list.tsx` | adaptador com a API de `Table` do HeroUI sobre `ResourceList` |

**Helpers de query e listas migradas**

| Arquivo | Responsabilidade |
|---|---|
| `src/shared/query/create-optimistic-mutation.ts` | handlers `onMutate`/`onError`/`onSettled` genéricos |
| `src/shared/hooks/use-list-query-state.ts` | estado de lista simples sincronizado com a URL |
| `src/modules/leads/presentation/components/lists/lead-list-definition.tsx` | definição da lista de leads (capability servidor) |
| `src/presentation/components/pages/dashboard/leads/page.tsx` | página de leads sobre `EntityList` |
| `src/modules/cms/presentation/components/lists/article-list-definition.tsx` | definição da lista de artigos (capability local) |
| `src/presentation/components/organisms/cms/articles/article-list.tsx` | lista de artigos sobre `EntityList` |

**Design e notificações**

| Arquivo | Responsabilidade |
|---|---|
| `src/shared/styles/globals.css` | `--header-height`, `--sidebar-width`, raio de card 16px, 24 h em `input[type="time"]`, fonte |
| `docs/DESIGN.md` | design system do Reserve com a paleta RÉSERVE |
| `src/modules/notifications/domain/notification-event-labels.ts` | rótulo em português do evento disparador |
| `src/shared/hooks/notifications/notification-query-keys.ts` | chaves de query de notificação |
| `src/shared/hooks/notifications/use-notification-inbox.ts` | inbox + leitura otimista em React Query |
| `src/shared/hooks/notifications/use-tenant-notification.ts` | resolve uma notificação a partir do inbox |
| `src/shared/hooks/notifications/use-unread-count.ts` | contagem de não lidas em React Query |
| `src/presentation/components/organisms/notifications/notification-view.tsx` | visão somente leitura para o tenant |
| `src/app/dashboard/notifications/[id]/page.tsx` | rota da visão |

---

### Task 1: TenantQueryProvider — rotação de cache por tenant

> **Esta task NÃO depende da Fase 4 e deve ser executada imediatamente**, em paralelo às Fases 1–4. É correção de vazamento de dados entre tenants: hoje `src/app/providers.tsx` cria o `QueryClient` como singleton de módulo, então trocar de tenant no `TenantSelector` serve os dados do tenant anterior como *fresh* pelo `staleTime` de 60 s.
>
> **Caminhos na estrutura ATUAL (use estes se a Fase 4 ainda não rodou):**
> - `src/common/query/tenant-query-provider.tsx`
> - `src/common/query/tenant-query-provider.test.tsx`
> - `src/common/query/test-query-provider.tsx`
>
> E troque os imports: `@/src/shared/stores/tenant-store` → `@/src/common/stores/tenant-store`, `@/src/shared/domain/types/@auth` → `@/src/common/@types/@auth`. Nada mais muda.

**Files:**
- Create: `src/shared/query/tenant-query-provider.tsx`
- Create: `src/shared/query/test-query-provider.tsx`
- Test: `src/shared/query/tenant-query-provider.test.tsx`
- Modify: `src/app/providers.tsx` (remove o `QueryClient` de módulo e o `QueryClientProvider`)
- Delete: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: `useTenantStore` de `@/src/shared/stores/tenant-store` (já existe); `Tenant` de `@/src/shared/domain/types/@auth`
- Produces: `TenantQueryProvider({ children }: PropsWithChildren)`, `getTenantCacheScope(tenantId: string | null): string`, `createTestQueryClient(): QueryClient`, `createTestQueryWrapper(client?: QueryClient)`, `renderWithQueryClient(ui, options?)`

- [ ] **Step 1: Write the failing test**

Crie `src/shared/query/test-query-provider.tsx` primeiro — ele é infraestrutura de teste usada por este e por quase todos os testes seguintes:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { PropsWithChildren, ReactElement } from "react";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function createTestQueryWrapper(client: QueryClient = createTestQueryClient()) {
  return function TestQueryWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

export function renderWithQueryClient(
  ui: ReactElement,
  options?: RenderOptions & { queryClient?: QueryClient },
) {
  const queryClient = options?.queryClient ?? createTestQueryClient();
  return {
    queryClient,
    ...render(ui, { wrapper: createTestQueryWrapper(queryClient), ...options }),
  };
}
```

Agora o teste, em `src/shared/query/tenant-query-provider.test.tsx`:

```tsx
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { act, render, waitFor } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Tenant } from "@/src/shared/domain/types/@auth";
import { useTenantStore } from "@/src/shared/stores/tenant-store";
import {
  getTenantCacheScope,
  TenantQueryProvider,
} from "./tenant-query-provider";

const tenantA: Tenant = {
  id: "tenant-a",
  name: "Tenant A",
  slug: "tenant-a",
  domain: "tenant-a.test",
};

const tenantB: Tenant = {
  id: "tenant-b",
  name: "Tenant B",
  slug: "tenant-b",
  domain: "tenant-b.test",
};

function ClientProbe({ onClient }: { onClient(client: QueryClient): void }) {
  const client = useQueryClient();

  useEffect(() => {
    onClient(client);
  }, [client, onClient]);

  return null;
}

function renderProvider(
  onClient: (client: QueryClient) => void,
  children?: ReactNode,
) {
  return render(
    <TenantQueryProvider>
      <ClientProbe onClient={onClient} />
      {children}
    </TenantQueryProvider>,
  );
}

afterEach(() => {
  act(() => {
    useTenantStore.setState({ selectedTenant: null });
  });
});

describe("getTenantCacheScope", () => {
  it("uses a stable key per tenant id", () => {
    expect(getTenantCacheScope("tenant-a")).toBe("tenant:tenant-a");
    expect(getTenantCacheScope(null)).toBe("tenant:none");
  });
});

describe("TenantQueryProvider", () => {
  it("rotates and retires the entire cache when the tenant changes", async () => {
    useTenantStore.setState({ selectedTenant: tenantA });
    const clients: QueryClient[] = [];
    const onClient = vi.fn((client: QueryClient) => {
      clients.push(client);
    });

    renderProvider(onClient);
    await waitFor(() => expect(clients).toHaveLength(1));

    const clientA = clients[0];
    const cancelQueries = vi.spyOn(clientA, "cancelQueries");
    const clear = vi.spyOn(clientA, "clear");
    clientA.setQueryData(["legacy-unscoped"], "tenant-a-data");

    act(() => {
      useTenantStore.setState({ selectedTenant: tenantB });
    });

    await waitFor(() => expect(clients).toHaveLength(2));
    const clientB = clients[1];

    expect(clientB).not.toBe(clientA);
    expect(clientB.getQueryData(["legacy-unscoped"])).toBeUndefined();
    expect(cancelQueries).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(clientA.getQueryCache().getAll()).toHaveLength(0);
  });

  it("keeps the client when the selected tenant id does not change", async () => {
    useTenantStore.setState({ selectedTenant: tenantB });
    const clients: QueryClient[] = [];
    const onClient = vi.fn((client: QueryClient) => {
      clients.push(client);
    });

    renderProvider(onClient);
    await waitFor(() => expect(clients).toHaveLength(1));

    act(() => {
      useTenantStore.setState({
        selectedTenant: { ...tenantB, name: "Tenant B atualizado" },
      });
    });

    expect(clients).toHaveLength(1);
  });

  it("rotates the cache when the tenant is cleared", async () => {
    useTenantStore.setState({ selectedTenant: tenantA });
    const clients: QueryClient[] = [];

    renderProvider((client) => clients.push(client));
    await waitFor(() => expect(clients).toHaveLength(1));

    act(() => {
      useTenantStore.setState({ selectedTenant: null });
    });

    await waitFor(() => expect(clients).toHaveLength(2));
    expect(clients[1]).not.toBe(clients[0]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- tenant-query-provider`
Expected: FAIL com `Failed to resolve import "./tenant-query-provider"`

- [ ] **Step 3: Write minimal implementation**

`src/shared/query/tenant-query-provider.tsx`:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type PropsWithChildren } from "react";
import { useTenantStore } from "@/src/shared/stores/tenant-store";

export function getTenantCacheScope(tenantId: string | null) {
  return `tenant:${tenantId ?? "none"}`;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
      },
    },
  });
}

function TenantQueryScope({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);

  useEffect(
    () => () => {
      void queryClient.cancelQueries();
      queryClient.clear();
    },
    [queryClient],
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export function TenantQueryProvider({ children }: PropsWithChildren) {
  const tenantId = useTenantStore(
    (state) => state.selectedTenant?.id.toString() ?? null,
  );
  const cacheScope = getTenantCacheScope(tenantId);

  return <TenantQueryScope key={cacheScope}>{children}</TenantQueryScope>;
}
```

Substitua `src/app/providers.tsx` inteiro (isto também repara a formatação quebrada pelos scripts `fix_spacing.js` / `remove_shadows.js` neste arquivo):

```tsx
"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";

import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "nextjs-toploader/app";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";

import { TenantQueryProvider } from "@/src/shared/query/tenant-query-provider";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <TenantQueryProvider>
      <HeroUIProvider navigate={router.push}>
        <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
        <Toaster richColors position="bottom-center" />
      </HeroUIProvider>
    </TenantQueryProvider>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- tenant-query-provider`
Expected: PASS (4 testes)

Confirme também que o build ainda fecha: `npm run build`

- [ ] **Step 5: Commit**

```bash
rm pnpm-lock.yaml
git add src/shared/query/tenant-query-provider.tsx src/shared/query/tenant-query-provider.test.tsx src/shared/query/test-query-provider.tsx src/app/providers.tsx
git rm --cached pnpm-lock.yaml
git commit -m "fix: rotate the react-query cache per tenant to stop cross-tenant data reuse"
```

---

### Task 2: Migração versionada do tenant-store e remoção de `dashboardScope`

O Reserve ainda carrega `dashboardScope: 'tenant' | 'global'` no estado persistido em cookie, e `useSelectedTenantId()` devolve `null` quando o escopo é `global` — o que faz o `x-tenant-id` deixar de ser enviado e o backend responder no escopo errado. A Zarp removeu o conceito com `version: 3` + `migrate`. Aqui a função de migração é **exportada** para poder ser testada direto, sem depender do ciclo de reidratação do Zustand.

Os call sites de `dashboardScope` no Reserve (encontrados por grep) são exatamente estes seis:

| Arquivo | O que muda |
|---|---|
| `src/shared/stores/tenant-store.ts` | remove o campo, o setter e os selectors `useDashboardScope` / `useIsGlobalDashboardScope` |
| `src/infraestructure/axios/get-auth-headers.ts:8,26` | para de anular o tenant quando o escopo era `global` |
| `src/shared/utils/get-tenant-id-server.ts:8,26` | idem |
| `src/shared/hooks/payments/use-payment-movements.ts:8,11` | passa a habilitar só com tenant selecionado |
| `src/presentation/components/organisms/tenant-selector.tsx` | remove a opção "visão global"; auto-seleciona o primeiro tenant |
| `src/presentation/components/atoms/reserve/aside.tsx:50,78,101,560,737,750,799` | o menu de super admin passa a ser decidido por `isSuperAdmin`, não por escopo |

As rotas `/dashboard/global/*` **continuam existindo** — elas são superfícies de autoria do super admin, não um "escopo". O que sai é o conceito de escopo no store. Na Task 6 o gate passa de `isSuperAdmin` para `isMasterTenant` das capabilities.

**Files:**
- Modify: `src/shared/stores/tenant-store.ts` (arquivo inteiro)
- Test: `src/shared/stores/tenant-store.test.ts`
- Modify: `src/infraestructure/axios/get-auth-headers.ts:3-31`
- Modify: `src/shared/utils/get-tenant-id-server.ts:3-30`
- Modify: `src/shared/hooks/payments/use-payment-movements.ts` (arquivo inteiro)
- Modify: `src/presentation/components/organisms/tenant-selector.tsx` (arquivo inteiro)
- Modify: `src/presentation/components/atoms/reserve/aside.tsx` (7 pontos)

**Interfaces:**
- Consumes: `Tenant` de `@/src/shared/domain/types/@auth`
- Produces: `useTenantStore`, `useSelectedTenantId(): string | null`, `useHasSelectedTenant(): boolean`, `migrateTenantStore(persistedState: unknown): TenantState`. **`DashboardScope`, `useDashboardScope` e `useIsGlobalDashboardScope` deixam de existir** — nenhuma task posterior os referencia.

- [ ] **Step 1: Write the failing test**

`src/shared/stores/tenant-store.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import {
  migrateTenantStore,
  useHasSelectedTenant,
  useSelectedTenantId,
  useTenantStore,
} from "./tenant-store";

const tenant = {
  id: "clv1tenant000000000000001",
  name: "Hotel RÉSERVE",
  slug: "hotel-reserve",
  domain: "hotel.reserve.test",
};

beforeEach(() => {
  useTenantStore.setState({ selectedTenant: null });
});

describe("migrateTenantStore", () => {
  it("drops the dead dashboardScope field from a persisted v2 cookie", () => {
    const migrated = migrateTenantStore({
      selectedTenant: tenant,
      dashboardScope: "global",
    });

    expect(migrated.selectedTenant).toEqual(tenant);
    expect("dashboardScope" in migrated).toBe(false);
  });

  it("returns an empty selection for a corrupt or empty persisted state", () => {
    expect(migrateTenantStore(null).selectedTenant).toBeNull();
    expect(migrateTenantStore("not an object").selectedTenant).toBeNull();
    expect(migrateTenantStore({}).selectedTenant).toBeNull();
  });
});

describe("tenant store selectors", () => {
  it("reports the selected tenant id without consulting any scope", () => {
    useTenantStore.setState({ selectedTenant: tenant });
    expect(useSelectedTenantId.getState?.()).toBeUndefined();
    expect(useTenantStore.getState().selectedTenant?.id).toBe(tenant.id);
  });

  it("exposes setSelectedTenant and clearSelectedTenant with no scope side effect", () => {
    useTenantStore.getState().setSelectedTenant(tenant);
    expect(useTenantStore.getState().selectedTenant).toEqual(tenant);

    useTenantStore.getState().clearSelectedTenant();
    expect(useTenantStore.getState().selectedTenant).toBeNull();
    expect(Object.keys(useTenantStore.getState())).toEqual([
      "selectedTenant",
      "setSelectedTenant",
      "clearSelectedTenant",
    ]);
  });

  it("no longer exports a dashboard scope selector", async () => {
    const storeModule = await import("./tenant-store");
    expect("useDashboardScope" in storeModule).toBe(false);
    expect("useIsGlobalDashboardScope" in storeModule).toBe(false);
    expect(typeof useHasSelectedTenant).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- tenant-store`
Expected: FAIL com `No "migrateTenantStore" export is defined on the module`

- [ ] **Step 3: Write minimal implementation**

`src/shared/stores/tenant-store.ts` (arquivo inteiro):

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Tenant } from '@/src/shared/domain/types/@auth';

interface TenantState {
  selectedTenant: Tenant | null;
  setSelectedTenant: (tenant: Tenant | null) => void;
  clearSelectedTenant: () => void;
}

const COOKIE_MAX_AGE = 86400; // 24h

/**
 * Storage adapter que persiste o state do Zustand diretamente em cookie.
 * Unica fonte de verdade -- client e server leem o mesmo cookie.
 */
const cookieStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = {
  getItem(name) {
    if (typeof document === 'undefined') return null;
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`));
    if (!match) return null;
    try {
      return decodeURIComponent(match.split('=').slice(1).join('='));
    } catch {
      return null;
    }
  },
  setItem(name, value) {
    if (typeof document === 'undefined') return;
    const isSecure = window.location.protocol === 'https:';
    const flags = `path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
    document.cookie = `${name}=${encodeURIComponent(value)}; ${flags}`;
  },
  removeItem(name) {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; path=/; max-age=0`;
  },
};

/**
 * v1/v2 persistiam `dashboardScope` ('tenant' | 'global'). O conceito nao existe
 * mais: o acesso de super admin vem das capabilities do tenant, nao de um escopo
 * guardado no cookie. Descartamos o campo para que sessoes abertas nao carreguem
 * um campo morto -- e, principalmente, para que `useSelectedTenantId` pare de
 * devolver null (o que suprimia o header `x-tenant-id`).
 */
export function migrateTenantStore(persistedState: unknown): TenantState {
  const isRecord =
    typeof persistedState === 'object' &&
    persistedState !== null &&
    !Array.isArray(persistedState);
  const state = (isRecord ? persistedState : {}) as Partial<TenantState> & {
    dashboardScope?: string;
  };
  const { dashboardScope: _dashboardScope, ...rest } = state;

  return { selectedTenant: null, ...rest } as TenantState;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      selectedTenant: null,
      setSelectedTenant: (tenant) => set({ selectedTenant: tenant }),
      clearSelectedTenant: () => set({ selectedTenant: null }),
    }),
    {
      name: 'tenant-storage',
      storage: createJSONStorage(() => cookieStorage),
      version: 3,
      migrate: (persistedState) => migrateTenantStore(persistedState),
    }
  )
);

// Hook para obter o tenant ID selecionado (util para APIs)
export const useSelectedTenantId = () => {
  const selectedTenant = useTenantStore((state) => state.selectedTenant);
  return selectedTenant?.id ?? null;
};

// Hook para verificar se um tenant esta selecionado
export const useHasSelectedTenant = () => {
  const selectedTenant = useTenantStore((state) => state.selectedTenant);
  return selectedTenant !== null;
};
```

`src/infraestructure/axios/get-auth-headers.ts` — substitua as linhas 3–31 por:

```ts
type TenantStorageSnapshot = {
  state?: {
    selectedTenant?: {
      id?: string | number;
    } | null;
  };
};

/**
 * Extrai o tenant ID do valor do cookie "tenant-storage" (JSON persistido pelo Zustand).
 */
function parseTenantCookie(cookieValue: string): TenantStorageSnapshot | null {
  try {
    const decoded = decodeURIComponent(cookieValue);
    return JSON.parse(decoded) as TenantStorageSnapshot;
  } catch {
    return null;
  }
}

function extractTenantId(cookieValue: string): string | null {
  const parsed = parseTenantCookie(cookieValue);
  if (!parsed) return null;

  return parsed.state?.selectedTenant?.id?.toString() ?? null;
}
```

`src/shared/utils/get-tenant-id-server.ts` — substitua as linhas 3–30 por:

```ts
type TenantStorageSnapshot = {
  state?: {
    selectedTenant?: {
      id?: string | number;
    } | null;
  };
};

/**
 * Extrai o tenant ID do cookie "tenant-storage" no servidor (Server Actions / Route Handlers).
 * Retorna null se nao houver tenant selecionado.
 */
export async function getTenantIdFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const tenantCookie = cookieStore.get('tenant-storage')?.value;

    if (!tenantCookie) return null;

    const decoded = decodeURIComponent(tenantCookie);
    const parsed: TenantStorageSnapshot = JSON.parse(decoded);

    if (!parsed) return null;

    const tenantId = parsed.state?.selectedTenant?.id?.toString() ?? null;
```

(o restante do arquivo — validação de CUID e `catch` — fica como está)

`src/shared/hooks/payments/use-payment-movements.ts` (arquivo inteiro):

```ts
import { useQuery } from '@tanstack/react-query';
import { paymentMovementsService } from '@/src/modules/payments/infrastructure/payment-movements-adapter';
import type { ListMovementsParams } from '@/src/shared/domain/types/@payment-movements';
import { useHasSelectedTenant, useSelectedTenantId } from '@/src/shared/stores/tenant-store';

export function usePaymentMovements(params?: ListMovementsParams) {
  const hasTenant = useHasSelectedTenant();
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ['payment-movements', tenantId, params],
    queryFn: () => paymentMovementsService.listMovements(params),
    enabled: hasTenant,
    staleTime: 2 * 60 * 1000,
  });
}
```

`src/presentation/components/organisms/tenant-selector.tsx` (arquivo inteiro):

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Select, SelectItem } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useRouter } from "nextjs-toploader/app";

import useAdminDetails from "@/src/shared/hooks/useUserDatails";
import { useTenantStore } from "@/src/shared/stores/tenant-store";

export default function TenantSelector() {
  const { push } = useRouter();
  const t = useTranslations("sidebar");
  const [isMounted, setIsMounted] = useState(false);
  const { data: adminData, isLoading } = useAdminDetails();
  const selectedTenant = useTenantStore((state) => state.selectedTenant);
  const setSelectedTenant = useTenantStore((state) => state.setSelectedTenant);

  const tenants = adminData?.tenants ?? [];

  // Evita divergencia de hidratacao: o cookie so e lido depois da montagem.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-seleciona o primeiro tenant do admin quando nenhum esta selecionado ou
  // quando o tenant do cookie nao pertence mais a este admin.
  useEffect(() => {
    if (isLoading || !isMounted || tenants.length === 0) return;

    const tenantBelongsToAdmin = selectedTenant
      ? tenants.some(
          (tenant: { id: string | number }) =>
            tenant.id.toString() === selectedTenant.id.toString(),
        )
      : false;

    if (!selectedTenant || !tenantBelongsToAdmin) {
      setSelectedTenant(tenants[0]);
    }
  }, [tenants, selectedTenant, setSelectedTenant, isLoading, isMounted]);

  const handleSelectionChange = useCallback(
    (keys: Iterable<React.Key>) => {
      const selectedKey = Array.from(keys)[0] as string | undefined;
      if (!selectedKey) return;

      const tenant = tenants.find(
        (candidate: { id: string | number }) =>
          candidate.id.toString() === selectedKey,
      );
      if (tenant) {
        setSelectedTenant(tenant);
        push("/dashboard");
      }
    },
    [tenants, setSelectedTenant, push],
  );

  if (!isMounted || isLoading) {
    return (
      <Select
        label={t("tenantLabel")}
        placeholder={t("tenantLoading")}
        isLoading
        isDisabled
        className="max-w-xs"
        classNames={{
          trigger: "bg-white/5 border-border",
          label: "text-muted-foreground",
        }}
      >
        <SelectItem key="loading">{t("tenantLoading")}</SelectItem>
      </Select>
    );
  }

  if (tenants.length === 0) {
    return (
      <Select
        label={t("tenantLabel")}
        placeholder={t("noTenantsAvailable")}
        isDisabled
        className="max-w-xs"
        classNames={{
          trigger: "bg-white/5 border-border",
          label: "text-muted-foreground",
        }}
      >
        <SelectItem key="empty">{t("noTenants")}</SelectItem>
      </Select>
    );
  }

  return (
    <Select
      label={t("tenantLabel")}
      placeholder={t("selectTenantPlaceholder")}
      selectedKeys={
        selectedTenant ? new Set([selectedTenant.id.toString()]) : new Set()
      }
      onSelectionChange={handleSelectionChange}
      className="max-w-xs"
      classNames={{
        trigger: "bg-white/5 border-border hover:bg-white/10 transition-colors",
        value: "text-foreground group-data-[has-value=true]:text-foreground",
        popoverContent: "bg-card border-border text-foreground",
        label: "text-muted-foreground",
      }}
      listboxProps={{
        itemClasses: {
          base: [
            "text-muted-foreground",
            "data-[hover=true]:text-foreground",
            "data-[hover=true]:bg-default-100",
            "data-[selectable=true]:focus:bg-default-100",
          ],
        },
      }}
    >
      {tenants.map((tenant: { id: string | number; name: string }) => (
        <SelectItem key={tenant.id.toString()} textValue={tenant.name}>
          {tenant.name}
        </SelectItem>
      ))}
    </Select>
  );
}
```

Em `src/presentation/components/atoms/reserve/aside.tsx`, faça as sete substituições:

1. Linha 50, no import do store — remova `useDashboardScope,` da lista de imports (mantenha `useTenantStore`).
2. Linha 78 — apague `const dashboardScope = useDashboardScope();`.
3. Linha 101 — troque `if (dashboardScope === "global" && isSuperAdmin) {` por `if (isSuperAdmin) {`.
4. Linha 560 — troque o array de dependências `[dashboardScope, isSuperAdmin, t]` por `[isSuperAdmin, t]`.
5. Linha 737 — troque `href={dashboardScope === "global" && isSuperAdmin ? "/dashboard/global" : "/dashboard"}` por `href={isSuperAdmin ? "/dashboard/global" : "/dashboard"}`.
6. Linha 750 — troque `{dashboardScope === "global" && isSuperAdmin` por `{isSuperAdmin`.
7. Linha 799 — troque `{dashboardScope === "global" && isSuperAdmin` por `{isSuperAdmin`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- tenant-store`
Expected: PASS (5 testes)

Confirme que nenhum call site sobrou:

```bash
git grep -n "dashboardScope\|DashboardScope\|useIsGlobalDashboardScope" -- src
```
Expected: nenhuma saída.

Run: `npm run build`
Expected: build passa.

- [ ] **Step 5: Commit**

```bash
git add src/shared/stores/tenant-store.ts src/shared/stores/tenant-store.test.ts src/infraestructure/axios/get-auth-headers.ts src/shared/utils/get-tenant-id-server.ts src/shared/hooks/payments/use-payment-movements.ts src/presentation/components/organisms/tenant-selector.tsx src/presentation/components/atoms/reserve/aside.tsx
git commit -m "refactor: drop the dashboardScope concept with a versioned tenant-store migration"
```

---

### Task 3: `usePermissions` seguro para hidratação

Hoje `usePermissions()` chama `getCookie('session-role')` **durante o render**. No servidor não existe cookie de documento, então o primeiro render do cliente discorda do HTML do servidor: React descarta a árvore hidratada e o menu pisca. A correção é ler o cookie por `useSyncExternalStore`, com um `getServerSnapshot` que devolve `undefined` — assim o render de servidor e o primeiro render de cliente concordam, e o valor real entra no commit seguinte.

**Files:**
- Modify: `src/shared/hooks/use-permissions.ts` (arquivo inteiro)
- Test: `src/shared/hooks/use-permissions.test.tsx`

**Interfaces:**
- Consumes: `AdminRole` de `@/src/shared/domain/types/@access-management`
- Produces: `usePermissions()` (export default) → `{ role: AdminRole | undefined, isSuperAdmin, isOwner, isManager, isEditor, isViewer, canManageAdmins, canManageTenants, canViewReports, canManageCampaigns, canEditContent, canViewContent }` — mesma superfície de antes, agora estável na hidratação.

- [ ] **Step 1: Write the failing test**

`src/shared/hooks/use-permissions.test.tsx`:

```tsx
import { renderHook } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminRole } from "@/src/shared/domain/types/@access-management";
import usePermissions from "./use-permissions";

const getCookie = vi.fn();

vi.mock("cookies-next", () => ({
  getCookie: (...args: unknown[]) => getCookie(...args),
}));

function RoleProbe() {
  const { role, isSuperAdmin } = usePermissions();
  return (
    <span>
      {role ?? "sem papel"}:{isSuperAdmin ? "sim" : "nao"}
    </span>
  );
}

beforeEach(() => {
  getCookie.mockReset();
});

describe("usePermissions", () => {
  it("reads the session role from the cookie on the client", () => {
    getCookie.mockReturnValue(AdminRole.super_admin);

    const { result } = renderHook(() => usePermissions());

    expect(getCookie).toHaveBeenCalledWith("session-role");
    expect(result.current.role).toBe(AdminRole.super_admin);
    expect(result.current.isSuperAdmin).toBe(true);
    expect(result.current.canManageTenants).toBe(true);
  });

  it("renders no role on the server even when a cookie exists, so hydration matches", () => {
    getCookie.mockReturnValue(AdminRole.super_admin);

    expect(renderToStaticMarkup(<RoleProbe />)).toContain("sem papel:nao");
  });

  it("derives cumulative capabilities per role", () => {
    getCookie.mockReturnValue(AdminRole.editor);
    const editor = renderHook(() => usePermissions()).result.current;

    expect(editor.canEditContent).toBe(true);
    expect(editor.canViewContent).toBe(true);
    expect(editor.canManageAdmins).toBe(false);
    expect(editor.canViewReports).toBe(false);

    getCookie.mockReturnValue(AdminRole.viewer);
    const viewer = renderHook(() => usePermissions()).result.current;

    expect(viewer.canViewContent).toBe(true);
    expect(viewer.canEditContent).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- use-permissions`
Expected: FAIL no segundo teste, com `expected '<span>super_admin:sim</span>' to contain 'sem papel:nao'` — o hook lê o cookie no render de servidor.

- [ ] **Step 3: Write minimal implementation**

`src/shared/hooks/use-permissions.ts` (arquivo inteiro):

```ts
'use client'

import { useSyncExternalStore } from 'react';
import { getCookie } from 'cookies-next';
import { AdminRole } from '@/src/shared/domain/types/@access-management';

// Cookie nao emite evento de mudanca, entao a inscricao e um no-op. O que
// interessa aqui e o getServerSnapshot: ele garante que o render do servidor e o
// primeiro render do cliente concordem (sem papel), e o valor real do cookie
// entre no commit seguinte -- em vez de divergir na hidratacao.
const subscribe = () => () => {};
const getRole = () => getCookie('session-role') as AdminRole | undefined;
const getServerRole = () => undefined;

export default function usePermissions() {
    const role = useSyncExternalStore(subscribe, getRole, getServerRole);

    const isSuperAdmin = role === AdminRole.super_admin;
    const isOwner      = role === AdminRole.owner;
    const isManager    = role === AdminRole.manager;
    const isEditor     = role === AdminRole.editor;
    const isViewer     = role === AdminRole.viewer;

    const canManageAdmins    = isSuperAdmin || isManager;
    const canManageTenants   = isSuperAdmin;
    const canViewReports     = isSuperAdmin || isOwner;
    const canManageCampaigns = isSuperAdmin || isOwner || isManager;
    const canEditContent     = isSuperAdmin || isOwner || isManager || isEditor;
    const canViewContent     = isSuperAdmin || isOwner || isManager || isEditor || isViewer;

    return {
        role,
        isSuperAdmin,
        isOwner,
        isManager,
        isEditor,
        isViewer,
        canManageAdmins,
        canManageTenants,
        canViewReports,
        canManageCampaigns,
        canEditContent,
        canViewContent,
    };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- use-permissions`
Expected: PASS (3 testes)

- [ ] **Step 5: Commit**

```bash
git add src/shared/hooks/use-permissions.ts src/shared/hooks/use-permissions.test.tsx
git commit -m "fix: read the session role through useSyncExternalStore to keep hydration consistent"
```

---
### Task 4: `access-policy` — política de acesso com hierarquia e proteção contra auto-ação

Porta `createAccessPolicy` da Zarp: decide `can(permission)` a partir de um `Set` de permissões (com bypass por `"*"`) e `canActOnAdmin(targetRole, isSelf)`, que impede um admin de desativar/deletar a si mesmo e aplica a hierarquia de papel (super_admin > owner > manager > o resto). Também cria `admin-role.ts` como fonte única do tipo `AdminRoleValue` — na Zarp esse tipo vem de `modules/settings/domain/tenant-capabilities.ts`, mas isso faria `shared/` depender de `modules/`, o que a Fase 4 proíbe. Aqui a direção é invertida: `admin-role.ts` mora em `shared/domain/access-management/` e `tenant-capabilities.ts` (Task 6) importa dele.

**Files:**
- Create: `src/shared/domain/access-management/admin-role.ts`
- Create: `src/shared/domain/access-management/access-policy.ts`
- Test: `src/shared/domain/access-management/access-policy.test.ts`

**Interfaces:**
- Produces: `ADMIN_ROLE_VALUES: readonly AdminRoleValue[]`, `AdminRoleValue = "super_admin" | "owner" | "manager" | "editor" | "viewer"`, `normalizeAdminRole(value: unknown): AdminRoleValue`, `AccessPermission` (union de strings `recurso.ação`), `AccessPolicy` (`{ role, ready, can(permission), canActOnAdmin(targetRole, isSelf) }`), `createAccessPolicy({ permissions?, role?, ready }): AccessPolicy`

- [ ] **Step 1: Write the failing test**

`src/shared/domain/access-management/access-policy.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createAccessPolicy } from "./access-policy";

describe("createAccessPolicy", () => {
  it("denies writes until capabilities are ready", () => {
    const policy = createAccessPolicy({
      permissions: new Set(["*"]),
      role: "super_admin",
      ready: false,
    });

    expect(policy.can("tenants.update")).toBe(false);
  });

  it("grants wildcard access without checking master-tenant scope", () => {
    const policy = createAccessPolicy({
      permissions: new Set(["*"]),
      role: "super_admin",
      ready: true,
    });

    expect(policy.can("tenants.delete")).toBe(true);
    expect(policy.can("users.update")).toBe(true);
  });

  it("keeps read, update and lifecycle permissions independent", () => {
    const policy = createAccessPolicy({
      permissions: new Set(["admins.read", "admins.update"]),
      role: "manager",
      ready: true,
    });

    expect(policy.can("admins.read")).toBe(true);
    expect(policy.can("admins.update")).toBe(true);
    expect(policy.can("admins.deactivate")).toBe(false);
  });

  it("protects the current administrator from destructive self-actions", () => {
    const policy = createAccessPolicy({
      permissions: new Set(["*"]),
      role: "super_admin",
      ready: true,
    });

    expect(policy.canActOnAdmin("super_admin", true)).toBe(false);
    expect(policy.canActOnAdmin("manager", false)).toBe(true);
  });

  it("keeps non-super-admin actions below the target hierarchy", () => {
    const owner = createAccessPolicy({
      permissions: new Set(["admins.update"]),
      role: "owner",
      ready: true,
    });
    const manager = createAccessPolicy({
      permissions: new Set(["admins.update"]),
      role: "manager",
      ready: true,
    });

    expect(owner.canActOnAdmin("super_admin", false)).toBe(false);
    expect(owner.canActOnAdmin("manager", false)).toBe(true);
    expect(manager.canActOnAdmin("owner", false)).toBe(false);
    expect(manager.canActOnAdmin("editor", false)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- access-policy`
Expected: FAIL com `Failed to resolve import "./access-policy"`

- [ ] **Step 3: Write minimal implementation**

`src/shared/domain/access-management/admin-role.ts`:

```ts
export const ADMIN_ROLE_VALUES = [
  "super_admin",
  "owner",
  "manager",
  "editor",
  "viewer",
] as const;

export type AdminRoleValue = (typeof ADMIN_ROLE_VALUES)[number];

export function normalizeAdminRole(value: unknown): AdminRoleValue {
  return typeof value === "string" &&
    (ADMIN_ROLE_VALUES as readonly string[]).includes(value)
    ? (value as AdminRoleValue)
    : "viewer";
}
```

`src/shared/domain/access-management/access-policy.ts`:

```ts
import type { AdminRoleValue } from "./admin-role";

export type AccessPermission =
  | "tenants.create" | "tenants.read" | "tenants.update"
  | "tenants.admin.read" | "tenants.admin.assign"
  | "tenants.admin.remove" | "tenants.admin.role.update"
  | "tenants.activate" | "tenants.deactivate" | "tenants.delete"
  | "tenants.domains.manage-regex" | "settings.modules.manage"
  | "admins.create" | "admins.read" | "admins.update"
  | "admins.role.update" | "admins.activate"
  | "admins.deactivate" | "admins.delete"
  | "users.read" | "users.update" | "users.deactivate" | "users.delete";

export interface AccessPolicy {
  readonly role: AdminRoleValue;
  readonly ready: boolean;
  can(permission: AccessPermission): boolean;
  canActOnAdmin(targetRole: AdminRoleValue, isSelf: boolean): boolean;
}

export function createAccessPolicy({
  permissions = new Set<string>(),
  role = "viewer",
  ready,
}: {
  permissions?: ReadonlySet<string>;
  role?: AdminRoleValue;
  ready: boolean;
}): AccessPolicy {
  return {
    role,
    ready,
    can: (permission) => ready && (permissions.has("*") || permissions.has(permission)),
    canActOnAdmin: (targetRole, isSelf) => {
      if (!ready || isSelf) return false;
      if (role === "super_admin") return true;
      if (role === "owner") return targetRole !== "super_admin";
      if (role === "manager") return targetRole !== "super_admin" && targetRole !== "owner";

      return false;
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- access-policy`
Expected: PASS (5 testes)

- [ ] **Step 5: Commit**

```bash
git add src/shared/domain/access-management/admin-role.ts src/shared/domain/access-management/access-policy.ts src/shared/domain/access-management/access-policy.test.ts
git commit -m "feat: add createAccessPolicy with role hierarchy and self-action protection"
```

---

### Task 5: `tenant-modules` — catálogo de módulos gateáveis do Reserve

Fundação para `tenant-capabilities` (Task 6) e `navigation`/`dashboard-visibility` (Tasks 8–9). A Zarp usa 14 módulos (`courses`, `brands`, `cnpjs`, `journals`, `pi-bot` incluídos, que são domínio exclusivo dela — decisão #6 do porte). O catálogo do Reserve reflete os módulos de backend que existem hoje (`reserve-leads`, `reserve-cms`, `reserve-mailer`, `reserve-coupons`, `reserve-reports`, `reserve-notifications`, `reserve-subscriptions`/`reserve-b2b-payments`/`reserve-b2c-*`, o domínio de hotel do client-portal) mais `metrics`, que não tem nav próprio mas serve de módulo-fallback para `dashboard-visibility` (Task 9), do mesmo jeito que a Zarp trata `courses`/`brands` sem nav.

**Files:**
- Create: `src/modules/settings/domain/tenant-modules.ts`
- Test: `src/modules/settings/domain/tenant-modules.test.ts`

**Interfaces:**
- Produces: `GATEABLE_MODULES: readonly GateableModule[]`, `GateableModule` (union), `ModuleFlags = Record<GateableModule, boolean>`, `normalizeModuleFlags(input: unknown): ModuleFlags`

- [ ] **Step 1: Write the failing test**

`src/modules/settings/domain/tenant-modules.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { GATEABLE_MODULES, normalizeModuleFlags } from "./tenant-modules";

describe("GATEABLE_MODULES", () => {
  it("lists exactly the modules the Reserve backend gates today", () => {
    expect(GATEABLE_MODULES).toEqual([
      "leads",
      "cms",
      "mailer",
      "payments",
      "coupons",
      "reports",
      "notifications",
      "hotel",
      "metrics",
    ]);
  });
});

describe("normalizeModuleFlags", () => {
  it("defaults every module to enabled when nothing is disabled explicitly", () => {
    const flags = normalizeModuleFlags({});
    expect(flags.leads).toBe(true);
    expect(flags.hotel).toBe(true);
    expect(flags.metrics).toBe(true);
  });

  it("reads flags from a values-wrapped patch shape", () => {
    const flags = normalizeModuleFlags({ values: { coupons: false } });
    expect(flags.coupons).toBe(false);
    expect(flags.leads).toBe(true);
  });

  it("reads flags directly when not wrapped in values", () => {
    const flags = normalizeModuleFlags({ mailer: false, hotel: false });
    expect(flags.mailer).toBe(false);
    expect(flags.hotel).toBe(false);
    expect(flags.reports).toBe(true);
  });

  it("defaults defensively for null or non-object input", () => {
    expect(normalizeModuleFlags(null).leads).toBe(true);
    expect(normalizeModuleFlags(undefined).leads).toBe(true);
    expect(normalizeModuleFlags("not an object").leads).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- tenant-modules`
Expected: FAIL com `Failed to resolve import "./tenant-modules"`

- [ ] **Step 3: Write minimal implementation**

`src/modules/settings/domain/tenant-modules.ts`:

```ts
/**
 * Catalogo de modulos gateaveis do Reserve. Distinto do catalogo da Zarp:
 * nao inclui "courses"/"brands"/"cnpjs"/"journals" (dominio exclusivo da Zarp),
 * inclui "hotel" (dominio exclusivo do Reserve: client-portal / hotel-portal).
 * "metrics" nao tem item de navegacao proprio -- existe so como modulo-fallback
 * para dashboard-visibility.ts, no mesmo papel que "courses"/"brands" tem na Zarp.
 */
export const GATEABLE_MODULES = [
  "leads",
  "cms",
  "mailer",
  "payments",
  "coupons",
  "reports",
  "notifications",
  "hotel",
  "metrics",
] as const;

export type GateableModule = (typeof GATEABLE_MODULES)[number];
export type ModuleFlags = Record<GateableModule, boolean>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function normalizeModuleFlags(input: unknown): ModuleFlags {
  const record =
    isRecord(input) && isRecord(input.values)
      ? input.values
      : isRecord(input)
        ? input
        : {};
  return Object.fromEntries(
    GATEABLE_MODULES.map((module) => [
      module,
      typeof record[module] === "boolean" ? record[module] : true,
    ]),
  ) as ModuleFlags;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- tenant-modules`
Expected: PASS (5 testes)

- [ ] **Step 5: Commit**

```bash
git add src/modules/settings/domain/tenant-modules.ts src/modules/settings/domain/tenant-modules.test.ts
git commit -m "feat: add the Reserve gateable-module catalog and flag normalizer"
```

---

### Task 6: `tenant-capabilities` — normalização defensiva do payload

Porta `normalizeTenantCapabilities` da Zarp. Este é o ponto único que transforma a resposta crua de `GET /api/tenant-capabilities` (que ainda não existe no backend do Reserve — é entregável da Fase 3) num objeto tipado e seguro contra payload malformado: tipo de tenant desconhecido cai em `"COMMON"`, papel desconhecido cai em `"viewer"`, módulo sem resolução cai em habilitado (`true`), permissões não-string são descartadas.

**Files:**
- Create: `src/modules/settings/domain/tenant-capabilities.ts`
- Test: `src/modules/settings/domain/tenant-capabilities.test.ts`

**Interfaces:**
- Consumes: `GATEABLE_MODULES`, `GateableModule`, `ModuleFlags` de `./tenant-modules` (Task 5); `AdminRoleValue` de `@/src/shared/domain/access-management/admin-role` (Task 4)
- Produces: `TenantType = "MASTER" | "COMMON" | "EDUCATIONAL"`, `ModulePolicySource = "master" | "tenantOverride" | "tenantTypePolicy"`, `ModulePolicyResolution`, `TenantCapabilities`, `normalizeTenantCapabilities(raw: unknown): TenantCapabilities`

- [ ] **Step 1: Write the failing test**

`src/modules/settings/domain/tenant-capabilities.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeTenantCapabilities } from "./tenant-capabilities";

describe("normalizeTenantCapabilities", () => {
  it("normalizes a well-formed MASTER response", () => {
    const raw = {
      tenantId: "tenant-1",
      tenantType: "MASTER",
      isMasterTenant: true,
      role: "super_admin",
      modules: {
        leads: { enabled: true, source: "master" },
        cms: { enabled: true, source: "master" },
      },
      permissions: ["*"],
    };
    const result = normalizeTenantCapabilities(raw);
    expect(result.tenantType).toBe("MASTER");
    expect(result.isMasterTenant).toBe(true);
    expect(result.role).toBe("super_admin");
    expect(result.moduleResolutions.leads).toEqual({ enabled: true, source: "master" });
    expect(result.modules.leads).toBe(true);
    expect(result.permissions.has("*")).toBe(true);
  });

  it("defaults defensively when fields are missing", () => {
    const result = normalizeTenantCapabilities({});
    expect(result.tenantType).toBe("COMMON");
    expect(result.isMasterTenant).toBe(false);
    expect(result.role).toBe("viewer");
    expect(result.modules.leads).toBe(true);
    expect(result.permissions.size).toBe(0);
  });

  it("defaults defensively when given null/non-object input", () => {
    expect(normalizeTenantCapabilities(null).tenantType).toBe("COMMON");
    expect(normalizeTenantCapabilities(undefined).tenantType).toBe("COMMON");
    expect(normalizeTenantCapabilities("not an object").tenantType).toBe("COMMON");
  });

  it("derives a module flag from resolution.enabled for every GATEABLE_MODULES entry, defaulting missing ones to true", () => {
    const result = normalizeTenantCapabilities({
      modules: { leads: { enabled: false, source: "tenantOverride" } },
    });
    expect(result.modules.leads).toBe(false);
    expect(result.modules.cms).toBe(true);
    expect(result.modules.payments).toBe(true);
    expect(result.modules.hotel).toBe(true);
  });

  it("filters non-string entries out of permissions", () => {
    const result = normalizeTenantCapabilities({ permissions: ["leads.read", 42, null, "cms.article.read"] });
    expect([...result.permissions].sort()).toEqual(["cms.article.read", "leads.read"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- tenant-capabilities`
Expected: FAIL com `Failed to resolve import "./tenant-capabilities"`

- [ ] **Step 3: Write minimal implementation**

`src/modules/settings/domain/tenant-capabilities.ts`:

```ts
import type { AdminRoleValue } from "@/src/shared/domain/access-management/admin-role";
import { GATEABLE_MODULES, type GateableModule, type ModuleFlags } from "./tenant-modules";

export type TenantType = "MASTER" | "COMMON" | "EDUCATIONAL";
export type ModulePolicySource = "master" | "tenantOverride" | "tenantTypePolicy";

export interface ModulePolicyResolution {
  enabled: boolean;
  source: ModulePolicySource;
}

export interface TenantCapabilities {
  tenantId: string;
  tenantType: TenantType;
  isMasterTenant: boolean;
  role: AdminRoleValue;
  /** Resolucao crua por modulo, incluindo a origem da heranca. */
  moduleResolutions: Partial<Record<GateableModule, ModulePolicyResolution>>;
  /** Visao no formato ModuleFlags (Record<GateableModule, boolean>) para os filtros de nav/dashboard. */
  modules: ModuleFlags;
  permissions: ReadonlySet<string>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const VALID_TENANT_TYPES: readonly TenantType[] = ["MASTER", "COMMON", "EDUCATIONAL"];
const VALID_ROLES: readonly AdminRoleValue[] = ["super_admin", "owner", "manager", "editor", "viewer"];
const VALID_SOURCES: readonly ModulePolicySource[] = ["master", "tenantOverride", "tenantTypePolicy"];

function normalizeTenantType(value: unknown): TenantType {
  return typeof value === "string" && (VALID_TENANT_TYPES as readonly string[]).includes(value)
    ? (value as TenantType)
    : "COMMON";
}

function normalizeRole(value: unknown): AdminRoleValue {
  return typeof value === "string" && (VALID_ROLES as readonly string[]).includes(value)
    ? (value as AdminRoleValue)
    : "viewer";
}

function normalizeModuleResolutions(value: unknown): Partial<Record<GateableModule, ModulePolicyResolution>> {
  if (!isRecord(value)) return {};
  const result: Partial<Record<GateableModule, ModulePolicyResolution>> = {};
  for (const module of GATEABLE_MODULES) {
    const entry = value[module];
    if (!isRecord(entry)) continue;
    const source = typeof entry.source === "string" && (VALID_SOURCES as readonly string[]).includes(entry.source)
      ? (entry.source as ModulePolicySource)
      : "tenantTypePolicy";
    result[module] = { enabled: entry.enabled === true, source };
  }
  return result;
}

function toModuleFlags(resolutions: Partial<Record<GateableModule, ModulePolicyResolution>>): ModuleFlags {
  return Object.fromEntries(
    GATEABLE_MODULES.map((module) => [module, resolutions[module]?.enabled ?? true]),
  ) as ModuleFlags;
}

function normalizePermissions(value: unknown): ReadonlySet<string> {
  return new Set(Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : []);
}

export function normalizeTenantCapabilities(raw: unknown): TenantCapabilities {
  const record = isRecord(raw) ? raw : {};
  const moduleResolutions = normalizeModuleResolutions(record.modules);
  return {
    tenantId: typeof record.tenantId === "string" ? record.tenantId : "",
    tenantType: normalizeTenantType(record.tenantType),
    isMasterTenant: record.isMasterTenant === true,
    role: normalizeRole(record.role),
    moduleResolutions,
    modules: toModuleFlags(moduleResolutions),
    permissions: normalizePermissions(record.permissions),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- tenant-capabilities`
Expected: PASS (5 testes)

- [ ] **Step 5: Commit**

```bash
git add src/modules/settings/domain/tenant-capabilities.ts src/modules/settings/domain/tenant-capabilities.test.ts
git commit -m "feat: normalize the tenant-capabilities payload defensively"
```

---

### Task 7: `tenant-capabilities-provider` — contexto de capabilities do tenant selecionado

Porta o provider da Zarp que busca `GET /api/tenant-capabilities` via React Query (chave incluindo o tenant selecionado, então a Task 1 já garante que trocar de tenant não vaza capabilities antigas) e expõe `hasPermission`, `policy` (via `createAccessPolicy`, Task 4) e `refreshCapabilities`. Diferente da Zarp — que consome um serviço gerado pelo codegen do OpenAPI (`tenantManagementService.tenantCapabilitiesGet()`, escopo da Fase 4) — aqui a chamada HTTP é um adaptador fino próprio, para não depender de geração de código que é escopo de outra fase.

**Files:**
- Create: `src/modules/settings/infrastructure/tenant-capabilities-adapter.ts`
- Create: `src/modules/settings/presentation/hooks/tenant-capabilities-provider.tsx`
- Test: `src/modules/settings/presentation/hooks/tenant-capabilities-provider.test.tsx`

**Interfaces:**
- Consumes: `useSelectedTenantId` de `@/src/shared/stores/tenant-store` (Task 2); `normalizeTenantCapabilities`, `TenantCapabilities` de `../../domain/tenant-capabilities` (Task 6); `createAccessPolicy`, `AccessPolicy` de `@/src/shared/domain/access-management/access-policy` (Task 4)
- Produces: `fetchTenantCapabilities(): Promise<unknown>`, `TenantCapabilitiesProvider({ children })`, `useTenantCapabilities(): TenantCapabilities & { hasPermission(permission: string): boolean; policy: AccessPolicy; refreshCapabilities(): Promise<TenantCapabilities | undefined>; isLoading: boolean; isError: boolean }`

- [ ] **Step 1: Write the failing test**

`src/modules/settings/presentation/hooks/tenant-capabilities-provider.test.tsx`:

```tsx
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TenantCapabilitiesProvider, useTenantCapabilities } from "./tenant-capabilities-provider";

const fetchTenantCapabilities = vi.fn();

vi.mock("../../infrastructure/tenant-capabilities-adapter", () => ({
  fetchTenantCapabilities: (...args: unknown[]) => fetchTenantCapabilities(...args),
}));

let selectedTenantId: string | null = "tenant-1";

vi.mock("@/src/shared/stores/tenant-store", () => ({
  useSelectedTenantId: () => selectedTenantId,
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return (
    <QueryClientProvider client={client}>
      <TenantCapabilitiesProvider>{children}</TenantCapabilitiesProvider>
    </QueryClientProvider>
  );
}

describe("useTenantCapabilities", () => {
  it("fetches and normalizes capabilities for the selected tenant", async () => {
    selectedTenantId = "tenant-1";
    fetchTenantCapabilities.mockResolvedValueOnce({
      tenantId: "tenant-1",
      tenantType: "MASTER",
      isMasterTenant: true,
      role: "super_admin",
      modules: { leads: { enabled: true, source: "master" } },
      permissions: ["*"],
    });

    const { result } = renderHook(() => useTenantCapabilities(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isMasterTenant).toBe(true);
    expect(result.current.tenantType).toBe("MASTER");
    expect(result.current.hasPermission("anything.at.all")).toBe(true);
  });

  it("does not fetch when no tenant is selected", async () => {
    selectedTenantId = null;
    fetchTenantCapabilities.mockClear();

    const { result } = renderHook(() => useTenantCapabilities(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchTenantCapabilities).not.toHaveBeenCalled();
    expect(result.current.isMasterTenant).toBe(false);
  });

  it("hasPermission checks the resolved permission set for non-wildcard roles", async () => {
    selectedTenantId = "tenant-2";
    fetchTenantCapabilities.mockResolvedValueOnce({
      tenantId: "tenant-2",
      tenantType: "COMMON",
      isMasterTenant: false,
      role: "manager",
      modules: {},
      permissions: ["leads.read"],
    });

    const { result } = renderHook(() => useTenantCapabilities(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasPermission("leads.read")).toBe(true);
    expect(result.current.hasPermission("cms.article.read")).toBe(false);
  });

  it("exposes a ready policy without inferring authorization from master-tenant scope", async () => {
    selectedTenantId = "tenant-master";
    fetchTenantCapabilities.mockResolvedValueOnce({
      tenantId: "tenant-master",
      tenantType: "MASTER",
      isMasterTenant: true,
      role: "viewer",
      modules: {},
      permissions: [],
    });

    const { result } = renderHook(() => useTenantCapabilities(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.policy.ready).toBe(true);
    expect(result.current.policy.can("tenants.update" as never)).toBe(false);
  });

  it("refreshes and normalizes capabilities on demand", async () => {
    selectedTenantId = "tenant-3";
    fetchTenantCapabilities
      .mockResolvedValueOnce({
        tenantId: "tenant-3", tenantType: "COMMON", isMasterTenant: false,
        role: "viewer", modules: {}, permissions: [],
      })
      .mockResolvedValueOnce({
        tenantId: "tenant-3", tenantType: "COMMON", isMasterTenant: false,
        role: "owner", modules: {}, permissions: ["admins.update"],
      });

    const { result } = renderHook(() => useTenantCapabilities(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const capabilities = await result.current.refreshCapabilities();

    expect(capabilities?.role).toBe("owner");
    expect(capabilities?.permissions.has("admins.update")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- tenant-capabilities-provider`
Expected: FAIL com `Failed to resolve import "./tenant-capabilities-provider"`

- [ ] **Step 3: Write minimal implementation**

`src/modules/settings/infrastructure/tenant-capabilities-adapter.ts`:

```ts
import { apiClient } from "@/src/infraestructure/axios/api";

export async function fetchTenantCapabilities(): Promise<unknown> {
  const response = await apiClient.get("/api/tenant-capabilities");
  return response.data;
}
```

`src/modules/settings/presentation/hooks/tenant-capabilities-provider.tsx`:

```tsx
"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  normalizeTenantCapabilities,
  type TenantCapabilities,
} from "../../domain/tenant-capabilities";
import { fetchTenantCapabilities } from "../../infrastructure/tenant-capabilities-adapter";

import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";
import {
  createAccessPolicy,
  type AccessPolicy,
} from "@/src/shared/domain/access-management/access-policy";

const EMPTY_CAPABILITIES = normalizeTenantCapabilities({});

interface TenantCapabilitiesContextValue extends TenantCapabilities {
  hasPermission: (permission: string) => boolean;
  policy: AccessPolicy;
  refreshCapabilities: () => Promise<TenantCapabilities | undefined>;
  isLoading: boolean;
  isError: boolean;
}

const TenantCapabilitiesContext = createContext<TenantCapabilitiesContextValue>({
  ...EMPTY_CAPABILITIES,
  hasPermission: () => false,
  policy: createAccessPolicy({ ready: false }),
  refreshCapabilities: async () => undefined,
  isLoading: false,
  isError: false,
});

export function TenantCapabilitiesProvider({ children }: { children: ReactNode }) {
  const tenantId = useSelectedTenantId();
  const query = useQuery({
    queryKey: ["tenant-capabilities", tenantId],
    queryFn: fetchTenantCapabilities,
    enabled: Boolean(tenantId),
    staleTime: 60_000,
  });

  const value = useMemo<TenantCapabilitiesContextValue>(() => {
    const capabilities = query.data ? normalizeTenantCapabilities(query.data) : EMPTY_CAPABILITIES;
    const isLoading = query.isFetching;
    const isError = query.isError;

    return {
      ...capabilities,
      hasPermission: (permission: string) =>
        capabilities.permissions.has("*") || capabilities.permissions.has(permission),
      policy: createAccessPolicy({
        permissions: capabilities.permissions,
        role: capabilities.role,
        ready: Boolean(tenantId) && !isLoading && !isError,
      }),
      refreshCapabilities: async () => {
        const result = await query.refetch();

        return result.data ? normalizeTenantCapabilities(result.data) : undefined;
      },
      isLoading,
      isError,
    };
  }, [query.data, query.isError, query.isFetching, query.refetch, tenantId]);

  return (
    <TenantCapabilitiesContext.Provider value={value}>
      {children}
    </TenantCapabilitiesContext.Provider>
  );
}

export const useTenantCapabilities = () => useContext(TenantCapabilitiesContext);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- tenant-capabilities-provider`
Expected: PASS (5 testes)

- [ ] **Step 5: Commit**

```bash
git add src/modules/settings/infrastructure/tenant-capabilities-adapter.ts src/modules/settings/presentation/hooks/tenant-capabilities-provider.tsx src/modules/settings/presentation/hooks/tenant-capabilities-provider.test.tsx
git commit -m "feat: add the tenant-capabilities context provider"
```

---

### Task 8: `navigation` — menu filtrado por módulo e por permissão

Porta `filterNavigationByModuleFlags` e `filterNavigationByPermissions` da Zarp, com os ids de navegação reais do Reserve (levantados em `src/presentation/components/atoms/reserve/aside.tsx`, ids como `leads`, `leads-menu`, `cms`, `articles`, `notifications`, `payments-menu`, `hotel-menu`, etc. — ver mapa completo no código abaixo). Um item de grupo (`subItems`) sobrevive se ao menos um filho sobrevive; um item de folha sem módulo/permissão mapeado (como `dashboard` ou `access-management`) nunca é removido pelo filtro de módulo, só pelo de permissão quando ele tem uma entrada em `NAV_READ_PERMISSIONS`.

**Files:**
- Create: `src/modules/settings/domain/navigation.ts`
- Test: `src/modules/settings/domain/navigation.test.ts`

**Interfaces:**
- Consumes: `GATEABLE_MODULES`, `GateableModule`, `ModuleFlags` de `./tenant-modules` (Task 5)
- Produces: `ModuleNavItem { id: string; subItems?: ModuleNavItem[] }`, `MODULE_NAV_IDS: Record<GateableModule, readonly string[]>`, `filterNavigationByModuleFlags<T>(items, flags?): T[]`, `filterNavigationByPermissions<T>(items, permissions?): T[]`, `getUsableModuleFlags(flags, isLoading, isError)`, `isTenantSettingsAvailable(tenantId)`

- [ ] **Step 1: Write the failing test**

`src/modules/settings/domain/navigation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  filterNavigationByModuleFlags,
  filterNavigationByPermissions,
  getUsableModuleFlags,
  isTenantSettingsAvailable,
  type ModuleNavItem,
} from "./navigation";
import { normalizeModuleFlags } from "./tenant-modules";

const nav: ModuleNavItem[] = [
  { id: "dashboard" },
  { id: "settings" },
  { id: "access-management" },
  {
    id: "leads-menu",
    subItems: [
      { id: "leads" },
      { id: "lead-collections" },
      { id: "appointments" },
      { id: "abandoned-carts" },
    ],
  },
  {
    id: "cms",
    subItems: [
      { id: "blogs" },
      { id: "articles" },
      { id: "authors" },
      { id: "collections" },
      { id: "media" },
    ],
  },
  {
    id: "payments-menu",
    subItems: [
      { id: "payments-products" },
      { id: "payments-subscriptions" },
      { id: "payments-config" },
      { id: "coupons" },
    ],
  },
  { id: "hotel-menu", subItems: [{ id: "hotel-overview" }, { id: "hotel-config" }] },
];

describe("module navigation", () => {
  it("keeps mixed groups when at least one child is enabled", () => {
    const flags = normalizeModuleFlags({ cms: false, payments: false, coupons: true, leads: false });
    const result = filterNavigationByModuleFlags(nav, flags);

    expect(result.some((item) => item.id === "cms")).toBe(false);
    expect(
      result.find((item) => item.id === "payments-menu")?.subItems?.map((item) => item.id),
    ).toEqual(["coupons"]);
    expect(result.some((item) => item.id === "leads-menu")).toBe(false);
    expect(result.some((item) => item.id === "access-management")).toBe(true);
  });

  it("fails closed for gated items while flags are loading or errored", () => {
    const loaded = normalizeModuleFlags({ leads: true });
    expect(getUsableModuleFlags(loaded, true, false)).toBeUndefined();
    expect(getUsableModuleFlags(loaded, false, true)).toBeUndefined();
    expect(
      filterNavigationByModuleFlags(nav, undefined).map((item) => item.id),
    ).toEqual(["dashboard", "settings", "access-management"]);
  });

  it("only exposes tenant settings when a tenant is selected", () => {
    expect(isTenantSettingsAvailable(null)).toBe(false);
    expect(isTenantSettingsAvailable("tenant-1")).toBe(true);
  });

  it("removes tenant navigation that the admin cannot read", () => {
    const result = filterNavigationByPermissions(nav, new Set(["leads.read"]));
    expect(result.some((item) => item.id === "dashboard")).toBe(false);
    expect(
      result.find((item) => item.id === "leads-menu")?.subItems?.map((item) => item.id),
    ).toEqual(["leads"]);
    expect(result.some((item) => item.id === "access-management")).toBe(true);
  });

  it("orders the CMS journey and applies its read permissions", () => {
    const flags = normalizeModuleFlags({ cms: true });
    const enabled = filterNavigationByModuleFlags(nav, flags);
    const allowed = filterNavigationByPermissions(
      enabled,
      new Set(["cms.article.read", "cms.author.read"]),
    );

    expect(
      allowed.find((item) => item.id === "cms")?.subItems?.map((item) => item.id),
    ).toEqual(["articles", "authors"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- navigation`
Expected: FAIL com `Failed to resolve import "./navigation"`

- [ ] **Step 3: Write minimal implementation**

`src/modules/settings/domain/navigation.ts`:

```ts
import { GATEABLE_MODULES, type GateableModule, type ModuleFlags } from "./tenant-modules";

export interface ModuleNavItem {
  id: string;
  subItems?: ModuleNavItem[];
}

export const MODULE_NAV_IDS: Record<GateableModule, readonly string[]> = {
  leads: ["leads", "leads-menu", "lead-collections", "appointments", "abandoned-carts"],
  cms: ["cms", "blogs", "articles", "authors", "collections", "media"],
  mailer: ["email"],
  payments: ["payments-menu", "payments-products", "payments-subscriptions", "payments-config"],
  coupons: ["coupons"],
  reports: ["reports"],
  notifications: ["notifications", "notifications-global"],
  hotel: [
    "hotel-menu", "hotel-overview", "hotel-config", "hotel-campaigns",
    "hotel-ota", "hotel-reports", "hotel-site", "hotel-whatsapp-links",
  ],
  metrics: [],
};

const requiredModuleById = new Map(
  GATEABLE_MODULES.flatMap((module) =>
    MODULE_NAV_IDS[module].map((id) => [id, module] as const),
  ),
);

export function filterNavigationByModuleFlags<T extends ModuleNavItem>(
  items: readonly T[],
  flags?: ModuleFlags,
): T[] {
  return items.flatMap((item) => {
    const requiredModule = requiredModuleById.get(item.id);
    if (requiredModule && flags?.[requiredModule] !== true) return [];
    const subItems = item.subItems
      ? filterNavigationByModuleFlags(item.subItems, flags)
      : undefined;
    if (item.subItems && !subItems?.length) return [];
    return [{ ...item, ...(subItems ? { subItems } : {}) } as T];
  });
}

const NAV_READ_PERMISSIONS: Record<string, readonly string[]> = {
  dashboard: ["metrics.dashboard.read"],
  leads: ["leads.read"],
  "lead-collections": ["leads.collection.read"],
  appointments: ["appointments.read"],
  "abandoned-carts": ["leads.read"],
  blogs: ["cms.blog.read"],
  articles: ["cms.article.read"],
  authors: ["cms.author.read"],
  collections: ["cms.media-collection.read"],
  media: ["cms.media-asset.read"],
  email: ["mailer.campaign.manage"],
  "payments-products": ["payments.read"],
  "payments-subscriptions": ["payments.read"],
  "payments-config": ["payments.read"],
  coupons: ["coupons.read"],
  reports: ["reports.read"],
  notifications: ["notifications.read"],
  admins: ["admins.read"],
  users: ["users.read"],
  tenants: ["tenants.read"],
  "hotel-overview": ["hotel.read"],
  "hotel-config": ["hotel.read"],
  "hotel-campaigns": ["hotel.read"],
  "hotel-ota": ["hotel.read"],
  "hotel-reports": ["hotel.read"],
  "hotel-site": ["hotel.read"],
  "hotel-whatsapp-links": ["hotel.read"],
};

export function filterNavigationByPermissions<T extends ModuleNavItem>(
  items: readonly T[],
  permissions?: ReadonlySet<string>,
): T[] {
  return items.flatMap((item) => {
    const required = NAV_READ_PERMISSIONS[item.id];
    if (required && !permissions?.has("*") && !required.some((permission) => permissions?.has(permission))) {
      return [];
    }
    const subItems = item.subItems
      ? filterNavigationByPermissions(item.subItems, permissions)
      : undefined;
    if (item.subItems && !subItems?.length) return [];
    return [{ ...item, ...(subItems ? { subItems } : {}) } as T];
  });
}

export const getUsableModuleFlags = (
  flags: ModuleFlags | undefined,
  isLoading: boolean,
  isError: boolean,
) => (isLoading || isError ? undefined : flags);

export const isTenantSettingsAvailable = (
  tenantId: string | null | undefined,
) => Boolean(tenantId);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- navigation`
Expected: PASS (5 testes)

- [ ] **Step 5: Commit**

```bash
git add src/modules/settings/domain/navigation.ts src/modules/settings/domain/navigation.test.ts
git commit -m "feat: filter dashboard navigation by module flags and read permissions"
```

---

### Task 9: `dashboard-visibility` — filtro de métricas do dashboard por módulo e permissão

Porta `canViewMetric`/`canViewMetricGroup`/`filterDashboardGroups` da Zarp. Reserve não tem tenant educacional nem métricas cruzadas de curso, então o parâmetro `tenantType`/`courses` da Zarp é descartado — aqui a regra cruzada relevante é `leads` × `payments` (taxa de conversão de lead para pagante), que já existe no domínio do Reserve. `MetricGroupResponse`/`MetricValueResponse` já existem em `src/shared/domain/types/@stats.ts` com o mesmo formato usado pela Zarp — nenhuma adaptação de tipo necessária.

**Files:**
- Create: `src/modules/settings/domain/dashboard-visibility.ts`
- Test: `src/modules/settings/domain/dashboard-visibility.test.ts`

**Interfaces:**
- Consumes: `MetricGroupResponse`, `MetricValueResponse` de `@/src/shared/domain/types/@stats`; `GateableModule`, `ModuleFlags` de `./tenant-modules` (Task 5)
- Produces: `metricModuleFor(group): GateableModule | undefined`, `canViewMetric(group, metric, flags, permissions, isMasterTenant?): boolean`, `canViewMetricGroup(group, flags, permissions, isMasterTenant?): boolean`, `filterDashboardGroups(groups, flags, permissions, isMasterTenant?): MetricGroupResponse[]`

- [ ] **Step 1: Write the failing test**

`src/modules/settings/domain/dashboard-visibility.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeModuleFlags } from "./tenant-modules";
import { canViewMetric, canViewMetricGroup, filterDashboardGroups, metricModuleFor } from "./dashboard-visibility";

describe("dashboard metric visibility", () => {
  it("maps a hotel metric group to the hotel module", () => {
    expect(metricModuleFor({ moduleKey: "hotel-occupancy" })).toBe("hotel");
  });

  it("hides metrics from disabled modules even for a super admin", () => {
    const flags = normalizeModuleFlags({ hotel: false });
    expect(
      canViewMetricGroup(
        { moduleKey: "hotel", metrics: [{ key: "hotel.occupancy_rate" }] },
        flags,
        new Set(["*"]),
        true,
      ),
    ).toBe(false);
  });

  it("requires a matching read permission for tenant admins", () => {
    const flags = normalizeModuleFlags({ leads: true, cms: true });
    const permissions = new Set(["leads.read", "metrics.dashboard.read"]);
    expect(canViewMetricGroup({ moduleKey: "leads", metrics: [{ key: "leads.total" }] }, flags, permissions)).toBe(true);
    expect(canViewMetricGroup({ moduleKey: "cms", metrics: [{ key: "cms.articles.total" }] }, flags, permissions)).toBe(false);
  });

  it("filters mixed conversion metrics at metric level", () => {
    const flags = normalizeModuleFlags({ leads: true, payments: false });
    const permissions = new Set(["metrics.dashboard.read", "leads.read"]);
    const groups = filterDashboardGroups(
      [{
        moduleKey: "conversions",
        label: "Conversoes",
        fetchedAt: "2026-07-21",
        metrics: [
          { key: "conversions.leads_created", label: "Leads", value: 3 },
          { key: "conversions.revenue", label: "Receita", value: 100 },
        ],
      }],
      flags,
      permissions,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].moduleKey).toBe("leads");
    expect(groups[0].metrics.map((metric) => metric.key)).toEqual(["conversions.leads_created"]);
  });

  it("requires both leads and payments access for the cross-module conversion rate", () => {
    const flags = normalizeModuleFlags({ leads: true, payments: true });
    expect(
      canViewMetric(
        { moduleKey: "conversions" },
        { key: "conversions.lead_to_paying_rate" },
        flags,
        new Set(["metrics.dashboard.read", "leads.read"]),
      ),
    ).toBe(false);
  });

  it("bypasses module and permission checks for a master tenant", () => {
    const flags = normalizeModuleFlags({ hotel: false });
    expect(
      canViewMetricGroup(
        { moduleKey: "hotel", metrics: [{ key: "hotel.occupancy_rate" }] },
        flags,
        new Set(),
        true,
      ),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- dashboard-visibility`
Expected: FAIL com `Failed to resolve import "./dashboard-visibility"`

- [ ] **Step 3: Write minimal implementation**

`src/modules/settings/domain/dashboard-visibility.ts`:

```ts
import type {
  MetricGroupResponse,
  MetricValueResponse,
} from "@/src/shared/domain/types/@stats";
import type { GateableModule, ModuleFlags } from "./tenant-modules";

type AccessRule = {
  modules?: readonly GateableModule[];
  permissions?: readonly string[];
  requireAll?: boolean;
};

const MODULE_ALIASES: Array<[GateableModule, readonly string[]]> = [
  ["leads", ["lead", "appointment", "abandoned-cart"]],
  ["cms", ["cms", "blog", "article", "author", "media", "storage"]],
  ["mailer", ["mailer", "campaign", "email", "sms", "sender"]],
  ["payments", ["payment", "billing", "subscription", "stripe", "guest"]],
  ["coupons", ["coupon"]],
  ["reports", ["report"]],
  ["notifications", ["notification"]],
  ["hotel", ["hotel", "ota", "whatsapp"]],
  ["metrics", ["metric", "analytics"]],
];

const GROUP_RULES: Record<string, AccessRule> = {
  leads: { modules: ["leads"], permissions: ["leads.read"] },
  cms: { modules: ["cms"], permissions: ["cms.article.read", "cms.blog.read", "cms.author.read"] },
  storage: { modules: ["cms"], permissions: ["cms.media-asset.read", "cms.media-collection.read"] },
  email: { modules: ["mailer"], permissions: ["mailer.campaign.manage"] },
  users: { permissions: ["users.read"] },
  payments: { modules: ["payments"], permissions: ["payments.read"] },
  hotel: { modules: ["hotel"], permissions: ["hotel.read"] },
};

export function metricModuleFor(group: Pick<MetricGroupResponse, "moduleKey">): GateableModule | undefined {
  const key = group.moduleKey.toLocaleLowerCase();
  return MODULE_ALIASES.find(([, aliases]) => aliases.some((alias) => key.includes(alias)))?.[0];
}

function metricRule(groupKey: string, metricKey: string): AccessRule {
  const group = groupKey.toLocaleLowerCase();
  const key = metricKey.toLocaleLowerCase();

  if (group === "conversions") {
    if (key.includes("lead_to_paying")) {
      return {
        modules: ["leads", "payments"],
        permissions: ["leads.read", "payments.read"],
        requireAll: true,
      };
    }
    if (key.includes("paying") || key.includes("revenue")) {
      return { modules: ["payments"], permissions: ["payments.read"] };
    }
    return { modules: ["leads"], permissions: ["leads.read"] };
  }

  if (group === "leads" && key.includes("collection")) {
    return { modules: ["leads"], permissions: ["leads.collection.read"] };
  }
  if (group === "cms") {
    if (key.includes("author")) return { modules: ["cms"], permissions: ["cms.author.read"] };
    if (key.includes("blog") && !key.includes("article")) {
      return { modules: ["cms"], permissions: ["cms.blog.read"] };
    }
    return { modules: ["cms"], permissions: ["cms.article.read"] };
  }
  if (group === "storage") {
    const permission = key.includes("collection")
      ? "cms.media-collection.read"
      : "cms.media-asset.read";
    return { modules: ["cms"], permissions: [permission] };
  }

  return GROUP_RULES[group] ?? {
    modules: metricModuleFor({ moduleKey: group }) ? [metricModuleFor({ moduleKey: group })!] : undefined,
    permissions: ["metrics.dashboard.read"],
  };
}

function satisfiesRule(
  rule: AccessRule,
  flags: ModuleFlags | undefined,
  permissions: ReadonlySet<string> | undefined,
  isMasterTenant: boolean,
) {
  if (isMasterTenant) return true;

  const moduleChecks = rule.modules?.map((moduleKey) => flags?.[moduleKey] === true) ?? [];
  const modulesEnabled = moduleChecks.length === 0
    ? true
    : rule.requireAll
      ? moduleChecks.every(Boolean)
      : moduleChecks.some(Boolean);
  if (!modulesEnabled) return false;
  if (!permissions || (!permissions.has("*") && !permissions.has("metrics.dashboard.read"))) return false;

  const permissionChecks = rule.permissions?.map((permission) => permissions.has(permission)) ?? [];
  if (permissionChecks.length === 0 || permissions.has("*")) return true;
  return rule.requireAll ? permissionChecks.every(Boolean) : permissionChecks.some(Boolean);
}

export function canViewMetric(
  group: Pick<MetricGroupResponse, "moduleKey">,
  metric: Pick<MetricValueResponse, "key">,
  flags: ModuleFlags | undefined,
  permissions: ReadonlySet<string> | undefined,
  isMasterTenant = false,
) {
  return satisfiesRule(metricRule(group.moduleKey, metric.key), flags, permissions, isMasterTenant);
}

export function canViewMetricGroup(
  group: {
    moduleKey: MetricGroupResponse["moduleKey"];
    metrics: readonly Pick<MetricValueResponse, "key">[];
  },
  flags: ModuleFlags | undefined,
  permissions: ReadonlySet<string> | undefined,
  isMasterTenant = false,
) {
  return group.metrics.some((metric) => canViewMetric(group, metric, flags, permissions, isMasterTenant));
}

export function filterDashboardGroups(
  groups: MetricGroupResponse[],
  flags: ModuleFlags | undefined,
  permissions: ReadonlySet<string> | undefined,
  isMasterTenant = false,
): MetricGroupResponse[] {
  const organized = new Map<string, MetricGroupResponse>();

  for (const group of groups) {
    for (const metric of group.metrics) {
      if (!canViewMetric(group, metric, flags, permissions, isMasterTenant)) continue;
      const moduleKey =
        group.moduleKey.toLocaleLowerCase() === "conversions"
          ? (metric.key.toLocaleLowerCase().includes("paying") ||
             metric.key.toLocaleLowerCase().includes("revenue")
              ? "payments"
              : "leads")
          : group.moduleKey;
      if (
        group.moduleKey.toLocaleLowerCase() === "conversions" &&
        metric.key.toLocaleLowerCase().includes("lead_to_paying")
      ) {
        continue; // taxa cruzada nao pertence a nenhum painel de modulo unico
      }

      const current = organized.get(moduleKey);
      if (current) {
        current.metrics.push(metric);
      } else {
        organized.set(moduleKey, { ...group, moduleKey, metrics: [metric] });
      }
    }
  }

  return [...organized.values()];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- dashboard-visibility`
Expected: PASS (6 testes)

- [ ] **Step 5: Commit**

```bash
git add src/modules/settings/domain/dashboard-visibility.ts src/modules/settings/domain/dashboard-visibility.test.ts
git commit -m "feat: filter dashboard metrics by module flags and read permissions"
```

---
### Task 10: `entity-list` — tipos e estado de query serializável

Primeira peça da plataforma de listas: o contrato de dados (`EntityListDefinition`, `EntityListDataSource`, `EntityPage`, `EntityColumn`, `EntityFilterDefinition`) e a serialização do estado da lista (página, busca, ordenação, filtros) para `URLSearchParams`, usada depois por `use-entity-list-state` (Task 15) no modo `"url"`.

**Files:**
- Create: `src/presentation/components/organisms/entity-list/types.ts`
- Create: `src/presentation/components/organisms/entity-list/query-state.ts`
- Test: `src/presentation/components/organisms/entity-list/query-state.test.ts`
- Test: `src/presentation/components/organisms/entity-list/types.test-d.ts`

**Interfaces:**
- Produces: `EntityKey`, `EntitySort`, `EntityListRequest<TFilters>`, `EntityPage<TEntity>`, `EntityListCapabilities`, `EntityListDataSource<TEntity, TFilters>`, `EntitySortDefinition`, `EntityFilterOption`, `EntityFilterDefinition<TFilters>`, `EntityListItemRenderContext<TKey>`, `EntityColumn<TEntity>`, `EntityListDefinition<TEntity, TFilters, TKey>`, `assertCardsDefinition`, `serializeEntityListQuery<TFilters>(state)`, `parseEntityListQuery<TFilters>(params, defaults)`

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/entity-list/query-state.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  parseEntityListQuery,
  serializeEntityListQuery,
} from "./query-state";

describe("entity list query state", () => {
  it("round-trips list state with entity filters", () => {
    const encoded = serializeEntityListQuery({
      page: 2,
      pageSize: 50,
      search: "ana",
      sort: { field: "last_seen", direction: "desc" },
      filters: { status: "active" },
    });

    expect(parseEntityListQuery(encoded, { status: "" })).toEqual({
      page: 2,
      pageSize: 50,
      search: "ana",
      sort: { field: "last_seen", direction: "desc" },
      filters: { status: "active" },
    });
  });

  it("omits default page and empty filters from the URL", () => {
    const encoded = serializeEntityListQuery({
      page: 1,
      pageSize: 30,
      search: "",
      filters: { status: "", active: false },
    });

    expect(encoded.toString()).toBe("limit=30");
  });
});
```

`src/presentation/components/organisms/entity-list/types.test-d.ts`:

```ts
import { describe, it } from "vitest";
import type { EntityColumn, EntityListDefinition } from "./types";

interface Widget {
  id: string;
  name: string;
}

describe("EntityListDefinition variant typing", () => {
  it("accepts a table variant with columns and no renderItem", () => {
    const columns: readonly EntityColumn<Widget>[] = [
      { key: "name", header: "Nome", render: (w) => w.name },
    ];
    const definition: EntityListDefinition<Widget, Record<string, unknown>, string> = {
      id: "widgets",
      ariaLabel: "Widgets",
      getKey: (w) => w.id,
      dataSource: { capabilities: { search: false, sort: false, pagination: "local", selection: "none" }, query: async () => ({ items: [], total: 0, page: 1, pageSize: 30 }) },
      initialState: { pageSize: 30, filters: {} },
      filters: [],
      sorts: [],
      variant: "table",
      columns,
    };
    void definition;
  });

  it("accepts a cards variant with renderItem and no columns (default)", () => {
    const definition: EntityListDefinition<Widget, Record<string, unknown>, string> = {
      id: "widgets",
      ariaLabel: "Widgets",
      getKey: (w) => w.id,
      dataSource: { capabilities: { search: false, sort: false, pagination: "local", selection: "none" }, query: async () => ({ items: [], total: 0, page: 1, pageSize: 30 }) },
      initialState: { pageSize: 30, filters: {} },
      filters: [],
      sorts: [],
      renderItem: (w) => w.name,
    };
    void definition;
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- entity-list/query-state entity-list/types.test-d`
Expected: FAIL com `Failed to resolve import "./query-state"` / `"./types"`

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/entity-list/types.ts`:

```ts
import type { ReactNode } from "react";

export type EntityKey = string | number;

export interface EntitySort {
  field: string;
  direction: "asc" | "desc";
}

export interface EntityListRequest<TFilters extends object> {
  page: number;
  pageSize: number;
  search: string;
  sort?: EntitySort;
  filters: TFilters;
}

export interface EntityPage<TEntity> {
  items: readonly TEntity[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EntityListCapabilities {
  search: "server" | "local" | false;
  sort: "server" | "local" | false;
  pagination: "server" | "local";
  selection: "none" | "single" | "multiple";
  localItemLimit?: number;
}

export interface EntityListDataSource<TEntity, TFilters extends object> {
  capabilities: EntityListCapabilities;
  query(request: EntityListRequest<TFilters>): Promise<EntityPage<TEntity>>;
}

export interface EntitySortDefinition {
  field: string;
  label: string;
}

export interface EntityFilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface EntityFilterDefinition<TFilters extends object> {
  key: Extract<keyof TFilters, string>;
  label: string;
  kind:
    | "single"
    | "multi"
    | "boolean"
    | "date"
    | "date-range"
    | "number-range"
    | "entity"
    | "custom";
  options?: readonly EntityFilterOption[];
}

export interface EntityListItemRenderContext<TKey extends EntityKey> {
  selected: boolean;
  selectable: boolean;
  onSelectionChange(): void;
}

export interface EntityColumn<TEntity> {
  key: string;
  header: string;
  align?: "start" | "center" | "end";
  sortField?: string;
  render(entity: TEntity): ReactNode;
}

interface EntityListDefinitionBase<
  TEntity,
  TFilters extends object,
  TKey extends EntityKey = EntityKey,
> {
  id: string;
  ariaLabel: string;
  getKey(entity: TEntity): TKey;
  dataSource: EntityListDataSource<TEntity, TFilters>;
  initialState: {
    pageSize: number;
    filters: TFilters;
    sort?: EntitySort;
  };
  filters: readonly EntityFilterDefinition<TFilters>[];
  sorts: readonly EntitySortDefinition[];
  onActivate?(entity: TEntity): void;
  primaryActions?: ReactNode;
  listClassName?: string;
}

export type EntityListDefinition<
  TEntity,
  TFilters extends object,
  TKey extends EntityKey = EntityKey,
> =
  | (EntityListDefinitionBase<TEntity, TFilters, TKey> & {
      variant?: "cards";
      renderItem(entity: TEntity, context: EntityListItemRenderContext<TKey>): ReactNode;
    })
  | (EntityListDefinitionBase<TEntity, TFilters, TKey> & {
      variant: "table";
      columns: readonly EntityColumn<TEntity>[];
    });

/**
 * Estreita um EntityListDefinition possivelmente de variante "table" para o
 * seu braco "cards". Toda tela e teste deste codebase so constroem
 * definicoes "cards" (nenhum constroi "table" fora de types.test-d.ts), entao
 * esta asserção e segura em todo call site atual -- ela existe so para
 * satisfazer o estreitamento de union discriminada do compilador sem forcar
 * cada call site a duplicar um guard `if (definition.variant === "table") throw ...`.
 */
export function assertCardsDefinition<
  TEntity,
  TFilters extends object,
  TKey extends EntityKey = EntityKey,
>(
  definition: EntityListDefinition<TEntity, TFilters, TKey>,
): Extract<EntityListDefinition<TEntity, TFilters, TKey>, { renderItem: unknown }> {
  return definition as Extract<EntityListDefinition<TEntity, TFilters, TKey>, { renderItem: unknown }>;
}
```

`src/presentation/components/organisms/entity-list/query-state.ts`:

```ts
import type { EntityListRequest } from "./types";

export function serializeEntityListQuery<TFilters extends object>(
  state: EntityListRequest<TFilters>,
) {
  const params = new URLSearchParams();

  if (state.page > 1) params.set("page", String(state.page));
  params.set("limit", String(state.pageSize));
  if (state.search) params.set("q", state.search);

  if (state.sort) {
    params.set("sort", state.sort.field);
    params.set("direction", state.sort.direction);
  }

  Object.entries(state.filters).forEach(([key, value]) => {
    if (value === "" || value === false || value == null) return;
    params.set(key, Array.isArray(value) ? value.join(",") : String(value));
  });

  return params;
}

export function parseEntityListQuery<TFilters extends Record<string, unknown>>(
  params: URLSearchParams,
  defaults: TFilters,
): EntityListRequest<TFilters> {
  const filters = { ...defaults };

  Object.keys(defaults).forEach((key) => {
    const value = params.get(key);
    if (value !== null) {
      filters[key as keyof TFilters] = value as TFilters[keyof TFilters];
    }
  });

  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.max(1, Number(params.get("limit")) || 30);
  const sortField = params.get("sort");

  return {
    page,
    pageSize,
    search: params.get("q") ?? "",
    sort: sortField
      ? {
          field: sortField,
          direction: params.get("direction") === "asc" ? "asc" : "desc",
        }
      : undefined,
    filters,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- entity-list/query-state entity-list/types.test-d`
Expected: PASS (2 testes de `query-state` + 2 testes de tipo)

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/entity-list/types.ts src/presentation/components/organisms/entity-list/query-state.ts src/presentation/components/organisms/entity-list/query-state.test.ts src/presentation/components/organisms/entity-list/types.test-d.ts
git commit -m "feat: add the entity-list contract types and URL query-state serializer"
```

---

### Task 11: `entity-list` — seleção explícita e "todos que casam"

**Files:**
- Create: `src/presentation/components/organisms/entity-list/selection.ts`
- Test: `src/presentation/components/organisms/entity-list/selection.test.ts`

**Interfaces:**
- Consumes: `EntityKey` de `./types` (Task 10)
- Produces: `EntitySelection<TKey>`, `createEmptySelection<TKey>()`, `selectVisibleKeys<TKey>(keys)`, `selectAllMatching<TKey>()`, `toggleEntityKey<TKey>(selection, key)`, `getSelectedCount<TKey>(selection, totalMatching)`

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/entity-list/selection.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  createEmptySelection,
  getSelectedCount,
  selectAllMatching,
  selectVisibleKeys,
  toggleEntityKey,
} from "./selection";

describe("entity selection", () => {
  it("stores visible selections as explicit immutable keys", () => {
    const first = selectVisibleKeys(["lead-1", "lead-2"]);
    const second = toggleEntityKey(first, "lead-1");

    expect(first).toEqual({ mode: "explicit", keys: new Set(["lead-1", "lead-2"]) });
    expect(second).toEqual({ mode: "explicit", keys: new Set(["lead-2"]) });
  });

  it("excludes an item from all matching selection", () => {
    const selection = selectAllMatching<string>();
    const updated = toggleEntityKey(selection, "lead-2");

    expect(updated).toEqual({ mode: "allMatching", excludedKeys: new Set(["lead-2"]) });
    expect(getSelectedCount(updated, 12)).toBe(11);
  });

  it("creates an empty explicit selection", () => {
    expect(createEmptySelection()).toEqual({ mode: "explicit", keys: new Set() });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- entity-list/selection`
Expected: FAIL com `Failed to resolve import "./selection"`

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/entity-list/selection.ts`:

```ts
import type { EntityKey } from "./types";

export type EntitySelection<TKey extends EntityKey> =
  | { mode: "explicit"; keys: ReadonlySet<TKey> }
  | { mode: "allMatching"; excludedKeys: ReadonlySet<TKey> };

export const createEmptySelection = <
  TKey extends EntityKey = EntityKey,
>(): EntitySelection<TKey> => ({
  mode: "explicit",
  keys: new Set(),
});

export const selectVisibleKeys = <TKey extends EntityKey>(
  keys: Iterable<TKey>,
): EntitySelection<TKey> => ({
  mode: "explicit",
  keys: new Set(keys),
});

export const selectAllMatching = <TKey extends EntityKey>(): EntitySelection<TKey> => ({
  mode: "allMatching",
  excludedKeys: new Set(),
});

export function toggleEntityKey<TKey extends EntityKey>(
  selection: EntitySelection<TKey>,
  key: TKey,
): EntitySelection<TKey> {
  if (selection.mode === "allMatching") {
    const excludedKeys = new Set(selection.excludedKeys);
    if (excludedKeys.has(key)) excludedKeys.delete(key);
    else excludedKeys.add(key);
    return { mode: "allMatching", excludedKeys };
  }

  const keys = new Set(selection.keys);
  if (keys.has(key)) keys.delete(key);
  else keys.add(key);
  return { mode: "explicit", keys };
}

export function getSelectedCount<TKey extends EntityKey>(
  selection: EntitySelection<TKey>,
  totalMatching: number,
) {
  return selection.mode === "allMatching"
    ? Math.max(0, totalMatching - selection.excludedKeys.size)
    : selection.keys.size;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- entity-list/selection`
Expected: PASS (3 testes)

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/entity-list/selection.ts src/presentation/components/organisms/entity-list/selection.test.ts
git commit -m "feat: add entity-list selection with explicit and all-matching modes"
```

---

### Task 12: `entity-list` — busca/ordenação/paginação local

**Files:**
- Create: `src/presentation/components/organisms/entity-list/local-query.ts`
- Test: `src/presentation/components/organisms/entity-list/local-query.test.ts`

**Interfaces:**
- Consumes: `EntityListRequest`, `EntityPage` de `./types` (Task 10)
- Produces: `LocalEntityLimitError`, `LocalEntityQueryOptions<TEntity, TFilters>`, `applyLocalEntityQuery<TEntity, TFilters>(items, request, options): EntityPage<TEntity>`

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/entity-list/local-query.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  applyLocalEntityQuery,
  LocalEntityLimitError,
} from "./local-query";

type Contact = {
  id: string;
  name: string;
  status: "active" | "inactive";
};

const contacts: Contact[] = [
  { id: "1", name: "Ana", status: "active" },
  { id: "2", name: "Bruno", status: "inactive" },
  { id: "3", name: "Álvaro", status: "active" },
];

const options = {
  localItemLimit: 100,
  searchText: (contact: Contact) => contact.name,
  matchesFilters: (contact: Contact, filters: { status: string }) =>
    !filters.status || contact.status === filters.status,
  sortValue: (contact: Contact, field: string) =>
    field === "name" ? contact.name : null,
};

describe("applyLocalEntityQuery", () => {
  it("filters, folds accents, sorts, and paginates a local collection", () => {
    const result = applyLocalEntityQuery(
      contacts,
      {
        page: 1,
        pageSize: 1,
        search: "alvaro",
        sort: { field: "name", direction: "desc" },
        filters: { status: "active" },
      },
      options,
    );

    expect(result).toEqual({
      items: [{ id: "3", name: "Álvaro", status: "active" }],
      total: 1,
      page: 1,
      pageSize: 1,
    });
  });

  it("rejects collections above their declared local limit", () => {
    expect(() =>
      applyLocalEntityQuery(
        Array.from({ length: 101 }, (_, index) => contacts[index % 3]),
        { page: 1, pageSize: 30, search: "", filters: { status: "" } },
        options,
      ),
    ).toThrow(LocalEntityLimitError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- entity-list/local-query`
Expected: FAIL com `Failed to resolve import "./local-query"`

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/entity-list/local-query.ts`:

```ts
import type { EntityListRequest, EntityPage } from "./types";

export class LocalEntityLimitError extends Error {
  constructor(limit: number) {
    super(`Local entity-list limit of ${limit} items exceeded`);
    this.name = "LocalEntityLimitError";
  }
}

export interface LocalEntityQueryOptions<TEntity, TFilters extends object> {
  searchText(entity: TEntity): string;
  matchesFilters(entity: TEntity, filters: TFilters): boolean;
  sortValue(entity: TEntity, field: string): string | number | Date | null;
  localItemLimit: number;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase();
}

function compareValues(
  left: string | number | Date | null,
  right: string | number | Date | null,
) {
  if (left === right) return 0;
  if (left === null) return 1;
  if (right === null) return -1;

  if (left instanceof Date || right instanceof Date) {
    return new Date(left).getTime() - new Date(right).getTime();
  }

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function applyLocalEntityQuery<TEntity, TFilters extends object>(
  items: readonly TEntity[],
  request: EntityListRequest<TFilters>,
  options: LocalEntityQueryOptions<TEntity, TFilters>,
): EntityPage<TEntity> {
  if (items.length > options.localItemLimit) {
    throw new LocalEntityLimitError(options.localItemLimit);
  }

  const search = normalizeSearch(request.search.trim());
  const matching = items.filter(
    (item) =>
      options.matchesFilters(item, request.filters) &&
      (!search || normalizeSearch(options.searchText(item)).includes(search)),
  );

  const sorted = request.sort
    ? matching
        .map((item, index) => ({ item, index }))
        .sort((left, right) => {
          const compared = compareValues(
            options.sortValue(left.item, request.sort!.field),
            options.sortValue(right.item, request.sort!.field),
          );
          if (compared === 0) return left.index - right.index;
          return request.sort!.direction === "asc" ? compared : -compared;
        })
        .map(({ item }) => item)
    : matching;
  const page = Math.max(1, request.page);
  const pageSize = Math.max(1, request.pageSize);
  const start = (page - 1) * pageSize;

  return {
    items: sorted.slice(start, start + pageSize),
    total: sorted.length,
    page,
    pageSize,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- entity-list/local-query`
Expected: PASS (2 testes)

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/entity-list/local-query.ts src/presentation/components/organisms/entity-list/local-query.test.ts
git commit -m "feat: add in-memory search, sort, and pagination for local entity lists"
```

---

### Task 13: `entity-list` — mutação otimista sobre todas as páginas cacheadas

Uma lista lógica mantém várias páginas cacheadas ao mesmo tempo (uma por combinação de página/busca/filtro/ordenação), todas sob `["entity-list", <definitionId>, <tenant>, <estado>]`. Uma mutação otimista precisa atingir toda página cacheada daquela lista, não só "a atual", e poder desfazer todas se a requisição falhar.

**Files:**
- Create: `src/presentation/components/organisms/entity-list/optimistic.ts`
- Test: `src/presentation/components/organisms/entity-list/optimistic.test.ts`

**Interfaces:**
- Consumes: `EntityKey`, `EntityPage` de `./types` (Task 10); `QueryClient`, `QueryKey` de `@tanstack/react-query`
- Produces: `EntityListScope`, `entityListQueryScope(idPrefix)`, `EntityListSnapshot<TEntity>`, `snapshotEntityListPages<TEntity>(client, scope)`, `restoreEntityListSnapshot<TEntity>(client, snapshot)`, `applyOptimisticEntityUpdate<TEntity, TKey>(client, options)`, `removeOptimisticEntity<TEntity, TKey>(client, options)`

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/entity-list/optimistic.test.ts`:

```ts
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import {
  applyOptimisticEntityUpdate,
  entityListQueryScope,
  removeOptimisticEntity,
  restoreEntityListSnapshot,
  snapshotEntityListPages,
} from "./optimistic";
import type { EntityPage } from "./types";

interface Article {
  id: string;
  title: string;
  status: string;
}

const page = (items: Article[], total = items.length): EntityPage<Article> => ({
  items,
  total,
  page: 1,
  pageSize: 30,
});

function seed() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  client.setQueryData(
    ["entity-list", "cms-articles", "tenant-1", { page: 1, search: "" }],
    page([
      { id: "a", title: "Alpha", status: "draft" },
      { id: "b", title: "Beta", status: "draft" },
    ]),
  );
  client.setQueryData(
    ["entity-list", "cms-articles", "tenant-1", { page: 1, search: "alp" }],
    page([{ id: "a", title: "Alpha", status: "draft" }]),
  );
  client.setQueryData(
    ["entity-list", "leads", "tenant-1", { page: 1, search: "" }],
    page([{ id: "a", title: "Alpha lead", status: "new" }]),
  );

  return client;
}

const getItems = (client: QueryClient, key: unknown[]) =>
  client.getQueryData<EntityPage<Article>>(key as never)?.items;

describe("applyOptimisticEntityUpdate", () => {
  it("patches the matching entity across every cached page of the list", () => {
    const client = seed();

    applyOptimisticEntityUpdate<Article>(client, {
      scope: entityListQueryScope("cms-articles"),
      getKey: (article) => article.id,
      key: "a",
      update: (article) => ({ ...article, status: "published" }),
    });

    expect(getItems(client, ["entity-list", "cms-articles", "tenant-1", { page: 1, search: "" }])).toEqual([
      { id: "a", title: "Alpha", status: "published" },
      { id: "b", title: "Beta", status: "draft" },
    ]);
    expect(getItems(client, ["entity-list", "cms-articles", "tenant-1", { page: 1, search: "alp" }])).toEqual([
      { id: "a", title: "Alpha", status: "published" },
    ]);
  });

  it("leaves other entity lists alone", () => {
    const client = seed();

    applyOptimisticEntityUpdate<Article>(client, {
      scope: entityListQueryScope("cms-articles"),
      getKey: (article) => article.id,
      key: "a",
      update: (article) => ({ ...article, status: "published" }),
    });

    expect(getItems(client, ["entity-list", "leads", "tenant-1", { page: 1, search: "" }])).toEqual([
      { id: "a", title: "Alpha lead", status: "new" },
    ]);
  });

  it("is a no-op when the key is not cached", () => {
    const client = seed();

    applyOptimisticEntityUpdate<Article>(client, {
      scope: entityListQueryScope("cms-articles"),
      getKey: (article) => article.id,
      key: "missing",
      update: (article) => ({ ...article, status: "published" }),
    });

    expect(getItems(client, ["entity-list", "cms-articles", "tenant-1", { page: 1, search: "" }])).toEqual([
      { id: "a", title: "Alpha", status: "draft" },
      { id: "b", title: "Beta", status: "draft" },
    ]);
  });
});

describe("removeOptimisticEntity", () => {
  it("drops the entity and decrements the total on every cached page", () => {
    const client = seed();

    removeOptimisticEntity<Article>(client, {
      scope: entityListQueryScope("cms-articles"),
      getKey: (article) => article.id,
      key: "a",
    });

    const first = client.getQueryData<EntityPage<Article>>([
      "entity-list", "cms-articles", "tenant-1", { page: 1, search: "" },
    ] as never);

    expect(first?.items).toEqual([{ id: "b", title: "Beta", status: "draft" }]);
    expect(first?.total).toBe(1);
  });

  it("never drives the total below zero", () => {
    const client = new QueryClient();
    client.setQueryData(
      ["entity-list", "cms-articles", "tenant-1", { page: 1 }],
      { items: [{ id: "a", title: "Alpha", status: "draft" }], total: 0, page: 1, pageSize: 30 },
    );

    removeOptimisticEntity<Article>(client, {
      scope: entityListQueryScope("cms-articles"),
      getKey: (article) => article.id,
      key: "a",
    });

    expect(
      client.getQueryData<EntityPage<Article>>(["entity-list", "cms-articles", "tenant-1", { page: 1 }] as never)?.total,
    ).toBe(0);
  });
});

describe("snapshotEntityListPages / restoreEntityListSnapshot", () => {
  it("round-trips the cache so a failed mutation can roll back", () => {
    const client = seed();
    const snapshot = snapshotEntityListPages<Article>(client, entityListQueryScope("cms-articles"));

    removeOptimisticEntity<Article>(client, {
      scope: entityListQueryScope("cms-articles"),
      getKey: (article) => article.id,
      key: "a",
    });
    expect(getItems(client, ["entity-list", "cms-articles", "tenant-1", { page: 1, search: "" }])).toHaveLength(1);

    restoreEntityListSnapshot(client, snapshot);

    expect(getItems(client, ["entity-list", "cms-articles", "tenant-1", { page: 1, search: "" }])).toEqual([
      { id: "a", title: "Alpha", status: "draft" },
      { id: "b", title: "Beta", status: "draft" },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- entity-list/optimistic`
Expected: FAIL com `Failed to resolve import "./optimistic"`

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/entity-list/optimistic.ts`:

```ts
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { EntityKey, EntityPage } from "./types";

const ENTITY_LIST_ROOT = "entity-list";

/**
 * Descreve quais paginas cacheadas de entity-list um helper deve atingir. Um
 * id de definicao como `cms-articles-<blog>-<categoria>` se expande em varios
 * ids concretos conforme o escopo de blog/categoria muda, cada um com suas
 * proprias paginas cacheadas. Casar por *prefixo* do id deixa uma mutacao
 * otimista atingir toda variante da mesma lista logica.
 */
export interface EntityListScope {
  idPrefix: string;
}

export function entityListQueryScope(idPrefix: string): EntityListScope {
  return { idPrefix };
}

export interface EntityListSnapshot<TEntity> {
  entries: Array<[QueryKey, EntityPage<TEntity> | undefined]>;
}

function pageQueriesForScope<TEntity>(
  client: QueryClient,
  scope: EntityListScope,
): Array<[QueryKey, EntityPage<TEntity> | undefined]> {
  return client
    .getQueryCache()
    .findAll({ queryKey: [ENTITY_LIST_ROOT], exact: false })
    .filter((query) => {
      const definitionId = query.queryKey[1];
      return typeof definitionId === "string" && definitionId.startsWith(scope.idPrefix);
    })
    .map((query) => [query.queryKey, query.state.data as EntityPage<TEntity> | undefined]);
}

export function snapshotEntityListPages<TEntity>(
  client: QueryClient,
  scope: EntityListScope,
): EntityListSnapshot<TEntity> {
  return { entries: pageQueriesForScope<TEntity>(client, scope) };
}

export function restoreEntityListSnapshot<TEntity>(
  client: QueryClient,
  snapshot: EntityListSnapshot<TEntity>,
): void {
  for (const [key, data] of snapshot.entries) {
    client.setQueryData(key, data);
  }
}

interface MapPagesOptions<TEntity> {
  scope: EntityListScope;
  mapPage(page: EntityPage<TEntity>): EntityPage<TEntity>;
}

function mapEntityListPages<TEntity>(
  client: QueryClient,
  { scope, mapPage }: MapPagesOptions<TEntity>,
): void {
  for (const [key, data] of pageQueriesForScope<TEntity>(client, scope)) {
    if (!data) continue;
    client.setQueryData<EntityPage<TEntity>>(key, mapPage(data));
  }
}

export interface OptimisticUpdateOptions<TEntity, TKey extends EntityKey = EntityKey> {
  scope: EntityListScope;
  getKey(entity: TEntity): TKey;
  key: TKey;
  update(entity: TEntity): TEntity;
}

export function applyOptimisticEntityUpdate<TEntity, TKey extends EntityKey = EntityKey>(
  client: QueryClient,
  options: OptimisticUpdateOptions<TEntity, TKey>,
): void {
  mapEntityListPages<TEntity>(client, {
    scope: options.scope,
    mapPage: (page) => {
      let changed = false;
      const items = page.items.map((item) => {
        if (options.getKey(item) !== options.key) return item;
        changed = true;
        return options.update(item);
      });
      return changed ? { ...page, items } : page;
    },
  });
}

export interface OptimisticRemoveOptions<TEntity, TKey extends EntityKey = EntityKey> {
  scope: EntityListScope;
  getKey(entity: TEntity): TKey;
  key: TKey;
}

export function removeOptimisticEntity<TEntity, TKey extends EntityKey = EntityKey>(
  client: QueryClient,
  options: OptimisticRemoveOptions<TEntity, TKey>,
): void {
  mapEntityListPages<TEntity>(client, {
    scope: options.scope,
    mapPage: (page) => {
      const items = page.items.filter((item) => options.getKey(item) !== options.key);
      if (items.length === page.items.length) return page;
      return {
        ...page,
        items,
        total: Math.max(0, page.total - (page.items.length - items.length)),
      };
    },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- entity-list/optimistic`
Expected: PASS (6 testes)

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/entity-list/optimistic.ts src/presentation/components/organisms/entity-list/optimistic.test.ts
git commit -m "feat: add optimistic snapshot/patch/remove across cached entity-list pages"
```

---

### Task 14: `entity-list` — validação de capabilities

**Files:**
- Create: `src/presentation/components/organisms/entity-list/capabilities.ts`
- Test: `src/presentation/components/organisms/entity-list/capabilities.test.ts`

**Interfaces:**
- Consumes: `EntityListCapabilities` de `./types` (Task 10)
- Produces: `assertEntityListCapabilities(capabilities): void` (lança se busca/ordenação/paginação local não declara `localItemLimit`)

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/entity-list/capabilities.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { assertEntityListCapabilities } from "./capabilities";

describe("assertEntityListCapabilities", () => {
  it("requires a finite local item limit for local operations", () => {
    expect(() =>
      assertEntityListCapabilities({
        search: "local",
        sort: false,
        pagination: "local",
        selection: "multiple",
      }),
    ).toThrow(/localItemLimit/);
  });

  it("accepts an entirely server-backed source", () => {
    expect(() =>
      assertEntityListCapabilities({
        search: "server",
        sort: "server",
        pagination: "server",
        selection: "none",
      }),
    ).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- entity-list/capabilities`
Expected: FAIL com `Failed to resolve import "./capabilities"`

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/entity-list/capabilities.ts`:

```ts
import type { EntityListCapabilities } from "./types";

export function assertEntityListCapabilities(
  capabilities: EntityListCapabilities,
) {
  const usesLocalOperations =
    capabilities.search === "local" ||
    capabilities.sort === "local" ||
    capabilities.pagination === "local";

  if (
    usesLocalOperations &&
    (!Number.isInteger(capabilities.localItemLimit) ||
      capabilities.localItemLimit === undefined ||
      capabilities.localItemLimit < 1)
  ) {
    throw new Error("Local entity-list operations require localItemLimit");
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- entity-list/capabilities`
Expected: PASS (2 testes)

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/entity-list/capabilities.ts src/presentation/components/organisms/entity-list/capabilities.test.ts
git commit -m "feat: assert local entity-list operations declare a local item limit"
```

---

### Task 15: `entity-list` — estado da lista em memória ou na URL

**Files:**
- Create: `src/presentation/components/organisms/entity-list/use-entity-list-state.ts`
- Test: `src/presentation/components/organisms/entity-list/use-entity-list-state.test.tsx`

**Interfaces:**
- Consumes: `parseEntityListQuery`, `serializeEntityListQuery` de `./query-state` (Task 10); `EntityListRequest`, `EntitySort` de `./types` (Task 10); `usePathname`, `useRouter`, `useSearchParams` de `next/navigation`
- Produces: `useEntityListState<TFilters>({ initialState, mode?, searchDebounceMs? })` → `{ state, searchInput, setSearch, setFilter, setSort, setPage, setPageSize, clearFilters }`

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/entity-list/use-entity-list-state.test.tsx`:

```tsx
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEntityListState } from "./use-entity-list-state";

const replace = vi.fn();
let params = new URLSearchParams("page=2&status=draft&keep=yes");

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/leads",
  useRouter: () => ({ replace }),
  useSearchParams: () => params,
}));

const initialState = {
  page: 1,
  pageSize: 30,
  search: "",
  filters: { status: "" },
};

describe("useEntityListState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replace.mockClear();
    params = new URLSearchParams("page=2&status=draft&keep=yes");
  });

  afterEach(() => vi.useRealTimers());

  it("updates memory filters and resets to the first page", () => {
    const { result } = renderHook(() => useEntityListState({ mode: "memory", initialState }));

    act(() => result.current.setPage(3));
    act(() => result.current.setFilter("status", "active"));

    expect(result.current.state).toMatchObject({ page: 1, filters: { status: "active" } });
  });

  it("debounces URL search updates and preserves unrelated parameters", () => {
    const { result } = renderHook(() => useEntityListState({ mode: "url", initialState }));

    act(() => result.current.setSearch("  Ana  "));
    expect(result.current.searchInput).toBe("  Ana  ");

    act(() => vi.advanceTimersByTime(299));
    expect(replace).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(replace).toHaveBeenCalledWith(
      "/dashboard/leads?limit=30&q=Ana&status=draft&keep=yes",
      { scroll: false },
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- entity-list/use-entity-list-state`
Expected: FAIL com `Failed to resolve import "./use-entity-list-state"`

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/entity-list/use-entity-list-state.ts`:

```ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseEntityListQuery, serializeEntityListQuery } from "./query-state";
import type { EntityListRequest, EntitySort } from "./types";

type EntityListStateMode = "memory" | "url";

interface UseEntityListStateOptions<TFilters extends Record<string, unknown>> {
  initialState: EntityListRequest<TFilters>;
  mode?: EntityListStateMode;
  searchDebounceMs?: number;
}

export function useEntityListState<TFilters extends Record<string, unknown>>({
  initialState,
  mode = "memory",
  searchDebounceMs = 300,
}: UseEntityListStateOptions<TFilters>) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const latestSearchParams = useRef(searchParamsString);
  const latestPathname = useRef(pathname);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [memoryState, setMemoryState] = useState(initialState);

  if (latestSearchParams.current !== searchParamsString) {
    latestSearchParams.current = searchParamsString;
  }
  latestPathname.current = pathname;

  const urlState = useMemo(
    () => parseEntityListQuery(new URLSearchParams(searchParamsString), initialState.filters),
    [initialState.filters, searchParamsString],
  );
  const state = mode === "url" ? { ...urlState, pageSize: urlState.pageSize || initialState.pageSize } : memoryState;
  const [searchInput, setSearchInput] = useState(state.search);

  useEffect(() => {
    setSearchInput(state.search);
  }, [state.search]);

  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    [],
  );

  const commit = useCallback(
    (nextState: EntityListRequest<TFilters>) => {
      if (mode === "memory") {
        setMemoryState(nextState);
        return;
      }

      const current = new URLSearchParams(latestSearchParams.current);
      const encoded = serializeEntityListQuery(nextState);
      const managedKeys = new Set([
        "page", "limit", "q", "sort", "direction", ...Object.keys(initialState.filters),
      ]);

      managedKeys.forEach((key) => current.delete(key));
      const nextParams = new URLSearchParams(encoded);
      current.forEach((value, key) => nextParams.append(key, value));

      const suffix = nextParams.toString();
      latestSearchParams.current = suffix;
      router.replace(suffix ? `${latestPathname.current}?${suffix}` : latestPathname.current, { scroll: false });
    },
    [initialState.filters, mode, router],
  );

  const update = useCallback(
    (changes: Partial<EntityListRequest<TFilters>>, resetPage = true) => {
      commit({
        ...state,
        ...changes,
        page: resetPage ? 1 : changes.page ?? state.page,
        filters: changes.filters ?? state.filters,
      });
    },
    [commit, state],
  );

  const setSearch = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        update({ search: value.trim() });
        searchTimer.current = null;
      }, searchDebounceMs);
    },
    [searchDebounceMs, update],
  );

  const setFilter = useCallback(
    <TKey extends Extract<keyof TFilters, string>>(key: TKey, value: TFilters[TKey]) => {
      update({ filters: { ...state.filters, [key]: value } });
    },
    [state.filters, update],
  );

  const setSort = useCallback((sort?: EntitySort) => update({ sort }), [update]);

  const setPage = useCallback(
    (page: number) => update({ page: Math.max(1, Math.floor(page) || 1) }, false),
    [update],
  );

  const setPageSize = useCallback(
    (pageSize: number) => update({ pageSize: Math.max(1, Math.floor(pageSize) || 1) }),
    [update],
  );

  const clearFilters = useCallback(() => update({ filters: initialState.filters }), [initialState.filters, update]);

  return { state, searchInput, setSearch, setFilter, setSort, setPage, setPageSize, clearFilters };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- entity-list/use-entity-list-state`
Expected: PASS (2 testes)

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/entity-list/use-entity-list-state.ts src/presentation/components/organisms/entity-list/use-entity-list-state.test.tsx
git commit -m "feat: add entity-list state hook with memory and URL-synced modes"
```

---

### Task 16: `entity-list` — controller (query + seleção, isolado por tenant)

Junta o estado da lista com o `useQuery` do React Query e a seleção. A chave de query inclui o tenant selecionado (`useSelectedTenantId`), então mudar de tenant nunca reaproveita a página cacheada de outro (reforça a Task 1) — e a seleção é limpa sempre que a assinatura da query muda.

**Files:**
- Create: `src/presentation/components/organisms/entity-list/use-entity-list-controller.ts`
- Test: `src/presentation/components/organisms/entity-list/use-entity-list-controller.test.tsx`

**Interfaces:**
- Consumes: `useSelectedTenantId` de `@/src/shared/stores/tenant-store` (Task 2); `createEmptySelection`, `getSelectedCount`, `selectAllMatching`, `toggleEntityKey`, `EntitySelection` de `./selection` (Task 11); `EntityKey`, `EntityListDefinition` de `./types` (Task 10); `useEntityListState` de `./use-entity-list-state` (Task 15); `createTestQueryWrapper`, `createTestQueryClient` de `@/src/shared/query/test-query-provider` (Task 1)
- Produces: `useEntityListController<TEntity, TFilters, TKey>({ definition, stateMode?, searchDebounceMs? })` → estado da lista + `{ query, page, selection, selectedCount, toggleSelection, selectAllMatching, clearSelection }`

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/entity-list/use-entity-list-controller.test.tsx`:

```tsx
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createTestQueryClient, createTestQueryWrapper } from "@/src/shared/query/test-query-provider";
import { useEntityListController } from "./use-entity-list-controller";
import type { EntityListDefinition } from "./types";

let selectedTenantId: string | null = "tenant-1";

vi.mock("@/src/shared/stores/tenant-store", () => ({
  useSelectedTenantId: () => selectedTenantId,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/contacts",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

type Contact = { id: string; name: string };
type Filters = { status: string };

const query = vi.fn().mockResolvedValue({
  items: [{ id: "contact-1", name: "Ada" }],
  total: 1,
  page: 1,
  pageSize: 30,
});

const definition: EntityListDefinition<Contact, Filters> = {
  id: "contacts",
  ariaLabel: "Contatos",
  getKey: (contact) => contact.id,
  dataSource: {
    capabilities: { search: "server", sort: "server", pagination: "server", selection: "multiple" },
    query,
  },
  initialState: { pageSize: 30, filters: { status: "" } },
  filters: [],
  sorts: [],
  renderItem: (contact) => contact.name,
};

function setup() {
  const wrapper = createTestQueryWrapper(createTestQueryClient());
  return { wrapper };
}

describe("useEntityListController", () => {
  it("queries through the entity data source and retains its page contract", async () => {
    query.mockClear();
    const { wrapper } = setup();
    const { result } = renderHook(() => useEntityListController({ definition, searchDebounceMs: 0 }), { wrapper });

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    expect(query).toHaveBeenCalledWith({ page: 1, pageSize: 30, search: "", filters: { status: "" } });
    expect(result.current.page?.items).toEqual([{ id: "contact-1", name: "Ada" }]);
  });

  it("clears a selection when the controlled query changes", async () => {
    query.mockClear();
    const { wrapper } = setup();
    const { result } = renderHook(() => useEntityListController({ definition, searchDebounceMs: 0 }), { wrapper });

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    act(() => result.current.toggleSelection("contact-1"));
    expect(result.current.selectedCount).toBe(1);

    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.state.page).toBe(2));
    expect(result.current.selectedCount).toBe(0);
  });

  it("clamps a stale out-of-range page back into the available range", async () => {
    selectedTenantId = "tenant-1";
    const shrinkingQuery = vi.fn().mockImplementation(async (request) => ({
      items: request.page === 1 ? [{ id: "contact-1", name: "Ada" }] : [],
      total: 1,
      page: request.page,
      pageSize: 30,
    }));
    const shrinkingDefinition = { ...definition, dataSource: { ...definition.dataSource, query: shrinkingQuery } };
    const { wrapper } = setup();
    const { result } = renderHook(
      () => useEntityListController({ definition: shrinkingDefinition, searchDebounceMs: 0 }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    act(() => result.current.setPage(4));

    await waitFor(() => expect(result.current.state.page).toBe(1));
    expect(result.current.page?.items).toEqual([{ id: "contact-1", name: "Ada" }]);
  });

  it("isolates cached pages and selection by selected tenant", async () => {
    selectedTenantId = "tenant-1";
    const tenantQuery = vi.fn().mockImplementation(async () => ({
      items: [{ id: selectedTenantId!, name: selectedTenantId! }],
      total: 1,
      page: 1,
      pageSize: 30,
    }));
    const tenantDefinition = { ...definition, dataSource: { ...definition.dataSource, query: tenantQuery } };
    const { wrapper } = setup();
    const { result, rerender } = renderHook(
      () => useEntityListController({ definition: tenantDefinition, searchDebounceMs: 0 }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.page?.items[0]?.id).toBe("tenant-1"));
    act(() => result.current.toggleSelection("tenant-1"));
    expect(result.current.selectedCount).toBe(1);

    selectedTenantId = "tenant-2";
    rerender();

    await waitFor(() => expect(result.current.page?.items[0]?.id).toBe("tenant-2"));
    expect(tenantQuery).toHaveBeenCalledTimes(2);
    expect(result.current.selectedCount).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- entity-list/use-entity-list-controller`
Expected: FAIL com `Failed to resolve import "./use-entity-list-controller"`

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/entity-list/use-entity-list-controller.ts`:

```ts
"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";
import {
  createEmptySelection,
  getSelectedCount,
  selectAllMatching,
  toggleEntityKey,
  type EntitySelection,
} from "./selection";
import type { EntityKey, EntityListDefinition } from "./types";
import { useEntityListState } from "./use-entity-list-state";

interface UseEntityListControllerOptions<
  TEntity,
  TFilters extends Record<string, unknown>,
  TKey extends EntityKey,
> {
  definition: EntityListDefinition<TEntity, TFilters, TKey>;
  stateMode?: "memory" | "url";
  searchDebounceMs?: number;
}

export function useEntityListController<
  TEntity,
  TFilters extends Record<string, unknown>,
  TKey extends EntityKey = EntityKey,
>({
  definition,
  stateMode,
  searchDebounceMs,
}: UseEntityListControllerOptions<TEntity, TFilters, TKey>) {
  const initialState = useMemo(
    () => ({
      page: 1,
      pageSize: definition.initialState.pageSize,
      search: "",
      sort: definition.initialState.sort,
      filters: definition.initialState.filters,
    }),
    [definition.initialState],
  );
  const listState = useEntityListState({ initialState, mode: stateMode, searchDebounceMs });
  const [selection, setSelection] = useState<EntitySelection<TKey>>(() => createEmptySelection<TKey>());
  const tenantId = useSelectedTenantId();
  const tenantCacheScope = tenantId ?? "none";

  const query = useQuery({
    queryKey: ["entity-list", definition.id, tenantCacheScope, listState.state],
    queryFn: () => definition.dataSource.query(listState.state),
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2] === tenantCacheScope ? keepPreviousData(previousData) : undefined,
  });

  const querySignature = JSON.stringify([tenantCacheScope, listState.state]);
  useEffect(() => {
    setSelection(createEmptySelection<TKey>());
  }, [querySignature]);

  const page = query.data;

  const setPage = listState.setPage;
  const lastPage = page && page.total > 0 ? Math.max(1, Math.ceil(page.total / page.pageSize)) : null;
  const currentPage = page?.page ?? null;
  useEffect(() => {
    if (lastPage === null || currentPage === null) return;
    if (currentPage > lastPage) setPage(lastPage);
  }, [currentPage, lastPage, setPage]);
  const selectedCount = getSelectedCount(selection, page?.total ?? 0);

  return {
    ...listState,
    query,
    page,
    selection,
    selectedCount,
    toggleSelection: (key: TKey) =>
      setSelection((current) => {
        if (definition.dataSource.capabilities.selection !== "single") {
          return toggleEntityKey(current, key);
        }

        if (current.mode === "explicit" && current.keys.has(key)) {
          return createEmptySelection<TKey>();
        }
        return { mode: "explicit", keys: new Set([key]) };
      }),
    selectAllMatching: () => {
      if (definition.dataSource.capabilities.selection === "multiple") {
        setSelection(selectAllMatching<TKey>());
      }
    },
    clearSelection: () => setSelection(createEmptySelection<TKey>()),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- entity-list/use-entity-list-controller`
Expected: PASS (4 testes)

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/entity-list/use-entity-list-controller.ts src/presentation/components/organisms/entity-list/use-entity-list-controller.test.tsx
git commit -m "feat: add the entity-list controller wiring query, selection, and tenant isolation"
```

---

### Task 17: `entity-list-table` — variante tabela

**Files:**
- Create: `src/presentation/components/organisms/entity-list/entity-list-table.tsx`
- Test: `src/presentation/components/organisms/entity-list/entity-list-table.test.tsx`

**Interfaces:**
- Consumes: `EntityColumn`, `EntityKey` de `./types` (Task 10); `clsx`
- Produces: `EntityListTable<TEntity, TKey>({ ariaLabel, columns, items, getKey, selection?, onActivate? })`

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/entity-list/entity-list-table.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EntityListTable } from "./entity-list-table";
import type { EntityColumn } from "./types";

interface Row { id: string; name: string; status: string; }

const columns: readonly EntityColumn<Row>[] = [
  { key: "name", header: "Nome", render: (row) => row.name },
  { key: "status", header: "Status", render: (row) => row.status },
];

const items: Row[] = [
  { id: "1", name: "Acme Corp", status: "active" },
  { id: "2", name: "Globex", status: "inactive" },
];

describe("EntityListTable", () => {
  it("renders one header cell per column and one row per item", () => {
    render(<EntityListTable ariaLabel="Tenants" columns={columns} items={items} getKey={(row) => row.id} />);

    expect(screen.getByRole("table", { name: "Tenants" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Nome" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeVisible();
    expect(screen.getByRole("row", { name: /Acme Corp/ })).toBeVisible();
    expect(screen.getByRole("row", { name: /Globex/ })).toBeVisible();
  });

  it("activates a row on click when onActivate is provided", () => {
    const onActivate = vi.fn();
    render(
      <EntityListTable ariaLabel="Tenants" columns={columns} items={items} getKey={(row) => row.id} onActivate={onActivate} />,
    );

    fireEvent.click(screen.getByRole("row", { name: /Acme Corp/ }));
    expect(onActivate).toHaveBeenCalledWith(items[0]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- entity-list-table`
Expected: FAIL com `Failed to resolve import "./entity-list-table"`

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/entity-list/entity-list-table.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import clsx from "clsx";
import type { EntityColumn, EntityKey } from "./types";

interface EntityListTableProps<TEntity, TKey extends EntityKey> {
  ariaLabel: string;
  columns: readonly EntityColumn<TEntity>[];
  items: readonly TEntity[];
  getKey(entity: TEntity): TKey;
  selection?: {
    isSelected(key: TKey): boolean;
    onToggle(key: TKey): void;
  };
  onActivate?(entity: TEntity): void;
}

const ALIGN_CLASS: Record<NonNullable<EntityColumn<unknown>["align"]>, string> = {
  start: "text-left",
  center: "text-center",
  end: "text-right",
};

export function EntityListTable<TEntity, TKey extends EntityKey>({
  ariaLabel,
  columns,
  items,
  getKey,
  selection,
  onActivate,
}: EntityListTableProps<TEntity, TKey>): ReactNode {
  return (
    <table aria-label={ariaLabel} className="w-full overflow-hidden rounded-xl border border-divider bg-content1 text-sm">
      <thead>
        <tr className="border-b border-divider bg-default-50">
          {selection ? <th className="w-10 px-4 py-3" /> : null}
          {columns.map((column) => (
            <th
              key={column.key}
              className={clsx("px-4 py-3 font-medium text-muted-foreground", ALIGN_CLASS[column.align ?? "start"])}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((entity) => {
          const key = getKey(entity);
          return (
            <tr
              key={key}
              className={clsx("border-b border-divider last:border-b-0", onActivate && "cursor-pointer hover:bg-default-50")}
              onClick={() => onActivate?.(entity)}
            >
              {selection ? (
                <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                  <input
                    aria-label={`Selecionar linha ${String(key)}`}
                    checked={selection.isSelected(key)}
                    className="h-4 w-4 accent-primary"
                    type="checkbox"
                    onChange={() => selection.onToggle(key)}
                  />
                </td>
              ) : null}
              {columns.map((column) => (
                <td key={column.key} className={clsx("px-4 py-3", ALIGN_CLASS[column.align ?? "start"])}>
                  {column.render(entity)}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- entity-list-table`
Expected: PASS (2 testes)

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/entity-list/entity-list-table.tsx src/presentation/components/organisms/entity-list/entity-list-table.test.tsx
git commit -m "feat: add the entity-list table variant"
```

---

### Task 18: `entity-list-filters` + `entity-list-toolbar`

**Files:**
- Create: `src/presentation/components/organisms/entity-list/entity-list-filters.tsx`
- Create: `src/presentation/components/organisms/entity-list/entity-list-toolbar.tsx`
- Test: `src/presentation/components/organisms/entity-list/entity-list-primitives.test.tsx`

**Interfaces:**
- Consumes: `EntityFilterDefinition` de `./types` (Task 10); `lucide-react` (`Search`)
- Produces: `EntityListFilters<TFilters>({ definitions, values, onChange })`, `EntityListToolbar({ searchValue, onSearchChange, actions?, showSearch? })`

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/entity-list/entity-list-primitives.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EntityListFilters } from "./entity-list-filters";
import { EntityListToolbar } from "./entity-list-toolbar";

describe("entity-list primitives", () => {
  it("updates search and a single facet", () => {
    const onSearchChange = vi.fn();
    const onFilterChange = vi.fn();

    render(
      <>
        <EntityListToolbar searchValue="" onSearchChange={onSearchChange} />
        <EntityListFilters
          definitions={[
            { key: "status", label: "Status", kind: "single", options: [{ value: "active", label: "Ativo" }] },
          ]}
          values={{ status: "" }}
          onChange={onFilterChange}
        />
      </>,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar" }), { target: { value: "Ana" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Status" }), { target: { value: "active" } });

    expect(onSearchChange).toHaveBeenCalledWith("Ana");
    expect(onFilterChange).toHaveBeenCalledWith("status", "active");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- entity-list-primitives`
Expected: FAIL com `Failed to resolve import "./entity-list-filters"`

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/entity-list/entity-list-filters.tsx`:

```tsx
"use client";

import type { EntityFilterDefinition } from "./types";

interface EntityListFiltersProps<TFilters extends object> {
  definitions: readonly EntityFilterDefinition<TFilters>[];
  values: TFilters;
  onChange(key: Extract<keyof TFilters, string>, value: unknown): void;
}

export function EntityListFilters<TFilters extends Record<string, unknown>>({
  definitions,
  values,
  onChange,
}: EntityListFiltersProps<TFilters>) {
  return (
    <div className="space-y-4">
      {definitions.map((definition) => {
        if (!definition.options || definition.kind === "custom") return null;
        const value = String(values[definition.key] ?? "");
        return (
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground" key={definition.key}>
            {definition.label}
            <select
              aria-label={definition.label}
              className="min-h-11 rounded-lg border border-border bg-background px-2 text-sm font-normal"
              value={value}
              onChange={(event) => onChange(definition.key, event.target.value)}
            >
              <option value="">Todos</option>
              {definition.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}{option.count === undefined ? "" : ` (${option.count})`}
                </option>
              ))}
            </select>
          </label>
        );
      })}
    </div>
  );
}
```

`src/presentation/components/organisms/entity-list/entity-list-toolbar.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";

interface EntityListToolbarProps {
  searchValue: string;
  onSearchChange(value: string): void;
  actions?: ReactNode;
  showSearch?: boolean;
}

export function EntityListToolbar({
  searchValue,
  onSearchChange,
  actions,
  showSearch = true,
}: EntityListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {showSearch ? (
        <label className="relative block min-w-0 flex-1 sm:max-w-md">
          <span className="sr-only">Buscar</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            aria-label="Buscar"
            className="min-h-11 w-full rounded-xl border border-border bg-content1 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      ) : (
        <span className="flex-1" />
      )}
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- entity-list-primitives`
Expected: PASS (1 teste)

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/entity-list/entity-list-filters.tsx src/presentation/components/organisms/entity-list/entity-list-toolbar.tsx src/presentation/components/organisms/entity-list/entity-list-primitives.test.tsx
git commit -m "feat: add entity-list search toolbar and facet filters"
```

---

### Task 19: `entity-list-pagination`

**Files:**
- Create: `src/presentation/components/organisms/entity-list/entity-list-pagination.tsx`
- Test: `src/presentation/components/organisms/entity-list/entity-list-pagination.test.tsx`

**Interfaces:**
- Consumes: `Button` de `@/src/presentation/components/atoms/shadcn-ui/button`; `lucide-react` (`ChevronLeft`, `ChevronRight`)
- Produces: `EntityListPagination({ page, pageSize, totalItems, onPageChange })`

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/entity-list/entity-list-pagination.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EntityListPagination } from "./entity-list-pagination";

describe("EntityListPagination", () => {
  it("reports the visible range and advances to the next page", () => {
    const onPageChange = vi.fn();

    render(<EntityListPagination page={2} pageSize={25} totalItems={81} onPageChange={onPageChange} />);

    expect(screen.getByText("26–50 de 81")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- entity-list-pagination`
Expected: FAIL com `Failed to resolve import "./entity-list-pagination"`

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/entity-list/entity-list-pagination.tsx`:

```tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";

interface EntityListPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange(page: number): void;
}

export function EntityListPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: EntityListPaginationProps) {
  if (totalItems === 0) return null;

  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const from = (currentPage - 1) * safePageSize + 1;
  const to = Math.min(currentPage * safePageSize, totalItems);

  return (
    <nav aria-label="Paginação" className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">{`${from}–${to} de ${totalItems}`}</p>
      <div className="flex items-center gap-2">
        <Button
          aria-label="Página anterior"
          className="min-h-11 min-w-11"
          disabled={currentPage <= 1}
          size="icon"
          type="button"
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </Button>
        <span className="min-w-16 text-center text-sm text-muted-foreground">
          {`${currentPage} / ${totalPages}`}
        </span>
        <Button
          aria-label="Próxima página"
          className="min-h-11 min-w-11"
          disabled={currentPage >= totalPages}
          size="icon"
          type="button"
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- entity-list-pagination`
Expected: PASS (1 teste)

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/entity-list/entity-list-pagination.tsx src/presentation/components/organisms/entity-list/entity-list-pagination.test.tsx
git commit -m "feat: add entity-list pagination with visible-range label"
```

---

### Task 20: `entity-list-states` — carregando / vazio / erro

**Files:**
- Create: `src/presentation/components/organisms/entity-list/entity-list-states.tsx`

**Interfaces:**
- Consumes: `Button` de `@/src/presentation/components/atoms/shadcn-ui/button`; `lucide-react` (`AlertCircle`, `LoaderCircle`)
- Produces: `EntityListStates({ state: "loading" | "empty" | "error", onRetry? })`
- Nota: os três estados já são cobertos pelo teste de composição da Task 24 (`entity-list.test.tsx` exercita loading/empty/error através de `EntityList`); não há teste isolado nesta task.

- [ ] **Step 1: Write minimal implementation**

`src/presentation/components/organisms/entity-list/entity-list-states.tsx`:

```tsx
"use client";

import { AlertCircle, LoaderCircle } from "lucide-react";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";

interface EntityListStatesProps {
  state: "loading" | "empty" | "error";
  onRetry?: () => void;
}

export function EntityListStates({ state, onRetry }: EntityListStatesProps) {
  if (state === "loading") {
    return (
      <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Carregando
      </div>
    );
  }
  if (state === "empty") {
    return (
      <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
        Nenhum item encontrado
      </div>
    );
  }
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-muted-foreground" role="alert">
      <AlertCircle className="h-5 w-5" />
      Não foi possível carregar os itens
      {onRetry ? (
        <Button size="sm" type="button" variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/presentation/components/organisms/entity-list/entity-list-states.tsx
git commit -m "feat: add entity-list loading, empty, and error states"
```

---

### Task 21: `entity-row-actions` — menu de ações da linha

**Files:**
- Create: `src/presentation/components/organisms/entity-list/entity-row-actions.tsx`
- Test: `src/presentation/components/organisms/entity-list/entity-row-actions.test.tsx`

**Interfaces:**
- Consumes: `Dropdown`, `DropdownItem`, `DropdownMenu`, `DropdownTrigger` de `@heroui/react`; `lucide-react` (`MoreVertical`, `LucideIcon`)
- Produces: `EntityRowAction { key, label, icon: LucideIcon, tone?, onSelect() }`, `EntityRowActions({ ariaLabel, actions })`

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/entity-list/entity-row-actions.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pencil, Trash2 } from "lucide-react";
import { EntityRowActions } from "./entity-row-actions";

describe("EntityRowActions", () => {
  it("opens the menu and calls onSelect for the chosen action", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <EntityRowActions
        ariaLabel="Ações de Ana Silva"
        actions={[
          { key: "edit", label: "Editar", icon: Pencil, onSelect: onEdit },
          { key: "delete", label: "Excluir", icon: Trash2, tone: "danger", onSelect: onDelete },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ações de Ana Silva" }));
    fireEvent.click(await screen.findByText("Excluir"));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("renders nothing when there are no actions", () => {
    const { container } = render(<EntityRowActions ariaLabel="Ações de Ana Silva" actions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- entity-row-actions`
Expected: FAIL com `Failed to resolve import "./entity-row-actions"`

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/entity-list/entity-row-actions.tsx`:

```tsx
"use client";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { MoreVertical, type LucideIcon } from "lucide-react";

export interface EntityRowAction {
  key: string;
  label: string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "danger";
  onSelect(): void;
}

interface EntityRowActionsProps {
  ariaLabel: string;
  actions: readonly EntityRowAction[];
}

const TONE_CLASS: Record<NonNullable<EntityRowAction["tone"]>, string> = {
  default: "text-foreground",
  warning: "text-warning",
  danger: "text-danger",
};

export function EntityRowActions({ ariaLabel, actions }: EntityRowActionsProps) {
  if (actions.length === 0) return null;

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <button
          aria-label={ariaLabel}
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-default-100 hover:text-foreground"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownTrigger>
      <DropdownMenu aria-label={ariaLabel} variant="flat">
        {actions.map(({ key, label, icon: Icon, tone = "default", onSelect }) => (
          <DropdownItem
            key={key}
            className={TONE_CLASS[tone]}
            color={tone === "danger" ? "danger" : "default"}
            startContent={<Icon className="h-4 w-4" />}
            onPress={onSelect}
          >
            {label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- entity-row-actions`
Expected: PASS (2 testes)

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/entity-list/entity-row-actions.tsx src/presentation/components/organisms/entity-list/entity-row-actions.test.tsx
git commit -m "feat: add the entity-list row actions dropdown"
```

---

### Task 22: `entity-list-layout` — grade filtros/conteúdo com gaveta no mobile

**Files:**
- Create: `src/presentation/components/organisms/entity-list/entity-list-layout.tsx`
- Test: `src/presentation/components/organisms/entity-list/entity-list-layout.test.tsx`

**Interfaces:**
- Consumes: `Button` de `@/src/presentation/components/atoms/shadcn-ui/button`; `Sheet`, `SheetContent`, `SheetDescription`, `SheetHeader`, `SheetTitle`, `SheetTrigger` de `@/src/presentation/components/atoms/shadcn-ui/sheet`; `lucide-react` (`Filter`)
- Produces: `EntityListLayout({ filters?, toolbar?, bulkBar?, children, pagination? })`

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/entity-list/entity-list-layout.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EntityListLayout } from "./entity-list-layout";

describe("EntityListLayout", () => {
  it("keeps filters in a desktop sidebar and exposes them through a mobile sheet", () => {
    render(
      <EntityListLayout filters={<p>Filtros de leads</p>} toolbar={<p>Buscar leads</p>}>
        <p>Linhas de leads</p>
      </EntityListLayout>,
    );

    expect(screen.getByRole("complementary", { name: "Filtros" })).toHaveTextContent("Filtros de leads");
    expect(screen.getByText("Buscar leads")).toBeVisible();
    expect(screen.getByText("Linhas de leads")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Abrir filtros" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Filtros de leads");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- entity-list-layout`
Expected: FAIL com `Failed to resolve import "./entity-list-layout"`

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/entity-list/entity-list-layout.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/src/presentation/components/atoms/shadcn-ui/sheet";

interface EntityListLayoutProps {
  filters?: ReactNode;
  toolbar?: ReactNode;
  bulkBar?: ReactNode;
  children: ReactNode;
  pagination?: ReactNode;
}

export function EntityListLayout({
  filters,
  toolbar,
  bulkBar,
  children,
  pagination,
}: EntityListLayoutProps) {
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
      {filters ? (
        <aside aria-label="Filtros" className="hidden lg:block">
          <div className="sticky top-6 rounded-xl border border-divider bg-content1 p-4">
            {filters}
          </div>
        </aside>
      ) : null}
      <section className="min-w-0 space-y-4">
        {filters ? (
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button aria-label="Abrir filtros" className="min-h-11" size="sm" variant="outline">
                  <Filter aria-hidden="true" className="h-4 w-4" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                  <SheetDescription>Filtre a lista atual.</SheetDescription>
                </SheetHeader>
                <div className="overflow-y-auto p-6">{filters}</div>
              </SheetContent>
            </Sheet>
          </div>
        ) : null}
        {toolbar}
        {bulkBar}
        {children}
        {pagination}
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- entity-list-layout`
Expected: PASS (1 teste)

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/entity-list/entity-list-layout.tsx src/presentation/components/organisms/entity-list/entity-list-layout.test.tsx
git commit -m "feat: add entity-list layout with a mobile filter sheet"
```

---

### Task 23: `entity-list-item` — linha de card com trilha de status e seleção

**Files:**
- Create: `src/presentation/components/organisms/entity-list/entity-list-item.tsx`
- Test: `src/presentation/components/organisms/entity-list/entity-list-item.test.tsx`

**Interfaces:**
- Consumes: `clsx`
- Produces: `EntityListItem({ title, description?, identity?, badges?, metadata?, trailing?, status?, actions?, selectable?, onActivate? })`

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/entity-list/entity-list-item.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EntityListItem } from "./entity-list-item";

describe("EntityListItem", () => {
  it("supports accessible selection and keyboard row activation", () => {
    const onActivate = vi.fn();
    const onSelectionChange = vi.fn();

    render(
      <ul>
        <EntityListItem
          title="Ana Silva"
          description="ana@example.com"
          status={{ label: "Ativo", tone: "success" }}
          selectable={{ label: "Selecionar Ana Silva", selected: false, onSelectionChange }}
          onActivate={onActivate}
        />
      </ul>,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Selecionar Ana Silva" }));
    fireEvent.keyDown(screen.getByRole("button", { name: "Ana Silva" }), { key: "Enter" });

    expect(onSelectionChange).toHaveBeenCalledWith(true);
    expect(onActivate).toHaveBeenCalledOnce();
    expect(screen.getByText("Ativo")).toBeVisible();
  });

  it("does not activate the row when an action is clicked", () => {
    const onActivate = vi.fn();
    const onEdit = vi.fn();

    render(
      <ul>
        <EntityListItem title="Ana Silva" actions={<button onClick={onEdit}>Editar Ana</button>} onActivate={onActivate} />
      </ul>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Editar Ana" }));

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onActivate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- entity-list-item`
Expected: FAIL com `Failed to resolve import "./entity-list-item"`

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/entity-list/entity-list-item.tsx`:

```tsx
"use client";

import type { KeyboardEvent, ReactNode } from "react";
import clsx from "clsx";

type EntityStatusTone = "default" | "success" | "warning" | "danger" | "primary" | "secondary";

interface EntityListItemProps {
  title: ReactNode;
  description?: ReactNode;
  identity?: ReactNode;
  badges?: ReactNode;
  metadata?: ReactNode;
  trailing?: ReactNode;
  status?: { label: string; tone: EntityStatusTone };
  actions?: ReactNode;
  selectable?: {
    label: string;
    selected: boolean;
    onSelectionChange(selected: boolean): void;
  };
  onActivate?: () => void;
}

const statusClasses: Record<EntityStatusTone, string> = {
  default: "bg-default-400",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  primary: "bg-primary",
  secondary: "bg-secondary",
};

export function EntityListItem({
  title,
  description,
  identity,
  badges,
  metadata,
  trailing,
  status,
  actions,
  selectable,
  onActivate,
}: EntityListItemProps) {
  const titleText = typeof title === "string" ? title : "Abrir item";
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onActivate?.();
  };

  return (
    <li className="relative flex min-w-0 gap-3 border-b border-divider px-4 py-3 last:border-b-0">
      {status ? (
        <span
          aria-label={`Status: ${status.label}`}
          className={clsx("absolute inset-y-0 left-0 w-1", statusClasses[status.tone])}
          role="img"
        />
      ) : null}
      {selectable ? (
        <input
          aria-label={selectable.label}
          checked={selectable.selected}
          className="mt-1 h-4 w-4 shrink-0 accent-primary"
          type="checkbox"
          onChange={(event) => selectable.onSelectionChange(event.target.checked)}
          onClick={(event) => event.stopPropagation()}
        />
      ) : null}
      <div
        aria-label={titleText}
        className={clsx(
          "min-w-0 flex-1",
          onActivate && "cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary",
        )}
        role={onActivate ? "button" : undefined}
        tabIndex={onActivate ? 0 : undefined}
        onClick={onActivate}
        onKeyDown={onKeyDown}
      >
        <div className="flex min-w-0 items-start gap-3">
          {identity ? <div className="shrink-0">{identity}</div> : null}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium text-foreground">{title}</p>
              {badges ? <div className="flex flex-wrap gap-1">{badges}</div> : null}
              {status ? <span className="text-xs font-medium text-muted-foreground">{status.label}</span> : null}
            </div>
            {description ? <div className="mt-0.5 text-sm text-muted-foreground">{description}</div> : null}
            {metadata ? (
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">{metadata}</div>
            ) : null}
          </div>
          {trailing ? <div className="hidden shrink-0 text-sm text-muted-foreground sm:block">{trailing}</div> : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-start gap-1" onClick={(event) => event.stopPropagation()}>
          {actions}
        </div>
      ) : null}
    </li>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- entity-list-item`
Expected: PASS (2 testes)

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/entity-list/entity-list-item.tsx src/presentation/components/organisms/entity-list/entity-list-item.test.tsx
git commit -m "feat: add the entity-list card item with status rail and keyboard activation"
```

---

### Task 24: `EntityList` — composição pública, alvo de toque e tipos de variante

Junta todas as peças das Tasks 10–23 no componente público `EntityList`. Inclui `entity-list-touch-targets.test.tsx` (todo controle de lista tem alvo mínimo de 44px, `min-h-11`/`min-w-11`) — o mesmo padrão que a Task 37 vai espelhar para as peças de `resource-list`.

**Files:**
- Create: `src/presentation/components/organisms/entity-list/entity-list.tsx`
- Create: `src/presentation/components/organisms/entity-list/index.ts`
- Test: `src/presentation/components/organisms/entity-list/entity-list.test.tsx`
- Test: `src/presentation/components/organisms/entity-list/entity-list-touch-targets.test.tsx`

**Interfaces:**
- Consumes: todas as peças das Tasks 10–23
- Produces: `EntityList<TEntity, TFilters, TKey>({ definition, stateMode?, searchDebounceMs? })`; barrel `index.ts` reexportando o contrato público da plataforma

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/entity-list/entity-list-touch-targets.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EntityListFilters } from "./entity-list-filters";
import { EntityListLayout } from "./entity-list-layout";
import { EntityListPagination } from "./entity-list-pagination";
import { EntityListToolbar } from "./entity-list-toolbar";

describe("entity-list touch targets", () => {
  it("gives search and filter controls a minimum 44px height", () => {
    render(
      <>
        <EntityListToolbar searchValue="" onSearchChange={vi.fn()} />
        <EntityListFilters
          definitions={[{ key: "status", label: "Status", kind: "single", options: [{ value: "active", label: "Ativo" }] }]}
          values={{ status: "" }}
          onChange={vi.fn()}
        />
      </>,
    );

    expect(screen.getByRole("searchbox", { name: "Buscar" })).toHaveClass("min-h-11");
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveClass("min-h-11");
  });

  it("gives the mobile filter trigger a minimum 44px height", () => {
    render(
      <EntityListLayout filters={<p>Filtros</p>}>
        <p>Linhas</p>
      </EntityListLayout>,
    );

    expect(screen.getByRole("button", { name: "Abrir filtros" })).toHaveClass("min-h-11");
  });

  it("gives pagination icon controls a minimum 44px square target", () => {
    render(<EntityListPagination page={2} pageSize={10} totalItems={30} onPageChange={vi.fn()} />);

    for (const name of ["Página anterior", "Próxima página"]) {
      expect(screen.getByRole("button", { name })).toHaveClass("min-h-11", "min-w-11");
    }
  });
});
```

`src/presentation/components/organisms/entity-list/entity-list.test.tsx`:

```tsx
import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/src/shared/query/test-query-provider";
import { EntityList } from "./entity-list";
import { EntityListItem } from "./entity-list-item";
import type { EntityListDefinition } from "./types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/contacts",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/src/shared/stores/tenant-store", () => ({
  useSelectedTenantId: () => "tenant-1",
}));

const definition: EntityListDefinition<{ id: string; name: string }, { status: string }> = {
  id: "contacts",
  ariaLabel: "Contatos",
  getKey: (contact) => contact.id,
  dataSource: {
    capabilities: { search: "server", sort: "server", pagination: "server", selection: "multiple" },
    query: vi.fn().mockResolvedValue({
      items: [{ id: "contact-1", name: "Ada Lovelace" }],
      total: 1,
      page: 1,
      pageSize: 30,
    }),
  },
  initialState: { pageSize: 30, filters: { status: "" } },
  filters: [{ key: "status", label: "Status", kind: "single", options: [{ value: "active", label: "Ativo" }] }],
  sorts: [],
  renderItem: (contact, context) => (
    <EntityListItem
      selectable={
        context.selectable
          ? { label: `Selecionar ${contact.name}`, selected: context.selected, onSelectionChange: context.onSelectionChange }
          : undefined
      }
      title={contact.name}
    />
  ),
};

function renderList<TEntity, TFilters extends Record<string, unknown>>(
  listDefinition: EntityListDefinition<TEntity, TFilters> = definition as never,
) {
  const client = createTestQueryClient();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<EntityList definition={listDefinition} searchDebounceMs={0} />, { wrapper });
}

describe("EntityList", () => {
  it("renders narrative items and connects their selectable state", async () => {
    renderList();

    await waitFor(() => expect(screen.getByText("Ada Lovelace")).toBeInTheDocument());
    const checkbox = screen.getByRole("checkbox", { name: "Selecionar Ada Lovelace" });
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByText("1 selecionado(s)")).toBeInTheDocument();
  });

  it("hides search when the data source does not support it", async () => {
    renderList({
      ...definition,
      dataSource: { ...definition.dataSource, capabilities: { ...definition.dataSource.capabilities, search: false } },
    });

    await waitFor(() => expect(screen.getByText("Ada Lovelace")).toBeInTheDocument());
    expect(screen.queryByRole("searchbox", { name: "Buscar" })).not.toBeInTheDocument();
  });

  it('renders a table when the definition declares variant: "table"', async () => {
    const items = [{ id: "1", name: "Acme Corp" }];
    const tableDefinition: EntityListDefinition<{ id: string; name: string }, Record<string, never>> = {
      id: "widgets-table",
      ariaLabel: "Widgets",
      getKey: (w) => w.id,
      dataSource: {
        capabilities: { search: false, sort: false, pagination: "local", selection: "none" },
        query: vi.fn().mockResolvedValue({ items, total: items.length, page: 1, pageSize: 30 }),
      },
      initialState: { pageSize: 30, filters: {} },
      filters: [],
      sorts: [],
      variant: "table",
      columns: [{ key: "name", header: "Nome", render: (w) => w.name }],
    };

    renderList(tableDefinition);

    expect(await screen.findByRole("table", { name: "Widgets" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Nome" })).toBeVisible();
    expect(screen.getByText("Acme Corp")).toBeVisible();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- entity-list.test entity-list-touch-targets`
Expected: FAIL com `Failed to resolve import "./entity-list"`

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/entity-list/entity-list.tsx`:

```tsx
"use client";

import { Fragment } from "react";
import { EntityListFilters } from "./entity-list-filters";
import { EntityListLayout } from "./entity-list-layout";
import { EntityListPagination } from "./entity-list-pagination";
import { EntityListStates } from "./entity-list-states";
import { EntityListTable } from "./entity-list-table";
import { EntityListToolbar } from "./entity-list-toolbar";
import type { EntityKey, EntityListDefinition } from "./types";
import { useEntityListController } from "./use-entity-list-controller";

interface EntityListProps<
  TEntity,
  TFilters extends Record<string, unknown>,
  TKey extends EntityKey,
> {
  definition: EntityListDefinition<TEntity, TFilters, TKey>;
  stateMode?: "memory" | "url";
  searchDebounceMs?: number;
}

export function EntityList<
  TEntity,
  TFilters extends Record<string, unknown>,
  TKey extends EntityKey = EntityKey,
>({
  definition,
  stateMode,
  searchDebounceMs,
}: EntityListProps<TEntity, TFilters, TKey>) {
  const controller = useEntityListController({ definition, stateMode, searchDebounceMs });
  const canSelect = definition.dataSource.capabilities.selection !== "none";
  const page = controller.page;
  const showInitialLoading = controller.query.isLoading && !page;

  return (
    <EntityListLayout
      filters={
        definition.filters.length > 0 ? (
          <EntityListFilters
            definitions={definition.filters}
            values={controller.state.filters}
            onChange={(key, value) => controller.setFilter(key, value as TFilters[typeof key])}
          />
        ) : undefined
      }
      toolbar={
        <EntityListToolbar
          actions={definition.primaryActions}
          searchValue={controller.searchInput}
          onSearchChange={controller.setSearch}
          showSearch={definition.dataSource.capabilities.search !== false}
        />
      }
      bulkBar={
        canSelect && controller.selectedCount > 0 ? (
          <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-foreground">
            {`${controller.selectedCount} selecionado(s)`}
          </div>
        ) : undefined
      }
      pagination={
        page ? (
          <EntityListPagination
            page={page.page}
            pageSize={page.pageSize}
            totalItems={page.total}
            onPageChange={controller.setPage}
          />
        ) : undefined
      }
    >
      {showInitialLoading ? <EntityListStates state="loading" /> : null}
      {controller.query.isError ? (
        <EntityListStates state="error" onRetry={() => void controller.query.refetch()} />
      ) : null}
      {!showInitialLoading && !controller.query.isError && page?.items.length === 0 ? (
        <EntityListStates state="empty" />
      ) : null}
      {!showInitialLoading && !controller.query.isError && page && page.items.length > 0 ? (
        definition.variant === "table" ? (
          <EntityListTable
            ariaLabel={definition.ariaLabel}
            columns={definition.columns}
            items={page.items}
            getKey={definition.getKey}
            onActivate={definition.onActivate}
            selection={
              canSelect
                ? {
                    isSelected: (key) =>
                      controller.selection.mode === "allMatching"
                        ? !controller.selection.excludedKeys.has(key)
                        : controller.selection.keys.has(key),
                    onToggle: (key) => controller.toggleSelection(key),
                  }
                : undefined
            }
          />
        ) : (
          <ul
            aria-label={definition.ariaLabel}
            className={definition.listClassName ?? "overflow-hidden rounded-xl border border-divider bg-content1"}
          >
            {page.items.map((entity) => {
              const key = definition.getKey(entity);
              const selected =
                controller.selection.mode === "allMatching"
                  ? !controller.selection.excludedKeys.has(key)
                  : controller.selection.keys.has(key);
              return (
                <Fragment key={key}>
                  {definition.renderItem(entity, {
                    selected,
                    selectable: canSelect,
                    onSelectionChange: () => controller.toggleSelection(key),
                  })}
                </Fragment>
              );
            })}
          </ul>
        )
      ) : null}
    </EntityListLayout>
  );
}
```

`src/presentation/components/organisms/entity-list/index.ts`:

```ts
export { EntityList } from "./entity-list";
export { EntityListItem } from "./entity-list-item";
export { EntityListTable } from "./entity-list-table";
export { EntityRowActions, type EntityRowAction } from "./entity-row-actions";
export { useEntityListController } from "./use-entity-list-controller";
export { useEntityListState } from "./use-entity-list-state";
export { assertEntityListCapabilities } from "./capabilities";
export { applyLocalEntityQuery, LocalEntityLimitError } from "./local-query";
export {
  applyOptimisticEntityUpdate,
  entityListQueryScope,
  removeOptimisticEntity,
  restoreEntityListSnapshot,
  snapshotEntityListPages,
} from "./optimistic";
export { parseEntityListQuery, serializeEntityListQuery } from "./query-state";
export {
  createEmptySelection,
  getSelectedCount,
  selectAllMatching,
  selectVisibleKeys,
  toggleEntityKey,
  type EntitySelection,
} from "./selection";
export { assertCardsDefinition } from "./types";
export type {
  EntityColumn,
  EntityFilterDefinition,
  EntityFilterOption,
  EntityKey,
  EntityListCapabilities,
  EntityListDataSource,
  EntityListDefinition,
  EntityListItemRenderContext,
  EntityListRequest,
  EntityPage,
  EntitySort,
  EntitySortDefinition,
} from "./types";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- entity-list.test entity-list-touch-targets`
Expected: PASS (3 + 3 testes)

Rode a suíte inteira da plataforma para fechar as Tasks 10–24 juntas:

Run: `npm run test:run -- entity-list`
Expected: PASS (todos os arquivos de `entity-list/`)

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/entity-list/entity-list.tsx src/presentation/components/organisms/entity-list/index.ts src/presentation/components/organisms/entity-list/entity-list.test.tsx src/presentation/components/organisms/entity-list/entity-list-touch-targets.test.tsx
git commit -m "feat: compose the public EntityList component and its barrel export"
```

---
### Task 25: `entity-actions` — descritores e máquina de estado

Modela a ação de linha (editar, excluir, arquivar, ...) como uma máquina de estado explícita: `openEdit`/`openConfirm` abrem, `start` marca em andamento, `fail` guarda o erro sem fechar o diálogo, `complete` limpa tudo, `close` recusa fechar uma ação pendente a menos que `force: true`.

**Files:**
- Create: `src/presentation/components/organisms/entity-actions/types.ts`
- Create: `src/presentation/components/organisms/entity-actions/entity-actions-reducer.ts`
- Test: `src/presentation/components/organisms/entity-actions/entity-actions-reducer.test.ts`

**Interfaces:**
- Produces: `EntityActionKind`, `EditActionDescriptor<TEntity>`, `ConfirmActionDescriptor<TEntity>`, `EntityActionState`, `EntityActionsEvent`, `initialEntityActionState`, `entityActionsReducer(state, event): EntityActionState`

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/entity-actions/entity-actions-reducer.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { entityActionsReducer, initialEntityActionState } from "./entity-actions-reducer";
import type { ConfirmActionDescriptor } from "./types";

const descriptor: ConfirmActionDescriptor<{ id: string }> = {
  kind: "delete",
  entity: { id: "contact-1" },
  title: "Excluir contato",
  description: "Esta ação não pode ser desfeita.",
  confirmLabel: "Excluir",
  successMessage: "Contato excluído",
  tone: "danger",
  mutation: async () => undefined,
  invalidate: [["contacts"]],
};

describe("entityActionsReducer", () => {
  it("keeps a failed confirmation open with its descriptor and error", () => {
    const open = entityActionsReducer(initialEntityActionState, { type: "openConfirm", descriptor });
    const pending = entityActionsReducer(open, { type: "start" });
    const failed = entityActionsReducer(pending, { type: "fail", error: new Error("Falha de rede") });

    expect(failed).toMatchObject({ descriptor, pending: false });
    expect(failed.error).toBeInstanceOf(Error);
  });

  it("does not close a pending action unless forced", () => {
    const open = entityActionsReducer(initialEntityActionState, { type: "openConfirm", descriptor });
    const pending = entityActionsReducer(open, { type: "start" });

    expect(entityActionsReducer(pending, { type: "close" })).toEqual(pending);
    expect(entityActionsReducer(pending, { type: "close", force: true })).toEqual(initialEntityActionState);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- entity-actions-reducer`
Expected: FAIL com `Failed to resolve import "./entity-actions-reducer"`

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/entity-actions/types.ts`:

```ts
import type { ReactNode } from "react";

export type EntityActionKind = "edit" | "delete" | "archive" | "deactivate" | "restore" | "custom";

export interface EditActionDescriptor<TEntity> {
  kind: "edit";
  entity: TEntity;
  title: string;
  render(context: { close(): void; complete(): Promise<void> }): ReactNode;
}

export interface ConfirmActionDescriptor<TEntity> {
  kind: Exclude<EntityActionKind, "edit">;
  entity: TEntity;
  title: string;
  description: string;
  confirmLabel: string;
  entityLabel?: string;
  successMessage: string;
  tone: "default" | "warning" | "danger";
  mutation(entity: TEntity): Promise<unknown>;
  invalidate: readonly (readonly unknown[])[];
}

export interface EntityActionState {
  descriptor: EditActionDescriptor<unknown> | ConfirmActionDescriptor<unknown> | null;
  pending: boolean;
  error: Error | null;
}
```

`src/presentation/components/organisms/entity-actions/entity-actions-reducer.ts`:

```ts
import type { ConfirmActionDescriptor, EditActionDescriptor, EntityActionState } from "./types";

export const initialEntityActionState: EntityActionState = {
  descriptor: null,
  pending: false,
  error: null,
};

export type EntityActionsEvent =
  | { type: "openEdit"; descriptor: EditActionDescriptor<unknown> }
  | { type: "openConfirm"; descriptor: ConfirmActionDescriptor<unknown> }
  | { type: "start" }
  | { type: "fail"; error: Error }
  | { type: "complete" }
  | { type: "close"; force?: boolean };

export function entityActionsReducer(
  state: EntityActionState,
  event: EntityActionsEvent,
): EntityActionState {
  switch (event.type) {
    case "openEdit":
    case "openConfirm":
      return { descriptor: event.descriptor, pending: false, error: null };
    case "start":
      return state.descriptor ? { ...state, pending: true, error: null } : state;
    case "fail":
      return state.descriptor ? { ...state, pending: false, error: event.error } : state;
    case "complete":
      return initialEntityActionState;
    case "close":
      return state.pending && !event.force ? state : initialEntityActionState;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- entity-actions-reducer`
Expected: PASS (2 testes)

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/entity-actions/types.ts src/presentation/components/organisms/entity-actions/entity-actions-reducer.ts src/presentation/components/organisms/entity-actions/entity-actions-reducer.test.ts
git commit -m "feat: add the entity-actions descriptor types and state machine"
```

---

### Task 26: `entity-actions` — executor de ação em massa

**Files:**
- Create: `src/presentation/components/organisms/entity-actions/bulk-executor.ts`
- Test: `src/presentation/components/organisms/entity-actions/bulk-executor.test.ts`

**Interfaces:**
- Produces: `BulkExecutionResult<TKey>`, `BulkExecutorOptions`, `executeEntityBulkAction<TKey>(keys, mutation, options?): Promise<BulkExecutionResult<TKey>>`

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/entity-actions/bulk-executor.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { executeEntityBulkAction } from "./bulk-executor";

describe("executeEntityBulkAction", () => {
  it("caps work at the configured concurrency and reports partial failures", async () => {
    let active = 0;
    let peak = 0;
    const result = await executeEntityBulkAction(
      [1, 2, 3, 4, 5],
      async (key) => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        if (key === 3) throw new Error("Rejeitado");
      },
      { concurrency: 2 },
    );

    expect(peak).toBe(2);
    expect(result.succeeded).toEqual([1, 2, 4, 5]);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]?.key).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- bulk-executor`
Expected: FAIL com `Failed to resolve import "./bulk-executor"`

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/entity-actions/bulk-executor.ts`:

```ts
export interface BulkExecutionResult<TKey> {
  succeeded: TKey[];
  failed: Array<{ key: TKey; error: unknown }>;
  unprocessed: TKey[];
}

export interface BulkExecutorOptions {
  concurrency?: number;
  signal?: AbortSignal;
  onProgress?(completed: number, total: number): void;
}

export async function executeEntityBulkAction<TKey>(
  keys: readonly TKey[],
  mutation: (key: TKey) => Promise<unknown>,
  { concurrency = 4, signal, onProgress }: BulkExecutorOptions = {},
): Promise<BulkExecutionResult<TKey>> {
  const result: BulkExecutionResult<TKey> = { succeeded: [], failed: [], unprocessed: [] };
  const limit = Math.max(1, Math.floor(concurrency));
  let next = 0;
  let completed = 0;

  const worker = async () => {
    while (next < keys.length) {
      if (signal?.aborted) return;
      const key = keys[next++];
      try {
        await mutation(key);
        result.succeeded.push(key);
      } catch (error) {
        result.failed.push({ key, error });
      } finally {
        completed += 1;
        onProgress?.(completed, keys.length);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, keys.length) }, worker));
  result.unprocessed.push(...keys.slice(next));
  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- bulk-executor`
Expected: PASS (1 teste)

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/entity-actions/bulk-executor.ts src/presentation/components/organisms/entity-actions/bulk-executor.test.ts
git commit -m "feat: add the concurrency-capped bulk action executor"
```

---

### Task 27: `entity-actions` — provider, host de diálogo e API imperativa

Junta reducer (Task 25) e host de diálogo (`Dialog`/`DialogContent` do shadcn-ui do Reserve) numa API imperativa (`useEntityActions().openDelete(...)`) que qualquer lista pode chamar. O host invalida exatamente as chaves declaradas em `invalidate` e mostra um toast de sucesso via `sonner`.

**Files:**
- Create: `src/presentation/components/organisms/entity-actions/entity-actions-context.ts`
- Create: `src/presentation/components/organisms/entity-actions/entity-actions-provider.tsx`
- Create: `src/presentation/components/organisms/entity-actions/use-entity-actions.ts`
- Create: `src/presentation/components/organisms/entity-actions/entity-action-host.tsx`
- Create: `src/presentation/components/organisms/entity-actions/index.ts`
- Test: `src/presentation/components/organisms/entity-actions/entity-actions-provider.test.tsx`

**Interfaces:**
- Consumes: `entityActionsReducer`, `initialEntityActionState` de `./entity-actions-reducer` (Task 25); `ConfirmActionDescriptor`, `EditActionDescriptor`, `EntityActionState` de `./types` (Task 25); `Button`, `Dialog`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogTitle` de `@/src/presentation/components/atoms/shadcn-ui/*`; `createTestQueryClient` de `@/src/shared/query/test-query-provider` (Task 1)
- Produces: `EntityActionsApi { openEdit, openDelete, openConfirm, close }`, `EntityActionsProvider({ children })`, `useEntityActions(): EntityActionsApi`

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/entity-actions/entity-actions-provider.test.tsx`:

```tsx
import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/src/shared/query/test-query-provider";
import { EntityActionsProvider } from "./entity-actions-provider";
import { useEntityActions } from "./use-entity-actions";

function Harness({ mutation }: { mutation: () => Promise<unknown> }) {
  const actions = useEntityActions();
  return (
    <button
      onClick={() =>
        actions.openDelete({
          entity: { id: "contact-1" },
          title: "Excluir contato",
          description: "Esta ação não pode ser desfeita.",
          confirmLabel: "Excluir",
          successMessage: "Contato excluído",
          tone: "danger",
          mutation,
          invalidate: [["contacts"]],
        })
      }
    >
      Abrir exclusão
    </button>
  );
}

function setup(mutation: () => Promise<unknown>) {
  const client = createTestQueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>
      <EntityActionsProvider>{children}</EntityActionsProvider>
    </QueryClientProvider>
  );
  render(<Harness mutation={mutation} />, { wrapper });
  return { invalidate };
}

describe("EntityActionsProvider", () => {
  it("keeps a failed deletion open and invalidates exact keys on success", async () => {
    const mutation = vi.fn()
      .mockRejectedValueOnce(new Error("Indisponível"))
      .mockResolvedValueOnce(undefined);
    const { invalidate } = setup(mutation);
    fireEvent.click(screen.getByRole("button", { name: "Abrir exclusão" }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    await waitFor(() => expect(screen.getByText("Indisponível")).toBeInTheDocument());
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["contacts"] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- entity-actions-provider`
Expected: FAIL com `Failed to resolve import "./entity-actions-provider"`

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/entity-actions/entity-actions-context.ts`:

```ts
import { createContext } from "react";
import type { ConfirmActionDescriptor, EditActionDescriptor } from "./types";

export interface EntityActionsApi {
  openEdit<TEntity>(descriptor: EditActionDescriptor<TEntity>): void;
  openDelete<TEntity>(descriptor: Omit<ConfirmActionDescriptor<TEntity>, "kind">): void;
  openConfirm<TEntity>(descriptor: ConfirmActionDescriptor<TEntity>): void;
  close(): void;
}

export const EntityActionsContext = createContext<EntityActionsApi | null>(null);
```

`src/presentation/components/organisms/entity-actions/use-entity-actions.ts`:

```ts
"use client";

import { useContext } from "react";
import { EntityActionsContext } from "./entity-actions-context";

export function useEntityActions() {
  const actions = useContext(EntityActionsContext);
  if (!actions) throw new Error("useEntityActions deve ser usado dentro de EntityActionsProvider");
  return actions;
}
```

`src/presentation/components/organisms/entity-actions/entity-action-host.tsx`:

```tsx
"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/presentation/components/atoms/shadcn-ui/dialog";
import type { EntityActionState } from "./types";

interface EntityActionHostProps {
  state: EntityActionState;
  onStart(): void;
  onFail(error: Error): void;
  onComplete(): void;
  onClose(): void;
}

export function EntityActionHost({ state, onStart, onFail, onComplete, onClose }: EntityActionHostProps) {
  const queryClient = useQueryClient();
  const descriptor = state.descriptor;
  const isEdit = descriptor?.kind === "edit";
  const confirm = useCallback(async () => {
    if (!descriptor || descriptor.kind === "edit") return;
    onStart();
    try {
      await descriptor.mutation(descriptor.entity);
      await Promise.all(descriptor.invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      toast.success(descriptor.successMessage);
      onComplete();
    } catch (error) {
      onFail(error instanceof Error ? error : new Error("Não foi possível concluir esta ação."));
    }
  }, [descriptor, onComplete, onFail, onStart, queryClient]);

  if (!descriptor) return null;
  if (isEdit) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{descriptor.title}</DialogTitle>
          </DialogHeader>
          {descriptor.render({ close: onClose, complete: async () => onComplete() })}
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{descriptor.title}</DialogTitle>
          <DialogDescription>{descriptor.description}</DialogDescription>
        </DialogHeader>
        {state.error ? (
          <p className="text-sm text-danger" role="alert">{state.error.message}</p>
        ) : null}
        <DialogFooter>
          <Button disabled={state.pending} type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={state.pending}
            type="button"
            variant={descriptor.tone === "danger" ? "destructive" : "default"}
            onClick={() => void confirm()}
          >
            {state.pending ? "Processando..." : descriptor.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

`src/presentation/components/organisms/entity-actions/entity-actions-provider.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import { useMemo, useReducer } from "react";
import { EntityActionHost } from "./entity-action-host";
import { EntityActionsContext, type EntityActionsApi } from "./entity-actions-context";
import { entityActionsReducer, initialEntityActionState } from "./entity-actions-reducer";
import type { ConfirmActionDescriptor, EditActionDescriptor } from "./types";

export function EntityActionsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(entityActionsReducer, initialEntityActionState);
  const api = useMemo<EntityActionsApi>(
    () => ({
      openEdit: <TEntity,>(descriptor: EditActionDescriptor<TEntity>) =>
        dispatch({ type: "openEdit", descriptor: descriptor as EditActionDescriptor<unknown> }),
      openDelete: <TEntity,>(descriptor: Omit<ConfirmActionDescriptor<TEntity>, "kind">) =>
        dispatch({
          type: "openConfirm",
          descriptor: { ...descriptor, kind: "delete" } as ConfirmActionDescriptor<unknown>,
        }),
      openConfirm: <TEntity,>(descriptor: ConfirmActionDescriptor<TEntity>) =>
        dispatch({ type: "openConfirm", descriptor: descriptor as ConfirmActionDescriptor<unknown> }),
      close: () => dispatch({ type: "close" }),
    }),
    [],
  );
  return (
    <EntityActionsContext.Provider value={api}>
      {children}
      <EntityActionHost
        state={state}
        onStart={() => dispatch({ type: "start" })}
        onFail={(error) => dispatch({ type: "fail", error })}
        onComplete={() => dispatch({ type: "complete" })}
        onClose={() => dispatch({ type: "close" })}
      />
    </EntityActionsContext.Provider>
  );
}
```

`src/presentation/components/organisms/entity-actions/index.ts`:

```ts
export { EntityActionsProvider } from "./entity-actions-provider";
export { useEntityActions } from "./use-entity-actions";
export type { ConfirmActionDescriptor, EditActionDescriptor, EntityActionKind } from "./types";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- entity-actions-provider`
Expected: PASS (1 teste)

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/entity-actions/entity-actions-context.ts src/presentation/components/organisms/entity-actions/entity-actions-provider.tsx src/presentation/components/organisms/entity-actions/use-entity-actions.ts src/presentation/components/organisms/entity-actions/entity-action-host.tsx src/presentation/components/organisms/entity-actions/index.ts src/presentation/components/organisms/entity-actions/entity-actions-provider.test.tsx
git commit -m "feat: add the entity-actions provider, imperative API, and confirmation dialog host"
```

---

### Task 28: `resource-list` — utilitários de filtro e paginação em memória

Peça mais leve, usada por listas pequenas que não justificam a máquina de `EntityList` inteira (ex.: listas de configuração com poucas dezenas de itens).

**Files:**
- Create: `src/presentation/components/organisms/resource-list/list-utils.ts`
- Test: `src/presentation/components/organisms/resource-list/list-utils.test.ts`

**Interfaces:**
- Produces: `FilterResourcesOptions<T, K>`, `filterResources<T, K>(resources, options): T[]`, `PaginatedResources<T>`, `paginateResources<T>(resources, requestedPage, pageSize): PaginatedResources<T>`

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/resource-list/list-utils.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { filterResources, paginateResources } from "./list-utils";

const resources = [
  { name: "Campanha Julho", status: "active" },
  { name: "Newsletter", status: "draft" },
  { name: "Campanha Agosto", status: "draft" },
];

describe("resource list utilities", () => {
  it("filters client resources with normalized search and typed filters", () => {
    expect(
      filterResources(resources, {
        query: "  CAMPANHA ",
        searchBy: (resource) => resource.name,
        filters: { status: "draft" },
        filterBy: { status: (resource) => resource.status },
      }),
    ).toEqual([resources[2]]);
  });

  it("ignores empty filters and query", () => {
    expect(
      filterResources(resources, {
        query: "",
        searchBy: (resource) => resource.name,
        filters: { status: "" },
        filterBy: { status: (resource) => resource.status },
      }),
    ).toEqual(resources);
  });

  it("fails explicitly when an active filter has no selector", () => {
    expect(() =>
      filterResources(resources, {
        searchBy: (resource) => resource.name,
        filters: { status: "draft" },
        filterBy: {},
      }),
    ).toThrow('Missing filter selector for "status"');
  });

  it("slices pages and clamps page boundaries", () => {
    expect(paginateResources(resources, 0, 2)).toEqual({ items: resources.slice(0, 2), page: 1, totalPages: 2 });
    expect(paginateResources(resources, 99, 2)).toEqual({ items: resources.slice(2), page: 2, totalPages: 2 });
  });

  it("returns a stable empty-page result", () => {
    expect(paginateResources([], 3, 10)).toEqual({ items: [], page: 1, totalPages: 1 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- resource-list/list-utils`
Expected: FAIL com `Failed to resolve import "./list-utils"`

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/resource-list/list-utils.ts`:

```ts
export interface FilterResourcesOptions<T, K extends string> {
  query?: string;
  searchBy: (resource: T) => string | readonly string[];
  filters?: Partial<Record<K, string>>;
  filterBy?: Partial<Record<K, (resource: T) => string | readonly string[]>>;
}

const normalize = (value: string) => value.trim().toLocaleLowerCase();
const asValues = (value: string | readonly string[]) => (Array.isArray(value) ? value : [value]);

export function filterResources<T, K extends string = string>(
  resources: readonly T[],
  options: FilterResourcesOptions<T, K>,
): T[] {
  const query = normalize(options.query ?? "");
  const activeFilters = Object.entries(options.filters ?? {}).filter(
    (entry): entry is [string, string] => Boolean(entry[1]),
  );

  activeFilters.forEach(([key]) => {
    if (!options.filterBy?.[key as K]) {
      throw new Error(`Missing filter selector for "${key}"`);
    }
  });

  return resources.filter((resource) => {
    const matchesQuery =
      !query || asValues(options.searchBy(resource)).some((value) => normalize(value).includes(query));

    const matchesFilters = activeFilters.every(([key, expected]) => {
      const selector = options.filterBy![key as K]!;
      return asValues(selector(resource)).includes(expected);
    });

    return matchesQuery && matchesFilters;
  });
}

export interface PaginatedResources<T> {
  items: T[];
  page: number;
  totalPages: number;
}

export function paginateResources<T>(
  resources: readonly T[],
  requestedPage: number,
  pageSize: number,
): PaginatedResources<T> {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(resources.length / safePageSize));
  const page = Math.min(totalPages, Math.max(1, Math.floor(requestedPage) || 1));
  const start = (page - 1) * safePageSize;

  return { items: resources.slice(start, start + safePageSize), page, totalPages };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- resource-list/list-utils`
Expected: PASS (5 testes)

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/resource-list/list-utils.ts src/presentation/components/organisms/resource-list/list-utils.test.ts
git commit -m "feat: add resource-list client-side filter and pagination utilities"
```

---

### Task 29: `resource-list` — primitivos semânticos (`ul`/`li`)

Estados de carregando/vazio/erro, linha com trilha de status, toolbar com busca+filtros e paginação, todos com semântica `list`/`listitem` (não `table`), próprios para listas operacionais leves.

**Files:**
- Create: `src/presentation/components/organisms/resource-list/resource-list-states.tsx`
- Create: `src/presentation/components/organisms/resource-list/resource-list-row.tsx`
- Create: `src/presentation/components/organisms/resource-list/resource-list-toolbar.tsx`
- Create: `src/presentation/components/organisms/resource-list/resource-list-pagination.tsx`
- Create: `src/presentation/components/organisms/resource-list/resource-list.tsx`
- Test: `src/presentation/components/organisms/resource-list/resource-list.test.tsx`

**Interfaces:**
- Consumes: `Spinner`, `Input` de `@heroui/react`; `lucide-react` (`Search`, `ChevronLeft`, `ChevronRight`)
- Produces: `ResourceListLoadingState`, `ResourceListErrorState`, `ResourceListEmptyState`, `ResourceListRow`, `ResourceListFilter`, `ResourceListToolbar`, `ResourceListPagination`, `ResourceList`

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/resource-list/resource-list.test.tsx`:

```tsx
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ResourceList,
  ResourceListEmptyState,
  ResourceListErrorState,
  ResourceListLoadingState,
  ResourceListPagination,
  ResourceListRow,
  ResourceListToolbar,
} from "./index";

describe("resource list components", () => {
  it("renders controlled search and filters and reports changes", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    function ControlledToolbar() {
      const [search, setSearch] = useState("");
      return (
        <ResourceListToolbar
          count={<span>3 campanhas</span>}
          searchLabel="Buscar campanhas"
          searchValue={search}
          onSearchChange={setSearch}
          filters={[
            {
              key: "status",
              label: "Status",
              value: "all",
              options: [{ value: "all", label: "Todos" }, { value: "draft", label: "Rascunho" }],
              onChange: onFilterChange,
            },
          ]}
        />
      );
    }
    render(<ControlledToolbar />);
    const search = screen.getByRole("textbox", { name: "Buscar campanhas" });
    await user.type(search, "abc");
    expect(search).toHaveValue("abc");
    expect(screen.getByRole("status", { name: "Total de recursos" })).toHaveTextContent("3 campanhas");
    await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "draft");
    expect(onFilterChange).toHaveBeenCalledWith("draft");
  });

  it("uses accessible list and listitem semantics with a labeled status rail and keyboard action", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(
      <ResourceList aria-label="Campanhas">
        <ResourceListRow statusLabel="Ativa" statusColor="success" actions={<button onClick={onOpen}>Abrir</button>}>
          Campanha Julho
        </ResourceListRow>
      </ResourceList>,
    );
    expect(screen.getByRole("list", { name: "Campanhas" })).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent("Campanha Julho");
    expect(screen.getByLabelText("Status: Ativa")).toBeInTheDocument();
    expect(screen.getByText("Ativa")).toBeVisible();
    screen.getByRole("button", { name: "Abrir" }).focus();
    await user.keyboard("{Enter}");
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("treats an empty children array as an empty list", () => {
    render(<ResourceList aria-label="Campanhas">{[]}</ResourceList>);
    expect(screen.getByRole("status")).toHaveTextContent("Nenhum recurso encontrado");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it.each([
    { props: { isLoading: true, loadingLabel: "Carregando campanhas" }, role: "status", text: "Carregando campanhas" },
    { props: { error: "Falha ao carregar" }, role: "alert", text: "Falha ao carregar" },
    { props: {}, role: "status", text: "Nenhum recurso encontrado" },
  ])("renders list state $text", ({ props, role, text }) => {
    render(<ResourceList aria-label="Campanhas" {...props} />);
    expect(screen.getByRole(role)).toHaveTextContent(text);
  });

  it("exports reusable loading, error, and empty states", () => {
    render(
      <>
        <ResourceListLoadingState label="Carregando itens" />
        <ResourceListErrorState>Erro de rede</ResourceListErrorState>
        <ResourceListEmptyState>Nada por aqui</ResourceListEmptyState>
      </>,
    );
    expect(screen.getByRole("status", { name: "Carregando itens" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Erro de rede");
    expect(screen.getByText("Nada por aqui")).toBeInTheDocument();
  });

  it("disables pagination at boundaries and emits valid page changes", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const { rerender } = render(
      <ResourceListPagination page={1} totalItems={21} pageSize={10} onPageChange={onPageChange} />,
    );
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    rerender(<ResourceListPagination page={3} totalItems={21} pageSize={10} onPageChange={onPageChange} />);
    expect(screen.getByRole("button", { name: "Próxima página" })).toBeDisabled();
    rerender(<ResourceListPagination page={3} totalItems={5} pageSize={10} onPageChange={onPageChange} />);
    await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(1));
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
  });

  it("normalizes invalid page size before calculating ranges", () => {
    render(<ResourceListPagination page={2} totalItems={3} pageSize={0} onPageChange={vi.fn()} />);
    expect(screen.getByText("2–2 de 3")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- resource-list/resource-list.test`
Expected: FAIL com `Failed to resolve import "./index"`

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/resource-list/resource-list-states.tsx`:

```tsx
import type { ReactNode } from "react";
import { Spinner } from "@heroui/react";

export function ResourceListLoadingState({ label = "Carregando" }: { label?: string }) {
  return (
    <div aria-label={label} className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground" role="status">
      <Spinner size="sm" />
      <span>{label}</span>
    </div>
  );
}

export function ResourceListErrorState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger" role="alert">
      {children}
    </div>
  );
}

export function ResourceListEmptyState({ children = "Nenhum recurso encontrado" }: { children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground" role="status">
      {children}
    </div>
  );
}
```

`src/presentation/components/organisms/resource-list/resource-list-row.tsx`:

```tsx
import type { ReactNode } from "react";

type StatusColor = "default" | "success" | "warning" | "danger" | "primary";
const statusClasses: Record<StatusColor, string> = {
  default: "bg-default-400",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  primary: "bg-primary",
};

interface ResourceListRowProps {
  children: ReactNode;
  actions?: ReactNode;
  statusLabel?: string;
  statusColor?: StatusColor;
  statusPrefix?: string;
  actionsLabel?: string;
}

export function ResourceListRow({
  children,
  actions,
  statusLabel,
  statusColor = "default",
  statusPrefix = "Status",
  actionsLabel = "Ações do recurso",
}: ResourceListRowProps) {
  return (
    <li className="relative flex min-w-0 flex-col gap-3 p-4 pl-5 sm:flex-row sm:items-center sm:justify-between">
      {statusLabel && (
        <span
          aria-label={`${statusPrefix}: ${statusLabel}`}
          className={`absolute inset-y-0 left-0 w-1 ${statusClasses[statusColor]}`}
          role="img"
        />
      )}
      <div className="min-w-0 flex-1">
        {children}
        {statusLabel && (
          <span className="mt-1 block text-xs font-medium text-muted-foreground">{statusLabel}</span>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-1" aria-label={actionsLabel}>
          {actions}
        </div>
      )}
    </li>
  );
}
```

`src/presentation/components/organisms/resource-list/resource-list-toolbar.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import { Input } from "@heroui/react";
import { Search } from "lucide-react";

export interface ResourceListFilter {
  key: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}

interface ResourceListToolbarProps {
  searchLabel: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: readonly ResourceListFilter[];
  actions?: ReactNode;
  count?: ReactNode;
  countLabel?: string;
}

export function ResourceListToolbar({
  searchLabel,
  searchValue,
  onSearchChange,
  filters = [],
  actions,
  count,
  countLabel = "Total de recursos",
}: ResourceListToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      {count !== undefined && (
        <div aria-label={countLabel} aria-live="polite" className="text-sm text-muted-foreground" role="status">
          {count}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            aria-label={searchLabel}
            className="w-full sm:max-w-sm"
            placeholder={searchLabel}
            startContent={<Search aria-hidden="true" className="h-4 w-4 text-muted-foreground" />}
            value={searchValue}
            onValueChange={onSearchChange}
          />
          {filters.map((filter) => (
            <label className="flex min-w-40 flex-col gap-1 text-xs text-muted-foreground" key={filter.key}>
              {filter.label}
              <select
                aria-label={filter.label}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={filter.value}
                onChange={(event) => filter.onChange(event.target.value)}
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
```

`src/presentation/components/organisms/resource-list/resource-list-pagination.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ResourceListPaginationProps {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  labels?: {
    navigation: string;
    previous: string;
    next: string;
    range: (from: number, to: number, total: number) => string;
    page: (current: number, total: number) => string;
  };
}

export function ResourceListPagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
  labels,
}: ResourceListPaginationProps) {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const currentPage = Math.min(totalPages, Math.max(1, page));

  useEffect(() => {
    if (page !== currentPage) onPageChange(currentPage);
  }, [currentPage, onPageChange, page]);
  if (totalItems === 0) return null;
  const from = (currentPage - 1) * safePageSize + 1;
  const to = Math.min(currentPage * safePageSize, totalItems);

  return (
    <nav aria-label={labels?.navigation ?? "Paginação"} className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">{labels?.range(from, to, totalItems) ?? `${from}–${to} de ${totalItems}`}</p>
      <div className="flex items-center gap-2">
        <button
          aria-label={labels?.previous ?? "Página anterior"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-default-100 text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentPage <= 1}
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </button>
        <span className="min-w-16 text-center text-sm text-muted-foreground">
          {labels?.page(currentPage, totalPages) ?? `${currentPage} / ${totalPages}`}
        </span>
        <button
          aria-label={labels?.next ?? "Próxima página"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-default-100 text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentPage >= totalPages}
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
```

`src/presentation/components/organisms/resource-list/resource-list.tsx`:

```tsx
import { Children, type ReactNode } from "react";
import {
  ResourceListEmptyState,
  ResourceListErrorState,
  ResourceListLoadingState,
} from "./resource-list-states";

interface ResourceListProps {
  "aria-label": string;
  children?: ReactNode;
  isLoading?: boolean;
  loadingLabel?: string;
  error?: ReactNode;
  emptyContent?: ReactNode;
  unwrapped?: boolean;
}

export function ResourceList({
  children,
  isLoading = false,
  loadingLabel = "Carregando",
  error,
  emptyContent = "Nenhum recurso encontrado",
  unwrapped = false,
  ...listProps
}: ResourceListProps) {
  if (isLoading) return <ResourceListLoadingState label={loadingLabel} />;
  if (error) return <ResourceListErrorState>{error}</ResourceListErrorState>;
  if (Children.count(children) === 0) return <ResourceListEmptyState>{emptyContent}</ResourceListEmptyState>;

  return (
    <ul
      {...listProps}
      className={
        unwrapped
          ? "m-0 flex list-none flex-col p-0 divide-y divide-border"
          : "m-0 flex list-none flex-col overflow-hidden rounded-xl border border-border bg-content1 p-0 divide-y divide-border"
      }
    >
      {children}
    </ul>
  );
}
```

Ainda falta `index.ts` — ele é criado na Task 30 junto com `OperationalList`, para o barrel expor a plataforma inteira de uma vez.

- [ ] **Step 4: Run test to verify it passes**

Este teste fica **pendente** até a Task 30 criar `index.ts` (o barrel é compartilhado entre as duas tasks porque o arquivo de teste importa `OperationalList`/`OperationalListBody`/etc. da Zarp — aqui, adaptado, o teste desta task só usa os primitivos `ResourceList*`). Rode:

Run: `npm run test:run -- resource-list/resource-list.test`
Expected: FAIL ainda, com `Failed to resolve import "./index"` — **esperado nesta task**; resolve na Task 30, Step 4.

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/resource-list/resource-list-states.tsx src/presentation/components/organisms/resource-list/resource-list-row.tsx src/presentation/components/organisms/resource-list/resource-list-toolbar.tsx src/presentation/components/organisms/resource-list/resource-list-pagination.tsx src/presentation/components/organisms/resource-list/resource-list.tsx src/presentation/components/organisms/resource-list/resource-list.test.tsx
git commit -m "feat: add resource-list semantic primitives (states, row, toolbar, pagination)"
```

---

### Task 30: `OperationalList` — adaptador de grade sobre `ResourceList`

Camada de compatibilidade: várias telas do Reserve hoje montam uma grade de dados usando a API do `Table` do HeroUI (`<Table><TableHeader><TableColumn>...`) mesmo quando o conteúdo é lido melhor como lista (mobile-first). `OperationalList` aceita essa mesma forma de composição (`OperationalListHeader`/`OperationalListBody`/`OperationalListRow`/`OperationalListCell`/`OperationalListColumn`) mas renderiza semântica de `ul`/`li` por baixo, sobre o `ResourceList` da Task 29 — zero re-trabalho de props nas telas que migrarem depois.

Esta task **não porta** `operational-list-inventory.test.ts` da Zarp: aquele arquivo é um teste de conformidade arquitetural que lista, por caminho hard-coded, todo arquivo de página da Zarp que deve evitar marcação `<table>` — os caminhos são específicos do inventário de telas da Zarp e não existem no Reserve. Portá-lo verbatim faria o teste falhar por arquivo inexistente, não por regra violada. A cobertura de comportamento do `OperationalList` fica em `resource-list.test.tsx` (que já testa seleção, teclado, `removeWrapper`, `classNames` de compatibilidade — ver Task 29); a auditoria "nenhuma tela nova usa `<table>`" fica registrada como prática a aplicar manualmente nas Tasks 33–34 (migração de listas reais), não como teste automatizado nesta plataforma.

**Files:**
- Create: `src/presentation/components/organisms/resource-list/operational-list.tsx`
- Create: `src/presentation/components/organisms/resource-list/index.ts`
- Modify: `src/presentation/components/organisms/resource-list/resource-list.test.tsx` (adiciona os testes de `OperationalList`)

**Interfaces:**
- Consumes: `ResourceList` de `./resource-list` (Task 29); `ResourceListRow` de `./resource-list-row` (Task 29); `clsx`
- Produces: `OperationalList`, `OperationalListHeader`, `OperationalListBody`, `OperationalListRow`, `OperationalListCell`, `OperationalListColumn`

- [ ] **Step 1: Write the failing test**

Adicione ao final de `src/presentation/components/organisms/resource-list/resource-list.test.tsx` (antes do último `});` de fechamento do `describe`, como continuação do arquivo criado na Task 29) os blocos de teste do `OperationalList`. Substitua o topo do arquivo pelos imports completos e insira os testes abaixo dentro do mesmo `describe("resource list components", ...)`:

```tsx
import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ResourceList,
  ResourceListEmptyState,
  ResourceListErrorState,
  ResourceListLoadingState,
  ResourceListPagination,
  ResourceListRow,
  ResourceListToolbar,
  OperationalList,
  OperationalListBody,
  OperationalListCell,
  OperationalListHeader,
  OperationalListRow,
} from "./index";

describe("resource list components", () => {
  it("adapts operational grids to responsive list semantics", () => {
    render(
      <OperationalList aria-label="Usuários">
        <OperationalListHeader>
          <OperationalListCell>Nome</OperationalListCell>
          <OperationalListCell>Email</OperationalListCell>
        </OperationalListHeader>
        <OperationalListBody>
          <OperationalListRow>
            <OperationalListCell>Ada</OperationalListCell>
            <OperationalListCell>ada@example.com</OperationalListCell>
          </OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );

    expect(screen.getByRole("list", { name: "Usuários" })).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent("Nome");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    const labels = within(screen.getByRole("listitem")).getAllByText("Nome");
    const accessibleLabels = labels.filter((label) => label.getAttribute("aria-hidden") !== "true");
    expect(accessibleLabels).toHaveLength(1);
    expect(accessibleLabels[0]).toHaveClass("sr-only");
    expect(labels.find((label) => label.getAttribute("aria-hidden") === "true")).toHaveClass("sm:hidden");
  });

  it("keeps row actions keyboard accessible", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <OperationalList aria-label="Leads">
        <OperationalListBody>
          <OperationalListRow onAction={onAction} textValue="Abrir lead">
            <OperationalListCell>Lead</OperationalListCell>
          </OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );

    const primaryAction = screen.getByRole("button", { name: "Abrir lead" });
    expect(primaryAction.parentElement).toHaveAttribute("role", "presentation");
    primaryAction.focus();
    await user.keyboard("{Enter}");
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("preserves single-selection callbacks from operational tables", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <OperationalList aria-label="Leads" selectionMode="single" onSelectionChange={onSelectionChange}>
        <OperationalListBody>
          <OperationalListRow key="lead-42" textValue="Selecionar Ada">
            <OperationalListCell>Ada</OperationalListCell>
          </OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );

    await user.click(screen.getByRole("button", { name: "Selecionar Ada" }));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(["lead-42"]));
  });

  it("activates onClick-only rows with Enter and Space", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <OperationalList aria-label="Leads">
        <OperationalListBody>
          <OperationalListRow onClick={onClick} textValue="Abrir lead">
            <OperationalListCell>Lead</OperationalListCell>
          </OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );
    const row = screen.getByRole("button", { name: "Abrir lead" });
    row.focus();
    await user.keyboard("{Enter}{Space}");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("keeps descendant actions operable without activating the row", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const onActionClick = vi.fn();
    render(
      <OperationalList aria-label="Leads">
        <OperationalListBody>
          <OperationalListRow onClick={onRowClick} textValue="Lead Ada">
            <OperationalListCell onClick={(event) => event.stopPropagation()} data-testid="actions">
              <button onClick={onActionClick}>Editar</button>
            </OperationalListCell>
          </OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );
    await user.click(screen.getByRole("button", { name: "Editar" }));
    expect(onActionClick).toHaveBeenCalledOnce();
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("accumulates and removes controlled multiple selection", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <OperationalList aria-label="Leads" selectionMode="multiple" selectedKeys={new Set(["lead-1"])} onSelectionChange={onSelectionChange}>
        <OperationalListBody>
          <OperationalListRow key="lead-1" textValue="Ada"><OperationalListCell>Ada</OperationalListCell></OperationalListRow>
          <OperationalListRow key="lead-2" textValue="Grace"><OperationalListCell>Grace</OperationalListCell></OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );
    expect(screen.getByRole("button", { name: /Ada/ })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /Grace/ }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["lead-1", "lead-2"]));
    rerender(
      <OperationalList aria-label="Leads" selectionMode="multiple" selectedKeys={new Set(["lead-1", "lead-2"])} onSelectionChange={onSelectionChange}>
        <OperationalListBody>
          <OperationalListRow key="lead-1" textValue="Ada"><OperationalListCell>Ada</OperationalListCell></OperationalListRow>
          <OperationalListRow key="lead-2" textValue="Grace"><OperationalListCell>Grace</OperationalListCell></OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );
    await user.click(screen.getByRole("button", { name: /Ada/ }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["lead-2"]));
  });

  it("renders ReactNode loading content intact", () => {
    render(
      <OperationalList aria-label="Leads">
        <OperationalListBody isLoading loadingLabel="Loading leads" loadingContent={<div data-testid="skeleton">Skeleton customizado</div>} />
      </OperationalList>,
    );
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading leads" })).toBeInTheDocument();
  });

  it("supports removeWrapper without legacy wrapper decoration", () => {
    render(
      <OperationalList aria-label="Autores" removeWrapper classNames={{ wrapper: "border bg-content1 shadow", table: "space-y-9" }}>
        <OperationalListBody>
          <OperationalListRow><OperationalListCell>Ada</OperationalListCell></OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );
    const root = screen.getByRole("list", { name: "Autores" }).parentElement;
    expect(root).not.toHaveClass("space-y-3", "space-y-9", "border", "bg-content1", "shadow");
  });

  it("expands selectedKeys all before deselecting one visible item", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <OperationalList aria-label="Leads" selectionMode="multiple" selectedKeys="all" onSelectionChange={onSelectionChange}>
        <OperationalListBody>
          <OperationalListRow key="lead-1" textValue="Ada"><OperationalListCell>Ada</OperationalListCell></OperationalListRow>
          <OperationalListRow key="lead-2" textValue="Grace"><OperationalListCell>Grace</OperationalListCell></OperationalListRow>
          <OperationalListRow key="lead-3" textValue="Linus"><OperationalListCell>Linus</OperationalListCell></OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );
    await user.click(screen.getByRole("button", { name: "Grace" }));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(["lead-1", "lead-3"]));
  });

  it("applies compatibility classes to rows and cells", () => {
    render(
      <OperationalList aria-label="Leads" classNames={{ tr: "legacy-row", td: "legacy-cell" }}>
        <OperationalListBody>
          <OperationalListRow><OperationalListCell data-testid="cell">Ada</OperationalListCell></OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );
    expect(screen.getByRole("listitem").firstElementChild?.firstElementChild).toHaveClass("legacy-row");
    expect(screen.getByTestId("cell")).toHaveClass("legacy-cell");
  });

  // ... os testes de ResourceList/ResourceListToolbar/ResourceListPagination da Task 29
  // continuam no mesmo describe, sem alteracao.
});
```

Combine este bloco com o conteúdo já escrito na Task 29 num único arquivo (mesmo `describe`, um só bloco de imports no topo).

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- resource-list/resource-list.test`
Expected: FAIL com `Failed to resolve import "./index"` (ainda não existe `OperationalList`)

- [ ] **Step 3: Write minimal implementation**

`src/presentation/components/organisms/resource-list/operational-list.tsx`:

```tsx
"use client";

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useRef,
  useState,
  type HTMLAttributes,
  type Key,
  type MutableRefObject,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import clsx from "clsx";
import { ResourceList } from "./resource-list";
import { ResourceListRow } from "./resource-list-row";

type Selection = "all" | Set<Key>;
// Fronteira de compatibilidade para descritores heterogeneos de colecao do HeroUI.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LegacyCollectionItem = any;

interface OperationalListProps {
  children?: ReactNode;
  "aria-label"?: string;
  className?: string;
  classNames?: Record<string, string>;
  selectionMode?: "none" | "single" | "multiple";
  selectedKeys?: Selection;
  onSelectionChange?: (keys: Selection) => void;
  bottomContent?: ReactNode;
  topContent?: ReactNode;
  removeWrapper?: boolean;
  [key: string]: unknown;
}

interface OperationalHeaderProps {
  children?: ReactNode | ((column: LegacyCollectionItem) => ReactNode);
  columns?: readonly LegacyCollectionItem[];
  className?: string;
  [key: string]: unknown;
}

interface OperationalListRowProps {
  children?: ReactNode | ((column: LegacyCollectionItem) => ReactNode);
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  actions?: ReactNode;
  statusLabel?: string;
  statusColor?: "default" | "success" | "warning" | "danger" | "primary";
  onAction?: () => void;
  resourceKey?: Key;
  textValue?: string;
  [key: string]: unknown;
}

interface OperationalListCellProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
  align?: string;
  colSpan?: number;
  scope?: string;
  [key: string]: unknown;
}

interface SelectionContextValue {
  mode?: OperationalListProps["selectionMode"];
  selectedKeys: Selection;
  update: (keys: Selection) => void;
  classNames?: Record<string, string>;
  availableKeys: MutableRefObject<Set<Key>>;
  removeWrapper?: boolean;
}

const OperationalListLabel = createContext("Recursos");
const OperationalListColumns = createContext<readonly LegacyCollectionItem[]>([]);
const OperationalListContext = createContext<SelectionContextValue>({
  selectedKeys: new Set(),
  update: () => undefined,
  availableKeys: { current: new Set() },
});

function getHeaderColumns(header: ReactNode): readonly LegacyCollectionItem[] {
  if (!isValidElement<OperationalHeaderProps>(header)) return [];
  if (header.props.columns?.length) return header.props.columns;
  let content = header.props.children;
  if (typeof content === "function") return [];
  const onlyChild = Children.count(content) === 1 ? Children.only(content as ReactNode) : null;
  if (isValidElement<OperationalListRowProps>(onlyChild) && onlyChild.type === OperationalListRow)
    content = onlyChild.props.children;
  if (typeof content === "function") return [];
  return Children.toArray(content).map((child, index) => ({
    key: index,
    label: isValidElement<{ children?: ReactNode }>(child) ? child.props.children : child,
  }));
}

export function OperationalList({
  children,
  className,
  classNames,
  topContent,
  bottomContent,
  selectionMode,
  selectedKeys,
  onSelectionChange,
  removeWrapper,
  ...props
}: OperationalListProps) {
  const label = typeof props["aria-label"] === "string" ? props["aria-label"] : "Recursos";
  const header = Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === OperationalListHeader,
  );
  const columns = getHeaderColumns(header);
  const [internalSelection, setInternalSelection] = useState<Selection>(new Set());
  const currentSelection = selectedKeys ?? internalSelection;
  const availableKeys = useRef(new Set<Key>());
  const update = (keys: Selection) => {
    if (selectedKeys === undefined) setInternalSelection(keys);
    onSelectionChange?.(keys);
  };

  return (
    <OperationalListLabel.Provider value={label}>
      <OperationalListColumns.Provider value={columns}>
        <OperationalListContext.Provider
          value={{ mode: selectionMode, selectedKeys: currentSelection, update, classNames, availableKeys, removeWrapper }}
        >
          <div
            className={clsx(
              "min-w-0",
              !removeWrapper && "space-y-3",
              className,
              classNames?.base,
              !removeWrapper && classNames?.table,
              !removeWrapper && classNames?.wrapper,
            )}
          >
            {topContent}
            {children}
            {bottomContent}
          </div>
        </OperationalListContext.Provider>
      </OperationalListColumns.Provider>
    </OperationalListLabel.Provider>
  );
}

export function OperationalListHeader({ children, columns = [], className }: OperationalHeaderProps) {
  const context = useContext(OperationalListContext);
  let rendered = typeof children === "function" ? columns.map(children) : children;
  const onlyChild = Children.count(rendered) === 1 ? Children.only(rendered as ReactNode) : null;
  if (isValidElement<{ children?: ReactNode }>(onlyChild) && onlyChild.type === OperationalListRow)
    rendered = onlyChild.props.children;
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "hidden gap-3 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:flex",
        context.classNames?.thead,
        className,
      )}
    >
      {rendered}
    </div>
  );
}

interface OperationalListBodyProps<T> {
  children?: ReactNode | ((item: T) => ReactNode);
  items?: Iterable<T>;
  emptyContent?: ReactNode;
  isLoading?: boolean;
  loadingContent?: ReactNode;
  loadingLabel?: string;
  className?: string;
  [key: string]: unknown;
}

export function OperationalListBody<T>({
  children,
  items,
  emptyContent,
  isLoading,
  loadingContent,
  loadingLabel,
  className,
}: OperationalListBodyProps<T>) {
  const label = useContext(OperationalListLabel);
  const context = useContext(OperationalListContext);
  if (isLoading && loadingContent && typeof loadingContent !== "string") {
    return (
      <div role="status" aria-label={loadingLabel ?? label} className={clsx(className, context.classNames?.tbody)}>
        {loadingContent}
      </div>
    );
  }
  const initial = items && typeof children === "function" ? Array.from(items, children) : (children as ReactNode);
  const visibleKeys = new Set<Key>();
  Children.forEach(initial, (child) => {
    if (isValidElement<OperationalListRowProps>(child) && child.type === OperationalListRow && child.key != null)
      visibleKeys.add(child.key);
  });
  const rendered = Children.map(initial, (child) =>
    isValidElement<OperationalListRowProps>(child) && child.type === OperationalListRow
      ? cloneElement(child, { resourceKey: child.key ?? undefined })
      : child,
  );
  context.availableKeys.current = visibleKeys;
  const list = (
    <ResourceList
      aria-label={label}
      isLoading={isLoading}
      loadingLabel={loadingLabel ?? (typeof loadingContent === "string" ? loadingContent : undefined)}
      emptyContent={emptyContent}
      unwrapped={context.removeWrapper}
    >
      {rendered}
    </ResourceList>
  );
  return className || context.classNames?.tbody ? (
    <div className={clsx(className, context.classNames?.tbody)}>{list}</div>
  ) : (
    list
  );
}

export function OperationalListRow({
  children,
  className,
  onAction,
  onClick,
  actions,
  statusLabel,
  statusColor,
  resourceKey,
  textValue,
}: OperationalListRowProps) {
  const columns = useContext(OperationalListColumns);
  const context = useContext(OperationalListContext);
  const rendered =
    typeof children === "function"
      ? columns.map((column, index) => {
          const cell = children(column);
          return isValidElement(cell) && cell.key == null ? cloneElement(cell, { key: column?.key ?? index }) : cell;
        })
      : children;
  const labeled = Children.map(rendered, (child, index) => {
    if (!isValidElement<OperationalListCellProps>(child) || child.type !== OperationalListCell || child.props.label)
      return child;
    const column = columns[index];
    return cloneElement(child, { label: column?.label ?? column?.name ?? column?.children ?? column?.key });
  });
  const selected = resourceKey != null && (context.selectedKeys === "all" || context.selectedKeys.has(resourceKey));
  const select =
    resourceKey != null && context.mode && context.mode !== "none"
      ? () => {
          if (context.mode === "single") return context.update(new Set([resourceKey]));
          const next = context.selectedKeys === "all" ? new Set(context.availableKeys.current) : new Set(context.selectedKeys);
          if (next.has(resourceKey)) next.delete(resourceKey);
          else next.add(resourceKey);
          context.update(next);
        }
      : undefined;
  const activate = Boolean(onClick ?? onAction ?? select);
  const handleClick: MouseEventHandler<HTMLDivElement> | undefined = activate
    ? (event) => {
        select?.();
        onClick?.(event);
        onAction?.();
      }
    : undefined;
  const rowRef = useRef<HTMLDivElement>(null);

  return (
    <ResourceListRow actions={actions} statusLabel={statusLabel} statusColor={statusColor}>
      <div
        ref={rowRef}
        role="presentation"
        className={clsx(
          "relative grid min-w-0 grid-cols-1 gap-2 [content-visibility:auto] [contain-intrinsic-size:auto_80px] sm:flex sm:items-center sm:gap-4",
          activate && "cursor-pointer",
          selected && "bg-primary/10 ring-1 ring-inset ring-primary/40",
          context.classNames?.tr,
          className,
        )}
        data-selected={selected ? "true" : "false"}
        onClick={handleClick}
      >
        {activate && textValue ? (
          <button
            type="button"
            aria-label={textValue}
            aria-pressed={select ? selected : undefined}
            className="sr-only focus:not-sr-only focus:absolute focus:inset-1 focus:z-10 focus:rounded-lg focus:bg-content1 focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={(event) => {
              event.stopPropagation();
              rowRef.current?.click();
            }}
            onKeyDown={(event) => {
              if (event.key === " " || event.key === "Space" || event.key === "Spacebar") {
                event.preventDefault();
                rowRef.current?.click();
              }
            }}
          >
            {textValue}
          </button>
        ) : null}
        {labeled}
      </div>
    </ResourceListRow>
  );
}

export function OperationalListCell({
  children,
  className,
  label,
  align: _align,
  colSpan: _colSpan,
  scope: _scope,
  ...props
}: OperationalListCellProps) {
  const context = useContext(OperationalListContext);
  return (
    <div className={clsx("min-w-0 flex-1 break-words", context.classNames?.td, context.classNames?.cell, className)} {...props}>
      {label ? (
        <>
          <span className="sr-only">{label}</span>
          <span aria-hidden="true" className="mr-2 text-xs font-medium text-muted-foreground sm:hidden">{label}</span>
        </>
      ) : null}
      {children}
    </div>
  );
}

export function OperationalListColumn({ children, className, ...props }: OperationalListCellProps) {
  const context = useContext(OperationalListContext);
  return (
    <div className={clsx("min-w-0 flex-1", context.classNames?.th, className)} {...props}>
      {children}
    </div>
  );
}
```

`src/presentation/components/organisms/resource-list/index.ts`:

```ts
export { ResourceList } from "./resource-list";
export { ResourceListPagination } from "./resource-list-pagination";
export { ResourceListRow } from "./resource-list-row";
export {
  ResourceListEmptyState,
  ResourceListErrorState,
  ResourceListLoadingState,
} from "./resource-list-states";
export { ResourceListToolbar } from "./resource-list-toolbar";
export type { ResourceListFilter } from "./resource-list-toolbar";
export { filterResources, paginateResources } from "./list-utils";
export type { FilterResourcesOptions, PaginatedResources } from "./list-utils";
export {
  OperationalList,
  OperationalListBody,
  OperationalListCell,
  OperationalListColumn,
  OperationalListHeader,
  OperationalListRow,
} from "./operational-list";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- resource-list/resource-list.test`
Expected: PASS (todos os testes de `resource-list.test.tsx`, das Tasks 29 e 30 juntos)

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/resource-list/operational-list.tsx src/presentation/components/organisms/resource-list/index.ts src/presentation/components/organisms/resource-list/resource-list.test.tsx
git commit -m "feat: add OperationalList as a grid-compatible adapter over ResourceList"
```

---
### Task 31: `create-optimistic-mutation` — helper genérico de mutação otimista

Para telas que não usam `EntityList` mas ainda precisam de atualização otimista com rollback (ex.: um toggle de status numa página avulsa).

**Files:**
- Create: `src/shared/query/create-optimistic-mutation.ts`
- Test: `src/shared/query/create-optimistic-mutation.test.ts`

**Interfaces:**
- Consumes: `QueryClient`, `QueryKey` de `@tanstack/react-query`
- Produces: `createOptimisticMutationHandlers<TVariables>({ client, queryKey, update }): { onMutate, onError, onSettled }`

- [ ] **Step 1: Write the failing test**

`src/shared/query/create-optimistic-mutation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import { createOptimisticMutationHandlers } from "./create-optimistic-mutation";

describe("createOptimisticMutationHandlers", () => {
  it("updates every matching cache and restores all snapshots on failure", async () => {
    const client = new QueryClient();
    const root = ["marketing", "tenant", "tenant-1", "prospecting"] as const;
    const detailKey = [...root, "detail", "job-1"] as const;
    const listKey = [...root, "list", { page: 1 }] as const;
    client.setQueryData(detailKey, { id: "job-1", status: "running" });
    client.setQueryData(listKey, { items: [{ id: "job-1", status: "running" }] });

    const handlers = createOptimisticMutationHandlers({
      client,
      queryKey: root,
      update: (current: unknown) => {
        if (current && typeof current === "object" && "items" in current && Array.isArray(current.items)) {
          return {
            ...current,
            items: current.items.map((item) => (item.id === "job-1" ? { ...item, status: "paused" } : item)),
          };
        }
        return { ...(current as object), status: "paused" };
      },
    });

    const context = await handlers.onMutate();
    expect(client.getQueryData(detailKey)).toMatchObject({ status: "paused" });
    expect(client.getQueryData(listKey)).toMatchObject({ items: [{ status: "paused" }] });

    handlers.onError(new Error("conflict"), undefined, context);
    expect(client.getQueryData(detailKey)).toMatchObject({ status: "running" });
    expect(client.getQueryData(listKey)).toMatchObject({ items: [{ status: "running" }] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- create-optimistic-mutation`
Expected: FAIL com `Failed to resolve import "./create-optimistic-mutation"`

- [ ] **Step 3: Write minimal implementation**

`src/shared/query/create-optimistic-mutation.ts`:

```ts
import type { QueryClient, QueryKey } from "@tanstack/react-query";

type Snapshot = [QueryKey, unknown];

interface OptimisticMutationOptions<TVariables> {
  client: QueryClient;
  queryKey: QueryKey;
  update: (current: unknown, variables: TVariables) => unknown;
}

export function createOptimisticMutationHandlers<TVariables = void>({
  client,
  queryKey,
  update,
}: OptimisticMutationOptions<TVariables>) {
  return {
    onMutate: async (variables: TVariables) => {
      await client.cancelQueries({ queryKey });
      const snapshots = client.getQueriesData({ queryKey }) as Snapshot[];

      for (const [key, current] of snapshots) {
        client.setQueryData(key, update(current, variables));
      }

      return { snapshots };
    },
    onError: (
      _error: unknown,
      _variables: TVariables,
      context?: { snapshots: Snapshot[] },
    ) => {
      for (const [key, snapshot] of context?.snapshots ?? []) {
        client.setQueryData(key, snapshot);
      }
    },
    onSettled: () => client.invalidateQueries({ queryKey }),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- create-optimistic-mutation`
Expected: PASS (1 teste)

- [ ] **Step 5: Commit**

```bash
git add src/shared/query/create-optimistic-mutation.ts src/shared/query/create-optimistic-mutation.test.ts
git commit -m "feat: add a generic optimistic-mutation handler factory"
```

---

### Task 32: `use-list-query-state` — estado de lista simples sincronizado com a URL

Versão mais leve de `use-entity-list-state` (Task 15), para telas que só precisam de busca + página + filtros simples na URL, sem o contrato completo de `EntityListDefinition`.

**Files:**
- Create: `src/shared/hooks/use-list-query-state.ts`
- Test: `src/shared/hooks/use-list-query-state.test.tsx`

**Interfaces:**
- Consumes: `usePathname`, `useRouter`, `useSearchParams` de `next/navigation`
- Produces: `useListQueryState<K>({ filterKeys?, queryKey?, pageKey?, searchDebounceMs? }) → { query, page, filters, setQuery, setPage, setFilter, clearFilters }`

- [ ] **Step 1: Write the failing test**

`src/shared/hooks/use-list-query-state.test.tsx`:

```tsx
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useListQueryState } from "./use-list-query-state";

const replace = vi.fn();
let params = new URLSearchParams("q=campanha&page=2&status=draft&keep=yes");

vi.mock("next/navigation", () => ({
  usePathname: () => "/marketing",
  useRouter: () => ({ replace }),
  useSearchParams: () => params,
}));

describe("useListQueryState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replace.mockClear();
    params = new URLSearchParams("q=campanha&page=2&status=draft&keep=yes");
  });
  afterEach(() => vi.useRealTimers());

  it("reads query, page, and declared filters from the URL", () => {
    const { result } = renderHook(() => useListQueryState({ filterKeys: ["status"] as const }));
    expect(result.current).toMatchObject({ query: "campanha", page: 2, filters: { status: "draft" } });
  });

  it("preserves raw input and debounces one trimmed URL commit while keeping unrelated params", () => {
    const { result } = renderHook(() => useListQueryState({ filterKeys: ["status"] as const }));
    act(() => result.current.setQuery("  Acme Corp  "));
    expect(result.current.query).toBe("  Acme Corp  ");
    act(() => vi.advanceTimersByTime(299));
    expect(replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/marketing?q=Acme+Corp&status=draft&keep=yes", { scroll: false });
  });

  it("removes empty filters and clamps invalid pages", () => {
    params = new URLSearchParams("page=-3&status=draft");
    const { result } = renderHook(() => useListQueryState({ filterKeys: ["status"] as const }));
    expect(result.current.page).toBe(1);
    act(() => result.current.setFilter("status", ""));
    expect(replace).toHaveBeenCalledWith("/marketing", { scroll: false });
  });

  it("clears all declared filters and resets pagination", () => {
    const { result } = renderHook(() => useListQueryState({ filterKeys: ["status"] as const }));
    act(() => result.current.clearFilters());
    expect(replace).toHaveBeenCalledWith("/marketing?q=campanha&keep=yes", { scroll: false });
  });

  it("synchronizes controlled input after back or forward navigation", () => {
    const { result, rerender } = renderHook(() => useListQueryState());
    act(() => result.current.setQuery("stale draft"));
    params = new URLSearchParams("q=restored&keep=yes");
    rerender();
    expect(result.current.query).toBe("restored");
    act(() => vi.advanceTimersByTime(300));
    expect(replace).not.toHaveBeenCalled();
  });

  it("rebases a pending search commit on the latest concurrent URL state", () => {
    params = new URLSearchParams("page=4&status=draft&keep=old");
    const { result, rerender } = renderHook(() => useListQueryState({ filterKeys: ["status"] as const }));
    act(() => result.current.setQuery("Acme"));
    act(() => vi.advanceTimersByTime(100));
    params = new URLSearchParams("page=7&status=active&keep=yes");
    rerender();
    act(() => vi.advanceTimersByTime(200));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/marketing?status=active&keep=yes&q=Acme", { scroll: false });
  });

  it("optimistically composes search and filter updates without a navigation rerender", () => {
    params = new URLSearchParams("page=4&status=draft&keep=yes");
    const first = renderHook(() => useListQueryState({ filterKeys: ["status"] as const }));
    act(() => first.result.current.setQuery("Acme"));
    act(() => vi.advanceTimersByTime(100));
    act(() => first.result.current.setFilter("status", "active"));
    act(() => vi.advanceTimersByTime(200));
    expect(replace).toHaveBeenNthCalledWith(2, "/marketing?status=active&keep=yes&q=Acme", { scroll: false });

    first.unmount();
    replace.mockClear();
    params = new URLSearchParams("page=4&status=draft&keep=yes");
    const inverse = renderHook(() => useListQueryState({ filterKeys: ["status"] as const }));
    act(() => inverse.result.current.setFilter("status", "active"));
    act(() => inverse.result.current.setQuery("Acme"));
    act(() => vi.advanceTimersByTime(300));
    expect(replace).toHaveBeenLastCalledWith("/marketing?status=active&keep=yes&q=Acme", { scroll: false });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- use-list-query-state`
Expected: FAIL com `Failed to resolve import "./use-list-query-state"`

- [ ] **Step 3: Write minimal implementation**

`src/shared/hooks/use-list-query-state.ts`:

```ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface UseListQueryStateOptions<K extends string> {
  filterKeys?: readonly K[];
  queryKey?: string;
  pageKey?: string;
  searchDebounceMs?: number;
}

export function useListQueryState<K extends string = string>({
  filterKeys = [] as readonly K[],
  queryKey = 'q',
  pageKey = 'page',
  searchDebounceMs = 300,
}: UseListQueryStateOptions<K> = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const renderedSearchParams = searchParams.toString();
  const latestSearchParams = useRef(renderedSearchParams);
  const lastRenderedSearchParams = useRef(renderedSearchParams);
  const latestPathname = useRef(pathname);
  if (renderedSearchParams !== lastRenderedSearchParams.current) {
    lastRenderedSearchParams.current = renderedSearchParams;
    latestSearchParams.current = renderedSearchParams;
  }
  latestPathname.current = pathname;
  const urlQuery = searchParams.get(queryKey) ?? '';
  const [query, setQueryInput] = useState(urlQuery);
  const lastUrlQuery = useRef(urlQuery);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const parsedPage = Number(searchParams.get(pageKey) ?? '1');
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const filters = useMemo(() => Object.fromEntries(
    filterKeys.map((key) => [key, searchParams.get(key) ?? '']),
  ) as Record<K, string>, [filterKeys, searchParams]);

  const update = useCallback((changes: Record<string, string | number | null>) => {
    const next = new URLSearchParams(latestSearchParams.current);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === '' || (key === pageKey && value === 1)) next.delete(key);
      else next.set(key, String(value));
    });
    const suffix = next.toString();
    latestSearchParams.current = suffix;
    router.replace(
      suffix ? `${latestPathname.current}?${suffix}` : latestPathname.current,
      { scroll: false },
    );
  }, [pageKey, router]);

  useEffect(() => {
    if (urlQuery !== lastUrlQuery.current) {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
        searchTimer.current = null;
      }
      lastUrlQuery.current = urlQuery;
      setQueryInput(urlQuery);
    }
  }, [urlQuery]);

  useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }, []);

  const setQuery = useCallback((value: string) => {
    setQueryInput(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      update({ [queryKey]: value.trim(), [pageKey]: null });
      searchTimer.current = null;
    }, searchDebounceMs);
  }, [pageKey, queryKey, searchDebounceMs, update]);

  return {
    query,
    page,
    filters,
    setQuery,
    setPage: useCallback((value: number) => update({ [pageKey]: Math.max(1, Math.floor(value) || 1) }), [pageKey, update]),
    setFilter: useCallback((key: K, value: string) => update({ [key]: value, [pageKey]: null }), [pageKey, update]),
    clearFilters: useCallback(() => update({
      ...Object.fromEntries(filterKeys.map((key) => [key, null])),
      [pageKey]: null,
    }), [filterKeys, pageKey, update]),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- use-list-query-state`
Expected: PASS (7 testes)

- [ ] **Step 5: Commit**

```bash
git add src/shared/hooks/use-list-query-state.ts src/shared/hooks/use-list-query-state.test.tsx
git commit -m "feat: add a lightweight URL-synced list query state hook"
```

---

### Task 33: Migrar a lista de Leads para `EntityList`

**Por que Leads:** `src/app/dashboard/leads/page.tsx` tem 473 linhas hoje, das quais a maior parte é reimplementação manual de tabela HeroUI, paginação com reticências, filtros `Select` e estados de carregando/vazio — exatamente o que `EntityList` (Tasks 10–24) substitui. É também a prova do caminho **capability `"server"`**: o backend (`GET /leads`) já pagina e filtra por `status`/`origin`, então `dataSource.query` apenas repassa a requisição.

**Escopo intencionalmente reduzido:** a página original também trocava a fonte de dados para `useGetCollectionLeads` quando um filtro de coleção estava ativo, e tinha exportação CSV. Coleção-scoped browsing já tem rota dedicada (`/dashboard/leads/collections/[collectionId]`) e fica fora desta migração — o botão "Ver por coleção" leva para lá. A exportação CSV **não é portada nesta task**: ela pertence a uma ação de página independente do contrato de `EntityListDefinition` (que não modela "baixar todos os itens que casam o filtro atual" como conceito de plataforma) — fica registrada como funcionalidade a reintroduzir depois como uma ação de `primaryActions` que lê `controller.query` diretamente, fora do escopo desta prova de conceito.

**Files:**
- Create: `src/modules/leads/infrastructure/lead-entity-list-adapter.ts`
- Test: `src/modules/leads/infrastructure/lead-entity-list-adapter.test.ts`
- Modify: `src/presentation/components/pages/dashboard/leads/page.tsx` (arquivo inteiro)

**Interfaces:**
- Consumes: `listLeadsService` de `@/src/modules/leads/infrastructure/list-leads-adapter` (serviço já existente, apenas realocado pela Fase 4); `EntityListRequest`, `EntityPage` de `@/src/presentation/components/organisms/entity-list/types` (Task 10); `EntityList`, `EntityListDefinition` de `@/src/presentation/components/organisms/entity-list` (Task 24); `Lead`, `ELeadStatus`, `EOriginLead` de `@/src/shared/domain/types/@lead`
- Produces: `queryLeadEntityList(request): Promise<EntityPage<Lead>>`

- [ ] **Step 1: Write the failing test**

`src/modules/leads/infrastructure/lead-entity-list-adapter.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/modules/leads/infrastructure/list-leads-adapter", () => ({
  listLeadsService: vi.fn(),
}));

import { listLeadsService } from "@/src/modules/leads/infrastructure/list-leads-adapter";
import { queryLeadEntityList } from "./lead-entity-list-adapter";

describe("queryLeadEntityList", () => {
  it("maps entity-list request fields to the leads API and back to an EntityPage", async () => {
    vi.mocked(listLeadsService).mockResolvedValue({
      success: true,
      data: {
        leads: [{ id: "lead-1" } as never],
        page: { count: 42, count_pages: 2, current_page: 2, limit: 30 },
      },
    });

    const page = await queryLeadEntityList({
      page: 2,
      pageSize: 30,
      search: "",
      filters: { status: "1", origin: "" },
    });

    expect(listLeadsService).toHaveBeenCalledWith({ page: 2, limit: 30, status: 1, origin: undefined });
    expect(page).toEqual({ items: [{ id: "lead-1" }], total: 42, page: 2, pageSize: 30 });
  });

  it("omits status and origin from the request when the filters are empty", async () => {
    vi.mocked(listLeadsService).mockResolvedValue({
      success: true,
      data: { leads: [], page: { count: 0, count_pages: 1, current_page: 1, limit: 30 } },
    });

    await queryLeadEntityList({ page: 1, pageSize: 30, search: "", filters: { status: "", origin: "" } });

    expect(listLeadsService).toHaveBeenCalledWith({ page: 1, limit: 30, status: undefined, origin: undefined });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- lead-entity-list-adapter`
Expected: FAIL com `Failed to resolve import "./lead-entity-list-adapter"`

- [ ] **Step 3: Write minimal implementation**

`src/modules/leads/infrastructure/lead-entity-list-adapter.ts`:

```ts
import { listLeadsService } from "@/src/modules/leads/infrastructure/list-leads-adapter";
import type { EntityListRequest, EntityPage } from "@/src/presentation/components/organisms/entity-list/types";
import type { Lead } from "@/src/shared/domain/types/@lead";

export interface LeadEntityFilters extends Record<string, unknown> {
  status: string;
  origin: string;
}

export async function queryLeadEntityList(
  request: EntityListRequest<LeadEntityFilters>,
): Promise<EntityPage<Lead>> {
  const response = await listLeadsService({
    page: request.page,
    limit: request.pageSize,
    status: request.filters.status ? Number(request.filters.status) : undefined,
    origin: request.filters.origin ? Number(request.filters.origin) : undefined,
  });

  return {
    items: response.data.leads,
    total: response.data.page.count,
    page: response.data.page.current_page,
    pageSize: response.data.page.limit,
  };
}
```

Substitua `src/presentation/components/pages/dashboard/leads/page.tsx` inteiro:

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Chip } from "@heroui/react";
import { ListChecks, Plus, Users } from "lucide-react";

import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { EntityList } from "@/src/presentation/components/organisms/entity-list";
import type { EntityListDefinition } from "@/src/presentation/components/organisms/entity-list";
import { LeadDrawer } from "@/src/presentation/components/organisms/leads/lead-drawer";
import { CreateLeadDialog } from "@/src/presentation/components/organisms/leads/create-lead-dialog";
import { queryLeadEntityList, type LeadEntityFilters } from "@/src/modules/leads/infrastructure/lead-entity-list-adapter";
import type { Lead } from "@/src/shared/domain/types/@lead";
import { ELeadStatus, EOriginLead } from "@/src/shared/domain/types/@lead";
import { formatDate } from "@/src/shared/utils/format-date";

export default function LeadsPage() {
  const t = useTranslations("leads");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const STATUS_LABELS: Record<number, string> = {
    [ELeadStatus.new]: t("statusNew"),
    [ELeadStatus.archived]: t("statusArchived"),
  };
  const STATUS_COLORS: Record<number, "success" | "default"> = {
    [ELeadStatus.new]: "success",
    [ELeadStatus.archived]: "default",
  };
  const ORIGIN_LABELS: Record<number, string> = {
    [EOriginLead.seo_tool]: t("originSeoTool"),
    [EOriginLead.seo_archive]: t("originSeoArchive"),
    [EOriginLead.email]: t("originEmail"),
    [EOriginLead.facebook_ads]: t("originFacebookAds"),
    [EOriginLead.google_ads]: t("originGoogleAds"),
    [EOriginLead.page]: t("originPage"),
  };

  const definition: EntityListDefinition<Lead, LeadEntityFilters> = {
    id: "leads",
    ariaLabel: t("title"),
    getKey: (lead) => lead.id,
    dataSource: {
      capabilities: { search: false, sort: false, pagination: "server", selection: "none" },
      query: queryLeadEntityList,
    },
    initialState: { pageSize: 30, filters: { status: "", origin: "" } },
    filters: [
      {
        key: "status",
        label: t("allStatuses"),
        kind: "single",
        options: [
          { value: String(ELeadStatus.new), label: t("statusNew") },
          { value: String(ELeadStatus.archived), label: t("statusArchived") },
        ],
      },
      {
        key: "origin",
        label: t("allOrigins"),
        kind: "single",
        options: Object.entries(ORIGIN_LABELS).map(([value, label]) => ({ value, label })),
      },
    ],
    sorts: [],
    variant: "table",
    columns: [
      {
        key: "name",
        header: t("columnName"),
        render: (lead) => <p className="font-medium text-foreground">{lead.name || "—"}</p>,
      },
      {
        key: "email",
        header: t("columnEmail"),
        render: (lead) => <span className="text-sm text-muted-foreground">{lead.email || "—"}</span>,
      },
      {
        key: "phone",
        header: t("columnPhone"),
        render: (lead) => <span className="text-sm">{lead.phone_number || "—"}</span>,
      },
      {
        key: "origin",
        header: t("columnOrigin"),
        render: (lead) => (
          <span className="text-sm text-muted-foreground">{ORIGIN_LABELS[lead.origin] ?? t("originUnknown")}</span>
        ),
      },
      {
        key: "status",
        header: t("columnStatus"),
        render: (lead) => (
          <Chip color={STATUS_COLORS[lead.status] ?? "default"} variant="flat" size="sm">
            {STATUS_LABELS[lead.status] ?? t("statusUnknown")}
          </Chip>
        ),
      },
      {
        key: "created_at",
        header: t("columnCreated"),
        render: (lead) => <span className="text-sm text-muted-foreground">{formatDate(lead.created_at)}</span>,
      },
    ],
    onActivate: (lead) => setSelectedLeadId(lead.id),
    primaryActions: (
      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-default-100"
        href="/dashboard/leads/collections"
      >
        <ListChecks className="h-4 w-4" />
        {t("viewByCollection")}
      </Link>
    ),
  };

  return (
    <LayoutScopeRoot routeActive="leads">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6" />
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t("manageLeads")}</p>
          </div>
          <button
            type="button"
            className="btn-pill btn-primary inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-4 w-4" />
            {t("newLead")}
          </button>
        </div>

        <EntityList definition={definition} stateMode="url" />
      </div>

      <LeadDrawer
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onDeleted={() => setSelectedLeadId(null)}
      />

      <CreateLeadDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </LayoutScopeRoot>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- lead-entity-list-adapter`
Expected: PASS (2 testes)

Run: `npm run build`
Expected: build passa (a rota `/dashboard/leads` compila sobre `EntityList`)

- [ ] **Step 5: Commit**

```bash
git add src/modules/leads/infrastructure/lead-entity-list-adapter.ts src/modules/leads/infrastructure/lead-entity-list-adapter.test.ts src/presentation/components/pages/dashboard/leads/page.tsx
git commit -m "refactor: migrate the leads list to the EntityList platform (server capability)"
```

---

### Task 34: Migrar a lista de Artigos (CMS) para `EntityList`

**Por que Artigos:** `src/components/cms/articles/article-list.tsx` (308 linhas) é a segunda maior duplicação de scaffolding de tabela do Reserve, e — diferente de Leads — pagina, busca e ordena **inteiramente no cliente** (`useState` + `.slice()` manual sobre a lista completa). Migrar esta lista prova o caminho **capability `"local"`** da plataforma (`applyLocalEntityQuery`, Task 12, com `localItemLimit` obrigatório da Task 14), complementando a prova "server" da Task 33. Juntas, as duas migrações exercitam os dois modos que `EntityListCapabilities.pagination` declara.

**Escopo intencionalmente reduzido:** a página original tinha abas de status (`CmsPageHeader` `tabs`) fora do corpo da lista. Elas são substituídas pelo filtro `status` padrão da plataforma (mesmo papel, dropdown em vez de abas) — usar o idioma de filtro da plataforma em vez de duplicar um segundo controle de UI para a mesma coisa.

**Files:**
- Create: `src/modules/cms/infrastructure/cms-article-entity-list-adapter.ts`
- Test: `src/modules/cms/infrastructure/cms-article-entity-list-adapter.test.ts`
- Modify: `src/presentation/components/organisms/cms/articles/article-list.tsx` (arquivo inteiro)

**Interfaces:**
- Consumes: `fetchArticles` de `@/src/modules/cms/infrastructure/cms-article-adapter` (serviço já existente, realocado pela Fase 4); `applyLocalEntityQuery` de `@/src/presentation/components/organisms/entity-list` (Task 12); `EntityListRequest`, `EntityPage` de `@/src/presentation/components/organisms/entity-list/types` (Task 10); `Article`, `ArticleStatus` de `@/src/shared/domain/types/@cms-article`; `Author` de `@/src/shared/domain/types/@cms-author`
- Produces: `queryArticleEntityList(blogId?, localItemLimit?): (request) => Promise<EntityPage<Article>>`

- [ ] **Step 1: Write the failing test**

`src/modules/cms/infrastructure/cms-article-entity-list-adapter.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/modules/cms/infrastructure/cms-article-adapter", () => ({
  fetchArticles: vi.fn(),
}));

import { fetchArticles } from "@/src/modules/cms/infrastructure/cms-article-adapter";
import { queryArticleEntityList } from "./cms-article-entity-list-adapter";

const article = (overrides: Record<string, unknown> = {}) => ({
  id: "1",
  blog_id: "1",
  title: "Guia de check-in",
  displayTitle: "Guia de check-in",
  slug: "guia-check-in",
  content: "",
  status: "draft",
  published_at: null,
  scheduled_at: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  images: [],
  ...overrides,
});

describe("queryArticleEntityList", () => {
  it("fetches the full blog once and applies local search filtering", async () => {
    vi.mocked(fetchArticles).mockResolvedValue([
      article({ id: "1", title: "Guia de check-in", slug: "guia-check-in" }),
      article({ id: "2", title: "Política de cancelamento", slug: "politica-cancelamento" }),
    ] as never);

    const query = queryArticleEntityList("blog-1");
    const page = await query({ page: 1, pageSize: 30, search: "check-in", filters: { status: "" } });

    expect(fetchArticles).toHaveBeenCalledWith("blog-1", undefined, 1, 500);
    expect(page.items).toHaveLength(1);
    expect((page.items[0] as { id: string }).id).toBe("1");
  });

  it("filters by status locally without a second network request", async () => {
    vi.mocked(fetchArticles).mockResolvedValue([
      article({ id: "1", status: "draft" }),
      article({ id: "2", status: "published" }),
    ] as never);

    const query = queryArticleEntityList();
    const page = await query({ page: 1, pageSize: 30, search: "", filters: { status: "published" } });

    expect(fetchArticles).toHaveBeenCalledTimes(1);
    expect(page.items.map((item) => (item as { id: string }).id)).toEqual(["2"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- cms-article-entity-list-adapter`
Expected: FAIL com `Failed to resolve import "./cms-article-entity-list-adapter"`

- [ ] **Step 3: Write minimal implementation**

`src/modules/cms/infrastructure/cms-article-entity-list-adapter.ts`:

```ts
import { fetchArticles } from "@/src/modules/cms/infrastructure/cms-article-adapter";
import { applyLocalEntityQuery } from "@/src/presentation/components/organisms/entity-list/local-query";
import type { EntityListRequest, EntityPage } from "@/src/presentation/components/organisms/entity-list/types";
import type { Article, ArticleStatus } from "@/src/shared/domain/types/@cms-article";

export interface ArticleEntityFilters extends Record<string, unknown> {
  status: string;
}

export const ARTICLE_LOCAL_ITEM_LIMIT = 500;

export function queryArticleEntityList(blogId?: string) {
  return async (
    request: EntityListRequest<ArticleEntityFilters>,
  ): Promise<EntityPage<Article>> => {
    const articles = await fetchArticles(blogId, undefined, 1, ARTICLE_LOCAL_ITEM_LIMIT);

    return applyLocalEntityQuery(articles, request, {
      localItemLimit: ARTICLE_LOCAL_ITEM_LIMIT,
      searchText: (article) => `${article.title} ${article.slug}`,
      matchesFilters: (article, filters) =>
        !filters.status || article.status === (filters.status as ArticleStatus),
      sortValue: (article, field) =>
        field === "updated_at" ? new Date(article.published_at ?? article.updated_at) : null,
    });
  };
}
```

Substitua `src/presentation/components/organisms/cms/articles/article-list.tsx` inteiro:

```tsx
"use client";

import { useMemo, useState } from "react";
import { Avatar, Chip } from "@heroui/react";
import { Edit, FileText, Plus } from "lucide-react";

import { EntityList } from "@/src/presentation/components/organisms/entity-list";
import type { EntityListDefinition } from "@/src/presentation/components/organisms/entity-list";
import {
  ARTICLE_LOCAL_ITEM_LIMIT,
  queryArticleEntityList,
  type ArticleEntityFilters,
} from "@/src/modules/cms/infrastructure/cms-article-entity-list-adapter";
import { CmsPageHeader } from "../shared/cms-page-header";
import ArticleStatusBadge from "./article-status-badge";
import type { Article } from "@/src/shared/domain/types/@cms-article";
import type { Author } from "@/src/shared/domain/types/@cms-author";
import { formatDate } from "@/src/shared/utils/format-date";

interface ArticleListProps {
  blogId?: string;
  authors: Author[];
  onCreateClick: () => void;
  onRowClick: (article: Article) => void;
}

export default function ArticleList({ blogId, authors, onCreateClick, onRowClick }: ArticleListProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const getAuthor = (authorId?: string) =>
    authorId ? authors.find((author) => String(author.id) === String(authorId)) : undefined;

  const definition = useMemo<EntityListDefinition<Article, ArticleEntityFilters>>(
    () => ({
      id: `cms-articles-${blogId ?? "all"}-${refreshKey}`,
      ariaLabel: "Artigos do blog",
      getKey: (article) => article.id,
      dataSource: {
        capabilities: { search: "local", sort: "local", pagination: "local", selection: "none", localItemLimit: ARTICLE_LOCAL_ITEM_LIMIT },
        query: queryArticleEntityList(blogId),
      },
      initialState: { pageSize: 15, filters: { status: "" } },
      filters: [
        {
          key: "status",
          label: "Status",
          kind: "single",
          options: [
            { value: "draft", label: "Rascunho" },
            { value: "published", label: "Publicado" },
            { value: "archived", label: "Arquivado" },
          ],
        },
      ],
      sorts: [{ field: "updated_at", label: "Última atualização" }],
      variant: "table",
      columns: [
        {
          key: "title",
          header: "Artigo",
          render: (article) => (
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{article.displayTitle}</span>
              <span className="text-xs text-muted-foreground">{article.slug}</span>
            </div>
          ),
        },
        {
          key: "author",
          header: "Autor",
          render: (article) => {
            const author = getAuthor(article.authorId);
            return author ? (
              <div className="flex items-center gap-2">
                <Avatar size="sm" src={author.avatar_url} name={author.fullName} />
                <span className="text-sm text-foreground">{author.fullName}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            );
          },
        },
        {
          key: "language",
          header: "Idioma",
          render: (article) => (
            <Chip size="sm" variant="flat" color="default" className="uppercase">
              {article.language ?? "pt_br"}
            </Chip>
          ),
        },
        { key: "status", header: "Status", render: (article) => <ArticleStatusBadge status={article.status} /> },
        {
          key: "updated_at",
          header: "Última atualização",
          render: (article) => (
            <span className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(article.updated_at)}</span>
          ),
        },
        {
          key: "actions",
          header: "",
          align: "end",
          render: (article) => (
            <a
              aria-label="Editar artigo"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-default-100 hover:text-foreground"
              href={`/dashboard/cms/articles/${article.id}?blogId=${article.blog_id}`}
              onClick={(event) => event.stopPropagation()}
            >
              <Edit size={16} />
            </a>
          ),
        },
      ],
      onActivate: onRowClick,
      primaryActions: (
        <button
          type="button"
          className="btn-pill btn-primary inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm"
          onClick={onCreateClick}
        >
          <Plus className="h-4 w-4" />
          Novo artigo
        </button>
      ),
    }),
    [authors, blogId, onCreateClick, onRowClick, refreshKey],
  );

  return (
    <div className="space-y-6">
      <CmsPageHeader
        title="Artigos do blog"
        description="Escreva e publique conteúdo nas coleções do seu blog."
        icon={<FileText className="w-6 h-6" />}
      />
      <EntityList definition={definition} stateMode="memory" />
    </div>
  );
}
```

Nota: `refreshKey` fica como um placeholder de invalidação manual — cada mutação de artigo (publicar/arquivar/excluir) que hoje já existe em `useArticleMutations` deve chamar `setRefreshKey((key) => key + 1)` via um callback repassado à tela pai, ou, preferencialmente, invalidar `["entity-list", "cms-articles"]` diretamente pelo React Query (o prefixo de `optimistic.ts`, Task 13, já casa com esse padrão). Como esta task só prova a migração da lista, a integração fina com as mutações existentes fica para quando as próprias mutações forem portadas para `entity-actions` (fora do escopo desta prova).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- cms-article-entity-list-adapter`
Expected: PASS (2 testes)

Run: `npm run build`
Expected: build passa

- [ ] **Step 5: Commit**

```bash
git add src/modules/cms/infrastructure/cms-article-entity-list-adapter.ts src/modules/cms/infrastructure/cms-article-entity-list-adapter.test.ts src/presentation/components/organisms/cms/articles/article-list.tsx
git commit -m "refactor: migrate the CMS article list to the EntityList platform (local capability)"
```

---
### Task 35: Alinhamento de tokens de layout/card e `docs/DESIGN.md` com a paleta RÉSERVE

**Onde estão os valores hard-coded que os tokens substituem** (achados por grep):
- Largura da sidebar: `src/presentation/components/atoms/reserve/aside.tsx` (linha do `<aside className="... w-[310px] ... h-[calc(100svh-60px)]">`).
- Altura do header consumida pelo cálculo de altura do conteúdo: `src/app/dashboard/layout.tsx` (`h-[calc(100svh-60px)]`) e o mesmo `aside.tsx` acima — os dois hard-codam `60px`, não `80px`. O header em si (`src/presentation/components/atoms/reserve/header.tsx`) não tem altura fixa hoje (`h-fit py-3`), então os `60px` espalhados são uma suposição implícita do valor renderizado, não uma medida declarada.

**Decisão registrada:** o token `--header-height` é fixado em `80px` (igual à Zarp, que também tem header dela mais alto que o corpo do Reserve hoje). Isso é uma mudança visual real (o header cresce ~20px), então o header passa a declarar essa altura explicitamente (`h-[var(--header-height)]` com `items-center`) em vez de deixar a régua imprecisa. Os dois `calc(100svh-60px)` e o `w-[310px]` passam a referenciar os tokens.

**Paleta RÉSERVE extraída:** `tailwind.config.js` e `src/common/styles/globals.css` do Reserve hoje têm os **mesmos valores hex/HSL da Zarp** (`#9FE870` lime, comentário "Zarp specific tokens") — o rebranding nunca foi feito. A fonte real da identidade RÉSERVE é o ativo de logo (`public/reserve-logomark-h-light.svg`), que usa `fill="#8b9b75"` — um verde-sálvia opaco, não o lima elétrico da Zarp. Esta task substitui a paleta copiada por essa cor real:

| Papel | Zarp (a substituir) | RÉSERVE (extraída do logo) | Token CSS |
|---|---|---|---|
| Fundo (parchment) | `#F8FAF4` | `#FFFCF6` (fundo do próprio SVG do logo) | `--background: 60 40% 98%` |
| Primário / verde-sálvia | `#9FE870` lima elétrico | `#8B9B75` verde-sálvia opaco | `--primary` / `--brand-green: 85 16% 53%` |
| Texto sobre primário | `#163300` | `#1E2A16` tinta-sálvia escura | `--primary-foreground` / `--brand-green-deep: 96 32% 13%` |
| Secundário / realce suave | `#E2F6D5` menta pálida | `#E4E8DC` névoa de sálvia | `--secondary` / `--brand-mint: 80 21% 89%` |
| Superfície neutra | `#E8EBE6` | mantido, deslocado para a família sálvia | `--muted: 90 10% 91%` |
| Tinta (texto/ink) | `#0E1009` | mantido (já compatível com a família sálvia) | `--foreground` / `--brand-ink: 86 28% 5%` |
| Destrutivo | `#D03238` | mantido (vermelho é universal, não é identidade de marca) | `--destructive: 358 64% 51%` |

As duas regras do DESIGN.md §5 continuam valendo e são preservadas verbatim: **admin não usa azul** como cor informativa/link (usa a família verde-sálvia), e **admin não usa `blur-3xl` glow**.

**Files:**
- Modify: `src/shared/styles/globals.css` (tokens de layout, card, paleta, input de hora)
- Modify: `tailwind.config.js` (cores do tema HeroUI, light e dark)
- Modify: `src/presentation/components/atoms/reserve/header.tsx` (altura explícita via token)
- Modify: `src/app/dashboard/layout.tsx` (calc via token)
- Modify: `src/presentation/components/atoms/reserve/aside.tsx` (largura e calc via token)
- Create: `docs/DESIGN.md`
- Test: `src/shared/styles/design-tokens.test.ts`

**Interfaces:**
- Produces: tokens CSS `--header-height`, `--sidebar-width`; classe `.card-reserve` com raio `16px`; regra `input[type="time"]::-webkit-datetime-edit-ampm-field { display: none; }`

- [ ] **Step 1: Write the failing test**

`src/shared/styles/design-tokens.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/shared/styles/globals.css"), "utf8");

describe("design tokens", () => {
  it("declares the header height and sidebar width layout tokens", () => {
    expect(css).toMatch(/--header-height:\s*80px/);
    expect(css).toMatch(/--sidebar-width:\s*310px/);
  });

  it("sets the admin card radius to 16px, not the 30px landing-page radius", () => {
    const cardRule = css.match(/\.card-reserve,\s*\.card-flat\s*\{[^}]*\}/)?.[0];
    expect(cardRule).toBeDefined();
    expect(cardRule).toMatch(/border-radius:\s*16px/);
    expect(cardRule).not.toMatch(/border-radius:\s*30px/);
  });

  it("forces 24h display on time inputs regardless of browser locale", () => {
    expect(css).toMatch(/input\[type="time"\]::-webkit-datetime-edit-ampm-field\s*\{\s*display:\s*none/);
  });

  it("uses the RÉSERVE sage-green brand color, not the Zarp lime", () => {
    expect(css).toMatch(/--brand-green:\s*85 16% 53%/);
    expect(css).not.toMatch(/--brand-green:\s*96 73% 67%/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- design-tokens`
Expected: FAIL — nenhum dos quatro padrões existe ainda no `globals.css` atual (que tem `--brand-green: 96 73% 67%` e `.card-reserve { border-radius: 30px; }`, sem `--header-height`/`--sidebar-width`/regra de `time`)

- [ ] **Step 3: Write minimal implementation**

Em `src/shared/styles/globals.css`, dentro do bloco `:root`, logo após `--brand-mint`, adicione os tokens de layout e troque a paleta:

```css
    /* Reserve specific tokens */
    --brand-ink: 86 28% 5%;
    --brand-green: 85 16% 53%;
    --brand-green-deep: 96 32% 13%;
    --brand-mint: 80 21% 89%;

    /* Layout tokens */
    --header-height: 80px;
    --sidebar-width: 310px;
```

E troque `--background`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--accent`, `--border`, `--input`, `--ring` do bloco `:root` (light) para:

```css
    --background: 60 40% 98%;
    --foreground: 86 28% 5%;
    --card: 0 0% 100%;
    --card-foreground: 86 28% 5%;
    --popover: 0 0% 100%;
    --popover-foreground: 86 28% 5%;
    --primary: 85 16% 53%;
    --primary-foreground: 96 32% 13%;
    --secondary: 80 21% 89%;
    --secondary-foreground: 86 28% 5%;
    --muted: 90 10% 91%;
    --muted-foreground: 60 1% 52%;
    --accent: 85 20% 84%;
    --accent-foreground: 86 28% 5%;
    --destructive: 358 64% 51%;
    --destructive-foreground: 0 0% 100%;
    --border: 90 10% 91%;
    --input: 90 10% 91%;
    --ring: 85 16% 53%;
```

E no bloco `.dark`, troque `--primary`/`--ring` (mantendo o resto do esquema de navy escuro como está):

```css
    --primary: 85 20% 62%;
    --primary-foreground: 96 32% 13%;
```
```css
    --ring: 85 20% 62%;
```

Troque o raio de `.card-reserve`:

```css
.card-reserve, .card-flat { border-radius: 16px; background-color: hsl(var(--card)); border: 1px solid color-mix(in oklch, hsl(var(--brand-ink)) 12%, transparent); box-shadow: 0 1px 0 color-mix(in oklch, #000 6%, transparent), 0 0 0 1px color-mix(in oklch, #000 8%, transparent); padding: clamp(1.2rem, 2.3vw, 2rem); }
.pill-tag { border-radius: 9999px; background-color: hsl(var(--brand-mint)); color: hsl(var(--brand-green-deep)); font-size: 0.78rem; font-weight: 600; padding: 0.25rem 0.75rem; display: inline-flex; align-items: center; }

/* Forca exibicao 24h em inputs de hora, independente do locale do navegador */
input[type="time"]::-webkit-datetime-edit-ampm-field { display: none; }
```

Em `tailwind.config.js`, dentro de `heroui({ themes: { light: { colors: { primary: ... } } } })`, troque:

```js
            primary: {
              DEFAULT: "#8B9B75",
              foreground: "#1E2A16",
            },
```

E em `themes.dark.colors.primary` e `themes.light.colors.focus` / `themes.dark.colors.focus`:

```js
            primary: {
              DEFAULT: "#8B9B75",
              foreground: "#1E2A16",
            },
```
```js
            focus: "#8B9B75",
```
(aplicado nos dois blocos, `light` e `dark`)

Em `src/presentation/components/atoms/reserve/header.tsx`, troque a classe do `<header>` de `"sticky top-0 z-40 flex items-center justify-between px-5 bg-background/88 backdrop-blur-md border-b border-border h-fit py-3 transition-all duration-300"` para:

```tsx
"sticky top-0 z-40 flex h-[var(--header-height)] items-center justify-between px-5 bg-background/88 backdrop-blur-md border-b border-border transition-all duration-300"
```

Em `src/app/dashboard/layout.tsx`, troque `h-[calc(100svh-60px)]` por `h-[calc(100svh-var(--header-height))]`.

Em `src/presentation/components/atoms/reserve/aside.tsx`, troque `w-[310px]` por `w-[var(--sidebar-width)]` e `h-[calc(100svh-60px)]` por `h-[calc(100svh-var(--header-height))]` (as duas ocorrências no `<aside>` do desktop).

`docs/DESIGN.md` (novo arquivo, derivado de `docs/DESIGN.md` da Zarp):

```markdown
# Design System: RÉSERVE — Painel Administrativo

**Project:** `frontend_dashboard_reserve`
**Stack:** Next.js 16 · React 19 · Tailwind CSS v4 · HeroUI · Radix UI (atoms shadcn-ui) · Framer Motion
**Design reference:** admin denso derivado da identidade de marca RÉSERVE (logomark em verde-sálvia)

---

## 1. Tema Visual e Atmosfera

A estética é **calma, confiável e densa** — um painel administrativo que prioriza clareza sobre decoração. A base é um tema claro: fundo parchment quase branco, tinta quase preta para tipografia, e verde-sálvia opaco (extraído do próprio logotipo RÉSERVE) como único acento de marca dominante. O verde-sálvia é mais contido que o lima elétrico usado na landing page da Zarp — a marca RÉSERVE se posiciona como madura e discreta, não energética.

**Distinção admin vs. marketing:** este documento cobre a superfície de admin (`frontend_dashboard_reserve`). Uma eventual landing page RÉSERVE teria liberdade visual maior (glow, gradientes largos); a superfície de admin não.

---

## 2. Paleta de Cores e Papéis

### Tema Claro (padrão)

| Nome descritivo | Hex aprox. | Token CSS | Papel |
|---|---|---|---|
| Parchment quase-branco | `#FFFCF6` | `--background` | Fundo de página |
| Verde-Sálvia RÉSERVE | `#8B9B75` | `--primary` / `--brand-green` | Acento primário de marca; botões de ação, destaques de link, preenchimento de badge |
| Tinta-Sálvia Profunda | `#1E2A16` | `--primary-foreground` / `--brand-green-deep` | Texto sobre o verde-sálvia |
| Névoa de Sálvia Pálida | `#E4E8DC` | `--secondary` / `--brand-mint` | Fundos suaves de seção alternada, variantes de superfície de card |
| Pedra Fria | `#EBEDE8` | `--muted` | Fundos de container discretos, cabeçalhos de tabela |
| Névoa Grafite | `#868685` | `--muted-foreground` | Labels secundários, metadados |
| Tinta Quase-Preta | `#0E1009` | `--foreground` / `--brand-ink` | Texto primário de corpo e título |
| Branco Puro | `#FFFFFF` | `--card` / `--popover` | Superfície de card e container |
| Vermelho de Alerta | `#D03238` | `--destructive` | Ações destrutivas, estados de erro |

### Tema Escuro (`.dark`)

Mantém o esquema navy-escuro herdado (não deriva do verde-sálvia — segue a mesma lógica da Zarp de um dark mode desacoplado da paleta clara), com `--primary`/`--ring` ajustados para `#8B9B75` numa luminosidade maior (`85 20% 62%`) para manter contraste sobre o fundo navy.

### Nota de Superfície de Admin

O painel administrativo **nunca** introduz azul como cor informativa, de link ou de série de gráfico. Onde um design pediria azul (badge de informação, link, série secundária de gráfico), usa-se uma variante da família verde-sálvia:

| Papel | Token/Hex | Notas |
|---|---|---|
| Acento informativo | `hsl(var(--brand-green))` / `#8B9B75` | Substitui qualquer badge "info" ou cor de link azul |
| Série secundária de gráfico | `#65A30D`, `#059669`, `#0D9488` | Família verde já em uso para tematização de módulo; nunca azul |
| Neutro/desabilitado | `hsl(var(--muted-foreground))` | Substitui tons neutros cinza-azulados |

---

## 3. Tipografia

Sistema de duas fontes com separação estrita de papel:

- **Display:** `Bricolage Grotesque` (`--font-display`) — títulos (`h1`–`h4`), peso 700, tracking apertado.
- **Corpo:** `Inter`/Nunito (`--font-sans`) — parágrafos, navegação, labels, texto de UI.

---

## 4. Componentes

### Header e Sidebar

- Header: altura fixa em `var(--header-height)` (`80px`), fundo `bg-background/88` com `backdrop-blur-md`, borda inferior hairline.
- Sidebar desktop: largura fixa em `var(--sidebar-width)` (`310px`), altura `calc(100svh - var(--header-height))`.

### Botões

`.btn-pill` — totalmente arredondado (`border-radius: 9999px`), peso 600, com spring sutil no hover/active (`scale(1.05)`/`scale(0.95)`).

- `.btn-primary`: fundo verde-sálvia (`--brand-green`), texto tinta-sálvia (`--brand-green-deep`).
- `.btn-ghost`: tint quase invisível de verde-sálvia sobre fundo.
- `.btn-dark`: fundo tinta, texto parchment.

### Cards (`.card-reserve` / `.card-flat`)

- **Raio: `16px`** — densidade de admin, não os `30px` de uma landing page.
- Fundo `--card` (branco puro), borda hairline tingida de tinta, sombra dupla sutil (`0 1px 0` + anel `0 0 0 1px`).
- Padding fluido `clamp(1.2rem, 2.3vw, 2rem)`.

### Inputs de Hora

`input[type="time"]` força exibição 24h escondendo o campo AM/PM nativo do WebKit (`::-webkit-datetime-edit-ampm-field { display: none }`) — consistência com o resto do painel, que não usa formato 12h em nenhum outro lugar.

---

## 5. Regras de Superfície de Admin (obrigatórias)

1. **Admin não usa azul** como cor informativa, de link ou de série de gráfico — usa a família verde-sálvia.
2. **Admin não usa decoração `blur-3xl` glow** — esse padrão (glow-circle com borda visível) é de landing page; superfícies densas usam cor sólida ou, no máximo, um gradiente de dois tons sem borda desenhada por cima.

---

## 6. Princípio de Copy (Todas as Superfícies)

Todo texto voltado ao usuário diz o que aconteceu ou o que fazer a seguir, em linguagem simples — nunca um label técnico bruto, valor de enum ou placeholder não traduzido. "Não foi possível carregar os dados" vence "Error loading". "Arquivar lead" vence um ícone sem label. Vale igualmente para estados de carregando, vazio, erro e proibido, não só para o conteúdo primário.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- design-tokens`
Expected: PASS (4 testes)

Run: `npm run build`
Expected: build passa (o header renderiza com a altura nova; nenhuma classe Tailwind quebrada)

- [ ] **Step 5: Commit**

```bash
git add src/shared/styles/globals.css tailwind.config.js src/presentation/components/atoms/reserve/header.tsx src/app/dashboard/layout.tsx src/presentation/components/atoms/reserve/aside.tsx docs/DESIGN.md src/shared/styles/design-tokens.test.ts
git commit -m "feat: add layout tokens, tighten admin card radius, and swap the Zarp lime for the RÉSERVE sage palette"
```

---

### Task 36: Notificações — trazer só o que falta (aditivo)

O Reserve já está à frente do backend Zarp em notificações (`notification-scheduler.service.ts`, `TenantNotificationSettings` — a Zarp não tem nenhum dos dois). Esta task **não sobrescreve nada do backend**; só adiciona peças de frontend que a Zarp tem e o Reserve não: rótulo traduzido do evento disparador, inbox com estado de leitura em React Query (troca o `useState`+`useEffect` atual, que refaz fetch a cada `focus` da janela e não faz atualização otimista), e uma visão somente-leitura de notificação individual.

**Dependência de backend não coberta aqui:** `GET /notifications/tenant/:id` (buscar uma notificação específica do inbox do tenant) ainda não existe no `NotificationTenantController` do Reserve — hoje ele só tem `GET /notifications/tenant` (lista), `GET .../me/unread-count` e `POST .../:id/view`. O hook `useTenantNotification` desta task assume essa rota (mesmo caminho que a Zarp usa), seguindo o mesmo padrão da Task 7 (`GET /api/tenant-capabilities`, que também é contrato assumido antes do backend existir). Registrar como pré-requisito de backend antes de `notification-view` ir para produção.

**Files:**
- Create: `src/modules/notifications/domain/notification-event-labels.ts`
- Test: `src/modules/notifications/domain/notification-event-labels.test.ts`
- Create: `src/shared/hooks/notifications/notification-query-keys.ts`
- Modify: `src/shared/hooks/notifications/use-notification-inbox.ts` (arquivo inteiro, reescrito para React Query)
- Modify: `src/shared/hooks/notifications/use-unread-count.ts` (arquivo inteiro, reescrito para React Query)
- Create: `src/shared/hooks/notifications/use-tenant-notification.ts`
- Test: `src/shared/hooks/notifications/notification-read-state.test.tsx`
- Test: `src/shared/hooks/notifications/use-tenant-notification.test.tsx`
- Create: `src/presentation/components/organisms/notifications/notification-view.tsx`
- Create: `src/app/dashboard/notifications/[id]/view/page.tsx`

**Interfaces:**
- Consumes: `apiClient` de `@/src/infraestructure/axios/api`; `useTenantStore` de `@/src/shared/stores/tenant-store` (Task 2); `formatInTenantTimezone` de `@/src/shared/utils/format-timezone`; `createTestQueryClient`, `createTestQueryWrapper` de `@/src/shared/query/test-query-provider` (Task 1)
- Produces: `resolveEventLabel(eventKey, t): string | null`, `notificationKeys.{tenant,all,inbox,detail,unreadCount}`, `useNotificationInbox(tenantId, page?, limit?)`, `useUnreadCount(tenantId): number`, `useTenantNotification(tenantId, id)`, `NotificationView({ id })`

- [ ] **Step 1: Write the failing test**

`src/modules/notifications/domain/notification-event-labels.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveEventLabel } from "./notification-event-labels";

describe("resolveEventLabel", () => {
  it("maps a known backend event key to its i18n message key", () => {
    const t = (key: string) => (key === "eventLeadCreated" ? "Novo lead" : key);
    expect(resolveEventLabel("lead.created", t)).toBe("Novo lead");
  });

  it("falls back to the raw key for an event the frontend catalog does not know yet", () => {
    const t = (key: string) => key;
    expect(resolveEventLabel("some.new.event", t)).toBe("some.new.event");
  });

  it("returns null when there is no triggering event", () => {
    const t = (key: string) => key;
    expect(resolveEventLabel(null, t)).toBeNull();
    expect(resolveEventLabel(undefined, t)).toBeNull();
  });
});
```

`src/shared/hooks/notifications/notification-read-state.test.tsx`:

```tsx
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { createTestQueryClient, createTestQueryWrapper } from "@/src/shared/query/test-query-provider";
import { notificationKeys } from "./notification-query-keys";
import { useNotificationInbox } from "./use-notification-inbox";
import { useUnreadCount } from "./use-unread-count";

import { apiClient } from "@/src/infraestructure/axios/api";

vi.mock("@/src/infraestructure/axios/api", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const mockedGet = apiClient.get as Mock;
const mockedPost = apiClient.post as Mock;

function setup() {
  const client = createTestQueryClient();
  return { client, wrapper: createTestQueryWrapper(client) };
}

describe("notification read-state synchronization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGet.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("unread-count")) {
        return Promise.resolve({ data: { count: 1 } } as never);
      }
      return Promise.resolve({
        data: {
          data: [
            { id: "receipt-1", notificationId: "notification-1", viewed: false, firstViewedAt: null, Notification: { id: "notification-1" } },
          ],
          total: 1,
        },
      } as never);
    });
    mockedPost.mockResolvedValue({ data: { ok: true } } as never);
  });

  it("marks an item as viewed with an empty object body, never a null body", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useNotificationInbox("tenant-1"), { wrapper });

    await waitFor(() => expect(result.current.data).toHaveLength(1));

    await act(async () => {
      result.current.markAsViewed("notification-1");
    });

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith(
        "/notifications/tenant/notification-1/view",
        {},
        expect.objectContaining({ headers: { "x-tenant-id": "tenant-1" } }),
      ),
    );
    const [, bodyArg] = mockedPost.mock.calls[0];
    expect(bodyArg).not.toBeNull();
  });

  it("invalidates the unread-count query after marking one item as viewed", async () => {
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useNotificationInbox("tenant-1"), { wrapper });

    await waitFor(() => expect(result.current.data).toHaveLength(1));

    await act(async () => {
      result.current.markAsViewed("notification-1");
    });

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: notificationKeys.unreadCount("tenant-1") }),
    );
  });

  it("rolls back the optimistic update when marking all items partially fails", async () => {
    mockedPost.mockRejectedValueOnce(new Error("request failed"));
    const { wrapper } = setup();
    const { result } = renderHook(() => useNotificationInbox("tenant-1"), { wrapper });

    await waitFor(() => expect(result.current.data).toHaveLength(1));

    await act(async () => {
      result.current.markAllAsViewed();
    });

    await waitFor(() => expect(result.current.data.every((item) => !item.viewed)).toBe(true));
  });

  it("fetches the unread count for the current tenant", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useUnreadCount("tenant-1"), { wrapper });

    await waitFor(() => expect(result.current).toBe(1));
    expect(mockedGet).toHaveBeenCalledWith(
      "/notifications/tenant/me/unread-count",
      expect.objectContaining({ headers: { "x-tenant-id": "tenant-1" } }),
    );
  });
});
```

`src/shared/hooks/notifications/use-tenant-notification.test.tsx`:

```tsx
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { createTestQueryClient, createTestQueryWrapper } from "@/src/shared/query/test-query-provider";
import { useTenantNotification } from "./use-tenant-notification";

import { apiClient } from "@/src/infraestructure/axios/api";

vi.mock("@/src/infraestructure/axios/api", () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = apiClient.get as Mock;

function setup() {
  return { wrapper: createTestQueryWrapper(createTestQueryClient()) };
}

describe("useTenantNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGet.mockResolvedValue({
      data: {
        id: "receipt-1",
        notificationId: "notification-1",
        viewed: true,
        firstViewedAt: "2026-07-25T16:18:29.931Z",
        Notification: { id: "notification-1", title: "Novo lead recebido" },
      },
    } as never);
  });

  it("fetches a single notification from the tenant endpoint with the tenant header", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useTenantNotification("tenant-1", "notification-1"), { wrapper });

    await waitFor(() => expect(result.current.notification).not.toBeNull());
    expect(mockedGet).toHaveBeenCalledWith(
      "/notifications/tenant/notification-1",
      expect.objectContaining({ headers: { "x-tenant-id": "tenant-1" } }),
    );
    expect(result.current.notification.Notification.title).toBe("Novo lead recebido");
  });

  it("does not fetch when tenant or id is missing", async () => {
    const { wrapper } = setup();
    renderHook(() => useTenantNotification(null, "notification-1"), { wrapper });
    renderHook(() => useTenantNotification("tenant-1", null), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mockedGet).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- notification-event-labels notification-read-state use-tenant-notification`
Expected: FAIL — nenhum dos módulos existe ainda; `use-notification-inbox`/`use-unread-count` atuais usam `useState`+`useEffect`, não React Query, então `notificationKeys` e o comportamento de invalidação testado não existem

- [ ] **Step 3: Write minimal implementation**

`src/modules/notifications/domain/notification-event-labels.ts`:

```ts
/**
 * Mapeia uma chave de evento de dominio do backend (Notification.eventKey) para
 * uma chave de mensagem i18n sob o namespace `notifications`. Espelha o catalogo
 * do backend (reserve-notifications/domain/constants/notification-events.ts,
 * que hoje tem 3 eventos: lead.created, subscription.expiring, subscription.expired).
 * Chaves desconhecidas caem na propria chave crua, entao um evento novo do
 * backend ainda renderiza algo legivel em vez de sumir.
 */
const EVENT_LABEL_KEYS: Record<string, string> = {
  "lead.created": "eventLeadCreated",
  "subscription.expiring": "eventSubscriptionExpiring",
  "subscription.expired": "eventSubscriptionExpired",
};

export function resolveEventLabel(
  eventKey: string | null | undefined,
  t: (key: string) => string,
): string | null {
  if (!eventKey) return null;
  const messageKey = EVENT_LABEL_KEYS[eventKey];
  return messageKey ? t(messageKey) : eventKey;
}
```

`src/shared/hooks/notifications/notification-query-keys.ts`:

```ts
const tenant = (tenantId: string | null) => ["notifications", "tenant", tenantId] as const;

export const notificationKeys = {
  tenant,
  all: (tenantId: string | null) => [...tenant(tenantId)] as const,
  inbox: (tenantId: string | null, page: number, limit: number) =>
    [...tenant(tenantId), "inbox", { page, limit }] as const,
  detail: (tenantId: string | null, id: string) => [...tenant(tenantId), "detail", id] as const,
  unreadCount: (tenantId: string | null) => [...tenant(tenantId), "unread-count"] as const,
};
```

`src/shared/hooks/notifications/use-notification-inbox.ts` (arquivo inteiro):

```ts
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { notificationKeys } from "./notification-query-keys";

import { apiClient } from "@/src/infraestructure/axios/api";

const STALE_TIME = 30_000;

interface TenantNotificationReceipt {
  id: string;
  notificationId?: string;
  notification_id?: string;
  viewed: boolean;
  firstViewedAt?: string | null;
  first_viewed_at?: string | null;
  Notification?: { id: string; [key: string]: unknown };
  [key: string]: unknown;
}

function resolveNotificationId(item: TenantNotificationReceipt): string | null {
  return item.notificationId ?? item.notification_id ?? item.Notification?.id ?? item.id ?? null;
}

async function fetchInbox(tenantId: string, page: number, limit: number) {
  const res = await apiClient.get("/notifications/tenant", {
    params: { page, limit },
    headers: { "x-tenant-id": tenantId },
  });

  return {
    data: (res.data?.data ?? []) as TenantNotificationReceipt[],
    total: (res.data?.total ?? 0) as number,
  };
}

async function postView(tenantId: string, notificationId: string) {
  await apiClient.post(`/notifications/tenant/${notificationId}/view`, {}, { headers: { "x-tenant-id": tenantId } });
}

export function useNotificationInbox(tenantId: string | null, page = 1, limit = 20) {
  const queryClient = useQueryClient();
  const inboxKey = notificationKeys.inbox(tenantId, page, limit);

  const query = useQuery({
    queryKey: inboxKey,
    queryFn: () => fetchInbox(tenantId as string, page, limit),
    enabled: Boolean(tenantId),
    staleTime: STALE_TIME,
    refetchOnWindowFocus: true,
    placeholderData: (previous) => previous,
  });

  const data = query.data?.data ?? [];
  const total = query.data?.total ?? 0;

  const invalidateUnreadCount = () =>
    queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(tenantId) });

  const markAsViewed = useMutation({
    mutationFn: (notificationId: string) => postView(tenantId as string, notificationId),
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({ queryKey: inboxKey });
      const previous = queryClient.getQueryData<{ data: TenantNotificationReceipt[]; total: number }>(inboxKey);
      const nowIso = new Date().toISOString();

      queryClient.setQueryData(inboxKey, (current: typeof previous) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map((item) =>
            resolveNotificationId(item) === notificationId
              ? { ...item, viewed: true, firstViewedAt: item.firstViewedAt ?? nowIso }
              : item,
          ),
        };
      });

      return { previous };
    },
    onError: (_error, _notificationId, context) => {
      if (context?.previous) queryClient.setQueryData(inboxKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: inboxKey });
      invalidateUnreadCount();
    },
  });

  const markAllAsViewed = useMutation({
    mutationFn: async () => {
      if (!tenantId) return;
      const unreadIds = data
        .filter((item) => !item.viewed)
        .map((item) => resolveNotificationId(item))
        .filter((id): id is string => Boolean(id));

      if (unreadIds.length === 0) return;

      const results = await Promise.allSettled(unreadIds.map((id) => postView(tenantId, id)));
      if (results.some((result) => result.status === "rejected")) {
        throw new Error("Falha ao marcar todas as notificações como vistas");
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: inboxKey });
      const previous = queryClient.getQueryData<{ data: TenantNotificationReceipt[]; total: number }>(inboxKey);
      const nowIso = new Date().toISOString();

      queryClient.setQueryData(inboxKey, (current: typeof previous) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map((item) => ({ ...item, viewed: true, firstViewedAt: item.firstViewedAt ?? nowIso })),
        };
      });

      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(inboxKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: inboxKey });
      invalidateUnreadCount();
    },
  });

  return {
    data,
    total,
    loading: query.isPending && Boolean(tenantId),
    refetch: query.refetch,
    markAsViewed: (notificationId: string) => {
      if (!tenantId || !notificationId) return;
      markAsViewed.mutate(notificationId);
    },
    markAllAsViewed: () => markAllAsViewed.mutate(),
  };
}
```

`src/shared/hooks/notifications/use-unread-count.ts` (arquivo inteiro):

```ts
"use client";
import { useQuery } from "@tanstack/react-query";

import { notificationKeys } from "./notification-query-keys";

import { apiClient } from "@/src/infraestructure/axios/api";

const STALE_TIME = 30_000;
const REFETCH_INTERVAL = 60_000;

async function fetchUnreadCount(tenantId: string): Promise<number> {
  const res = await apiClient.get("/notifications/tenant/me/unread-count", { headers: { "x-tenant-id": tenantId } });
  return res.data?.count ?? 0;
}

export function useUnreadCount(tenantId: string | null) {
  const { data } = useQuery({
    queryKey: notificationKeys.unreadCount(tenantId),
    queryFn: () => fetchUnreadCount(tenantId as string),
    enabled: Boolean(tenantId),
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });

  return data ?? 0;
}
```

`src/shared/hooks/notifications/use-tenant-notification.ts`:

```ts
"use client";
import { useQuery } from "@tanstack/react-query";

import { notificationKeys } from "./notification-query-keys";

import { apiClient } from "@/src/infraestructure/axios/api";

const STALE_TIME = 30_000;

interface TenantNotificationDetail {
  id: string;
  notificationId?: string;
  viewed: boolean;
  firstViewedAt?: string | null;
  Notification?: Record<string, unknown>;
  [key: string]: unknown;
}

async function fetchTenantNotification(tenantId: string, id: string): Promise<TenantNotificationDetail> {
  const res = await apiClient.get(`/notifications/tenant/${id}`, { headers: { "x-tenant-id": tenantId } });
  return res.data as TenantNotificationDetail;
}

export function useTenantNotification(tenantId: string | null, id: string | null) {
  const query = useQuery({
    queryKey: notificationKeys.detail(tenantId, id ?? ""),
    queryFn: () => fetchTenantNotification(tenantId as string, id as string),
    enabled: Boolean(tenantId && id),
    staleTime: STALE_TIME,
  });

  return {
    notification: query.data ?? null,
    loading: query.isPending && Boolean(tenantId && id),
    error: query.error,
  };
}
```

`src/presentation/components/organisms/notifications/notification-view.tsx`:

```tsx
"use client";

import { Card, CardBody, CardHeader, Chip, Button, Spinner } from "@heroui/react";
import { ArrowLeft, Bell, CheckCheck, ExternalLink, Zap } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { CmsPageLayout } from "../cms/shared/cms-page-layout";
import { resolveEventLabel } from "@/src/modules/notifications/domain/notification-event-labels";
import { useTenantNotification } from "@/src/shared/hooks/notifications/use-tenant-notification";
import { useNotificationSettings } from "@/src/shared/hooks/notifications/use-notification-settings";
import { useTenantStore } from "@/src/shared/stores/tenant-store";
import { formatInTenantTimezone } from "@/src/shared/utils/format-timezone";

interface Props {
  id: string;
}

const META_FIELDS: { key: string; labelKey: string }[] = [
  { key: "name", labelKey: "metaName" },
  { key: "email", labelKey: "metaEmail" },
  { key: "phone", labelKey: "metaPhone" },
  { key: "source", labelKey: "metaSource" },
  { key: "message", labelKey: "metaMessage" },
];

function extractMeta(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return [];
  const record = metadata as Record<string, unknown>;

  return META_FIELDS.map(({ key, labelKey }) => {
    const value = record[key];
    return value ? { labelKey, value: String(value) } : null;
  }).filter((entry): entry is { labelKey: string; value: string } => Boolean(entry));
}

export function NotificationView({ id }: Props) {
  const t = useTranslations("notifications");
  const selectedTenant = useTenantStore((s) => s.selectedTenant);
  const tenantId = selectedTenant?.id ?? null;

  const { notification, loading } = useTenantNotification(tenantId, id);
  const { settings } = useNotificationSettings(tenantId);
  const timezone: string = settings?.timezone ?? "America/Sao_Paulo";

  if (loading) {
    return (
      <CmsPageLayout routeActive="notifications">
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </CmsPageLayout>
    );
  }

  if (!notification) {
    return (
      <CmsPageLayout routeActive="notifications">
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-base font-semibold text-foreground">{t("viewNotFound")}</p>
          <Button as={Link} href="/dashboard/notifications" startContent={<ArrowLeft className="h-4 w-4" />} variant="flat">
            {t("back")}
          </Button>
        </div>
      </CmsPageLayout>
    );
  }

  const notif = (notification.Notification ?? notification) as Record<string, unknown>;
  const isRead = Boolean(notification.viewed);
  const firstViewedAt = notification.firstViewedAt as string | undefined;
  const publishedAt = (notif.publishedAt ?? notif.published_at) as string | undefined;
  const eventLabel = resolveEventLabel((notif.eventKey ?? notif.event_key) as string | undefined, t);
  const actionUrl = (notif.action_url ?? notif.url ?? notif.link) as string | undefined;
  const meta = extractMeta(notif.metadata);

  return (
    <CmsPageLayout routeActive="notifications">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Button
          as={Link}
          className="w-fit font-semibold"
          href="/dashboard/notifications"
          size="sm"
          startContent={<ArrowLeft className="h-4 w-4" />}
          variant="light"
        >
          {t("back")}
        </Button>

        <Card className="border border-border/70 shadow-xs">
          <CardHeader className="flex flex-col items-start gap-3 px-6 pt-6">
            <div className="flex items-center gap-3">
              <div
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                  isRead ? "bg-default-100 text-muted-foreground" : "bg-primary/15 text-primary"
                }`}
              >
                {isRead ? <CheckCheck className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="text-xl font-bold leading-tight text-foreground">{String(notif.title ?? "")}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <Chip className="text-[11px] font-semibold" color={isRead ? "default" : "primary"} size="sm" variant="flat">
                    {isRead ? t("viewStatusRead") : t("viewStatusUnread")}
                  </Chip>
                  {eventLabel && (
                    <Chip className="text-[11px] font-semibold" color="warning" size="sm" startContent={<Zap className="h-3 w-3" />} variant="flat">
                      {eventLabel}
                    </Chip>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardBody className="flex flex-col gap-6 px-6 pb-6">
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{String(notif.body ?? "")}</p>

            <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/60 bg-default-50/50 p-4 sm:grid-cols-2">
              {selectedTenant?.name && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground/70">{t("audienceLabel")}</span>
                  <span className="text-sm font-medium text-foreground">{selectedTenant.name}</span>
                </div>
              )}
              {publishedAt && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground/70">{t("viewReceivedLabel")}</span>
                  <span className="text-sm font-medium text-foreground">{formatInTenantTimezone(publishedAt, timezone)}</span>
                </div>
              )}
              {isRead && firstViewedAt && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground/70">{t("viewStatusLabel")}</span>
                  <span className="text-sm font-medium text-foreground">
                    {t("inboxViewedAt", { date: formatInTenantTimezone(firstViewedAt, timezone) })}
                  </span>
                </div>
              )}
            </div>

            {meta.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground/70">{t("viewDetailsSection")}</span>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {meta.map(({ labelKey, value }) => (
                    <div key={labelKey} className="flex flex-col gap-0.5">
                      <dt className="text-xs font-semibold text-muted-foreground">{t(labelKey)}</dt>
                      <dd className="whitespace-pre-line break-words text-sm text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {actionUrl && (
              <Button as={Link} className="w-fit font-semibold" color="primary" endContent={<ExternalLink className="h-4 w-4" />} href={actionUrl} variant="flat">
                {t("viewOpenLink")}
              </Button>
            )}
          </CardBody>
        </Card>
      </div>
    </CmsPageLayout>
  );
}
```

`src/app/dashboard/notifications/[id]/view/page.tsx`:

```tsx
import { NotificationView } from "@/src/presentation/components/organisms/notifications/notification-view";

export default async function NotificationViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NotificationView id={id} />;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- notification-event-labels notification-read-state use-tenant-notification`
Expected: PASS (3 + 4 + 2 testes)

Run: `npm run build`
Expected: build passa

- [ ] **Step 5: Commit**

```bash
git add src/modules/notifications/domain/notification-event-labels.ts src/modules/notifications/domain/notification-event-labels.test.ts src/shared/hooks/notifications/notification-query-keys.ts src/shared/hooks/notifications/use-notification-inbox.ts src/shared/hooks/notifications/use-unread-count.ts src/shared/hooks/notifications/use-tenant-notification.ts src/shared/hooks/notifications/notification-read-state.test.tsx src/shared/hooks/notifications/use-tenant-notification.test.tsx src/presentation/components/organisms/notifications/notification-view.tsx src/app/dashboard/notifications/[id]/view/page.tsx
git commit -m "feat: move the notification inbox to React Query and add a read-only tenant notification view"
```

---

### Task 37: Acessibilidade — `vitest-axe`, alvo de toque do `resource-list` e `fast-check`

Fecha a plataforma com o que o Reserve já paga por mas não usa: `vitest-axe` (instalado, zero uso) e `fast-check` (instalado, zero uso). Também corrige um alvo de toque real encontrado nesta auditoria: os botões de `ResourceListPagination` (Task 29) renderizam a `h-8 w-8` (32px) — abaixo do mínimo de 44px que `EntityListPagination` (Task 19) já respeita. Esta task alinha os dois.

**Files:**
- Create: `src/presentation/components/organisms/entity-list/entity-list.a11y.test.tsx`
- Create: `src/presentation/components/organisms/entity-actions/entity-action-host.a11y.test.tsx`
- Create: `src/presentation/components/organisms/notifications/notification-view.a11y.test.tsx`
- Modify: `src/presentation/components/organisms/resource-list/resource-list-pagination.tsx` (botões para `min-h-11 min-w-11`)
- Create: `src/presentation/components/organisms/resource-list/resource-list-touch-targets.test.tsx`
- Create: `src/presentation/components/organisms/resource-list/list-utils.property.test.ts`

**Interfaces:**
- Consumes: `axe`/`toHaveNoViolations` de `vitest-axe`; `fc` de `fast-check`; `paginateResources` de `./list-utils` (Task 28); todas as peças das Tasks 24, 27, 36

- [ ] **Step 1: Write the failing test**

`src/presentation/components/organisms/entity-list/entity-list.a11y.test.tsx`:

```tsx
import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";

import { createTestQueryClient } from "@/src/shared/query/test-query-provider";
import { EntityList } from "./entity-list";
import { EntityListItem } from "./entity-list-item";
import type { EntityListDefinition } from "./types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/contacts",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/src/shared/stores/tenant-store", () => ({
  useSelectedTenantId: () => "tenant-1",
}));

function definitionWith(items: Array<{ id: string; name: string }>): EntityListDefinition<{ id: string; name: string }, { status: string }> {
  return {
    id: "contacts-a11y",
    ariaLabel: "Contatos",
    getKey: (contact) => contact.id,
    dataSource: {
      capabilities: { search: "server", sort: false, pagination: "server", selection: "multiple" },
      query: vi.fn().mockResolvedValue({ items, total: items.length, page: 1, pageSize: 30 }),
    },
    initialState: { pageSize: 30, filters: { status: "" } },
    filters: [{ key: "status", label: "Status", kind: "single", options: [{ value: "active", label: "Ativo" }] }],
    sorts: [],
    renderItem: (contact, context) => (
      <EntityListItem
        selectable={context.selectable ? { label: `Selecionar ${contact.name}`, selected: context.selected, onSelectionChange: context.onSelectionChange } : undefined}
        title={contact.name}
      />
    ),
  };
}

function renderWithClient(definition: EntityListDefinition<{ id: string; name: string }, { status: string }>) {
  const client = createTestQueryClient();
  const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return render(<EntityList definition={definition} searchDebounceMs={0} />, { wrapper });
}

describe("EntityList accessibility", () => {
  it("has no axe violations with a populated list", async () => {
    const { container } = renderWithClient(definitionWith([{ id: "1", name: "Ada Lovelace" }]));
    await waitFor(() => expect(container.textContent).toContain("Ada Lovelace"));

    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations in the empty state", async () => {
    const { container } = renderWithClient(definitionWith([]));
    await waitFor(() => expect(container.textContent).toContain("Nenhum item encontrado"));

    expect(await axe(container)).toHaveNoViolations();
  });
});
```

`src/presentation/components/organisms/entity-actions/entity-action-host.a11y.test.tsx`:

```tsx
import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";

import { createTestQueryClient } from "@/src/shared/query/test-query-provider";
import { EntityActionsProvider } from "./entity-actions-provider";
import { useEntityActions } from "./use-entity-actions";

function Harness() {
  const actions = useEntityActions();
  return (
    <button
      onClick={() =>
        actions.openDelete({
          entity: { id: "contact-1" },
          title: "Excluir contato",
          description: "Esta ação não pode ser desfeita.",
          confirmLabel: "Excluir",
          successMessage: "Contato excluído",
          tone: "danger",
          mutation: async () => undefined,
          invalidate: [["contacts"]],
        })
      }
    >
      Abrir exclusão
    </button>
  );
}

describe("EntityActionHost accessibility", () => {
  it("has no axe violations while the confirmation dialog is open", async () => {
    const client = createTestQueryClient();
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>
        <EntityActionsProvider>{children}</EntityActionsProvider>
      </QueryClientProvider>
    );
    render(<Harness />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: "Abrir exclusão" }));
    const dialog = screen.getByRole("dialog");

    expect(await axe(dialog)).toHaveNoViolations();
  });
});
```

`src/presentation/components/organisms/notifications/notification-view.a11y.test.tsx`:

```tsx
import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";

import { createTestQueryClient } from "@/src/shared/query/test-query-provider";
import { NotificationView } from "./notification-view";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/src/shared/stores/tenant-store", () => ({
  useTenantStore: (selector: (state: { selectedTenant: { id: string; name: string } }) => unknown) =>
    selector({ selectedTenant: { id: "tenant-1", name: "Hotel RÉSERVE" } }),
}));
vi.mock("@/src/shared/hooks/notifications/use-tenant-notification", () => ({
  useTenantNotification: () => ({
    notification: {
      viewed: false,
      Notification: { title: "Novo lead recebido", body: "Um novo lead chegou.", published_at: "2026-07-25T10:00:00.000Z" },
    },
    loading: false,
  }),
}));
vi.mock("@/src/shared/hooks/notifications/use-notification-settings", () => ({
  useNotificationSettings: () => ({ settings: { timezone: "America/Sao_Paulo" } }),
}));

describe("NotificationView accessibility", () => {
  it("has no axe violations rendering a single notification", async () => {
    const client = createTestQueryClient();
    const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { container } = render(<NotificationView id="notification-1" />, { wrapper });

    await waitFor(() => expect(container.textContent).toContain("Novo lead recebido"));
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

`src/presentation/components/organisms/resource-list/resource-list-touch-targets.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResourceListPagination } from "./resource-list-pagination";

describe("resource-list touch targets", () => {
  it("gives pagination icon controls a minimum 44px square target, matching entity-list", () => {
    render(<ResourceListPagination page={2} totalItems={30} pageSize={10} onPageChange={vi.fn()} />);

    for (const name of ["Página anterior", "Próxima página"]) {
      expect(screen.getByRole("button", { name })).toHaveClass("min-h-11", "min-w-11");
    }
  });
});
```

`src/presentation/components/organisms/resource-list/list-utils.property.test.ts`:

```ts
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { paginateResources } from "./list-utils";

describe("paginateResources (property-based)", () => {
  it("never returns more items than the page size and covers every item across all pages exactly once", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 0, maxLength: 200 }),
        fc.integer({ min: 1, max: 50 }),
        (resources, pageSize) => {
          const { totalPages } = paginateResources(resources, 1, pageSize);
          const seen: number[] = [];

          for (let page = 1; page <= totalPages; page += 1) {
            const result = paginateResources(resources, page, pageSize);
            expect(result.items.length).toBeLessThanOrEqual(pageSize);
            seen.push(...result.items);
          }

          expect(seen).toEqual(resources);
        },
      ),
    );
  });

  it("always clamps the resolved page into [1, totalPages], regardless of how far out of range the request is", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 0, maxLength: 50 }),
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: -1000, max: 1000 }),
        (resources, pageSize, requestedPage) => {
          const result = paginateResources(resources, requestedPage, pageSize);
          expect(result.page).toBeGreaterThanOrEqual(1);
          expect(result.page).toBeLessThanOrEqual(result.totalPages);
        },
      ),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- entity-list.a11y entity-action-host.a11y notification-view.a11y resource-list-touch-targets list-utils.property`
Expected: FAIL — os arquivos de teste ainda não existem, e `resource-list-touch-targets` falha porque `ResourceListPagination` hoje usa `h-8 w-8`, não `min-h-11 min-w-11`

- [ ] **Step 3: Write minimal implementation**

Em `src/presentation/components/organisms/resource-list/resource-list-pagination.tsx`, troque as duas classes de `<button>` de:

```
"inline-flex h-8 w-8 items-center justify-center rounded-lg bg-default-100 text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
```

para:

```
"inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-default-100 text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
```

(nos dois botões, "Página anterior" e "Próxima página")

Os demais três arquivos de teste (`entity-list.a11y.test.tsx`, `entity-action-host.a11y.test.tsx`, `notification-view.a11y.test.tsx`, `list-utils.property.test.ts`) não exigem nenhum código de produção novo — eles verificam comportamento e markup que as Tasks 24, 27, 28 e 36 já implementam corretamente. Nenhuma implementação adicional é necessária além do ajuste de `resource-list-pagination.tsx` acima.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- entity-list.a11y entity-action-host.a11y notification-view.a11y resource-list-touch-targets list-utils.property`
Expected: PASS (2 + 1 + 1 + 1 + 2 testes)

Rode a suíte completa para fechar a Fase 5:

Run: `npm run test:run`
Expected: PASS (toda a suíte, incluindo os arquivos pré-existentes do Reserve)

Run: `npm run build`
Expected: build passa

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/entity-list/entity-list.a11y.test.tsx src/presentation/components/organisms/entity-actions/entity-action-host.a11y.test.tsx src/presentation/components/organisms/notifications/notification-view.a11y.test.tsx src/presentation/components/organisms/resource-list/resource-list-pagination.tsx src/presentation/components/organisms/resource-list/resource-list-touch-targets.test.tsx src/presentation/components/organisms/resource-list/list-utils.property.test.ts
git commit -m "test: add vitest-axe accessibility coverage, align resource-list touch targets, and add a fast-check property test"
```
