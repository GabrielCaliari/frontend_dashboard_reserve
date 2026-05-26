import { use } from 'react';
import { TenantNotificationSettingsForm } from '@/src/components/notifications/tenant-notification-settings-form';

export default function TenantNotificationSettingsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);
  return <TenantNotificationSettingsForm tenantId={tenantId} isSuperAdmin />;
}
