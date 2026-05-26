'use client';
import { useNotificationSettings } from '@/src/common/hooks/notifications/use-notification-settings';

const EVENT_KEYS = ['lead.created', 'subscription.expiring', 'subscription.expired'];
const CRON_KEYS_LIST = ['subscription.expiry_check', 'subscription.expired_check'];

interface Props {
  tenantId: string;
  isSuperAdmin?: boolean;
}

export function TenantNotificationSettingsForm({ tenantId, isSuperAdmin }: Props) {
  const { settings, loading, updateSettings } = useNotificationSettings(tenantId, isSuperAdmin);

  if (loading || !settings) return <div className="p-6 text-sm text-gray-500">Carregando...</div>;

  const toggle = (field: 'email_enabled' | 'inapp_enabled', value: boolean) =>
    updateSettings({ [field]: value });

  const toggleEvent = (key: string, value: boolean) =>
    updateSettings({ event_settings: { ...(settings.event_settings ?? {}), [key]: value } });

  const toggleCron = (key: string, value: boolean) =>
    updateSettings({ cron_settings: { ...(settings.cron_settings ?? {}), [key]: value } });

  return (
    <div className="flex max-w-xl flex-col gap-6 p-6">
      <h2 className="text-lg font-semibold">Configurações de notificações</h2>
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Canais globais</h3>
        {(['email_enabled', 'inapp_enabled'] as const).map((field) => (
          <label key={field} className="flex items-center justify-between rounded border px-4 py-3 text-sm">
            {field === 'email_enabled' ? 'Email' : 'In-app'}
            <input
              type="checkbox"
              checked={settings[field]}
              onChange={(e) => toggle(field, e.target.checked)}
            />
          </label>
        ))}
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Eventos do sistema</h3>
        {EVENT_KEYS.map((key) => (
          <label key={key} className="flex items-center justify-between rounded border px-4 py-3 text-sm">
            {key}
            <input
              type="checkbox"
              checked={(settings.event_settings ?? {})[key] !== false}
              onChange={(e) => toggleEvent(key, e.target.checked)}
            />
          </label>
        ))}
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Jobs agendados (cron)</h3>
        {CRON_KEYS_LIST.map((key) => (
          <label key={key} className="flex items-center justify-between rounded border px-4 py-3 text-sm">
            {key}
            <input
              type="checkbox"
              checked={(settings.cron_settings ?? {})[key] !== false}
              onChange={(e) => toggleCron(key, e.target.checked)}
            />
          </label>
        ))}
      </section>
    </div>
  );
}
