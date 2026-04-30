"use client";

import * as React from "react";
import { PlateElement, type PlateElementProps } from "platejs/react";
import { GripVertical } from "lucide-react";
import { cn } from "@/src/common/lib/utils";

function DragHandle() {
  return (
    <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
      <GripVertical className="w-4 h-4 text-muted-foreground/50" />
    </div>
  );
}

export function H1Element({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement {...props} className="relative group mt-8 mb-4 first:mt-0">
      <DragHandle />
      <h1 className="text-4xl font-bold text-foreground border-b border-border pb-3">
        {children}
      </h1>
    </PlateElement>
  );
}

export function H2Element({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement {...props} className="relative group mt-6 mb-3">
      <DragHandle />
      <h2 className="text-3xl font-semibold text-foreground">{children}</h2>
    </PlateElement>
  );
}

export function H3Element({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement {...props} className="relative group mt-5 mb-2">
      <DragHandle />
      <h3 className="text-2xl font-medium text-foreground/90">{children}</h3>
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

export function ListItemElement({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement {...props} asChild>
      <li className="text-muted-foreground leading-relaxed pl-2">{children}</li>
    </PlateElement>
  );
}
