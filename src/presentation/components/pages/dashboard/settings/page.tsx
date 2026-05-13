"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import { Settings } from "lucide-react";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import { Breadcrumbs } from "@/src/presentation/components/organisms/access-management/shared/breadcrumbs";

export default function SettingsPage() {
  return (
    <LayoutScopeRoot routeActive="settings">
      <div className="p-6 max-w-3xl">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Settings" },
          ]}
        />

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground text-sm">
              Manage your account and workspace settings
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">General</h2>
          </CardHeader>
          <CardBody>
            <p className="text-muted-foreground text-sm">
              Settings will be available here.
            </p>
          </CardBody>
        </Card>
      </div>
    </LayoutScopeRoot>
  );
}
