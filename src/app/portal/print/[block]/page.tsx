"use client";

import { use } from "react";
import type { ComponentType } from "react";
import PortalDashboardPage from "@/src/presentation/components/pages/portal/dashboard/page";
import PortalTrafegoPage from "@/src/presentation/components/pages/portal/trafego/page";
import PortalLeadsPage from "@/src/presentation/components/pages/portal/leads/page";
import PortalInstagramPage from "@/src/presentation/components/pages/portal/instagram/page";
import PortalRetornoPage from "@/src/presentation/components/pages/portal/retorno/page";

const BLOCK_PAGES: Record<string, ComponentType> = {
  dashboard: PortalDashboardPage,
  trafego: PortalTrafegoPage,
  leads: PortalLeadsPage,
  instagram: PortalInstagramPage,
  retorno: PortalRetornoPage,
};

/**
 * Chrome-free printable route (no PortalNav — see the /portal/print branch
 * in PortalLayout), ready for the backend's future PDF screenshotter to
 * call once built (plan Assumption 5). Still sits under /portal/**, so
 * src/proxy.ts's auth guard applies — a signed-out visitor cannot reach
 * this route either. Backend PDF generation is expected to call this route
 * with a service-level session, not bypass auth.
 */
export default function PortalPrintPage({ params }: { params: Promise<{ block: string }> }) {
  const { block } = use(params);
  const BlockPage = BLOCK_PAGES[block];

  if (!BlockPage) {
    return <div className="p-6">Bloco não encontrado para exportação.</div>;
  }

  return (
    <div className="print:m-0">
      <header className="mb-4 flex items-center gap-3 border-b border-border pb-4">
        <span className="font-portal-display text-lg">RÉSERVE</span>
      </header>
      <BlockPage />
    </div>
  );
}
