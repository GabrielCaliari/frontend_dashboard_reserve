import { Sidebar } from "@/src/components/ui/aside";

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
