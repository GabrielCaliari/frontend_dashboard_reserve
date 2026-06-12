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
  const onlyChild =
    Children.count(content) === 1 ? Children.only(content as ReactNode) : null;
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
          value={{
            mode: selectionMode,
            selectedKeys: currentSelection,
            update,
            classNames,
            availableKeys,
            removeWrapper,
          }}
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

export function OperationalListHeader({
  children,
  columns = [],
  className,
}: OperationalHeaderProps) {
  const context = useContext(OperationalListContext);
  let rendered = typeof children === "function" ? columns.map(children) : children;
  const onlyChild =
    Children.count(rendered) === 1 ? Children.only(rendered as ReactNode) : null;
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
      <div
        role="status"
        aria-label={loadingLabel ?? label}
        className={clsx(className, context.classNames?.tbody)}
      >
        {loadingContent}
      </div>
    );
  }
  const initial =
    items && typeof children === "function" ? Array.from(items, children) : (children as ReactNode);
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
          return isValidElement(cell) && cell.key == null
            ? cloneElement(cell, { key: column?.key ?? index })
            : cell;
        })
      : children;
  const labeled = Children.map(rendered, (child, index) => {
    if (!isValidElement<OperationalListCellProps>(child) || child.type !== OperationalListCell || child.props.label)
      return child;
    const column = columns[index];
    return cloneElement(child, { label: column?.label ?? column?.name ?? column?.children ?? column?.key });
  });
  const selected =
    resourceKey != null && (context.selectedKeys === "all" || context.selectedKeys.has(resourceKey));
  const select =
    resourceKey != null && context.mode && context.mode !== "none"
      ? () => {
          if (context.mode === "single") return context.update(new Set([resourceKey]));
          const next =
            context.selectedKeys === "all"
              ? new Set(context.availableKeys.current)
              : new Set(context.selectedKeys);
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
    <div
      className={clsx("min-w-0 flex-1 break-words", context.classNames?.td, context.classNames?.cell, className)}
      {...props}
    >
      {label ? (
        <>
          <span className="sr-only">{label}</span>
          <span aria-hidden="true" className="mr-2 text-xs font-medium text-muted-foreground sm:hidden">
            {label}
          </span>
        </>
      ) : null}
      {children}
    </div>
  );
}

export function OperationalListColumn({
  children,
  className,
  ...props
}: OperationalListCellProps) {
  const context = useContext(OperationalListContext);
  return (
    <div className={clsx("min-w-0 flex-1", context.classNames?.th, className)} {...props}>
      {children}
    </div>
  );
}
