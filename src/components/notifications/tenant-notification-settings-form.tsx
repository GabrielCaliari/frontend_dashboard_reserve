'use client';
import { Card, CardBody, CardHeader, Switch, Skeleton, Chip } from '@heroui/react';
import { Bell, Mail, Zap, Clock } from 'lucide-react';
import { useNotificationSettings } from '@/src/common/hooks/notifications/use-notification-settings';
import toast from 'react-hot-toast';

const EVENT_KEYS: Array<{ key: string; label: string; description: string }> = [
  { key: 'lead.created', label: 'Novo lead', description: 'Notifica quando um novo lead é registrado' },
  { key: 'subscription.expiring', label: 'Assinatura vencendo', description: 'Notifica quando a assinatura está próxima do vencimento' },
  { key: 'subscription.expired', label: 'Assinatura expirada', description: 'Notifica quando a assinatura expira' },
];

const CRON_KEYS: Array<{ key: string; label: string; description: string }> = [
  { key: 'subscription.expiry_check', label: 'Verificação diária de vencimento', description: 'Job diário que alerta sobre assinaturas próximas do vencimento' },
  { key: 'subscription.expired_check', label: 'Verificação diária de expiradas', description: 'Job diário que alerta sobre assinaturas já expiradas' },
];

interface Props {
  tenantId: string;
  isSuperAdmin?: boolean;
}

export function TenantNotificationSettingsForm({ tenantId, isSuperAdmin }: Props) {
  const { settings, loading, updateSettings } = useNotificationSettings(tenantId, isSuperAdmin);

  const toggle = async (field: 'email_enabled' | 'inapp_enabled', value: boolean) => {
    try {
      await updateSettings({ [field]: value });
    } catch {
      toast.error('Erro ao salvar configuração.');
    }
  };

  const toggleEvent = async (key: string, value: boolean) => {
    try {
      await updateSettings({ event_settings: { ...(settings?.event_settings ?? {}), [key]: value } });
    } catch {
      toast.error('Erro ao salvar configuração.');
    }
  };

  const toggleCron = async (key: string, value: boolean) => {
    try {
      await updateSettings({ cron_settings: { ...(settings?.cron_settings ?? {}), [key]: value } });
    } catch {
      toast.error('Erro ao salvar configuração.');
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="w-full h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Canais de entrega */}
      <Card className="border border-border shadow-none">
        <CardHeader className="px-5 pt-5 pb-0 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Canais de entrega</h3>
        </CardHeader>
        <CardBody className="flex flex-col gap-3 px-5 pb-5">
          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">In-app</span>
                <span className="text-xs text-muted-foreground">Notificações dentro da plataforma</span>
              </div>
            </div>
            <Switch
              isSelected={settings.inapp_enabled}
              onValueChange={(v) => toggle('inapp_enabled', v)}
              size="sm"
              color="primary"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Email</span>
                <span className="text-xs text-muted-foreground">Notificações enviadas por email</span>
              </div>
            </div>
            <Switch
              isSelected={settings.email_enabled}
              onValueChange={(v) => toggle('email_enabled', v)}
              size="sm"
              color="primary"
            />
          </div>
        </CardBody>
      </Card>

      {/* Eventos do sistema */}
      <Card className="border border-border shadow-none">
        <CardHeader className="px-5 pt-5 pb-0 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Eventos do sistema</h3>
        </CardHeader>
        <CardBody className="flex flex-col gap-3 px-5 pb-5">
          {EVENT_KEYS.map(({ key, label, description }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{label}</span>
                  <Chip size="sm" variant="flat" color="default" className="h-4 text-[10px] px-1 font-mono">
                    {key}
                  </Chip>
                </div>
                <span className="text-xs text-muted-foreground">{description}</span>
              </div>
              <Switch
                isSelected={(settings.event_settings ?? {})[key] !== false}
                onValueChange={(v) => toggleEvent(key, v)}
                size="sm"
                color="primary"
              />
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Jobs agendados */}
      <Card className="border border-border shadow-none">
        <CardHeader className="px-5 pt-5 pb-0 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Jobs agendados (cron)</h3>
        </CardHeader>
        <CardBody className="flex flex-col gap-3 px-5 pb-5">
          {CRON_KEYS.map(({ key, label, description }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{label}</span>
                  <Chip size="sm" variant="flat" color="default" className="h-4 text-[10px] px-1 font-mono">
                    {key}
                  </Chip>
                </div>
                <span className="text-xs text-muted-foreground">{description}</span>
              </div>
              <Switch
                isSelected={(settings.cron_settings ?? {})[key] !== false}
                onValueChange={(v) => toggleCron(key, v)}
                size="sm"
                color="primary"
              />
            </div>
          ))}
        </CardBody>
      </Card>

      {settings.timezone && (
        <p className="text-xs text-muted-foreground px-1">
          Fuso horário do tenant: <span className="font-medium text-foreground">{settings.timezone}</span>
        </p>
      )}
    </div>
  );
}
