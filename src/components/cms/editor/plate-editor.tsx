"use client";

import * as React from "react";
import {
  Plate,
  PlateContent,
  PlateElement,
  usePlateEditor,
  useEditorRef,
  type PlateElementProps,
} from "platejs/react";
import type { Value } from "platejs";
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  BlockquotePlugin,
} from "@platejs/basic-nodes/react";
import { ImagePlugin } from "@platejs/media/react";
import { MarkdownPlugin } from "@platejs/markdown";
import { cn } from "@/src/common/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  ImageIcon,
  Undo,
  Redo,
  PanelLeftClose,
  PanelLeft,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { MarkdownView } from "@/src/components/cms/editor/markdown-view";
import { BlogImageInsertDialog } from "@/src/components/cms/editor/blog-image-insert-dialog";
import {
  ViewModeToggle,
  type ViewMode,
} from "@/src/components/cms/editor/view-mode-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { Button } from "@/src/components/ui/button";
import type { ContentStats } from "@/src/types/cms";

// ─── Element Components ───────────────────────────────────────────────────────

function H1Element({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement {...props} className="relative group mt-8 mb-4 first:mt-0">
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-muted-foreground/50" />
      </div>
      <h1 className="text-4xl font-bold text-foreground border-b border-border pb-3">
        {children}
      </h1>
    </PlateElement>
  );
}

function H2Element({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement {...props} className="relative group mt-6 mb-3">
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-muted-foreground/50" />
      </div>
      <h2 className="text-3xl font-semibold text-foreground">{children}</h2>
    </PlateElement>
  );
}

function H3Element({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement {...props} className="relative group mt-5 mb-2">
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-muted-foreground/50" />
      </div>
      <h3 className="text-2xl font-medium text-foreground/90">{children}</h3>
    </PlateElement>
  );
}

function BlockquoteElement({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      className="relative group my-4 border-l-4 border-border pl-6 py-2 italic text-muted-foreground bg-muted/30"
    >
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-muted-foreground/50" />
      </div>
      {children}
    </PlateElement>
  );
}

function ImageElement({ children, ...props }: PlateElementProps) {
  const element = props.element as any;
  return (
    <PlateElement {...props} className="relative group my-6">
      <div className="absolute -left-8 top-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-muted-foreground/50" />
      </div>
      <div className="rounded-lg overflow-hidden border border-border">
        <img
          src={element.url}
          alt={element.alt || ""}
          className="w-full h-auto"
          contentEditable={false}
        />
        {element.alt && (
          <div className="px-4 py-2 bg-muted/50 text-sm text-muted-foreground">
            {element.alt}
          </div>
        )}
      </div>
      {children}
    </PlateElement>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  shortcut?: string;
}

function ToolbarButton({ icon, label, isActive, onClick, shortcut }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            isActive && "bg-accent text-accent-foreground",
          )}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="flex items-center gap-2">
        <span>{label}</span>
        {shortcut && (
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

interface EditorToolbarProps {
  onInsertImage: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  disabled?: boolean;
  isTransitioning?: boolean;
  markdownWarning?: string | null;
  onDismissWarning?: () => void;
  topSlot?: React.ReactNode;
}

function EditorToolbar({
  onInsertImage,
  viewMode,
  onViewModeChange,
  disabled,
  isTransitioning,
  markdownWarning,
  onDismissWarning,
  topSlot,
}: EditorToolbarProps) {
  const editor = useEditorRef();
  const isFormatted = viewMode === "formatted";

  const isMarkActive = (key: string) => !!editor?.api.marks()?.[key];

  const isBlockActive = (type: string) => {
    if (!editor?.selection) return false;
    const [match] = editor.api.nodes({
      at: editor.selection,
      match: (n: any) => n.type === type,
    });
    return !!match;
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="sticky top-0 z-40 border-b border-border bg-content1/95 backdrop-blur-sm shadow-sm">
        {topSlot && (
          <>
            {topSlot}
            <div className="h-px bg-border/60 mx-0" />
          </>
        )}
        <div className="overflow-x-auto">
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2">
            {isFormatted && (
              <>
                {/* Undo / Redo */}
                <div className="flex items-center gap-0.5">
                  <ToolbarButton
                    icon={<Undo className="w-4 h-4" />}
                    label="Undo"
                    shortcut="Ctrl+Z"
                    onClick={() => editor?.undo()}
                  />
                  <ToolbarButton
                    icon={<Redo className="w-4 h-4" />}
                    label="Redo"
                    shortcut="Ctrl+Shift+Z"
                    onClick={() => editor?.redo()}
                  />
                </div>

                <div className="hidden xs:block w-px h-6 bg-border mx-1" />

                {/* Marks */}
                <div className="flex items-center gap-0.5">
                  <ToolbarButton
                    icon={<Bold className="w-4 h-4" />}
                    label="Bold"
                    shortcut="Ctrl+B"
                    isActive={isMarkActive("bold")}
                    onClick={() => editor?.tf.toggleMark("bold")}
                  />
                  <ToolbarButton
                    icon={<Italic className="w-4 h-4" />}
                    label="Italic"
                    shortcut="Ctrl+I"
                    isActive={isMarkActive("italic")}
                    onClick={() => editor?.tf.toggleMark("italic")}
                  />
                  <ToolbarButton
                    icon={<Underline className="w-4 h-4" />}
                    label="Underline"
                    shortcut="Ctrl+U"
                    isActive={isMarkActive("underline")}
                    onClick={() => editor?.tf.toggleMark("underline")}
                  />
                  <ToolbarButton
                    icon={<Strikethrough className="w-4 h-4" />}
                    label="Strikethrough"
                    isActive={isMarkActive("strikethrough")}
                    onClick={() => editor?.tf.toggleMark("strikethrough")}
                  />
                  <ToolbarButton
                    icon={<Code className="w-4 h-4" />}
                    label="Inline Code"
                    isActive={isMarkActive("code")}
                    onClick={() => editor?.tf.toggleMark("code")}
                  />
                </div>

                <div className="hidden xs:block w-px h-6 bg-border mx-1" />

                {/* Block types */}
                <div className="flex items-center gap-0.5">
                  <ToolbarButton
                    icon={<Heading1 className="w-4 h-4" />}
                    label="Heading 1"
                    isActive={isBlockActive("h1")}
                    onClick={() => editor?.tf.toggleBlock("h1")}
                  />
                  <ToolbarButton
                    icon={<Heading2 className="w-4 h-4" />}
                    label="Heading 2"
                    isActive={isBlockActive("h2")}
                    onClick={() => editor?.tf.toggleBlock("h2")}
                  />
                  <ToolbarButton
                    icon={<Heading3 className="w-4 h-4" />}
                    label="Heading 3"
                    isActive={isBlockActive("h3")}
                    onClick={() => editor?.tf.toggleBlock("h3")}
                  />
                  <ToolbarButton
                    icon={<Quote className="w-4 h-4" />}
                    label="Blockquote"
                    isActive={isBlockActive("blockquote")}
                    onClick={() => editor?.tf.toggleBlock("blockquote")}
                  />
                </div>

                <div className="hidden xs:block w-px h-6 bg-border mx-1" />

                {/* Insert Image */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onInsertImage}
                      className={cn(
                        "flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1.5 rounded-md text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span className="hidden md:inline">Image</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Insert image (Ctrl+Shift+I)</TooltipContent>
                </Tooltip>
              </>
            )}

            {!isFormatted && (
              <span className="text-xs text-muted-foreground font-mono px-1">
                Editing raw markdown
              </span>
            )}

            <div className="flex-1 min-w-0" />

            <ViewModeToggle
              mode={viewMode}
              onModeChange={onViewModeChange}
              disabled={disabled || isTransitioning}
            />
          </div>
        </div>

        {markdownWarning && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border-t border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs animate-slide-down-fade-in">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1">{markdownWarning}</span>
            {onDismissWarning && (
              <button
                type="button"
                onClick={onDismissWarning}
                className="p-0.5 rounded hover:bg-amber-500/20 transition-colors"
                aria-label="Dismiss warning"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// ─── Chapters (table of contents) ────────────────────────────────────────────

interface Chapter {
  id: string;
  title: string;
  type: "h1" | "h2" | "h3";
}

function extractChapters(value: Value): Chapter[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((node, index) => {
      if (node.type !== "h1" && node.type !== "h2" && node.type !== "h3") return null;
      const text = (node.children as Array<{ text?: string }>)
        .map((child) => child.text || "")
        .join("");
      return { id: `chapter-${index}`, title: text, type: node.type as "h1" | "h2" | "h3" };
    })
    .filter((c): c is Chapter => c !== null);
}

// ─── Content analysis ─────────────────────────────────────────────────────────

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\*\*|__|~~|[*_]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function analyzeMarkdown(md: string, keyword: string): ContentStats {
  const keywordLower = keyword.toLowerCase().trim();
  const plainText = stripMarkdown(md);
  const words = plainText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const keywordRegex = keywordLower ? new RegExp(keywordLower, "gi") : null;
  const keywordCount = keywordRegex
    ? (plainText.toLowerCase().match(keywordRegex) || []).length
    : 0;
  const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
  const firstTenPercent = words
    .slice(0, Math.ceil(wordCount * 0.1))
    .join(" ")
    .toLowerCase();
  const headings = md
    .split("\n")
    .map((line) => {
      const match = /^(#{1,3})\s+(.*)$/.exec(line.trim());
      if (!match) return null;
      return { type: `h${match[1].length}`, text: match[2].trim() };
    })
    .filter((h): h is { type: string; text: string } => !!h);

  const paragraphs = plainText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return {
    wordCount,
    headings,
    hasImages: /!\[[^\]]*\]\([^)]+\)/.test(md),
    hasExternalLinks: /\[[^\]]+\]\(https?:\/\/[^)]+\)/i.test(md),
    hasInternalLinks: /\[[^\]]+\]\((?!https?:\/\/)[^)]+\)/i.test(md),
    keywordCount,
    keywordDensity: Math.round(keywordDensity * 100) / 100,
    keywordInFirstTenPercent: keywordLower ? firstTenPercent.includes(keywordLower) : false,
    keywordInSubheadings: headings.some(
      (h) =>
        (h.type === "h2" || h.type === "h3") &&
        h.text.toLowerCase().includes(keywordLower),
    ),
    keywordInImageAlt: keywordLower
      ? new RegExp(`!\\[[^\\]]*${keywordLower}[^\\]]*\\]`, "i").test(md)
      : false,
    shortParagraphs: paragraphs.every((p) => p.split(/\s+/).length < 120),
    plainText,
    metaDescription: plainText.slice(0, 160),
    content: md,
  };
}

// ─── Markdown validation ──────────────────────────────────────────────────────

function validateMarkdown(md: string): string | null {
  if (!md?.trim()) return null;
  const fenceMatches = md.match(/^```/gm);
  if (fenceMatches && fenceMatches.length % 2 !== 0)
    return "Unclosed code fence detected (```) — content may render incorrectly.";
  const boldMatches = md.match(/\*\*/g);
  if (boldMatches && boldMatches.length % 2 !== 0)
    return "Unclosed bold marker (**) detected — some formatting may be lost.";
  const openBrackets = (md.match(/\[/g) || []).length;
  const closeBrackets = (md.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets)
    return "Unbalanced brackets [] detected — some links may not parse correctly.";
  return null;
}

// ─── PlateEditor ──────────────────────────────────────────────────────────────

interface PlateEditorProps {
  highlightedSection?: string | null;
  onContentChange?: (stats: ContentStats) => void;
  focusKeyword?: string;
  initialContent?: string;
  blogId?: string | number;
  articleId?: string;
  topSlot?: React.ReactNode;
}

export function PlateEditor({
  highlightedSection,
  onContentChange,
  focusKeyword = "",
  initialContent,
  blogId,
  articleId,
  topSlot,
}: PlateEditorProps) {
  // Normalize initial content: blank → empty string, HTML → treat as opaque text
  const initialMarkdown = React.useMemo(() => {
    if (!initialContent?.trim()) return "";
    // If it looks like HTML pass it through as-is (treated as opaque markdown text)
    return initialContent;
  }, [initialContent]);

  const [viewMode, setViewMode] = React.useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("plate-editor-view-mode") as ViewMode) || "formatted";
    }
    return "formatted";
  });

  const [markdownContent, setMarkdownContent] = React.useState(initialMarkdown);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [markdownWarning, setMarkdownWarning] = React.useState<string | null>(null);
  const [chapters, setChapters] = React.useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = React.useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);

  const liveRegionRef = React.useRef<HTMLDivElement>(null);
  const lastInitializedRef = React.useRef<string | null>(null);
  const analyzeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Initialize editor — use value factory so MarkdownPlugin is ready when deserializing
  const editor = usePlateEditor({
    plugins: [
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      StrikethroughPlugin,
      CodePlugin,
      H1Plugin.withComponent(H1Element),
      H2Plugin.withComponent(H2Element),
      H3Plugin.withComponent(H3Element),
      BlockquotePlugin.withComponent(BlockquoteElement),
      ImagePlugin.withComponent(ImageElement),
      MarkdownPlugin,
    ],
    value: initialMarkdown
      ? (ed) => ed.getApi(MarkdownPlugin).markdown.deserialize(initialMarkdown)
      : [{ type: "p", children: [{ text: "" }] }],
  });

  const announce = React.useCallback((message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
      setTimeout(() => {
        if (liveRegionRef.current) liveRegionRef.current.textContent = "";
      }, 1000);
    }
  }, []);

  const publishStats = React.useCallback(
    (md: string) => {
      const stats = analyzeMarkdown(md, focusKeyword);
      setChapters(extractChapters(editor.children as Value));
      onContentChange?.(stats);
    },
    [editor, focusKeyword, onContentChange],
  );

  // Publish initial stats once
  React.useEffect(() => {
    if (!editor) return;
    const key = initialContent ?? "__empty__";
    if (lastInitializedRef.current === key) return;
    lastInitializedRef.current = key;
    publishStats(initialMarkdown);
  }, [editor, initialContent, initialMarkdown, publishStats]);

  // Debounced analysis when editor content changes (formatted mode)
  const triggerAnalysis = React.useCallback(() => {
    if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    analyzeTimerRef.current = setTimeout(() => {
      try {
        const md = editor.api.markdown.serialize();
        setMarkdownContent(md);
        publishStats(md);
      } catch (err) {
        console.error("[PlateEditor] serialize error:", err);
      }
    }, 300);
  }, [editor, publishStats]);

  // Handle raw markdown textarea changes
  const handleMarkdownChange = React.useCallback(
    (md: string) => {
      setMarkdownContent(md);
      if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
      analyzeTimerRef.current = setTimeout(() => {
        const warning = validateMarkdown(md);
        setMarkdownWarning(warning);
        publishStats(md);
      }, 500);
    },
    [publishStats],
  );

  // Switch between formatted ↔ markdown views
  const handleViewModeChange = React.useCallback(
    (newMode: ViewMode) => {
      if (newMode === viewMode || isTransitioning) return;
      setIsTransitioning(true);
      setMarkdownWarning(null);

      setTimeout(() => {
        try {
          if (newMode === "markdown") {
            const md = editor.api.markdown.serialize();
            setMarkdownContent(md);
            publishStats(md);
            announce("Switched to markdown source view");
          } else {
            const warning = validateMarkdown(markdownContent);
            if (warning) setMarkdownWarning(warning);
            const slateValue = editor.api.markdown.deserialize(markdownContent);
            editor.tf.setValue(slateValue);
            publishStats(markdownContent);
            announce("Switched to formatted view");
          }
          setViewMode(newMode);
          localStorage.setItem("plate-editor-view-mode", newMode);
        } catch (err) {
          console.error("[PlateEditor] view switch error:", err);
          if (newMode === "formatted") {
            const msg = err instanceof Error ? err.message : "Failed to convert markdown.";
            setMarkdownWarning(msg);
          }
        } finally {
          setTimeout(() => setIsTransitioning(false), 150);
        }
      }, 150);
    },
    [viewMode, isTransitioning, editor, markdownContent, publishStats, announce],
  );

  // Keyboard shortcut: Ctrl+Shift+M
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "M") {
        e.preventDefault();
        handleViewModeChange(viewMode === "formatted" ? "markdown" : "formatted");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleViewModeChange, viewMode]);

  const handleInsertImage = (url: string, alt: string) => {
    if (!editor) return;
    editor.tf.insertNodes([
      { type: "img", url, alt, children: [{ text: "" }] } as any,
      { type: "p", children: [{ text: "" }] } as any,
    ]);
  };

  return (
    <div className="flex h-full">
      {/* Chapter Navigation Sidebar */}
      {viewMode === "formatted" && !sidebarCollapsed && (
        <div className="w-56 shrink-0 border-r border-border overflow-y-auto hidden lg:block bg-content1">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Chapters
            </h3>
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-1 hover:bg-accent rounded-md transition-colors"
            >
              <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <nav className="p-2">
            {chapters.length === 0 && (
              <p className="text-xs text-muted-foreground px-3 py-4">
                Add headings (H1, H2, H3) to see chapters here.
              </p>
            )}
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => setActiveChapter(chapter.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors hover:bg-accent/50",
                  activeChapter === chapter.id && "bg-accent text-accent-foreground",
                  chapter.type === "h1" && "font-semibold text-foreground text-sm",
                  chapter.type === "h2" && "pl-6 text-sm text-muted-foreground",
                  chapter.type === "h3" && "pl-10 text-xs text-muted-foreground",
                )}
              >
                {chapter.type === "h2" || chapter.type === "h3" ? (
                  <ChevronRight className="w-3 h-3 shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 shrink-0" />
                )}
                <span className="truncate">{chapter.title}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {viewMode === "formatted" && sidebarCollapsed && (
        <div className="hidden lg:flex items-start p-2 border-r border-border">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title="Show chapters"
          >
            <PanelLeft className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* ARIA live region */}
      <div
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Main Editor Area */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full bg-content1 relative">
        <Plate
          editor={editor}
          onChange={() => {
            if (viewMode === "formatted") triggerAnalysis();
          }}
        >
          <EditorToolbar
            onInsertImage={() => setImageDialogOpen(true)}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            isTransitioning={isTransitioning}
            markdownWarning={markdownWarning}
            onDismissWarning={() => setMarkdownWarning(null)}
            topSlot={topSlot}
          />

          {isTransitioning && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-content1/60 backdrop-blur-[1px] animate-fade-in">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-default-100 border border-border shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Switching view...</span>
              </div>
            </div>
          )}

          {viewMode === "formatted" && (
            <div
              className={cn(
                "flex-1 min-h-0 flex flex-col transition-opacity duration-200",
                isTransitioning ? "opacity-0" : "opacity-100",
              )}
            >
              <div className="flex-1 min-h-0 overflow-y-auto bg-content1">
                <div
                  className={cn(
                    "max-w-3xl mx-auto px-6 sm:px-8 py-8 transition-all duration-200 slate-editor bg-content1",
                    highlightedSection === "content" && "ring-2 ring-primary/30",
                  )}
                >
                  <PlateContent
                    className="outline-none min-h-[200px] text-foreground bg-content1 [&_[data-slate-placeholder]]:text-muted-foreground [&_[data-slate-placeholder]]:opacity-50"
                    placeholder="Start writing your article content..."
                    renderElement={({ attributes, children, element }) => {
                      if (!element.type || element.type === "p") {
                        return (
                          <p
                            {...attributes}
                            className="my-4 text-base text-foreground leading-relaxed"
                          >
                            {children}
                          </p>
                        );
                      }
                      return <div {...attributes}>{children}</div>;
                    }}
                    renderLeaf={({ attributes, children, leaf }) => {
                      let result = children;
                      if (leaf.bold) result = <strong className="font-semibold">{result}</strong>;
                      if (leaf.italic) result = <em className="italic">{result}</em>;
                      if (leaf.underline) result = <u className="underline">{result}</u>;
                      if (leaf.strikethrough) result = <s className="line-through">{result}</s>;
                      if (leaf.code)
                        result = (
                          <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-sm border border-border">
                            {result}
                          </code>
                        );
                      return <span {...attributes}>{result}</span>;
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {viewMode === "markdown" && (
            <div
              className={cn(
                "flex-1 min-h-0 flex flex-col transition-opacity duration-200",
                isTransitioning ? "opacity-0" : "opacity-100",
              )}
            >
              <MarkdownView
                markdown={markdownContent}
                onChange={handleMarkdownChange}
                className="flex-1"
              />
            </div>
          )}
        </Plate>
      </div>

      <BlogImageInsertDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onInsert={handleInsertImage}
        blogId={blogId}
      />
    </div>
  );
}
