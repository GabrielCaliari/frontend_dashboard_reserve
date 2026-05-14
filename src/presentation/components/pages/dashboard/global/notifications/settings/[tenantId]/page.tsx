import { use } from "react";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import { TenantNotificationSettingsForm } from "@/src/presentation/components/organisms/notifications/tenant-notification-settings-form";

export default function TenantNotificationSettingsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);

  return (
    <LayoutScopeRoot routeActive="notifications-global">
      <div className="mx-auto max-w-2xl space-y-6 px-6 py-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Configurações de notificações
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie os canais e eventos de notificação deste tenant.
          </p>
        </div>
        <TenantNotificationSettingsForm tenantId={tenantId} isSuperAdmin />
      </div>
    </LayoutScopeRoot>
  );
}
