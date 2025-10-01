import CreateEmailCampaignButton from "@/src/components/modals/actions/create-email-campaign-button";
import { CampaignsTable } from "@/src/components/tables/campaigns-table";
import { LayoutScopeRoot } from "@/src/layout/root-layout";

export default function EmailCampaignPage() {

    return (
        <LayoutScopeRoot routeActive="email-campaign">
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-6">Campanhas de Email Marketing</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-end mb-4">
                        <CreateEmailCampaignButton />
                    </div>
                    <CampaignsTable />
                </div>
            </div>
        </LayoutScopeRoot>
    );
}
