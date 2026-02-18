"use client";

import * as React from "react";
import {
  Plate,
  PlateContent,
  PlateElement,
  usePlateEditor,
  useEditorRef,
  useEditorSelection,
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
import { Transforms, Editor } from "slate";
import { cn } from "@/src/lib/utils";
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
  Link,
  List,
  ListOrdered,
  ImageIcon,
  Video,
  Music,
  FileUp,
  Sparkles,
  Wand2,
  MessageSquarePlus,
  BookOpen,
  Minimize2,
  Maximize2,
  Languages,
  Table,
  CodeSquare,
  LayoutGrid,
  Columns,
  SeparatorHorizontal,
  ExternalLink,
  History,
  Undo,
  Redo,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/src/components/ui/dropdown-menu";
import type { ContentStats } from "@/src/types/cms";

// ToolbarButton component
interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  shortcut?: string;
}

function ToolbarButton({
  icon,
  label,
  isActive,
  onClick,
  shortcut,
}: ToolbarButtonProps) {
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

// FloatingToolbar component
function FloatingToolbar() {
  const editor = useEditorRef();
  const selection = useEditorSelection();
  const [position, setPosition] = React.useState<{
    top: number;
    left: number;
  } | null>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const updatePosition = () => {
      const domSelection = window.getSelection();
      if (
        !domSelection ||
        domSelection.rangeCount === 0 ||
        domSelection.isCollapsed
      ) {
        setPosition(null);
        return;
      }

      const range = domSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0) {
        setPosition(null);
        return;
      }

      const toolbarWidth = toolbarRef.current?.offsetWidth || 320;
      setPosition({
        top: rect.top - 50,
        left: rect.left + rect.width / 2 - toolbarWidth / 2,
      });
    };

    updatePosition();
    document.addEventListener("selectionchange", updatePosition);
    return () =>
      document.removeEventListener("selectionchange", updatePosition);
  }, [selection]);

  const toggleMark = (key: string) => {
    if (!editor) return;
    const isActive = editor.api.marks()?.[key];
    if (isActive) {
      editor.tf.removeMark(key);
    } else {
      editor.tf.addMark(key, true);
    }
  };

  const toggleBlock = (type: string) => {
    if (!editor) return;
    const isActive = isBlockActive(type);
    Transforms.setNodes(
      editor,
      { type: isActive ? "p" : type },
      { match: (n) => Editor.isBlock(editor, n) },
    );
  };

  const isBlockActive = (type: string) => {
    if (!editor?.selection) return false;
    const [match] = Editor.nodes(editor, {
      at: editor.selection,
      match: (n: any) => n.type === type,
    });
    return !!match;
  };

  const isMarkActive = (key: string) => {
    if (!editor) return false;
    return !!editor.api.marks()?.[key];
  };

  if (!position) return null;

  return (
    <TooltipProvider delayDuration={100}>
      <div
        ref={toolbarRef}
        className={cn(
          "fixed z-50 flex items-center gap-0.5 p-1 rounded-lg",
          "bg-popover border border-border shadow-lg",
          "animate-in fade-in-0 zoom-in-95 duration-150",
        )}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        {/* Text Formatting */}
        <div className="flex items-center gap-0.5 px-1">
          <ToolbarButton
            icon={<Bold className="w-4 h-4" />}
            label="Bold"
            shortcut="⌘B"
            isActive={isMarkActive("bold")}
            onClick={() => toggleMark("bold")}
          />
          <ToolbarButton
            icon={<Italic className="w-4 h-4" />}
            label="Italic"
            shortcut="⌘I"
            isActive={isMarkActive("italic")}
            onClick={() => toggleMark("italic")}
          />
          <ToolbarButton
            icon={<Underline className="w-4 h-4" />}
            label="Underline"
            shortcut="⌘U"
            isActive={isMarkActive("underline")}
            onClick={() => toggleMark("underline")}
          />
          <ToolbarButton
            icon={<Strikethrough className="w-4 h-4" />}
            label="Strikethrough"
            shortcut="⌘⇧S"
            isActive={isMarkActive("strikethrough")}
            onClick={() => toggleMark("strikethrough")}
          />
          <ToolbarButton
            icon={<Code className="w-4 h-4" />}
            label="Inline Code"
            shortcut="⌘E"
            isActive={isMarkActive("code")}
            onClick={() => toggleMark("code")}
          />
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Block Formatting */}
        <div className="flex items-center gap-0.5 px-1">
          <ToolbarButton
            icon={<Heading1 className="w-4 h-4" />}
            label="Heading 1"
            shortcut="⌘⌥1"
            isActive={isBlockActive("h1")}
            onClick={() => toggleBlock("h1")}
          />
          <ToolbarButton
            icon={<Heading2 className="w-4 h-4" />}
            label="Heading 2"
            shortcut="⌘⌥2"
            isActive={isBlockActive("h2")}
            onClick={() => toggleBlock("h2")}
          />
          <ToolbarButton
            icon={<Heading3 className="w-4 h-4" />}
            label="Heading 3"
            shortcut="⌘⌥3"
            isActive={isBlockActive("h3")}
            onClick={() => toggleBlock("h3")}
          />
          <ToolbarButton
            icon={<Quote className="w-4 h-4" />}
            label="Blockquote"
            shortcut="⌘⇧B"
            isActive={isBlockActive("blockquote")}
            onClick={() => toggleBlock("blockquote")}
          />
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Links & Lists */}
        <div className="flex items-center gap-0.5 px-1">
          <ToolbarButton
            icon={<Link className="w-4 h-4" />}
            label="Add Link"
            shortcut="⌘K"
            onClick={() => {}}
          />
          <ToolbarButton
            icon={<List className="w-4 h-4" />}
            label="Bullet List"
            onClick={() => {}}
          />
          <ToolbarButton
            icon={<ListOrdered className="w-4 h-4" />}
            label="Numbered List"
            onClick={() => {}}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

// StaticToolbar component
function EditorToolbar() {
  const editor = useEditorRef();

  return (
    <TooltipProvider delayDuration={100}>
      <div className="sticky top-0 z-40 flex flex-wrap items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 overflow-x-auto">
        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            icon={<Undo className="w-4 h-4" />}
            label="Undo"
            shortcut="⌘Z"
            onClick={() => editor?.undo()}
          />
          <ToolbarButton
            icon={<Redo className="w-4 h-4" />}
            label="Redo"
            shortcut="⌘⇧Z"
            onClick={() => editor?.redo()}
          />
        </div>

        <div className="hidden xs:block w-px h-6 bg-border mx-1 sm:mx-2" />

        {/* Media Insertion */}
        <div className="flex items-center gap-0.5">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1.5 rounded-md text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span className="hidden md:inline">Media</span>
                    <ChevronDown className="w-3 h-3 opacity-50 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Insert media content</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem className="gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>Image</span>
                <kbd className="ml-auto text-[10px] text-muted-foreground">
                  ⌘⇧I
                </kbd>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Video className="w-4 h-4" />
                <span>Video</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Music className="w-4 h-4" />
                <span>Audio</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <FileUp className="w-4 h-4" />
                <span>Upload file</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <ExternalLink className="w-4 h-4" />
                <span>Embed URL</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="hidden xs:block w-px h-6 bg-border mx-1 sm:mx-2" />

        {/* AI Features */}
        <div className="flex items-center gap-0.5">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1.5 rounded-md text-sm transition-colors",
                      "bg-primary/10 text-primary hover:bg-primary/20",
                    )}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden md:inline">AI Assist</span>
                    <ChevronDown className="w-3 h-3 opacity-50 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>AI writing assistance</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem className="gap-2">
                <Wand2 className="w-4 h-4" />
                <span>Continue writing</span>
                <kbd className="ml-auto text-[10px] text-muted-foreground">
                  ⌘J
                </kbd>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <MessageSquarePlus className="w-4 h-4" />
                <span>Write with prompt...</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Improve writing</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  <DropdownMenuItem>Fix grammar & spelling</DropdownMenuItem>
                  <DropdownMenuItem>Improve clarity</DropdownMenuItem>
                  <DropdownMenuItem>Make professional</DropdownMenuItem>
                  <DropdownMenuItem>Make casual</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem className="gap-2">
                <Minimize2 className="w-4 h-4" />
                <span>Make shorter</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Maximize2 className="w-4 h-4" />
                <span>Make longer</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <Languages className="w-4 h-4" />
                <span>Translate...</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Generate SEO keywords</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="hidden xs:block w-px h-6 bg-border mx-1 sm:mx-2" />

        {/* Specialized Blocks */}
        <div className="flex items-center gap-0.5">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1.5 rounded-md text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="hidden md:inline">Insert</span>
                    <ChevronDown className="w-3 h-3 opacity-50 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Insert blocks</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem className="gap-2">
                <Table className="w-4 h-4" />
                <span>Table</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <CodeSquare className="w-4 h-4" />
                <span>Code block</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Columns className="w-4 h-4" />
                <span>Columns</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <SeparatorHorizontal className="w-4 h-4" />
                <span>Divider</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <ExternalLink className="w-4 h-4" />
                <span>Call to action</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1 min-w-0" />

        {/* Version History - hidden on very small screens */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
              )}
            >
              <History className="w-4 h-4" />
              <span className="hidden lg:inline">History</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Version history</TooltipContent>
        </Tooltip>

        <div className="text-xs text-muted-foreground tabular-nums px-2 sm:border-l sm:border-border sm:ml-2 sm:pl-4 whitespace-nowrap" />
      </div>
    </TooltipProvider>
  );
}

// Custom Heading Elements with chapter markers
function H1Element({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement {...props} className="relative group mt-8 mb-4 first:mt-0">
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />
      </div>
      <h1 className="text-2xl font-bold text-foreground border-b border-border/60 pb-2">
        {children}
      </h1>
    </PlateElement>
  );
}

function H2Element({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement {...props} className="relative group mt-6 mb-3">
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">{children}</h2>
    </PlateElement>
  );
}

function H3Element({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement {...props} className="relative group mt-4 mb-2">
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />
      </div>
      <h3 className="text-lg font-medium text-foreground/90">{children}</h3>
    </PlateElement>
  );
}

function BlockquoteElement({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      className="my-4 border-l-2 border-primary/40 pl-4 italic text-foreground/70"
    >
      {children}
    </PlateElement>
  );
}

function ParagraphElement({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      className="my-3 text-foreground/80 leading-relaxed"
    >
      {children}
    </PlateElement>
  );
}

// CodeElement for inline code styling
function CodeElement({ children, leaf, ...props }: any) {
  return (
    <code
      {...props}
      className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-sm"
    >
      {children}
    </code>
  );
}

// Chapter type for organizing content
interface Chapter {
  id: string;
  title: string;
  type: "h1" | "h2" | "h3";
  collapsed: boolean;
}

// Extract chapters from content
function extractChapters(value: Value): Chapter[] {
  const chapters: Chapter[] = [];
  value.forEach((node, index) => {
    if (node.type === "h1" || node.type === "h2" || node.type === "h3") {
      const text = node.children
        .map((child: { text?: string }) => child.text || "")
        .join("");
      chapters.push({
        id: `chapter-${index}`,
        title: text,
        type: node.type as "h1" | "h2" | "h3",
        collapsed: false,
      });
    }
  });
  return chapters;
}

// Analyze content and return stats
function analyzeContent(value: Value, keyword: string): ContentStats {
  const keyword_lower = keyword.toLowerCase();
  let plainText = "";
  const headings: ContentStats["headings"] = [];
  let keywordInSubheadings = false;

  value.forEach((node: any) => {
    const nodeText =
      node.children
        ?.map((child: { text?: string }) => child.text || "")
        .join("") || "";
    if (node.type === "h1" || node.type === "h2" || node.type === "h3") {
      headings.push({ type: node.type, text: nodeText });
      if (
        (node.type === "h2" || node.type === "h3") &&
        nodeText.toLowerCase().includes(keyword_lower)
      ) {
        keywordInSubheadings = true;
      }
    }
    plainText += nodeText + " ";
  });

  plainText = plainText.trim();
  const words = plainText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const keywordRegex = new RegExp(keyword_lower, "gi");
  const keywordMatches = plainText.toLowerCase().match(keywordRegex);
  const keywordCount = keywordMatches ? keywordMatches.length : 0;
  const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

  // Check if keyword in first 10%
  const firstTenPercent = words
    .slice(0, Math.ceil(wordCount * 0.1))
    .join(" ")
    .toLowerCase();
  const keywordInFirstTenPercent = firstTenPercent.includes(keyword_lower);

  // Check paragraph lengths
  const paragraphs = value.filter((n: any) => n.type === "p");
  const shortParagraphs = paragraphs.every((p: any) => {
    const text =
      p.children?.map((c: { text?: string }) => c.text || "").join("") || "";
    return text.split(/\s+/).length < 120;
  });

  // Generate a meta description from first paragraph
  const firstParagraph = value.find((n: any) => n.type === "p");
  const metaDescription = firstParagraph
    ? firstParagraph.children
        ?.map((c: { text?: string }) => c.text || "")
        .join("")
        .slice(0, 160)
    : "";

  return {
    wordCount,
    headings,
    hasImages: false,
    hasExternalLinks:
      plainText.toLowerCase().includes("http") ||
      plainText.toLowerCase().includes("link"),
    hasInternalLinks: false,
    keywordCount,
    keywordDensity: Math.round(keywordDensity * 100) / 100,
    keywordInFirstTenPercent,
    keywordInSubheadings,
    keywordInImageAlt: false,
    shortParagraphs,
    plainText,
    metaDescription,
  };
}

interface PlateEditorProps {
  highlightedSection?: string | null;
  onContentChange?: (stats: ContentStats) => void;
  focusKeyword?: string;
}

export function PlateEditor({
  highlightedSection,
  onContentChange,
  focusKeyword = "Agentic Workflow",
}: PlateEditorProps) {
  const [chapters, setChapters] = React.useState<Chapter[]>(() =>
    extractChapters(initialValue),
  );
  const [activeChapter, setActiveChapter] = React.useState<string | null>(null);

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
    ],
    value: initialValue,
  });

  // Analyze content on mount and on changes
  const analyzeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const triggerAnalysis = React.useCallback(() => {
    if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    analyzeTimerRef.current = setTimeout(() => {
      try {
        const value = editor.children as Value;
        const stats = analyzeContent(value, focusKeyword);
        setChapters(extractChapters(value));
        onContentChange?.(stats);
      } catch {
        // editor not ready
      }
    }, 300);
  }, [editor, onContentChange, focusKeyword]);

  // Initial analysis on mount
  React.useEffect(() => {
    triggerAnalysis();
  }, [triggerAnalysis]);

  // Toggle chapter collapse
  const toggleChapter = (chapterId: string) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId ? { ...ch, collapsed: !ch.collapsed } : ch,
      ),
    );
  };

  // Scroll to chapter
  const scrollToChapter = (chapterId: string) => {
    setActiveChapter(chapterId);
  };

  return (
    <div className="flex h-full">
      {/* Chapter Navigation Sidebar */}
      <div className="w-64 shrink-0 border-r border-border bg-card/50 overflow-y-auto hidden lg:block">
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Chapters
          </h3>
        </div>
        <nav className="p-2">
          {chapters.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => scrollToChapter(chapter.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors",
                "hover:bg-accent/50",
                activeChapter === chapter.id &&
                  "bg-accent text-accent-foreground",
                chapter.type === "h1" &&
                  "font-semibold text-foreground text-sm",
                chapter.type === "h2" && "pl-6 text-sm text-foreground/70",
                chapter.type === "h3" && "pl-10 text-xs text-foreground/60",
              )}
            >
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  toggleChapter(chapter.id);
                }}
                className="shrink-0 cursor-pointer hover:text-foreground"
              >
                {chapter.collapsed ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </span>
              <span className="truncate">{chapter.title}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Plate context wrapper for toolbar */}
        <Plate editor={editor} onChange={() => triggerAnalysis()}>
          {/* Static Toolbar */}
          <EditorToolbar />

          {/* Floating Toolbar (appears on selection) */}
          <FloatingToolbar />

          {/* Editor Content */}
          <div className="flex-1 overflow-y-auto">
            <div
              className={cn(
                "max-w-3xl mx-auto p-8 transition-all duration-200 slate-editor",
                highlightedSection === "content" && "ring-2 ring-primary/30",
              )}
            >
              <PlateContent
                className="outline-none"
                renderElement={({ attributes, children, element }) => {
                  if (!element.type || element.type === "p") {
                    return (
                      <p
                        {...attributes}
                        className="my-3 text-foreground/80 leading-relaxed"
                      >
                        {children}
                      </p>
                    );
                  }
                  return <div {...attributes}>{children}</div>;
                }}
                renderLeaf={({ attributes, children, leaf }) => {
                  let result = children;
                  if (leaf.bold) {
                    result = <strong>{result}</strong>;
                  }
                  if (leaf.italic) {
                    result = <em>{result}</em>;
                  }
                  if (leaf.underline) {
                    result = <u>{result}</u>;
                  }
                  if (leaf.strikethrough) {
                    result = <s>{result}</s>;
                  }
                  if (leaf.code) {
                    result = (
                      <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-sm">
                        {result}
                      </code>
                    );
                  }
                  return <span {...attributes}>{result}</span>;
                }}
              />
            </div>
          </div>
        </Plate>
      </div>
    </div>
  );
}

// Initial content with chapters about Agentic Workflow
const initialValue: Value = [
  {
    type: "h1",
    children: [{ text: "Introduction to Agentic Workflows" }],
  },
  {
    type: "p",
    children: [
      { text: "An " },
      { text: "Agentic Workflow", bold: true },
      {
        text: " represents a paradigm shift in how we think about automation and AI-assisted processes. Unlike traditional workflows that follow rigid, predefined paths, agentic workflows leverage autonomous AI agents that can make decisions, adapt to changing conditions, and collaborate with other agents to achieve complex goals.",
      },
    ],
  },
  {
    type: "p",
    children: [
      {
        text: "This comprehensive guide explores the foundations, implementation strategies, and best practices for building effective agentic workflows in your organization.",
      },
    ],
  },
  {
    type: "h2",
    children: [{ text: "What is an Agentic Workflow?" }],
  },
  {
    type: "p",
    children: [
      { text: "At its core, an " },
      { text: "agentic workflow", italic: true },
      {
        text: " combines the structured nature of traditional business processes with the adaptive intelligence of AI agents. These agents operate with a degree of autonomy, making decisions based on context, learning from outcomes, and continuously optimizing their approach.",
      },
    ],
  },
  {
    type: "blockquote",
    children: [
      {
        text: '"The future of automation lies not in rigid scripts, but in intelligent agents that understand intent and adapt to achieve outcomes."',
      },
    ],
  },
  {
    type: "h3",
    children: [{ text: "Key Characteristics" }],
  },
  {
    type: "p",
    children: [
      {
        text: "Agentic workflows are characterized by their ability to handle uncertainty, make autonomous decisions within defined boundaries, and learn from both successes and failures. They represent the next evolution in process automation.",
      },
    ],
  },
  {
    type: "h2",
    children: [{ text: "Core Components of Agentic Systems" }],
  },
  {
    type: "p",
    children: [
      {
        text: "Building effective agentic workflows requires understanding the fundamental components that power them: the agent architecture, the decision-making framework, and the feedback loops that enable continuous improvement.",
      },
    ],
  },
  {
    type: "h3",
    children: [{ text: "Agent Architecture" }],
  },
  {
    type: "p",
    children: [
      {
        text: "The architecture of an agentic system typically includes a perception layer (for understanding inputs), a reasoning engine (for making decisions), and an action layer (for executing tasks). These components work together to create intelligent, responsive workflows.",
      },
    ],
  },
  {
    type: "h3",
    children: [{ text: "Decision-Making Framework" }],
  },
  {
    type: "p",
    children: [
      {
        text: "Agents use various decision-making frameworks, from rule-based systems to sophisticated machine learning models. The choice of framework depends on the complexity of decisions and the availability of training data.",
      },
    ],
  },
  {
    type: "h2",
    children: [{ text: "Implementation Best Practices" }],
  },
  {
    type: "p",
    children: [
      {
        text: "Successfully implementing agentic workflows requires careful planning, robust testing, and ongoing monitoring. Start with well-defined use cases, establish clear success metrics, and build in safeguards for agent autonomy.",
      },
    ],
  },
  {
    type: "h3",
    children: [{ text: "Starting Small" }],
  },
  {
    type: "p",
    children: [
      { text: "Begin with a limited scope " },
      { text: "agentic workflow", bold: true },
      {
        text: " pilot project. This allows your team to learn the nuances of agent behavior and refine your approach before scaling to more critical processes.",
      },
    ],
  },
  {
    type: "h2",
    children: [{ text: "Future of Agentic Workflows" }],
  },
  {
    type: "p",
    children: [
      {
        text: "As AI capabilities continue to advance, agentic workflows will become increasingly sophisticated. We can expect to see more complex multi-agent collaborations, better natural language interfaces, and deeper integration with existing enterprise systems.",
      },
    ],
  },
];
