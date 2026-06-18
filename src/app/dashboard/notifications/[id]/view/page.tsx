import { NotificationView } from "@/src/presentation/components/organisms/notifications/notification-view";

export default async function NotificationViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NotificationView id={id} />;
}
