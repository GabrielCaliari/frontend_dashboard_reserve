import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { AbandonedCartsTable } from "@/src/components/tables/abandoned-carts-table";

export default function AbandonedCartsPage() {
    return (
        <LayoutScopeRoot routeActive="abandoned-carts">
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-6">Carrinhos Abandonados</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <AbandonedCartsTable />
                </div>
            </div>
        </LayoutScopeRoot>
    );
} 