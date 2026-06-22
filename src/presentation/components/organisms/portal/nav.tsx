"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Instagram,
  MessageCircle,
  PiggyBank,
  Calendar,
  Target,
  ListChecks,
  History,
  FileText,
} from "lucide-react";
import { cn } from "@/src/shared/lib/utils";

export interface PortalRoute {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

export const PORTAL_ROUTES: PortalRoute[] = [
  { href: "/portal/dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/portal/trafego", label: "Tráfego Pago", icon: TrendingUp },
  { href: "/portal/leads", label: "Leads e Funil", icon: Users },
  { href: "/portal/instagram", label: "Instagram", icon: Instagram },
  { href: "/portal/atendimento", label: "Atendimento", icon: MessageCircle },
  { href: "/portal/retorno", label: "Retorno", icon: PiggyBank },
  { href: "/portal/calendario", label: "Calendário", icon: Calendar },
  { href: "/portal/plano", label: "Plano", icon: Target },
  { href: "/portal/atividades", label: "Atividades", icon: ListChecks },
  { href: "/portal/evolucao", label: "Evolução", icon: History },
  { href: "/portal/relatorios", label: "Relatórios", icon: FileText },
];

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação do painel"
      className={cn(
        // desktop: vertical sidebar
        "hidden md:flex md:w-56 md:flex-col md:gap-1 md:border-r md:border-border md:p-4",
        // mobile: bottom bar, per master doc §4.3 mobile-first
        "fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-border bg-background p-2 md:static md:justify-start",
      )}
    >
      {PORTAL_ROUTES.map((route) => {
        const isActive = pathname === route.href;
        const Icon = route.icon;
        return (
          <Link
            key={route.href}
            href={route.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 rounded-md px-2 py-1.5 text-xs md:flex-row md:gap-2 md:px-3 md:py-2 md:text-sm",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{route.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
