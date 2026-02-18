"use client";

import { useState } from "react";
import { Smartphone, Monitor, HelpCircle } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/src/components/ui/tooltip";

interface ScoreCardProps {
  score: number;
  focusKeyword: string;
  onKeywordChange: (keyword: string) => void;
  onPreviewMobile?: () => void;
  onPreviewDesktop?: () => void;
}

function getScoreColor(score: number) {
  if (score >= 80) return "bg-green-500"; // success
  if (score >= 50) return "bg-yellow-500"; // warning
  return "bg-red-500"; // destructive
}

export function ScoreCard({
  score,
  focusKeyword,
  onKeywordChange,
  onPreviewMobile,
  onPreviewDesktop,
}: ScoreCardProps) {
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">(
    "desktop",
  );

  return (
    <TooltipProvider>
      <div className="bg-card border border-border rounded-lg p-4 sticky top-0 z-10">
        {/* Header with Preview Icons */}
        <div className="flex items-center justify-end gap-1 mb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  setPreviewMode("mobile");
                  onPreviewMobile?.();
                }}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  previewMode === "mobile"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Preview Mobile Snippet</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  setPreviewMode("desktop");
                  onPreviewDesktop?.();
                }}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  previewMode === "desktop"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                <Monitor className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Preview Desktop Snippet</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                <HelpCircle className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>SEO Analysis Help</TooltipContent>
          </Tooltip>
        </div>

        {/* Score Badge */}
        <div className="flex justify-center mb-5">
          <div
            className={cn(
              "w-20 h-20 rounded-lg flex items-center justify-center",
              getScoreColor(score),
            )}
          >
            <span className="text-2xl font-bold text-white">{score}/100</span>
          </div>
        </div>

        {/* Focus Keyword Input */}
        <div className="space-y-2">
          <Label
            htmlFor="focus-keyword"
            className="text-xs text-muted-foreground font-medium"
          >
            Focus Keyword
          </Label>
          <Input
            id="focus-keyword"
            value={focusKeyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="Enter focus keyword..."
            className="bg-secondary border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
