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
          <span className="mt-1 block text-xs font-medium text-muted-foreground">
            {statusLabel}
          </span>
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
