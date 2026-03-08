"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/src/lib/utils";
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
// Markdown syntax highlighting (lightweight, CSS-based)
// ---------------------------------------------------------------------------

/** Token types used for highlighting. */
type TokenType =
  | "heading"
  | "bold"
  | "italic"
  | "strikethrough"
  | "code-inline"
  | "code-fence"
  | "link"
  | "image"
  | "blockquote"
  | "list"
  | "hr"
  | "text";

interface Token {
  type: TokenType;
  value: string;
}

const TOKEN_COLORS: Record<TokenType, string> = {
  heading: "text-violet-400 font-bold",
  bold: "text-orange-400 font-semibold",
  italic: "text-sky-400 italic",
  strikethrough: "text-rose-400 line-through",
  "code-inline": "text-emerald-400 bg-emerald-950/30 rounded px-0.5",
  "code-fence": "text-emerald-400",
  link: "text-blue-400 underline",
  image: "text-amber-400",
  blockquote: "text-teal-400 italic",
  list: "text-purple-400",
  hr: "text-default-500",
  text: "text-foreground",
};

/**
 * Very lightweight line-by-line markdown highlighter.
 * (Not a full parser -- it handles the most common patterns for visual feedback.)
 */
function highlightLine(line: string, inCodeBlock: boolean): React.ReactNode {
  if (inCodeBlock) {
    // Inside a fenced code block -> render as code fence token
    return <span className={TOKEN_COLORS["code-fence"]}>{line}</span>;
  }

  // Code fence start / end
  if (/^```/.test(line)) {
    return <span className={TOKEN_COLORS["code-fence"]}>{line}</span>;
  }

  // Heading
  if (/^#{1,6}\s/.test(line)) {
    return <span className={TOKEN_COLORS.heading}>{line}</span>;
  }

  // Horizontal rule
  if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
    return <span className={TOKEN_COLORS.hr}>{line}</span>;
  }

  // Blockquote
  if (/^>\s?/.test(line)) {
    return <span className={TOKEN_COLORS.blockquote}>{line}</span>;
  }

  // List item (unordered)
  if (/^(\s*[-*+]\s)/.test(line)) {
    return <span className={TOKEN_COLORS.list}>{line}</span>;
  }

  // List item (ordered)
  if (/^(\s*\d+\.\s)/.test(line)) {
    return <span className={TOKEN_COLORS.list}>{line}</span>;
  }

  // For inline patterns we tokenize the line
  return highlightInline(line);
}

/** Highlight inline markdown patterns within a line. */
function highlightInline(line: string): React.ReactNode {
  // Match patterns in order of priority
  const patterns: { regex: RegExp; type: TokenType }[] = [
    { regex: /!\[([^\]]*)\]\(([^)]*)\)/g, type: "image" },
    { regex: /\[([^\]]*)\]\(([^)]*)\)/g, type: "link" },
    { regex: /`([^`]+)`/g, type: "code-inline" },
    { regex: /\*\*([^*]+)\*\*/g, type: "bold" },
    { regex: /\*([^*]+)\*/g, type: "italic" },
    { regex: /~~([^~]+)~~/g, type: "strikethrough" },
  ];

  // Collect all matches with positions
  const matches: {
    start: number;
    end: number;
    type: TokenType;
    text: string;
  }[] = [];

  for (const { regex, type } of patterns) {
    let match;
    const re = new RegExp(regex.source, regex.flags);
    while ((match = re.exec(line)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type,
        text: match[0],
      });
    }
  }

  if (matches.length === 0) {
    return <span className={TOKEN_COLORS.text}>{line}</span>;
  }

  // Sort by start position and remove overlaps
  matches.sort((a, b) => a.start - b.start);
  const filtered: typeof matches = [];
  let lastEnd = 0;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      filtered.push(m);
      lastEnd = m.end;
    }
  }

  // Build fragments
  const fragments: React.ReactNode[] = [];
  let currentPos = 0;

  for (let i = 0; i < filtered.length; i++) {
    const m = filtered[i];
    // Text before this match
    if (m.start > currentPos) {
      fragments.push(
        <span key={`t-${i}`} className={TOKEN_COLORS.text}>
          {line.slice(currentPos, m.start)}
        </span>,
      );
    }
    fragments.push(
      <span key={`m-${i}`} className={TOKEN_COLORS[m.type]}>
        {m.text}
      </span>,
    );
    currentPos = m.end;
  }

  // Remaining text
  if (currentPos < line.length) {
    fragments.push(
      <span key="tail" className={TOKEN_COLORS.text}>
        {line.slice(currentPos)}
      </span>,
    );
  }

  return <>{fragments}</>;
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
  const highlightRef = React.useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);
  const editorTextClasses =
    "font-mono text-sm leading-[1.7rem] whitespace-pre [tab-size:2]";

  // Sync scrolling between textarea and highlight overlay
  const handleScroll = React.useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

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

  // Build highlighted lines
  const lines = markdown.split("\n");
  let inCodeBlock = false;

  const highlightedLines = lines.map((line, i) => {
    if (/^```/.test(line)) {
      const node = highlightLine(line, inCodeBlock);
      inCodeBlock = !inCodeBlock;
      return node;
    }
    return highlightLine(line, inCodeBlock);
  });

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
            ref={(el) => {
              // Sync line numbers scroll with content
              if (el && textareaRef.current) {
                const syncScroll = () => {
                  if (textareaRef.current) {
                    el.scrollTop = textareaRef.current.scrollTop;
                  }
                };
                textareaRef.current.addEventListener("scroll", syncScroll);
              }
            }}
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

        {/* Syntax-highlighted overlay */}
        <div
          ref={highlightRef}
          className={cn(
            "absolute inset-0 pl-14 pr-4 py-4 overflow-hidden pointer-events-none select-none min-w-max",
            editorTextClasses,
          )}
          aria-hidden="true"
        >
          {highlightedLines.map((node, i) => (
            <div key={i} className="leading-[1.7rem]">
              {node}
            </div>
          ))}
        </div>

        {/* Actual textarea (transparent text, captures input) */}
        <textarea
          ref={textareaRef}
          value={markdown}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          spellCheck={false}
          wrap="off"
          className={cn(
            "absolute inset-0 w-full h-full min-w-max pl-14 pr-4 py-4 resize-none overflow-auto bg-transparent",
            editorTextClasses,
            "text-transparent caret-foreground",
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
