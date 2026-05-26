import { ReactNode } from "react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";

interface CmsPageLayoutProps {
  children: ReactNode;
  routeActive: string;
}

export function CmsPageLayout({ children, routeActive }: CmsPageLayoutProps) {
  return (
    <LayoutScopeRoot routeActive={routeActive}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto animate-fade-in w-full">
        {children}
      </div>
    </LayoutScopeRoot>
  );
}
