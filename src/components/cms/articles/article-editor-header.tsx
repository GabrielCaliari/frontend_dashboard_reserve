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
    <header className="shrink-0 flex items-center justify-between gap-4 px-6 py-3 border-b border-border bg-background/80 backdrop-blur-sm z-10">
      <div className="flex items-center gap-3 min-w-0">
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

        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="text-base font-semibold text-foreground flex items-center gap-2">
            <span className="w-6 h-6 shrink-0 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <PenLine className="w-3 h-3 text-white" />
            </span>
            {pageTitle}
          </h1>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-default-400">
            {pageSubtitle}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">{actions}</div>
    </header>
  );
}
