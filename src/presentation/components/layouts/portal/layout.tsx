"use client";

import { usePathname } from "next/navigation";
import { PortalNav } from "@/src/presentation/components/organisms/portal/nav";
import { FirstAccessTour } from "@/src/presentation/components/organisms/portal/first-access-tour";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginRoute = pathname === "/portal/login";
  // §3.8 printable route: chrome-free so the backend's future PDF
  // screenshotter (Puppeteer/Playwright) captures only block content — the
  // route still sits under /portal/** so src/proxy.ts's auth guard applies.
  const isPrintRoute = pathname?.startsWith("/portal/print");

  if (isLoginRoute || isPrintRoute) return <>{children}</>;

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <PortalNav />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
      <FirstAccessTour />
    </div>
  );
}
