"use client";
import { use, useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { NotificationForm } from "@/src/presentation/components/organisms/notifications/notification-form";
import { apiClient } from "@/src/infraestructure/axios/api";
import { CmsPageLayout } from "@/src/presentation/components/organisms/cms/shared/cms-page-layout";

export default function EditNotificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    apiClient.get(`/notifications/${id}`).then((r) => setNotification(r.data));
  }, [id]);

  if (!notification) {
    return (
      <CmsPageLayout routeActive="notifications-global">
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </CmsPageLayout>
    );
  }

  return <NotificationForm initial={notification} id={id} />;
}
