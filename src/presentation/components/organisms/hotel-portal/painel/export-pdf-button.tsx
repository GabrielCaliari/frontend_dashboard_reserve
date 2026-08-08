"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";
import { hotelPortalService } from "@/src/modules/hotel-portal/infrastructure/adapters";

/**
 * §3.8 — o PDF e gerado no backend (Puppeteer) e devolvido como binario por
 * `GET /hotel-portal/:clientId/export/report`. Nao existe mais rota de
 * impressao no front: a antiga `/portal/print/[block]` foi removida junto com
 * a area /portal.
 *
 * O backend so suporta a secao `overview` hoje, entao este botao so faz
 * sentido na Visao Geral.
 */
export function ExportPdfButton({
  clientId,
  period,
  label = "Exportar período",
}: {
  clientId: string | null;
  period: { from: string; to: string };
  label?: string;
}) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    if (!clientId) return;
    setIsExporting(true);
    try {
      const blob = await hotelPortalService.exportReportPdf(clientId, period);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reserve-${period.from}-a-${period.to}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleExport}
      disabled={!clientId || isExporting}
    >
      <FileDown className="mr-1 size-3.5" />
      {isExporting ? "Gerando…" : label}
    </Button>
  );
}
