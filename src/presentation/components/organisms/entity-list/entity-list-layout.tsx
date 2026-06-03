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
                <Button
                  aria-label="Abrir filtros"
                  className="min-h-11"
                  size="sm"
                  variant="outline"
                >
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
