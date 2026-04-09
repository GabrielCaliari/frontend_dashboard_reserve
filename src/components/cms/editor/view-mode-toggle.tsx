"use client";

import * as React from "react";
import { Eye, FileCode2 } from "lucide-react";
import { cn } from "@/src/common/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { KbdKey } from "@/src/components/cms/editor/editor-kbd-key";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ViewMode = "formatted" | "markdown";

interface ViewModeToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  disabled?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ViewModeToggle({
  mode,
  onModeChange,
  disabled = false,
  className,
}: ViewModeToggleProps) {
  const isMarkdown = mode === "markdown";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center rounded-lg border border-border bg-default-100 p-0.5 gap-0.5",
              disabled && "opacity-50 pointer-events-none",
              className,
            )}
            role="radiogroup"
            aria-label="Editor view mode"
          >
            {/* Formatted button */}
            <button
              type="button"
              role="radio"
              aria-checked={!isMarkdown}
              aria-label="Formatted view"
              onClick={() => onModeChange("formatted")}
              disabled={disabled}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200",
                !isMarkdown
                  ? "bg-content1 text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-default-100/50",
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Formatted</span>
            </button>

            {/* Markdown button */}
            <button
              type="button"
              role="radio"
              aria-checked={isMarkdown}
              aria-label="Markdown source view"
              onClick={() => onModeChange("markdown")}
              disabled={disabled}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200",
                isMarkdown
                  ? "bg-content1 text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-default-100/50",
              )}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Markdown</span>
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span className="text-xs flex items-center gap-1.5">
            Switch view mode
            <KbdKey>Ctrl+Shift+M</KbdKey>
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
