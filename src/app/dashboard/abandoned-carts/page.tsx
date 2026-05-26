import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { AbandonedCartsTable } from "@/src/components/tables/abandoned-carts-table";
import { getTranslations } from "next-intl/server";

export default async function AbandonedCartsPage() {
    const t = await getTranslations("dashboard");

    return (
        <LayoutScopeRoot routeActive="abandoned-carts">
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-6 text-foreground">{t("abandonedCartsTitle")}</h1>
                <div className="bg-card rounded-lg shadow-lg border border-border p-6">
                    <AbandonedCartsTable />
                </div>
            </div>
        </LayoutScopeRoot>
    );
} 