"use client";

import dynamic from "next/dynamic";

const Sidebar = dynamic(
  () =>
    import("@/src/components/ui/aside").then((m) => ({ default: m.Sidebar })),
  { ssr: false },
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="inline-flex h-[calc(100svh-60px)] w-screen overflow-hidden">
      <Sidebar disabledTabs={[]} mobileStyle="footer" />
      {children}
    </div>
  );
}
