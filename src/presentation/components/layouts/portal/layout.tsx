"use client";

import { usePathname } from "next/navigation";
import { PortalNav } from "@/src/presentation/components/organisms/portal/nav";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginRoute = pathname === "/portal/login";

  if (isLoginRoute) return <>{children}</>;

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <PortalNav />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
    </div>
  );
}
