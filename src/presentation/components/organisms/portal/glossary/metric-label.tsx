"use client";

import { HelpCircle } from "lucide-react";
import { glossary, type GlossaryKey } from "@/src/modules/portal/domain/glossary";
import { useMediaQuery } from "@/src/shared/hooks/portal/use-media-query";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/src/presentation/components/atoms/shadcn-ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/src/presentation/components/atoms/shadcn-ui/sheet";

export function MetricLabel({ metricKey }: { metricKey: GlossaryKey }) {
  const entry = glossary[metricKey];
  const isMobile = useMediaQuery("(max-width: 767px)");

  const trigger = (
    <button
      type="button"
      aria-label={`O que é ${entry.label}`}
      className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
    >
      <HelpCircle className="size-3.5" />
    </button>
  );

  if (isMobile) {
    return (
      <span className="inline-flex items-center gap-1">
        <span>{entry.label}</span>
        <Sheet>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>{entry.label}</SheetTitle>
              <SheetDescription>{entry.tooltip}</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span>{entry.label}</span>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent>{entry.tooltip}</TooltipContent>
      </Tooltip>
    </span>
  );
}
