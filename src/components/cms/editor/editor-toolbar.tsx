"use client";

import * as React from "react";
import { useEditorRef } from "platejs/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  ImageIcon,
  List,
  ListOrdered,
  MoreHorizontal,
  Plus,
  ChevronDown,
  AlertTriangle,
  X,
  Type,
  Quote,
} from "lucide-react";
import { cn } from "@/src/common/lib/utils";
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
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import {
  ViewModeToggle,
  type ViewMode,
} from "@/src/components/cms/editor/view-mode-toggle";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EditorToolbarProps {
  onInsertImage: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  disabled?: boolean;
  isTransitioning?: boolean;
  markdownWarning?: string | null;
  onDismissWarning?: () => void;
  topSlot?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface ToolbarBtnProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  shortcut?: string;
  className?: string;
}

function ToolbarBtn({ icon, label, isActive, onClick, shortcut, className }: ToolbarBtnProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={isActive}
          onClick={onClick}
          className={cn(
            "inline-flex items-center justify-center w-8 h-8 rounded transition-colors",
            "text-foreground/70 hover:text-foreground hover:bg-accent",
            isActive && "bg-accent text-foreground",
            className,
          )}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="flex items-center gap-1.5 text-xs">
        {label}
        {shortcut && (
          <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">{shortcut}</kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-border mx-0.5 shrink-0" />;
}

// ---------------------------------------------------------------------------
// EditorToolbar
// ---------------------------------------------------------------------------

export function EditorToolbar({
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

  // Use Plate's own toggle APIs (docs: editor.tf.toggleMark, editor.tf.toggleBlock)
  const toggleMark = (key: string) => {
    if (!editor) return;
    editor.tf.toggleMark(key);
  };

  const toggleBlock = (type: string) => {
    if (!editor) return;
    editor.tf.toggleBlock({ type } as any);
  };

  // Use Plate's hasMark API (docs: editor.api.hasMark)
  const isMarkActive = (key: string): boolean => {
    if (!editor) return false;
    return !!(editor.api as any).hasMark?.(key) ?? !!editor.api.marks()?.[key];
  };

  const isBlockActive = (type: string): boolean => {
    if (!editor?.selection) return false;
    return !!(editor.api as any).someNode?.({ match: (n: any) => n.type === type })
      ?? !!(editor.api as any).node?.({ match: (n: any) => n.type === type });
  };

  const currentBlockLabel = (): string => {
    if (isBlockActive("h1")) return "Heading 1";
    if (isBlockActive("h2")) return "Heading 2";
    if (isBlockActive("h3")) return "Heading 3";
    if (isBlockActive("blockquote")) return "Quote";
    return "Normal text";
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="sticky top-0 z-40 bg-background border-b border-border shadow-sm">
        {topSlot && (
          <>
            {topSlot}
            <div className="h-px bg-border/60" />
          </>
        )}

        <div className="overflow-x-auto">
          <div
            role="toolbar"
            aria-label="Editor"
            className="flex items-center gap-0 px-2 py-1.5 min-w-max"
          >
            {isFormatted ? (
              <>
                {/* Text style dropdown */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-1 h-8 px-2 rounded text-sm font-medium transition-colors",
                            "text-foreground/70 hover:text-foreground hover:bg-accent",
                          )}
                        >
                          <Type className="w-4 h-4 shrink-0" />
                          <span className="hidden sm:inline text-xs max-w-[72px] truncate">
                            {currentBlockLabel()}
                          </span>
                          <ChevronDown className="w-3 h-3 shrink-0 opacity-60" />
                        </button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">Text styles</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="start" className="w-40">
                    <DropdownMenuItem
                      onClick={() => toggleBlock("p")}
                      className={cn(
                        !isBlockActive("h1") &&
                          !isBlockActive("h2") &&
                          !isBlockActive("h3") &&
                          !isBlockActive("blockquote") &&
                          "font-medium",
                      )}
                    >
                      Normal text
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => toggleBlock("h1")}>
                      <span className="text-xl font-bold leading-tight">Heading 1</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleBlock("h2")}>
                      <span className="text-lg font-semibold leading-tight">Heading 2</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleBlock("h3")}>
                      <span className="text-base font-medium leading-tight">Heading 3</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => toggleBlock("blockquote")}>
                      Quote
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Separator />

                {/* Bold + Italic */}
                <div className="flex items-center">
                  <ToolbarBtn
                    icon={<Bold className="w-4 h-4" />}
                    label="Bold"
                    shortcut="Ctrl+B"
                    isActive={isMarkActive("bold")}
                    onClick={() => toggleMark("bold")}
                  />
                  <ToolbarBtn
                    icon={<Italic className="w-4 h-4" />}
                    label="Italic"
                    shortcut="Ctrl+I"
                    isActive={isMarkActive("italic")}
                    onClick={() => toggleMark("italic")}
                  />
                </div>

                {/* More formatting dropdown */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center justify-center w-8 h-8 rounded transition-colors",
                            "text-foreground/70 hover:text-foreground hover:bg-accent",
                            (isMarkActive("underline") ||
                              isMarkActive("strikethrough") ||
                              isMarkActive("code")) &&
                              "bg-accent text-foreground",
                          )}
                          aria-label="More formatting"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">More formatting</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="start" className="w-44">
                    <DropdownMenuItem
                      onClick={() => toggleMark("underline")}
                      className={cn(isMarkActive("underline") && "bg-accent")}
                    >
                      <Underline className="w-4 h-4 mr-2 shrink-0" />
                      <span>Underline</span>
                      <kbd className="ml-auto pl-2 text-[10px] font-mono text-muted-foreground">
                        Ctrl+U
                      </kbd>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => toggleMark("strikethrough")}
                      className={cn(isMarkActive("strikethrough") && "bg-accent")}
                    >
                      <Strikethrough className="w-4 h-4 mr-2 shrink-0" />
                      Strikethrough
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => toggleMark("code")}
                      className={cn(isMarkActive("code") && "bg-accent")}
                    >
                      <Code className="w-4 h-4 mr-2 shrink-0" />
                      Inline code
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Separator />

                {/* Lists dropdown */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-0.5 h-8 px-1.5 rounded transition-colors",
                            "text-foreground/70 hover:text-foreground hover:bg-accent",
                          )}
                          aria-label="Lists"
                        >
                          <List className="w-4 h-4" />
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">Lists</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="start" className="w-44">
                    <DropdownMenuItem onClick={() => toggleBlock("ul")}>
                      <List className="w-4 h-4 mr-2 shrink-0" />
                      Bulleted list
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleBlock("ol")}>
                      <ListOrdered className="w-4 h-4 mr-2 shrink-0" />
                      Numbered list
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Separator />

                {/* Insert dropdown */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-0.5 h-8 px-1.5 rounded transition-colors",
                            "text-foreground/70 hover:text-foreground hover:bg-accent",
                          )}
                          aria-label="Insert elements"
                        >
                          <Plus className="w-4 h-4" />
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">Insert</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="start" className="w-44">
                    <DropdownMenuItem onClick={onInsertImage}>
                      <ImageIcon className="w-4 h-4 mr-2 shrink-0" />
                      Image
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleBlock("blockquote")}>
                      <Quote className="w-4 h-4 mr-2 shrink-0" />
                      Quote
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <span className="text-xs text-muted-foreground font-mono px-1">
                Editing raw markdown
              </span>
            )}

            <div className="flex-1 min-w-[16px]" />

            <ViewModeToggle
              mode={viewMode}
              onModeChange={onViewModeChange}
              disabled={disabled || isTransitioning}
            />
          </div>
        </div>

        {markdownWarning && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border-t border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
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
