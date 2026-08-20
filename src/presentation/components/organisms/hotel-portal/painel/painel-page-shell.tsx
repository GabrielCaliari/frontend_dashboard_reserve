"use client";

import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import { Card, CardBody, Spinner } from "@heroui/react";
import { AlertCircle } from "lucide-react";

/**
 * Casca comum das telas do Painel Reserve dentro do /dashboard: cabecalho,
 * estados de carregando/erro e o mesmo respiro das telas de hotel que ja
 * existiam. Evita repetir 40 linhas de boilerplate em cada uma das 11 telas.
 */
export function PainelPageShell({
  title,
  description,
  isLoading,
  isError,
  errorMessage = "Erro ao carregar os dados desta tela.",
  actions,
  wide,
  children,
}: {
  title: string;
  description?: string;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  actions?: React.ReactNode;
  /** Telas densas em colunas (calendario, kanban) precisam de mais largura util. */
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <LayoutScopeRoot>
      <div
        className={`mx-auto ${wide ? "max-w-[1840px]" : "max-w-[1400px]"} animate-fade-in space-y-8 px-4 py-8 sm:px-8 lg:px-10`}
      >
        <div className="relative overflow-hidden rounded-3xl border border-border bg-default-50 p-8 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              {description && (
                <p className="mt-2 text-base text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {actions}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Spinner size="lg" color="primary" />
          </div>
        ) : isError ? (
          <Card className="rounded-3xl border-danger/20 bg-danger/5 shadow-none">
            <CardBody className="p-10 text-center">
              <AlertCircle className="mx-auto mb-4 h-10 w-10 text-danger" />
              <p className="text-base text-danger">{errorMessage}</p>
            </CardBody>
          </Card>
        ) : (
          children
        )}
      </div>
    </LayoutScopeRoot>
  );
}

/**
 * Cabecalho de secao com a barrinha primaria das telas de hotel. A descricao e
 * opcional e alinha com o titulo (6px da barra + 12px do gap).
 */
export function PainelSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1.5 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h2>
        </div>
        {description ? (
          <p className="pl-[18px] text-sm text-foreground/60">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
