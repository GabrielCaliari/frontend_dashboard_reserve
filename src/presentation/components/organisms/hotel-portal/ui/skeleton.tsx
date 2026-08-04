"use client";

import { Card, CardBody } from "@heroui/react";

/** Skeleton de card de métrica (Doc 03 §5.2 — nunca spinner em tela cheia). */
export function SkeletonCard() {
  return (
    <Card className="rounded-3xl shadow-none border border-border bg-default-50">
      <CardBody className="p-5 sm:p-6 flex flex-col gap-3">
        <div className="h-9 w-9 rounded-xl bg-default-100 animate-pulse" />
        <div className="space-y-2">
          <div className="h-7 w-24 rounded-lg bg-default-100 animate-pulse" />
          <div className="h-4 w-32 rounded-lg bg-default-100 animate-pulse" />
        </div>
      </CardBody>
    </Card>
  );
}

export function SkeletonCardGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Skeleton de tabela/linha. */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="rounded-3xl shadow-none border border-border bg-default-50 overflow-hidden">
      <CardBody className="p-0 divide-y divide-border/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="h-4 flex-1 rounded bg-default-100 animate-pulse" />
            <div className="h-4 w-20 rounded bg-default-100 animate-pulse" />
            <div className="h-4 w-20 rounded bg-default-100 animate-pulse" />
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
