"use client";

import React from "react";

import { Sidebar } from "../components/ui/aside";

interface RootLayoutProps {
  children: React.ReactNode;
  routeActive: string;
}

export function LayoutScopeRoot({ children, routeActive }: RootLayoutProps) {
  return (
    <>
      <div className="inline-flex h-screen w-screen overflow-hidden">
        <Sidebar
          activeTab={routeActive}
          disabledTabs={[]}
          mobileStyle="footer"
        />

        <div className="flex-1 h-full overflow-y-auto custom-scrollbar">
          <main className="mt-6 mx-auto">{children}</main>
        </div>
      </div>
    </>
  );
}

/**
 * Full-height layout variant for immersive editor pages.
 * Does not add top margin or page-level scrolling — inner panels handle their own overflow.
 */
export function LayoutScopeEditor({ children, routeActive }: RootLayoutProps) {
  return (
    <div className="inline-flex h-screen w-screen overflow-hidden">
      <Sidebar
        activeTab={routeActive}
        disabledTabs={[]}
        mobileStyle="footer"
      />
      <div className="flex-1 h-full overflow-hidden">{children}</div>
    </div>
  );
}
