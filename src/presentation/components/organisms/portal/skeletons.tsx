import { cn } from "@/src/shared/lib/utils";

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function PortalCardSkeleton() {
  return (
    <div className="space-y-2 rounded-lg border border-border p-4">
      <Pulse className="h-3 w-24" />
      <Pulse className="h-7 w-32" />
      <Pulse className="h-3 w-16" />
    </div>
  );
}

export function PortalChartSkeleton() {
  return (
    <div className="rounded-lg border border-border p-4">
      <Pulse className="mb-4 h-4 w-40" />
      <Pulse className="h-48 w-full md:h-64" />
    </div>
  );
}

export function PortalTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 rounded-lg border border-border p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Pulse key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
