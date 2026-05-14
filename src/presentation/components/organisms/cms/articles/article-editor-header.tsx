"use client";

import type { ReactNode } from "react";
import { Button } from "@heroui/react";
import { ArrowLeft, PenLine } from "lucide-react";

interface ArticleEditorHeaderProps {
  pageTitle: string;
  pageSubtitle: ReactNode;
  actions: ReactNode;
  onBack: () => void;
  isBackDisabled?: boolean;
}

export function ArticleEditorHeader({
  pageTitle,
  pageSubtitle,
  actions,
  onBack,
  isBackDisabled,
}: ArticleEditorHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 h-12 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
        <Button
          isIconOnly
          variant="light"
          size="sm"
          onPress={onBack}
          isDisabled={isBackDisabled}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <span className="w-5 h-5 shrink-0 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <PenLine className="w-2.5 h-2.5 text-white" />
          </span>
          <div className="flex flex-col gap-0 min-w-0 overflow-hidden">
            <h1 className="text-sm font-semibold text-foreground leading-tight truncate">
              {pageTitle}
            </h1>
            <div className="flex items-center gap-1 text-xs text-muted-foreground leading-tight overflow-hidden">
              <span className="truncate">{pageSubtitle}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">{actions}</div>
    </div>
  );
}
