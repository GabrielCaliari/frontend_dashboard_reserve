"use client";

import dynamic from "next/dynamic";
import { TenantCapabilitiesProvider } from "@/src/modules/settings/presentation/hooks/tenant-capabilities-provider";

const Sidebar = dynamic(
  () =>
    import("@/src/presentation/components/atoms/reserve/aside").then((m) => ({ default: m.Sidebar })),
  { ssr: false },
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TenantCapabilitiesProvider>
      <div className="inline-flex h-[calc(100svh-var(--header-height))] w-screen overflow-hidden">
        <Sidebar disabledTabs={[]} mobileStyle="footer" />
        {children}
      </div>
    </TenantCapabilitiesProvider>
  );
}
