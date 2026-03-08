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
import { Transforms, Editor } from "slate";
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
  History,
  Undo,
  Redo,
  PanelLeftClose,
  PanelLeft,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { MarkdownView } from "@/src/components/cms/editor/markdown-view";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useUploadImages } from "@/src/common/hooks/cms/useImageMutations";
import type { ContentStats } from "@/src/types/cms";

// Utility: Serialize Slate value to HTML string
function serializeNodesToHtml(nodes: Value): string {
  return nodes
    .map((node: any) => {
      const childrenHtml = (node.children || [])
        .map((child: any) => {
          if (child.text !== undefined) {
            let text = child.text;
            if (!text) return "";
            text = text
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
            if (child.bold) text = `<strong>${text}</strong>`;
            if (child.italic) text = `<em>${text}</em>`;
            if (child.underline) text = `<u>${text}</u>`;
            if (child.strikethrough) text = `<s>${text}</s>`;
            if (child.code) text = `<code>${text}</code>`;
            return text;
          }
          return serializeNodesToHtml([child]);
        })
        .join("");

      switch (node.type) {
        case "h1":
          return `<h1>${childrenHtml}</h1>`;
        case "h2":
          return `<h2>${childrenHtml}</h2>`;
        case "h3":
          return `<h3>${childrenHtml}</h3>`;
        case "blockquote":
          return `<blockquote>${childrenHtml}</blockquote>`;
        case "img":
          return `<img src="${node.url}" alt="${node.alt || ""}" />`;
        case "a":
          return `<a href="${node.url}">${childrenHtml}</a>`;
        case "p":
        default:
          return `<p>${childrenHtml}</p>`;
      }
    })
    .join("\n");
}

// Utility: Parse HTML string to Slate value
function parseHtmlToSlate(html: string): Value {
  if (!html || !html.trim()) {
    return [{ type: "p", children: [{ text: "" }] }];
  }

  const nodes: any[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  function parseNode(domNode: Node): any {
    if (domNode.nodeType === Node.TEXT_NODE) {
      return { text: domNode.textContent || "" };
    }

    if (domNode.nodeType === Node.ELEMENT_NODE) {
      const el = domNode as Element;
      const tag = el.tagName.toLowerCase();
      const children = Array.from(el.childNodes).map(parseNode).flat();

      // Inline marks
      if (tag === "strong" || tag === "b") {
        return children.map((c: any) => ({ ...c, bold: true }));
      }
      if (tag === "em" || tag === "i") {
        return children.map((c: any) => ({ ...c, italic: true }));
      }
      if (tag === "u") {
        return children.map((c: any) => ({ ...c, underline: true }));
      }
      if (tag === "s" || tag === "del" || tag === "strike") {
        return children.map((c: any) => ({ ...c, strikethrough: true }));
      }
      if (tag === "code") {
        return children.map((c: any) => ({ ...c, code: true }));
      }

      // Block elements
      const blockChildren = children.length > 0 ? children : [{ text: "" }];
      if (tag === "h1") return { type: "h1", children: blockChildren };
      if (tag === "h2") return { type: "h2", children: blockChildren };
      if (tag === "h3") return { type: "h3", children: blockChildren };
      if (tag === "blockquote")
        return { type: "blockquote", children: blockChildren };
      if (tag === "img")
        return {
          type: "img",
          url: el.getAttribute("src") || "",
          alt: el.getAttribute("alt") || "",
          children: [{ text: "" }],
        };
      if (tag === "ul") return { type: "ul", children: blockChildren };
      if (tag === "ol") return { type: "ol", children: blockChildren };
      if (tag === "li") return { type: "li", children: blockChildren };
      if (tag === "a")
        return {
          type: "a",
          url: el.getAttribute("href") || "",
          children: blockChildren,
        };
      if (tag === "p") return { type: "p", children: blockChildren };
      if (tag === "div") return { type: "p", children: blockChildren };
      if (tag === "br") return { text: "\n" };

      return children;
    }

    return { text: "" };
  }

  Array.from(body.childNodes).forEach((node) => {
    const result = parseNode(node);
    if (Array.isArray(result)) {
      if (result.length > 0) {
        nodes.push({ type: "p", children: result });
      }
    } else if (result && result.type) {
      nodes.push(result);
    } else if (result && result.text) {
      nodes.push({ type: "p", children: [result] });
    }
  });

  return nodes.length > 0 ? nodes : [{ type: "p", children: [{ text: "" }] }];
}

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

// Image Insert Dialog
interface ImageInsertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string, alt: string) => void;
  blogId?: string | number;
  articleId?: string;
}

function ImageInsertDialog({
  open,
  onOpenChange,
  onInsert,
  blogId,
  articleId,
}: ImageInsertDialogProps) {
  const [imageUrl, setImageUrl] = React.useState("");
  const [altText, setAltText] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadMode, setUploadMode] = React.useState<"url" | "upload">("url");
  const uploadImagesMutation = useUploadImages();

  const handleInsert = async () => {
    if (uploadMode === "url" && imageUrl) {
      onInsert(imageUrl, altText);
      setImageUrl("");
      setAltText("");
      onOpenChange(false);
    } else if (uploadMode === "upload" && selectedFile && blogId && articleId) {
      try {
        const result = await uploadImagesMutation.mutateAsync({
          articleId,
          files: [selectedFile],
          altTexts: [altText || null],
        });
        if (result && result[0]) {
          onInsert(result[0].url, altText);
          setSelectedFile(null);
          setAltText("");
          onOpenChange(false);
        }
      } catch (error) {
        console.error("Upload failed:", error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Button
              variant={uploadMode === "url" ? "default" : "outline"}
              onClick={() => setUploadMode("url")}
              size="sm"
            >
              Image URL
            </Button>
            {blogId && articleId && (
              <Button
                variant={uploadMode === "upload" ? "default" : "outline"}
                onClick={() => setUploadMode("upload")}
                size="sm"
              >
                Upload File
              </Button>
            )}
          </div>

          {uploadMode === "url" ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Image URL</label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Alt Text</label>
                <Input
                  placeholder="Describe the image"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Select Image</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Alt Text</label>
                <Input
                  placeholder="Describe the image"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleInsert}
            disabled={
              (uploadMode === "url" && !imageUrl) ||
              (uploadMode === "upload" && !selectedFile) ||
              uploadImagesMutation.isPending
            }
          >
            {uploadImagesMutation.isPending ? "Uploading..." : "Insert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// EditorToolbar component
interface EditorToolbarProps {
  onInsertImage: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  disabled?: boolean;
  isTransitioning?: boolean;
  markdownWarning?: string | null;
  onDismissWarning?: () => void;
}

function EditorToolbar({
  onInsertImage,
  viewMode,
  onViewModeChange,
  disabled,
  isTransitioning,
  markdownWarning,
  onDismissWarning,
}: EditorToolbarProps) {
  const editor = useEditorRef();
  const isFormatted = viewMode === "formatted";

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

  return (
    <TooltipProvider delayDuration={100}>
      <div className="sticky top-0 z-40 border-b border-border bg-content1 overflow-x-auto">
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2">
          {/* Format buttons -- only visible in formatted mode */}
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

              {/* Text marks */}
              <div className="flex items-center gap-0.5">
                <ToolbarButton
                  icon={<Bold className="w-4 h-4" />}
                  label="Bold"
                  shortcut="Ctrl+B"
                  isActive={isMarkActive("bold")}
                  onClick={() => toggleMark("bold")}
                />
                <ToolbarButton
                  icon={<Italic className="w-4 h-4" />}
                  label="Italic"
                  shortcut="Ctrl+I"
                  isActive={isMarkActive("italic")}
                  onClick={() => toggleMark("italic")}
                />
                <ToolbarButton
                  icon={<Underline className="w-4 h-4" />}
                  label="Underline"
                  shortcut="Ctrl+U"
                  isActive={isMarkActive("underline")}
                  onClick={() => toggleMark("underline")}
                />
                <ToolbarButton
                  icon={<Strikethrough className="w-4 h-4" />}
                  label="Strikethrough"
                  isActive={isMarkActive("strikethrough")}
                  onClick={() => toggleMark("strikethrough")}
                />
                <ToolbarButton
                  icon={<Code className="w-4 h-4" />}
                  label="Inline Code"
                  isActive={isMarkActive("code")}
                  onClick={() => toggleMark("code")}
                />
              </div>

              <div className="hidden xs:block w-px h-6 bg-border mx-1" />

              {/* Block types */}
              <div className="flex items-center gap-0.5">
                <ToolbarButton
                  icon={<Heading1 className="w-4 h-4" />}
                  label="Heading 1"
                  isActive={isBlockActive("h1")}
                  onClick={() => toggleBlock("h1")}
                />
                <ToolbarButton
                  icon={<Heading2 className="w-4 h-4" />}
                  label="Heading 2"
                  isActive={isBlockActive("h2")}
                  onClick={() => toggleBlock("h2")}
                />
                <ToolbarButton
                  icon={<Heading3 className="w-4 h-4" />}
                  label="Heading 3"
                  isActive={isBlockActive("h3")}
                  onClick={() => toggleBlock("h3")}
                />
                <ToolbarButton
                  icon={<Quote className="w-4 h-4" />}
                  label="Blockquote"
                  isActive={isBlockActive("blockquote")}
                  onClick={() => toggleBlock("blockquote")}
                />
              </div>

              <div className="hidden xs:block w-px h-6 bg-border mx-1" />

              {/* Insert Image */}
              <div className="flex items-center gap-0.5">
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
              </div>
            </>
          )}

          {/* Markdown mode label */}
          {!isFormatted && (
            <span className="text-xs text-muted-foreground font-mono px-1">
              Editing raw markdown
            </span>
          )}

          <div className="flex-1 min-w-0" />

          {/* View Mode Toggle -- always visible */}
          <ViewModeToggle
            mode={viewMode}
            onModeChange={onViewModeChange}
            disabled={disabled || isTransitioning}
          />
        </div>

        {/* Markdown validation warning banner */}
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

// Custom Element Components with proper markdown rendering
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

function ListElement({ children, ...props }: PlateElementProps) {
  const element = props.element as any;
  const Tag = element.type === "ol" ? "ol" : "ul";
  return (
    <PlateElement {...props} asChild>
      <Tag
        className={cn(
          "my-4 space-y-2",
          element.type === "ol"
            ? "list-decimal list-inside"
            : "list-disc list-inside",
        )}
      >
        {children}
      </Tag>
    </PlateElement>
  );
}

function ListItemElement({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement {...props} asChild>
      <li className="text-muted-foreground leading-relaxed pl-2">{children}</li>
    </PlateElement>
  );
}

// Chapter type
interface Chapter {
  id: string;
  title: string;
  type: "h1" | "h2" | "h3";
  collapsed: boolean;
}

function extractChapters(value: Value): Chapter[] {
  const chapters: Chapter[] = [];
  // Guard against non-array values (e.g., markdown strings)
  if (!Array.isArray(value)) {
    return chapters;
  }
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

// Analyze content
function analyzeContent(
  value: Value,
  keyword: string,
  mdContent?: string,
): ContentStats {
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

  const firstTenPercent = words
    .slice(0, Math.ceil(wordCount * 0.1))
    .join(" ")
    .toLowerCase();
  const keywordInFirstTenPercent = firstTenPercent.includes(keyword_lower);

  const paragraphs = value.filter((n: any) => n.type === "p");
  const shortParagraphs = paragraphs.every((p: any) => {
    const text =
      p.children?.map((c: { text?: string }) => c.text || "").join("") || "";
    return text.split(/\s+/).length < 120;
  });

  const firstParagraph = value.find((n: any) => n.type === "p");
  const metaDescription = firstParagraph
    ? firstParagraph.children
        ?.map((c: { text?: string }) => c.text || "")
        .join("")
        .slice(0, 160)
    : "";

  const content = mdContent ?? plainText;

  return {
    wordCount,
    headings,
    hasImages: value.some((n: any) => n.type === "img"),
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
    content,
  };
}

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

function analyzeMarkdownFallback(md: string, keyword: string): ContentStats {
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

      return {
        type: `h${match[1].length}`,
        text: match[2].trim(),
      };
    })
    .filter((heading): heading is { type: string; text: string } => !!heading);

  const paragraphs = plainText
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return {
    wordCount,
    headings,
    hasImages: /!\[[^\]]*\]\([^)]+\)/.test(md),
    hasExternalLinks: /\[[^\]]+\]\(https?:\/\/[^)]+\)/i.test(md),
    hasInternalLinks: /\[[^\]]+\]\((?!https?:\/\/)[^)]+\)/i.test(md),
    keywordCount,
    keywordDensity: Math.round(keywordDensity * 100) / 100,
    keywordInFirstTenPercent: keywordLower
      ? firstTenPercent.includes(keywordLower)
      : false,
    keywordInSubheadings: headings.some(
      (heading) =>
        (heading.type === "h2" || heading.type === "h3") &&
        heading.text.toLowerCase().includes(keywordLower),
    ),
    keywordInImageAlt: keywordLower
      ? new RegExp(`!\\[[^\\]]*${keywordLower}[^\\]]*\\]`, "i").test(md)
      : false,
    shortParagraphs: paragraphs.every(
      (paragraph) => paragraph.split(/\s+/).length < 120,
    ),
    plainText,
    metaDescription: plainText.slice(0, 160),
    content: md,
  };
}

const emptyValue: Value = [
  {
    type: "p",
    children: [{ text: "" }],
  },
];

// PlateEditor Component
interface PlateEditorProps {
  highlightedSection?: string | null;
  onContentChange?: (stats: ContentStats) => void;
  focusKeyword?: string;
  initialContent?: string;
  blogId?: string | number;
  articleId?: string;
}

export function PlateEditor({
  highlightedSection,
  onContentChange,
  focusKeyword = "",
  initialContent,
  blogId,
  articleId,
}: PlateEditorProps) {
  // Parse initial content using Plate's markdown plugin
  const parsedInitial = React.useMemo(() => {
    if (initialContent && typeof window !== "undefined") {
      // If content looks like HTML (starts with < tag), use HTML parser
      if (initialContent.trim().startsWith("<")) {
        return parseHtmlToSlate(initialContent);
      }
      // Otherwise treat as markdown - will be deserialized by MarkdownPlugin
      return initialContent;
    }
    return emptyValue;
  }, [initialContent]);

  const initialSlateValue = React.useMemo<Value>(
    () => (Array.isArray(parsedInitial) ? (parsedInitial as Value) : emptyValue),
    [parsedInitial],
  );

  // --- View mode state ---
  const [viewMode, setViewMode] = React.useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (
        (localStorage.getItem("plate-editor-view-mode") as ViewMode) ||
        "formatted"
      );
    }
    return "formatted";
  });
  const [markdownContent, setMarkdownContent] = React.useState("");
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [markdownWarning, setMarkdownWarning] = React.useState<string | null>(
    null,
  );

  const [chapters, setChapters] = React.useState<Chapter[]>(() =>
    extractChapters(initialSlateValue),
  );
  const [activeChapter, setActiveChapter] = React.useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);
  const liveRegionRef = React.useRef<HTMLDivElement>(null);
  const lastInitializedContentRef = React.useRef<string | null>(null);
  const lastValidMarkdownRef = React.useRef<string>("");

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
    value:
      typeof parsedInitial === "string"
        ? undefined // Let MarkdownPlugin handle deserialization
        : initialSlateValue,
  });

  const publishParsedState = React.useCallback(
    (value: Value, markdown: string) => {
      lastValidMarkdownRef.current = markdown;
      setChapters(extractChapters(value));
      onContentChange?.(analyzeContent(value, focusKeyword, markdown));
    },
    [focusKeyword, onContentChange],
  );

  const publishMarkdownFallback = React.useCallback(
    (md: string, warning?: string) => {
      onContentChange?.(analyzeMarkdownFallback(md, focusKeyword));

      if (warning) {
        setMarkdownWarning(warning);
      }
    },
    [focusKeyword, onContentChange],
  );

  // Initialize content and keep markdown source in sync with incoming content
  React.useEffect(() => {
    if (!editor) return;

    const contentKey = initialContent ?? "__empty__";

    if (lastInitializedContentRef.current === contentKey) {
      return;
    }

    lastInitializedContentRef.current = contentKey;

    if (typeof parsedInitial === "string" && parsedInitial) {
      setMarkdownContent(parsedInitial);

      try {
        const slateValue = editor.api.markdown.deserialize(parsedInitial);
        editor.tf.setValue(slateValue);
        publishParsedState(slateValue, parsedInitial);
      } catch (error) {
        console.error("[PlateEditor] Failed to deserialize markdown:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Invalid markdown detected in the initial content.";

        publishMarkdownFallback(parsedInitial, message);
        setViewMode("markdown");
        localStorage.setItem("plate-editor-view-mode", "markdown");
      }

      return;
    }

    const serializedInitial = editor.api.markdown.serialize({
      value: initialSlateValue,
    });

    setMarkdownContent(serializedInitial);
    lastValidMarkdownRef.current = serializedInitial;
    publishParsedState(initialSlateValue, serializedInitial);
  }, [editor, initialContent, initialSlateValue, parsedInitial, publishMarkdownFallback, publishParsedState]);

  const analyzeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const triggerAnalysis = React.useCallback(() => {
    if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    analyzeTimerRef.current = setTimeout(() => {
      try {
        const value = editor.children as Value;
        const md = editor.api.markdown.serialize();
        publishParsedState(value, md);
      } catch (error) {
        console.error("[PlateEditor] Failed to analyze formatted content:", error);
      }
    }, 300);
  }, [editor, publishParsedState]);

  React.useEffect(() => {
    triggerAnalysis();
  }, [triggerAnalysis]);

  const toggleChapter = (chapterId: string) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId ? { ...ch, collapsed: !ch.collapsed } : ch,
      ),
    );
  };

  const scrollToChapter = (chapterId: string) => {
    setActiveChapter(chapterId);
  };

  const handleInsertImage = (url: string, alt: string) => {
    if (!editor) return;

    const imageNode = {
      type: "img",
      url,
      alt,
      children: [{ text: "" }],
    };

    Transforms.insertNodes(editor, imageNode as any);
    Transforms.insertNodes(editor, {
      type: "p",
      children: [{ text: "" }],
    } as any);
  };

  // --- Announce mode changes to screen readers ---
  const announce = React.useCallback((message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
      // Clear after announcement so next identical message still triggers
      setTimeout(() => {
        if (liveRegionRef.current) liveRegionRef.current.textContent = "";
      }, 1000);
    }
  }, []);

  // --- Validate markdown content ---
  const validateMarkdown = React.useCallback((md: string): string | null => {
    if (!md || !md.trim()) return null;

    // Check for unclosed code fences
    const fenceMatches = md.match(/^```/gm);
    if (fenceMatches && fenceMatches.length % 2 !== 0) {
      return "Unclosed code fence detected (```) -- content may render incorrectly.";
    }

    // Check for unclosed bold markers
    const boldMatches = md.match(/\*\*/g);
    if (boldMatches && boldMatches.length % 2 !== 0) {
      return "Unclosed bold marker (**) detected -- some formatting may be lost.";
    }

    // Check for unbalanced link syntax
    const openBrackets = (md.match(/\[/g) || []).length;
    const closeBrackets = (md.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      return "Unbalanced brackets [] detected -- some links may not parse correctly.";
    }

    return null;
  }, []);

  // --- View mode switching logic ---
  const handleViewModeChange = React.useCallback(
    (newMode: ViewMode) => {
      if (newMode === viewMode || isTransitioning) return;

      setIsTransitioning(true);
      setMarkdownWarning(null);

      // Brief transition delay for smooth animation
      const transitionMs = 150;

      setTimeout(() => {
        try {
          if (newMode === "markdown") {
            // Serialize current Slate value to markdown using MarkdownPlugin
            const md = editor.api.markdown.serialize();
            setMarkdownContent(md);
            lastValidMarkdownRef.current = md;
            announce("Switched to markdown source view");
          } else {
            // Validate markdown before switching
            const warning = validateMarkdown(markdownContent);
            if (warning) {
              setMarkdownWarning(warning);
            }

            // Deserialize markdown to Slate value using MarkdownPlugin
            const slateValue = editor.api.markdown.deserialize(markdownContent);
            // Replace editor content
            editor.tf.setValue(slateValue);
            publishParsedState(slateValue, markdownContent);
            // Re-analyze after switching back
            setTimeout(() => triggerAnalysis(), 100);
            announce("Switched to formatted view");
          }

          setViewMode(newMode);
          localStorage.setItem("plate-editor-view-mode", newMode);
        } catch (err) {
          console.error("[PlateEditor] View switch error:", err);

          if (newMode === "formatted") {
            const message =
              err instanceof Error
                ? err.message
                : "Failed to convert markdown back to formatted mode.";

            setMarkdownWarning(message);
            publishMarkdownFallback(markdownContent, message);
            announce("Markdown contains errors. Fix them before leaving source view.");
          } else {
            setMarkdownWarning(
              "Failed to convert content. Keeping the latest markdown source.",
            );
            setMarkdownContent(lastValidMarkdownRef.current || markdownContent);
            setViewMode("markdown");
          }
        } finally {
          // End transition after content settles
          setTimeout(() => setIsTransitioning(false), transitionMs);
        }
      }, transitionMs);
    },
    [
      viewMode,
      isTransitioning,
      editor,
      markdownContent,
      publishMarkdownFallback,
      publishParsedState,
      triggerAnalysis,
      announce,
      validateMarkdown,
    ],
  );

  // Handle markdown changes in raw mode
  const handleMarkdownChange = React.useCallback(
    (md: string) => {
      setMarkdownContent(md);
      // Trigger content analysis with the markdown content
      if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
      analyzeTimerRef.current = setTimeout(() => {
        try {
          // Live validation while typing
          const warning = validateMarkdown(md);
          setMarkdownWarning(warning);

          const slateValue = editor.api.markdown.deserialize(md);
          const mdContent = editor.api.markdown.serialize({
            value: slateValue,
          });
          publishParsedState(slateValue, mdContent);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Markdown syntax is currently invalid.";

          publishMarkdownFallback(md, validateMarkdown(md) ?? message);
        }
      }, 500);
    },
    [editor, publishMarkdownFallback, publishParsedState, validateMarkdown],
  );

  // --- Keyboard shortcut: Ctrl+Shift+M ---
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "M") {
        e.preventDefault();
        handleViewModeChange(
          viewMode === "formatted" ? "markdown" : "formatted",
        );
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleViewModeChange, viewMode]);

  return (
    <div className="flex h-full">
      {/* Chapter Navigation Sidebar - Collapsible (only in formatted mode) */}
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
                Add headings (H1, H2, H3) to your content to see chapters here.
              </p>
            )}
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
                  chapter.type === "h2" && "pl-6 text-sm text-muted-foreground",
                  chapter.type === "h3" &&
                    "pl-10 text-xs text-muted-foreground",
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
      )}

      {/* Collapsed Sidebar Toggle (formatted mode only) */}
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

      {/* ARIA live region for screen reader announcements */}
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
          />

          {/* Transition overlay */}
          {isTransitioning && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-content1/60 backdrop-blur-[1px] animate-fade-in">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-default-100 border border-border shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Switching view...
                </span>
              </div>
            </div>
          )}

          {/* Formatted (WYSIWYG) view */}
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
                    highlightedSection === "content" &&
                      "ring-2 ring-primary/30",
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
                      if (leaf.bold) {
                        result = (
                          <strong className="font-semibold">{result}</strong>
                        );
                      }
                      if (leaf.italic) {
                        result = <em className="italic">{result}</em>;
                      }
                      if (leaf.underline) {
                        result = <u className="underline">{result}</u>;
                      }
                      if (leaf.strikethrough) {
                        result = <s className="line-through">{result}</s>;
                      }
                      if (leaf.code) {
                        result = (
                          <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-sm border border-border">
                            {result}
                          </code>
                        );
                      }
                      return <span {...attributes}>{result}</span>;
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Markdown (raw source) view */}
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

      {/* Image Insert Dialog */}
      <ImageInsertDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onInsert={handleInsertImage}
        blogId={blogId}
        articleId={articleId}
      />
    </div>
  );
}
