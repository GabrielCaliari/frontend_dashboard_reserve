import CreateEmailCampaignButton from "@/src/presentation/components/organisms/email-builder/modals/actions/create-email-campaign-button";
import { CampaignsTable } from "@/src/presentation/components/organisms/tables/campaigns-table";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import { getTranslations } from "next-intl/server";

export default async function EmailCampaignPage() {
  const t = await getTranslations("dashboard");

  return (
    <LayoutScopeRoot routeActive="email-campaign">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6 text-foreground">
          {t("emailCampaignTitle")}
        </h1>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex justify-end mb-4">
            <CreateEmailCampaignButton />
          </div>
          <CampaignsTable />
        </div>
      </div>
    </LayoutScopeRoot>
  );
}
