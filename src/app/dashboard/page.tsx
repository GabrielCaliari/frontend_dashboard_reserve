import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { getTranslations } from "next-intl/server";

export default async function Page() {
    const t = await getTranslations("dashboard");

    return (
        <>
            <LayoutScopeRoot routeActive="dashboard">
                <h1 className="text-2xl font-bold text-gray-100">{t("title")}</h1>
            </LayoutScopeRoot>
        </>
    )
}