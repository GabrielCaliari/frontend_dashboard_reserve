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

export const selectAllMatching = <
  TKey extends EntityKey,
>(): EntitySelection<TKey> => ({
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
