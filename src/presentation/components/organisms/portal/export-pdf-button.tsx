import Link from "next/link";
import { FileDown } from "lucide-react";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";

/**
 * §3.8 — Actual PDF binary generation (Puppeteer/Playwright screenshotting
 * `/portal/print/[block]`) is backend-only (plan Assumption 5). This is the
 * trigger: it opens the printable route in a new tab, useful standalone
 * today via the browser's own print-to-PDF.
 */
export function ExportPdfButton({ block, label = "Exportar período" }: { block: string; label?: string }) {
  return (
    <Button asChild size="sm" variant="outline">
      <Link href={`/portal/print/${block}`} target="_blank" rel="noreferrer">
        <FileDown className="mr-1 size-3.5" /> {label}
      </Link>
    </Button>
  );
}
