"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/src/common/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MarkdownViewProps {
  markdown: string;
  onChange: (markdown: string) => void;
  readOnly?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MarkdownView({
  markdown,
  onChange,
  readOnly = false,
  className,
}: MarkdownViewProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const gutterRef = React.useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);
  const editorTextClasses =
    "font-mono text-sm leading-[1.7rem] whitespace-pre [tab-size:2]";

  // Sync scrolling between textarea and line number gutter
  const handleScroll = React.useCallback(() => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  React.useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.addEventListener("scroll", handleScroll);
    return () => textarea.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Handle tab key (insert 2 spaces)
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const newValue =
          markdown.substring(0, start) + "  " + markdown.substring(end);
        onChange(newValue);

        // Restore cursor position after React re-render
        requestAnimationFrame(() => {
          textarea.selectionStart = start + 2;
          textarea.selectionEnd = start + 2;
        });
      }
    },
    [markdown, onChange],
  );

  // Copy to clipboard
  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = markdown;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [markdown]);

  const lines = markdown.split("\n");

  return (
    <div className={cn("relative flex flex-col h-full bg-content1", className)}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-default-100/50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Markdown Source
          </span>
          <span className="text-[10px] text-default-400 tabular-nums">
            {lines.length} lines
          </span>
        </div>

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Copy markdown to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Copy to clipboard</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Editor area with line numbers */}
      <div className="flex-1 overflow-hidden relative">
        {/* Line numbers gutter */}
        <div
          className="absolute left-0 top-0 bottom-0 w-12 bg-default-100/30 border-r border-border z-10 overflow-hidden pointer-events-none select-none"
          aria-hidden="true"
        >
          <div
            ref={gutterRef}
            className="overflow-hidden py-4"
            style={{ height: "100%" }}
          >
            {lines.map((_, i) => (
              <div
                key={i}
                className="text-[11px] leading-[1.7rem] text-default-400 text-right pr-3 font-mono"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Actual textarea */}
        <textarea
          ref={textareaRef}
          value={markdown}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          spellCheck={false}
          wrap="off"
          className={cn(
            "absolute inset-0 w-full h-full min-w-max pl-14 pr-4 py-4 resize-none overflow-auto bg-transparent",
            editorTextClasses,
            "text-foreground caret-foreground",
            "focus:outline-none focus:ring-0",
            "selection:bg-primary/20",
            readOnly && "cursor-default",
          )}
          aria-label="Markdown source editor"
        />
      </div>
    </div>
  );
}
