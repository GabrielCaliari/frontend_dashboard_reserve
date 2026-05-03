"use client";

import * as React from "react";
import { PlateElement, type PlateElementProps, useEditorRef } from "platejs/react";
import { KEYS } from "platejs";
import { upsertLink, unwrapLink } from "@platejs/link";
import { ExternalLink, GripVertical, Link2Off, Pencil } from "lucide-react";
import { cn } from "@/src/common/lib/utils";

// ---------------------------------------------------------------------------
// LinkElement — Trello-like floating card on click
// ---------------------------------------------------------------------------
export function LinkElement(props: PlateElementProps) {
  const { children, element } = props;
  const href = (element as any)?.url ?? "";
  const isExternal = href.startsWith("http");

  const [showCard, setShowCard] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editUrl, setEditUrl] = React.useState(href);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const editor = useEditorRef();

  // Keep editUrl in sync if the stored href changes externally
  React.useEffect(() => { setEditUrl(href); }, [href]);

  // Close card on outside click (delayed to avoid closing on the same click)
  React.useEffect(() => {
    if (!showCard) return;
    const timer = setTimeout(() => {
      const handler = (e: MouseEvent) => {
        if (!cardRef.current?.contains(e.target as Node)) {
          setShowCard(false);
          setIsEditing(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, 50);
    return () => clearTimeout(timer);
  }, [showCard]);

  const handleUnlink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    unwrapLink(editor);
    setShowCard(false);
  };

  const handleApplyEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUrl.trim()) return;
    const normalized = editUrl.trim().startsWith("http")
      ? editUrl.trim()
      : `https://${editUrl.trim()}`;
    upsertLink(editor, { url: normalized, skipValidation: true });
    setIsEditing(false);
    setShowCard(false);
  };

  return (
    <PlateElement {...props} as="span" className="relative inline">
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className={cn(
          "cursor-pointer text-primary underline underline-offset-4",
          "hover:text-primary/80 transition-colors",
        )}
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          setShowCard((v) => !v);
          setIsEditing(false);
          setEditUrl(href);
        }}
      >
        {children}
      </a>

      {/* contentEditable=false keeps Slate from treating this as editor content */}
      <span
        contentEditable={false}
        style={{ userSelect: "none" }}
        className="absolute left-0 top-full mt-1.5 z-50"
      >
        {showCard && (
          <div
            ref={cardRef}
            className={cn(
              "flex flex-col gap-2 p-3 w-72 rounded-lg shadow-lg text-sm",
              "bg-popover border border-border",
            )}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {isEditing ? (
              /* ---- Edit mode ---- */
              <form onSubmit={handleApplyEdit} className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5" />
                  Edit link
                </p>
                <input
                  autoFocus
                  type="text"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://example.com"
                  className={cn(
                    "h-8 px-2.5 text-sm rounded-md",
                    "border border-border bg-background text-foreground",
                    "placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/40",
                  )}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 h-8 px-3 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="h-8 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              /* ---- Preview mode ---- */
              <>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors min-w-0"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{href}</span>
                </a>

                <div className="flex gap-2 pt-1.5 border-t border-border">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditing(true); }}
                    className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium text-foreground hover:bg-accent border border-border transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleUnlink}
                    className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 border border-destructive/30 transition-colors"
                  >
                    <Link2Off className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </span>
    </PlateElement>
  );
}

function DragHandle() {
  return (
    <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
      <GripVertical className="w-4 h-4 text-muted-foreground/50" />
    </div>
  );
}

export function H1Element({ children, ...props }: PlateElementProps) {
  const element = props.element as any;
  return (
    <PlateElement {...props} className="relative group mt-8 mb-4 first:mt-0">
      <DragHandle />
      <h1
        id={element?.id}
        className="text-4xl font-bold text-foreground border-b border-border pb-3 scroll-mt-24"
      >
        {children}
      </h1>
    </PlateElement>
  );
}

export function ParagraphElement({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement {...props} className="relative group my-4">
      <p className="text-base text-foreground leading-relaxed">{children}</p>
    </PlateElement>
  );
}

export function H2Element({ children, ...props }: PlateElementProps) {
  const element = props.element as any;
  return (
    <PlateElement {...props} className="relative group mt-6 mb-3">
      <DragHandle />
      <h2 id={element?.id} className="text-3xl font-semibold text-foreground scroll-mt-24">
        {children}
      </h2>
    </PlateElement>
  );
}

export function H3Element({ children, ...props }: PlateElementProps) {
  const element = props.element as any;
  return (
    <PlateElement {...props} className="relative group mt-5 mb-2">
      <DragHandle />
      <h3 id={element?.id} className="text-2xl font-medium text-foreground/90 scroll-mt-24">
        {children}
      </h3>
    </PlateElement>
  );
}

export function BlockquoteElement({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      className="relative group my-4 border-l-4 border-border pl-6 py-2 italic text-muted-foreground bg-muted/30"
    >
      <DragHandle />
      {children}
    </PlateElement>
  );
}

export function ImageElement({ children, ...props }: PlateElementProps) {
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
          <p className="px-4 py-2 bg-muted/50 text-sm text-muted-foreground">
            {element.alt}
          </p>
        )}
      </div>
      {children}
    </PlateElement>
  );
}

export function ListElement({ children, ...props }: PlateElementProps) {
  const element = props.element as any;
  const Tag = element.type === "ol" ? "ol" : "ul";
  return (
    <PlateElement
      {...props}
      as={Tag}
      className={cn(
        "my-4 space-y-1 pl-6",
        element.type === "ol" ? "list-decimal list-outside" : "list-disc list-outside",
      )}
    >
      {children}
    </PlateElement>
  );
}

export function ListItemElement({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement {...props} as="li" className="text-muted-foreground leading-relaxed [&>*]:my-0">
      {children}
    </PlateElement>
  );
}

export function ListItemContentElement({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement {...props} as="div" className="m-0">
      {children}
    </PlateElement>
  );
}
