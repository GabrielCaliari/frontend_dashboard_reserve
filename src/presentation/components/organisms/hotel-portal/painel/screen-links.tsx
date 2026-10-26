"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface ScreenLink {
  href: string;
  label: string;
  /** Uma linha dizendo o que a pessoa encontra la. */
  hint: string;
}

/**
 * Rodape "continue por aqui" das telas do painel: cada tela aponta para as
 * duas ou tres vizinhas que completam a leitura (trafego -> campanhas ->
 * retorno), em vez de a pessoa voltar ao menu para descobrir.
 */
export function ScreenLinks({ links }: { links: ScreenLink[] }) {
  return (
    <nav aria-label="Telas relacionadas" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="group flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-default-50 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="min-w-0">
            <span className="block text-sm font-medium text-foreground">{l.label}</span>
            <span className="block truncate text-xs text-muted-foreground">{l.hint}</span>
          </span>
          <ArrowRight
            aria-hidden
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
          />
        </Link>
      ))}
    </nav>
  );
}
