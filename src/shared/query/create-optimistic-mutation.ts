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
