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
          <main className="mt-6 mx-auto pb-10">{children}</main>
        </div>
      </div>
    </>
  );
}

export function LayoutScopeEditor({ children, routeActive }: RootLayoutProps) {
  return (
    <div className="inline-flex h-screen w-screen overflow-hidden">
      <Sidebar
        activeTab={routeActive}
        disabledTabs={[]}
        mobileStyle="footer"
      />
      <div className="flex-1 h-full overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
