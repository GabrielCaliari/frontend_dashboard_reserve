import CreateEmailCampaignButton from "@/src/components/email-builder/modals/actions/create-email-campaign-button";
import { CampaignsTable } from "@/src/components/tables/campaigns-table";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { getTranslations } from "next-intl/server";

export default async function EmailCampaignPage() {
  const t = await getTranslations("dashboard");

  return (
    <LayoutScopeRoot routeActive="email-campaign">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-100">
          {t("emailCampaignTitle")}
        </h1>
        <div className="bg-[#12121f] rounded-lg shadow-lg border border-gray-800 p-6">
          <div className="flex justify-end mb-4">
            <CreateEmailCampaignButton />
          </div>
          <CampaignsTable />
        </div>
      </div>
    </LayoutScopeRoot>
  );
}
