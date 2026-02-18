"use client";

import { useState } from "react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { LeadsTableV2 } from "@/src/components/tables/leads-table-v2";
import { Button } from "@nextui-org/react";
import { Plus, Database } from "lucide-react";
import { Lead } from "@/src/common/@types/@lead";
import { LeadDetailModal } from "@/src/components/email-builder/modals/lead-detail-modal";
import { CreateCollectionModal } from "@/src/components/email-builder/modals/create-collection-modal";
import { CollectionsTable } from "@/src/components/tables/collections-table";

export default function LeadsV2Page() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"leads" | "collections">("leads");

  return (
    <LayoutScopeRoot routeActive="leads">
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Lead Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your leads and collections
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              color={activeTab === "leads" ? "primary" : "default"}
              variant={activeTab === "leads" ? "solid" : "flat"}
              onPress={() => setActiveTab("leads")}
            >
              Leads
            </Button>
            <Button
              color={activeTab === "collections" ? "primary" : "default"}
              variant={activeTab === "collections" ? "solid" : "flat"}
              startContent={<Database className="w-4 h-4" />}
              onPress={() => setActiveTab("collections")}
            >
              Collections
            </Button>
            {activeTab === "collections" && (
              <Button
                color="primary"
                startContent={<Plus className="w-4 h-4" />}
                onPress={() => setShowCollectionModal(true)}
              >
                New Collection
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === "leads" ? (
            <LeadsTableV2 onViewLead={setSelectedLead} />
          ) : (
            <CollectionsTable />
          )}
        </div>
      </div>

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}

      <CreateCollectionModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
      />
    </LayoutScopeRoot>
  );
}
