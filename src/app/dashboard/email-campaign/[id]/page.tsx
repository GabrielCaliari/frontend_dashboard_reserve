import EmailCampaignPage from "@/src/presentation/components/pages/dashboard/email-campaign/[id]/page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EmailCampaignPage id={id} />;
}
