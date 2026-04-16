"use client";

import * as React from "react";
import { Plate, PlateContent } from "platejs/react";
import { cn } from "@/src/shared/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Loader2,
} from "lucide-react";
import { MarkdownView } from "@/src/presentation/components/organisms/cms/editor/markdown-view";
import { BlogImageInsertDialog } from "@/src/presentation/components/organisms/cms/editor/blog-image-insert-dialog";
import { EditorToolbar } from "@/src/presentation/components/organisms/cms/editor/editor-toolbar";
import { usePlateEditorState } from "@/src/presentation/components/organisms/cms/editor/use-plate-editor-state";
import type { PlateEditorProps } from "@/src/presentation/components/organisms/cms/editor/editor-types";

export function PlateEditor({
  highlightedSection,
  onContentChange,
  focusKeyword = "",
  initialContent,
  blogId,
  topSlot,
}: PlateEditorProps) {
  const {
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
    toggleChapter,
    dismissWarning,
    triggerAnalysis,
  } = usePlateEditorState({ initialContent, focusKeyword, onContentChange });

  const handleChapterNavigate = React.useCallback((anchorId: string) => {
    const target = document.getElementById(anchorId);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="flex h-full">
      {/* Chapter sidebar */}
      {viewMode === "formatted" && !sidebarCollapsed && (
        <aside className="w-56 shrink-0 border-r border-border overflow-y-auto hidden lg:block bg-content1">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Chapters
            </h3>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(true)}
              className="p-1 hover:bg-accent rounded-md transition-colors"
              aria-label="Collapse chapter sidebar"
            >
              <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <nav aria-label="Chapter navigation" className="p-2">
            {chapters.length === 0 && (
              <p className="text-xs text-muted-foreground px-3 py-4">
                Add headings to see chapters here.
              </p>
            )}
            {chapters.map((chapter) => (
              <a
                key={chapter.id}
                href={`#${chapter.anchorId}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveChapter(chapter.id);
                  handleChapterNavigate(chapter.anchorId);
                }}
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
                {chapter.hasChildren && (
                  <span
                    role="button"
                    aria-label={chapter.collapsed ? "Expand" : "Collapse"}
                    onClick={(e) => {
                      e.preventDefault();
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
                )}
                <span className="truncate">{chapter.title}</span>
              </a>
            ))}
          </nav>
        </aside>
      )}

      {/* Collapsed sidebar toggle */}
      {viewMode === "formatted" && sidebarCollapsed && (
        <div className="hidden lg:flex items-start p-2 border-r border-border">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(false)}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            aria-label="Show chapters"
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

      {/* Main editor area */}
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
            onDismissWarning={dismissWarning}
            topSlot={topSlot}
          />

          {isTransitioning && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-content1/60 backdrop-blur-[1px]">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-default-100 border border-border">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Switching view…
                </span>
              </div>
            </div>
          )}

          {/* Formatted WYSIWYG view */}
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
                    "max-w-3xl mx-auto px-6 sm:px-8 py-8 bg-content1",
                    highlightedSection === "content" &&
                      "ring-2 ring-primary/30",
                  )}
                >
                  <PlateContent
                    className="outline-none min-h-[200px] text-foreground bg-content1 [&_[data-slate-placeholder]]:text-muted-foreground [&_[data-slate-placeholder]]:opacity-50"
                    placeholder="Start writing your article content…"
                    renderLeaf={({ attributes, children, leaf }) => {
                      let node = children;
                      if (leaf.bold)
                        node = (
                          <strong className="font-semibold">{node}</strong>
                        );
                      if (leaf.italic)
                        node = <em className="italic">{node}</em>;
                      if (leaf.underline)
                        node = <u className="underline">{node}</u>;
                      if (leaf.strikethrough)
                        node = <s className="line-through">{node}</s>;
                      if (leaf.code) {
                        node = (
                          <code className="px-1.5 py-0.5 rounded bg-default-100 text-foreground font-mono text-sm border border-border">
                            {node}
                          </code>
                        );
                      }
                      return <span {...attributes}>{node}</span>;
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Raw markdown view */}
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

      {/* Image insert dialog */}
      <BlogImageInsertDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onInsert={handleInsertImage}
        blogId={blogId}
      />
    </div>
  );
}
