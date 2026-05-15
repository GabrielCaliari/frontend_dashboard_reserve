"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type PropsWithChildren } from "react";

import { useTenantStore } from "@/src/shared/stores/tenant-store";

/**
 * Deriva a chave de escopo do cache a partir do tenant selecionado.
 * Usada como `key` do QueryClientProvider para forcar o React a
 * desmontar/remontar a subarvore (e criar um QueryClient novo) sempre
 * que o tenant ativo mudar.
 */
export function getTenantCacheScope(tenantId: string | null) {
  return `tenant:${tenantId ?? "none"}`;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 60 * 1000, // 1 minute - data considered fresh for 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes - cache garbage collection time (formerly cacheTime)
      },
    },
  });
}

function TenantQueryScope({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);

  useEffect(
    () => () => {
      // Cancela requisicoes em voo e descarta o cache do client que esta
      // saindo antes do React o desmontar, para nenhum dado do tenant
      // anterior sobreviver ao troca (mesmo antes do staleTime expirar).
      void queryClient.cancelQueries();
      queryClient.clear();
    },
    [queryClient],
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/**
 * Substitui o QueryClient singleton por um QueryClient por tenant.
 *
 * Ao trocar de tenant (via TenantSelector), a `key` do QueryClientProvider
 * muda, o React desmonta a subarvore anterior (disparando a limpeza acima)
 * e monta uma nova com um QueryClient limpo -- eliminando o vazamento de
 * dados entre tenants que existia com o client de modulo compartilhado.
 */
export function TenantQueryProvider({ children }: PropsWithChildren) {
  const tenantId = useTenantStore(
    (state) => state.selectedTenant?.id.toString() ?? null,
  );
  const cacheScope = getTenantCacheScope(tenantId);

  return <TenantQueryScope key={cacheScope}>{children}</TenantQueryScope>;
}
