"use client";

import * as React from "react";

/**
 * KbdKey — keyboard shortcut badge.
 * Always renders with a light theme so it remains legible
 * regardless of the application color scheme (light / dark).
 */
export function KbdKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1 py-0.5 rounded bg-white text-foreground border border-border font-mono text-[10px] leading-none">
      {children}
    </kbd>
  );
}
