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
        {/* Cabecalho aberto, sem caixa: o titulo carrega a tela e uma linha fina
            separa do conteudo. */}
        <header className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-[2rem] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground sm:text-[2.5rem]">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </header>

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
        <h2 className="font-display text-xl font-semibold tracking-[-0.01em] text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="max-w-[70ch] text-sm text-foreground/60">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
