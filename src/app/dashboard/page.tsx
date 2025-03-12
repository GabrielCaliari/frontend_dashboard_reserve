import { LayoutScopeRoot } from "@/src/layout/root-layout";

export default function Page() {
    return (
        <>
            <LayoutScopeRoot routeActive="dashboard">
                <h1 className="text-2xl font-bold">Dashboard</h1>
            </LayoutScopeRoot>
        </>
    )
}