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
import { ImagePlugin } from "@platejs/media/react";
import { LinkPlugin } from "@platejs/link/react";
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
  ImageIcon,
  History,
  Undo,
  Redo,
  PanelLeftClose,
  PanelLeft,
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

      const anchorNode = domSelection.anchorNode;
      const editorEl =
        anchorNode instanceof Node
          ? (anchorNode.nodeType === Node.ELEMENT_NODE
              ? (anchorNode as Element)
              : anchorNode.parentElement
            )?.closest(".slate-editor")
          : null;
      if (!editorEl) {
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
        <div className="flex items-center gap-0.5 px-1">
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

        <div className="w-px h-5 bg-border mx-1" />

        <div className="flex items-center gap-0.5 px-1">
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
      </div>
    </TooltipProvider>
  );
}

// Image Insert Dialog
interface ImageInsertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string, alt: string) => void;
  blogId?: number;
  articleId?: number;
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
          blogId,
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
}

function EditorToolbar({ onInsertImage }: EditorToolbarProps) {
  const editor = useEditorRef();

  return (
    <TooltipProvider delayDuration={100}>
      <div className="sticky top-0 z-40 flex flex-wrap items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 border-b border-border bg-content1 overflow-x-auto">
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

        <div className="hidden xs:block w-px h-6 bg-border mx-1 sm:mx-2" />

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
                <span className="hidden md:inline">Insert Image</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>Insert image (Ctrl+Shift+I)</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex-1 min-w-0" />

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

  const content = serializeNodesToHtml(value);

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
  blogId?: number;
  articleId?: number;
}

export function PlateEditor({
  highlightedSection,
  onContentChange,
  focusKeyword = "",
  initialContent,
  blogId,
  articleId,
}: PlateEditorProps) {
  const parsedInitial = React.useMemo(() => {
    if (initialContent && typeof window !== "undefined") {
      return parseHtmlToSlate(initialContent);
    }
    return emptyValue;
  }, [initialContent]);

  const [chapters, setChapters] = React.useState<Chapter[]>(() =>
    extractChapters(parsedInitial),
  );
  const [activeChapter, setActiveChapter] = React.useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);

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
    ],
    value: parsedInitial,
  });

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

  return (
    <div className="flex h-full">
      {/* Chapter Navigation Sidebar - Collapsible */}
      {!sidebarCollapsed && (
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

      {/* Collapsed Sidebar Toggle */}
      {sidebarCollapsed && (
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

      {/* Main Editor Area */}
      <div className="flex-1 min-w-0 flex flex-col h-full bg-content1">
        <Plate editor={editor} onChange={() => triggerAnalysis()}>
          <EditorToolbar onInsertImage={() => setImageDialogOpen(true)} />
          <FloatingToolbar />

          <div className="flex-1 overflow-y-auto bg-content1">
            <div
              className={cn(
                "max-w-3xl mx-auto px-6 sm:px-8 py-8 min-h-full transition-all duration-200 slate-editor bg-content1",
                highlightedSection === "content" && "ring-2 ring-primary/30",
              )}
            >
              <PlateContent
                className="outline-none h-full text-foreground bg-content1 [&_[data-slate-placeholder]]:text-muted-foreground [&_[data-slate-placeholder]]:opacity-50"
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
