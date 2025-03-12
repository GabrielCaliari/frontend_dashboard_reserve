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
      <div className="inline-flex h-screen w-screen">
        <Sidebar activeTab={routeActive} />

        <div
          className="flex-1 overflow-y-auto lg:p-12 p-5 pt-0"
          style={{ paddingBottom: "150px" }}
        >
          <main className="mt-12">{children}</main>
        </div>
      </div>
    </>
  );
}
