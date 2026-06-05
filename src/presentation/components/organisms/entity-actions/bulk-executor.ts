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
  const result: BulkExecutionResult<TKey> = {
    succeeded: [],
    failed: [],
    unprocessed: [],
  };
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
