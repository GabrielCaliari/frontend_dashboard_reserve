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
      <div className="inline-flex h-screen w-screen bg-[#0a0a0f] overflow-hidden">
        <Sidebar
          activeTab={routeActive}
          disabledTabs={[]}
          mobileStyle="footer"
        />

        <div className="flex-1 h-full overflow-y-auto lg:p-12 p-4 pt-0 bg-[#0a0a0f] custom-scrollbar">
          <main className="mt-6 lg:mt-12 max-w-7xl mx-auto">{children}</main>
        </div>
      </div>
    </>
  );
}
