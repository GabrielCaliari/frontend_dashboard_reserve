"use client";

import * as React from "react";
import { usePlateEditor } from "platejs/react";
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
import { Transforms } from "slate";
import type { Value } from "platejs";
import {
  H1Element,
  H2Element,
  H3Element,
  BlockquoteElement,
  ImageElement,
} from "./editor-elements";
import {
  parseHtmlToSlate,
  extractChapters,
  analyzeContent,
  analyzeMarkdownFallback,
  validateMarkdown,
  EMPTY_SLATE_VALUE,
} from "./editor-utils";
import type { Chapter, ViewMode } from "./editor-types";
import type { ContentStats } from "@/src/common/@types/cms";

interface UsePlateEditorStateOptions {
  initialContent?: string;
  focusKeyword?: string;
  onContentChange?: (stats: ContentStats) => void;
}

export interface PlateEditorState {
  editor: ReturnType<typeof usePlateEditor>;
  viewMode: ViewMode;
  markdownContent: string;
  isTransitioning: boolean;
  markdownWarning: string | null;
  chapters: Chapter[];
  activeChapter: string | null;
  sidebarCollapsed: boolean;
  imageDialogOpen: boolean;
  liveRegionRef: React.RefObject<HTMLDivElement>;
  handleViewModeChange: (newMode: ViewMode) => void;
  handleMarkdownChange: (md: string) => void;
  handleInsertImage: (url: string, alt: string) => void;
  setActiveChapter: (id: string | null) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setImageDialogOpen: (v: boolean) => void;
  toggleChapter: (id: string) => void;
  dismissWarning: () => void;
  triggerAnalysis: () => void;
}

export function usePlateEditorState({
  initialContent,
  focusKeyword = "",
  onContentChange,
}: UsePlateEditorStateOptions): PlateEditorState {
  // Determine initial Slate value from content (HTML or markdown string or undefined)
  const parsedInitial = React.useMemo<Value | string>(() => {
    if (!initialContent || typeof window === "undefined") return EMPTY_SLATE_VALUE;
    if (initialContent.trim().startsWith("<")) return parseHtmlToSlate(initialContent);
    return initialContent; // raw markdown — MarkdownPlugin will handle deserialization
  }, [initialContent]);

  const initialSlateValue = React.useMemo<Value>(
    () => (Array.isArray(parsedInitial) ? (parsedInitial as Value) : EMPTY_SLATE_VALUE),
    [parsedInitial],
  );

  // --- Plate editor instance ---
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
    // When parsedInitial is a markdown string, don't pass value — MarkdownPlugin
    // will deserialize on first render via the init effect below.
    value: typeof parsedInitial === "string" ? undefined : initialSlateValue,
  });

  // --- Persisted view mode ---
  const [viewMode, setViewMode] = React.useState<ViewMode>(() => {
    if (typeof window === "undefined") return "formatted";
    return (localStorage.getItem("plate-editor-view-mode") as ViewMode) || "formatted";
  });

  // markdown is the single source of truth that persists across mode switches
  const [markdownContent, setMarkdownContent] = React.useState("");
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [markdownWarning, setMarkdownWarning] = React.useState<string | null>(null);
  const [chapters, setChapters] = React.useState<Chapter[]>(() =>
    extractChapters(initialSlateValue),
  );
  const [activeChapter, setActiveChapter] = React.useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);

  const liveRegionRef = React.useRef<HTMLDivElement>(null);
  const lastInitializedRef = React.useRef<string | null>(null);
  const lastValidMarkdownRef = React.useRef<string>("");
  const analyzeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = React.useCallback((message: string) => {
    if (!liveRegionRef.current) return;
    liveRegionRef.current.textContent = message;
    setTimeout(() => {
      if (liveRegionRef.current) liveRegionRef.current.textContent = "";
    }, 1000);
  }, []);

  const publishFromSlate = React.useCallback(
    (value: Value, md: string) => {
      lastValidMarkdownRef.current = md;
      setChapters(extractChapters(value));
      onContentChange?.(analyzeContent(value, focusKeyword, md));
    },
    [focusKeyword, onContentChange],
  );

  const publishFromMarkdown = React.useCallback(
    (md: string, warning?: string) => {
      onContentChange?.(analyzeMarkdownFallback(md, focusKeyword));
      if (warning) setMarkdownWarning(warning);
    },
    [focusKeyword, onContentChange],
  );

  // ---------------------------------------------------------------------------
  // Initialize editor content once per initialContent value
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    if (!editor) return;
    const key = initialContent ?? "__empty__";
    if (lastInitializedRef.current === key) return;
    lastInitializedRef.current = key;

    if (typeof parsedInitial === "string" && parsedInitial) {
      setMarkdownContent(parsedInitial);
      try {
        const slateValue = editor.api.markdown.deserialize(parsedInitial);
        editor.tf.setValue(slateValue);
        publishFromSlate(slateValue, parsedInitial);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid markdown in initial content.";
        publishFromMarkdown(parsedInitial, message);
        setViewMode("markdown");
        localStorage.setItem("plate-editor-view-mode", "markdown");
      }
      return;
    }

    // HTML or empty — serialize current Slate value to get initial markdown
    try {
      const md = editor.api.markdown.serialize({ value: initialSlateValue });
      setMarkdownContent(md);
      lastValidMarkdownRef.current = md;
      publishFromSlate(initialSlateValue, md);
    } catch {
      // Empty or unparseable — just seed empty markdown
      setMarkdownContent("");
    }
  }, [editor, initialContent, initialSlateValue, parsedInitial, publishFromMarkdown, publishFromSlate]);

  // ---------------------------------------------------------------------------
  // Debounced analysis triggered on Plate onChange
  // ---------------------------------------------------------------------------
  const triggerAnalysis = React.useCallback(() => {
    if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    analyzeTimerRef.current = setTimeout(() => {
      try {
        const value = editor.children as Value;
        const md = editor.api.markdown.serialize();
        setMarkdownContent(md);
        publishFromSlate(value, md);
      } catch (err) {
        console.error("[PlateEditor] Analysis failed:", err);
      }
    }, 300);
  }, [editor, publishFromSlate]);

  // ---------------------------------------------------------------------------
  // View mode switching — markdown is source of truth on switch
  // ---------------------------------------------------------------------------
  const handleViewModeChange = React.useCallback(
    (newMode: ViewMode) => {
      if (newMode === viewMode || isTransitioning) return;

      setIsTransitioning(true);
      setMarkdownWarning(null);

      const TRANSITION_MS = 150;

      setTimeout(() => {
        try {
          if (newMode === "markdown") {
            // Serialize current Slate state → markdown
            const md = editor.api.markdown.serialize();
            setMarkdownContent(md);
            lastValidMarkdownRef.current = md;
            announce("Switched to markdown source view");
          } else {
            // Validate markdown before attempting to parse
            const warning = validateMarkdown(markdownContent);
            if (warning) setMarkdownWarning(warning);

            // Deserialize markdown → Slate
            const slateValue = editor.api.markdown.deserialize(markdownContent);
            editor.tf.setValue(slateValue);
            publishFromSlate(slateValue, markdownContent);
            announce("Switched to formatted view");
          }

          setViewMode(newMode);
          localStorage.setItem("plate-editor-view-mode", newMode);
        } catch (err) {
          console.error("[PlateEditor] View switch error:", err);

          if (newMode === "formatted") {
            const message = err instanceof Error
              ? err.message
              : "Failed to convert markdown to formatted mode.";
            setMarkdownWarning(message);
            publishFromMarkdown(markdownContent, message);
            announce("Markdown contains errors. Fix them before leaving source view.");
          } else {
            setMarkdownWarning("Failed to convert content. Keeping the latest markdown.");
            setMarkdownContent(lastValidMarkdownRef.current || markdownContent);
            setViewMode("markdown");
          }
        } finally {
          setTimeout(() => setIsTransitioning(false), TRANSITION_MS);
        }
      }, TRANSITION_MS);
    },
    [
      viewMode,
      isTransitioning,
      editor,
      markdownContent,
      publishFromMarkdown,
      publishFromSlate,
      announce,
    ],
  );

  // ---------------------------------------------------------------------------
  // Markdown textarea change handler
  // ---------------------------------------------------------------------------
  const handleMarkdownChange = React.useCallback(
    (md: string) => {
      setMarkdownContent(md);
      if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
      analyzeTimerRef.current = setTimeout(() => {
        const warning = validateMarkdown(md);
        setMarkdownWarning(warning);
        try {
          const slateValue = editor.api.markdown.deserialize(md);
          const serialized = editor.api.markdown.serialize({ value: slateValue });
          publishFromSlate(slateValue, serialized);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Invalid markdown syntax.";
          publishFromMarkdown(md, validateMarkdown(md) ?? message);
        }
      }, 500);
    },
    [editor, publishFromMarkdown, publishFromSlate],
  );

  // ---------------------------------------------------------------------------
  // Image insertion via Transforms (Plate wraps Slate Transforms)
  // ---------------------------------------------------------------------------
  const handleInsertImage = React.useCallback(
    (url: string, alt: string) => {
      if (!editor) return;
      Transforms.insertNodes(editor as any, {
        type: "img",
        url,
        alt,
        children: [{ text: "" }],
      } as any);
      Transforms.insertNodes(editor as any, {
        type: "p",
        children: [{ text: "" }],
      } as any);
    },
    [editor],
  );

  // ---------------------------------------------------------------------------
  // Keyboard shortcut: Ctrl+Shift+M to toggle mode
  // ---------------------------------------------------------------------------
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

  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    };
  }, []);

  return {
    editor,
    viewMode,
    markdownContent,
    isTransitioning,
    markdownWarning,
    chapters,
    activeChapter,
    sidebarCollapsed,
    imageDialogOpen,
    liveRegionRef,
    handleViewModeChange,
    handleMarkdownChange,
    handleInsertImage,
    setActiveChapter,
    setSidebarCollapsed,
    setImageDialogOpen,
    toggleChapter: (id: string) =>
      setChapters((prev) =>
        prev.map((ch) => (ch.id === id ? { ...ch, collapsed: !ch.collapsed } : ch)),
      ),
    dismissWarning: () => setMarkdownWarning(null),
    triggerAnalysis,
  };
}
