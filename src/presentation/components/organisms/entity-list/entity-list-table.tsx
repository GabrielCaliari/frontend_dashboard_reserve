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
    <table
      aria-label={ariaLabel}
      className="w-full overflow-hidden rounded-xl border border-divider bg-content1 text-sm"
    >
      <thead>
        <tr className="border-b border-divider bg-default-50">
          {selection ? <th className="w-10 px-4 py-3" /> : null}
          {columns.map((column) => (
            <th
              key={column.key}
              className={clsx(
                "px-4 py-3 font-medium text-muted-foreground",
                ALIGN_CLASS[column.align ?? "start"],
              )}
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
              className={clsx(
                "border-b border-divider last:border-b-0",
                onActivate && "cursor-pointer hover:bg-default-50",
              )}
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
                <td
                  key={column.key}
                  className={clsx("px-4 py-3", ALIGN_CLASS[column.align ?? "start"])}
                >
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
