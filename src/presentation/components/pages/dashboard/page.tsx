"use client";

import usePermissions from "@/src/shared/hooks/use-permissions";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import { ManagerHome } from "@/src/presentation/components/organisms/home/manager-home";
import AdminDashboard from "./admin-dashboard";

export default function DashboardPage() {
  const { isManager } = usePermissions();
  if (isManager) {
    return (
      <LayoutScopeRoot>
        <ManagerHome />
      </LayoutScopeRoot>
    );
  }
  return <AdminDashboard />;
}
