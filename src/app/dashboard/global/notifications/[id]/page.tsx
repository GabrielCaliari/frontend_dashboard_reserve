'use client';
import { use, useEffect, useState } from 'react';
import { NotificationForm } from '@/src/components/notifications/notification-form';
import { apiClient } from '@/src/common/config/api';

export default function EditNotificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    apiClient.get(`/api/notifications/${id}`).then((r) => setNotification(r.data));
  }, [id]);

  if (!notification) return <div className="p-6 text-sm text-gray-500">Carregando...</div>;
  return <NotificationForm initial={notification} id={id} />;
}
