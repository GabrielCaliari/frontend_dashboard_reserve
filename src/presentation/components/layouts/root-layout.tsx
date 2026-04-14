"use client";

import React from "react";

interface RootLayoutProps {
  children: React.ReactNode;
  routeActive?: string; // mantido para não quebrar as páginas existentes, não é mais usado
}

export function LayoutScopeRoot({ children }: RootLayoutProps) {
  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar">
      <main className="mt-6 mx-auto pb-10">{children}</main>
    </div>
  );
}

export function LayoutScopeEditor({ children }: RootLayoutProps) {
  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col">
      {children}
    </div>
  );
}
