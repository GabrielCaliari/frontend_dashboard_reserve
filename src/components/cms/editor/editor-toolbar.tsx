"use client";

import * as React from "react";
import { useEditorState } from "platejs/react";
import { KEYS } from "platejs";
import { upsertLink, unwrapLink } from "@platejs/link";
import { toggleList } from "@platejs/list-classic";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  ImagePlus,
  List,
  ListOrdered,
  MoreHorizontal,
  ChevronDown,
  AlertTriangle,
  X,
  Type,
  Quote,
  Link,
  Link2Off,
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
import { KbdKey } from "@/src/components/cms/editor/editor-kbd-key";

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
          data-plate-focus="true"
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
          <KbdKey>{shortcut}</KbdKey>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-border mx-0.5 shrink-0" />;
}

// ---------------------------------------------------------------------------
// LinkInsertPopover — inline URL input triggered from the toolbar
// ---------------------------------------------------------------------------

interface LinkInsertPopoverProps {
  editor: ReturnType<typeof import("platejs/react").useEditorState>;
  onClose: () => void;
  savedSelection: any;
}

function LinkInsertPopover({ editor, onClose, savedSelection }: LinkInsertPopoverProps) {
  // Detect an existing link node at the current selection
  const existingLink = React.useMemo(() => {
    if (!editor?.selection && !savedSelection) return null;
    try {
      const entries = Array.from(
        editor.api.nodes({ match: (n: any) => n.type === KEYS.link }) ?? []
      );
      return (entries[0]?.[0] as any) ?? null;
    } catch { return null; }
  }, [editor, savedSelection]);

  // Pre-fill display text from selection when in insert mode
  const selectionText = React.useMemo(() => {
    if (!editor?.selection || existingLink) return "";
    try {
      return editor.api.string(editor.selection) ?? "";
    } catch { return ""; }
  }, [editor, existingLink]);

  const isEditMode = Boolean(existingLink);

  const [url, setUrl] = React.useState<string>(() => existingLink?.url ?? "");
  const [text, setText] = React.useState<string>(selectionText);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { inputRef.current?.focus(); }, []);

  const restoreSelection = () => {
    if (savedSelection) {
      try {
        editor.tf.select(savedSelection as any);
        editor.tf.focus();
      } catch { /* noop */ }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const normalized = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;

    // Restore the saved selection so the link wraps the correct text
    restoreSelection();

    // Contract selection to exclude trailing whitespace (e.g. double-click selects word + space)
    if (editor.selection) {
      let { focus } = editor.selection;
      try {
        while (true) {
          const before = editor.api.before(focus, { unit: "character" });
          if (!before) break;
          const range = { anchor: before, focus };
          const char = editor.api.string(range);
          if (char && /\s$/.test(char)) {
            focus = before;
          } else {
            break;
          }
        }
        if (focus !== editor.selection.focus) {
          editor.tf.select({ anchor: editor.selection.anchor, focus });
        }
      } catch { /* noop */ }
    }

    // Only pass text when the user explicitly changed it from the original
    // selection — otherwise let upsertLink preserve the selected content as-is
    const userChangedText = text !== selectionText;

    upsertLink(editor, {
      url: normalized,
      text: userChangedText && text ? text : undefined,
      target: normalized.startsWith("http") ? "_blank" : undefined,
      skipValidation: true,
    });

    onClose();
  };

  const handleUnlink = () => {
    restoreSelection();
    unwrapLink(editor);
    onClose();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 p-3 w-72 bg-popover border border-border rounded-lg shadow-lg"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <p className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
        <Link className="w-3.5 h-3.5" />
        {isEditMode ? "Edit link" : "Insert link"}
      </p>

      <label className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
        URL
      </label>
      <input
        ref={inputRef}
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
        className="h-8 px-2.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      {!isEditMode && (
        <>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
            Display text <span className="normal-case font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Link text…"
            className="h-8 px-2.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </>
      )}

      <div className="flex items-center gap-2 mt-1">
        <button
          type="submit"
          disabled={!url.trim()}
          className="flex-1 h-8 px-3 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isEditMode ? "Save" : "Apply"}
        </button>
        {isEditMode && (
          <button
            type="button"
            onClick={handleUnlink}
            className="flex items-center gap-1 h-8 px-2.5 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 border border-destructive/30 transition-colors"
          >
            <Link2Off className="w-3.5 h-3.5" />
            Remove
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="h-8 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
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
  const editor = useEditorState();
  const isFormatted = viewMode === "formatted";
  const savedSelectionRef = React.useRef<typeof editor.selection | null>(null);
  const lastSelectionRef = React.useRef<typeof editor.selection | null>(null);
  const [linkPopoverOpen, setLinkPopoverOpen] = React.useState(false);
  const linkBtnRef = React.useRef<HTMLButtonElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = React.useState<{ top: number; left: number } | null>(null);

  // Close popover on outside click
  React.useEffect(() => {
    if (!linkPopoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        !popoverRef.current?.contains(e.target as Node) &&
        !linkBtnRef.current?.contains(e.target as Node)
      ) {
        setLinkPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [linkPopoverOpen]);

  React.useEffect(() => {
    if (editor?.selection) lastSelectionRef.current = editor.selection;
  }, [editor?.selection]);

  // Ctrl+K to open link popover (only in formatted mode)
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k" && isFormatted) {
        e.preventDefault();
        openLinkPopover();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isFormatted]);

  // Helper to open the link popover — saves selection and computes position
  const openLinkPopover = React.useCallback(() => {
    // Save selection before the popover steals focus
    if (editor?.selection) {
      savedSelectionRef.current = JSON.parse(JSON.stringify(editor.selection));
    } else if (lastSelectionRef.current) {
      savedSelectionRef.current = JSON.parse(JSON.stringify(lastSelectionRef.current));
    }
    // Compute position relative to the link button
    if (linkBtnRef.current) {
      const rect = linkBtnRef.current.getBoundingClientRect();
      setPopoverPos({ top: rect.bottom + 4, left: rect.left });
    }
    setLinkPopoverOpen((v) => !v);
  }, [editor]);

  const refocusEditor = React.useCallback(() => {
    editor?.tf.focus();
  }, [editor]);

  // Use Plate's own toggle APIs (docs: editor.tf.toggleMark, editor.tf.toggleBlock)
  const toggleMark = (key: string) => {
    if (!editor) return;
    editor.tf.toggleMark(key);
  };

  const toggleBlock = (type: string) => {
    if (!editor) return;
    if (!editor.selection && lastSelectionRef.current) {
      editor.tf.select(lastSelectionRef.current as any);
    }
    editor.tf.focus();

    if (type === "ul") {
      const listType = editor.getType?.("ul") ?? "ul";
      toggleList(editor as any, { type: listType });
      return;
    }

    if (type === "ol") {
      const listType = editor.getType?.("ol") ?? "ol";
      toggleList(editor as any, { type: listType });
      return;
    }

    const tf = (editor.tf as any)?.[type];
    if (tf?.toggle) {
      tf.toggle();
      return;
    }
    editor.tf.toggleBlock({ type, wrap: type === "ul" || type === "ol" } as any);
  };

  // Use Plate's hasMark API (docs: editor.api.hasMark)
  const isMarkActive = (key: string): boolean => {
    if (!editor) return false;

    const hasMark = (editor.api as any).hasMark?.(key);
    if (typeof hasMark === "boolean") return hasMark;

    return Boolean((editor.api as any).marks?.()?.[key]);
  };

  const isBlockActive = (type: string): boolean => {
    if (!editor?.selection) return false;

    const match = { match: (n: any) => n.type === type };
    const someNode = (editor.api as any).someNode?.(match);
    if (typeof someNode === "boolean") return someNode;

    return Boolean((editor.api as any).node?.(match));
  };

  // Detect if the cursor/selection is currently inside a link node
  const isLinkActive = React.useMemo(() => {
    if (!editor?.selection) return false;
    try {
      return Array.from(
        editor.api.nodes({ match: (n: any) => n.type === KEYS.link }) ?? []
      ).length > 0;
    } catch { return false; }
  }, [editor]);

  const currentBlockLabel = (): string => {
    if (isBlockActive("h1")) return "Heading 1";
    if (isBlockActive("h2")) return "Heading 2";
    if (isBlockActive("h3")) return "Heading 3";
    if (isBlockActive("blockquote")) return "Quote";
    return "Normal text";
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="sticky top-0 z-40 bg-content1 border-b border-border shadow-sm">
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
                <DropdownMenu modal={false}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          data-plate-focus="true"
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
                  <DropdownMenuContent
                    align="start"
                    className="w-40"
                    onCloseAutoFocus={(event) => {
                      event.preventDefault();
                      refocusEditor();
                    }}
                    data-plate-focus="true"
                  >
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        toggleBlock("p");
                        refocusEditor();
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      data-plate-focus="true"
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
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        toggleBlock("h1");
                        refocusEditor();
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      data-plate-focus="true"
                    >
                      <span className="text-xl font-bold leading-tight">Heading 1</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        toggleBlock("h2");
                        refocusEditor();
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      data-plate-focus="true"
                    >
                      <span className="text-lg font-semibold leading-tight">Heading 2</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        toggleBlock("h3");
                        refocusEditor();
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      data-plate-focus="true"
                    >
                      <span className="text-base font-medium leading-tight">Heading 3</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        toggleBlock("blockquote");
                        refocusEditor();
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      data-plate-focus="true"
                    >
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
                      <KbdKey>Ctrl+U</KbdKey>
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
                <DropdownMenu modal={false}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          data-plate-focus="true"
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
                  <DropdownMenuContent
                    align="start"
                    className="w-44"
                    onCloseAutoFocus={(event) => {
                      event.preventDefault();
                      refocusEditor();
                    }}
                    data-plate-focus="true"
                  >
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        toggleBlock("ul");
                        refocusEditor();
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      data-plate-focus="true"
                    >
                      <List className="w-4 h-4 mr-2 shrink-0" />
                      Bulleted list
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        toggleBlock("ol");
                        refocusEditor();
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      data-plate-focus="true"
                    >
                      <ListOrdered className="w-4 h-4 mr-2 shrink-0" />
                      Numbered list
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Separator />

                {/* Insert image */}
                <ToolbarBtn
                  icon={<ImagePlus className="w-4 h-4" />}
                  label="Insert image"
                  onClick={onInsertImage}
                />

                <Separator />

                {/* Insert link */}
                <div className="relative">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        ref={linkBtnRef}
                        type="button"
                        aria-label="Insert link"
                        aria-pressed={linkPopoverOpen}
                        data-plate-focus="true"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          openLinkPopover();
                        }}
                        className={cn(
                          "inline-flex items-center justify-center w-8 h-8 rounded transition-colors",
                          "text-foreground/70 hover:text-foreground hover:bg-accent",
                          (linkPopoverOpen || isLinkActive) && "bg-accent text-foreground",
                        )}
                      >
                        <Link className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="flex items-center gap-1.5 text-xs">
                      Insert link
                      <KbdKey>Ctrl+K</KbdKey>
                    </TooltipContent>
                  </Tooltip>
                </div>
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

      {/* Link popover — rendered outside overflow container as a fixed portal */}
      {linkPopoverOpen && popoverPos && (
        <div
          ref={popoverRef}
          className="fixed z-[9999]"
          style={{ top: popoverPos.top, left: popoverPos.left }}
        >
          <LinkInsertPopover
            editor={editor}
            savedSelection={savedSelectionRef.current}
            onClose={() => setLinkPopoverOpen(false)}
          />
        </div>
      )}
    </TooltipProvider>
  );
}
