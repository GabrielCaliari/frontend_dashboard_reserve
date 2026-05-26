"use client";

import { useState } from "react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { AlertCircle, Plus, Plug } from "lucide-react";
import { Card, CardBody, Spinner, Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useHasSelectedTenant } from "@/src/common/stores/tenant-store";
import usePermissions from "@/src/common/hooks/use-permissions";
import {
  useStatsIntegrations,
  useStatsProviders,
  useCreateStatsIntegration,
  useUpdateStatsIntegration,
  useDeleteStatsIntegration,
} from "@/src/common/hooks/stats";
import {
  IntegrationListItem,
  AddIntegrationModal,
  EditIntegrationModal,
  DeleteIntegrationModal,
} from "@/src/components/stats";
import type {
  StatsIntegration,
  AvailableIntegration,
  CreateStatsIntegrationDto,
  UpdateStatsIntegrationDto,
} from "@/src/common/@types/@stats";

export default function IntegrationsPage() {
  const t = useTranslations("stats.integrations");
  const hasSelectedTenant = useHasSelectedTenant();
  const { isSuperAdmin, isOwner, isManager } = usePermissions();
  const canManage = isSuperAdmin || isOwner || isManager;

  const { data: integrations, isLoading } = useStatsIntegrations();
  const { data: providers } = useStatsProviders();

  const createMutation = useCreateStatsIntegration();
  const updateMutation = useUpdateStatsIntegration();
  const deleteMutation = useDeleteStatsIntegration();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StatsIntegration | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StatsIntegration | null>(
    null
  );

  const handleToggleActive = (id: string, active: boolean) => {
    updateMutation.mutate({ id, data: { active } });
  };

  const handleCreate = (data: CreateStatsIntegrationDto) => {
    createMutation.mutate(data);
  };

  const handleEdit = (id: string, data: UpdateStatsIntegrationDto) => {
    updateMutation.mutate({ id, data });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const getProviderForIntegration = (
    integration: StatsIntegration
  ): AvailableIntegration | null => {
    return providers?.find((p) => p.key === integration.key) ?? null;
  };

  if (!hasSelectedTenant) {
    return (
      <LayoutScopeRoot routeActive="stats-integrations">
        <div className="flex flex-col items-center justify-center py-16">
          <Card className="max-w-md border-warning/20 bg-warning/5">
            <CardBody className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-warning" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {t("noTenant")}
              </h3>
              <p className="text-muted-foreground">{t("selectTenant")}</p>
            </CardBody>
          </Card>
        </div>
      </LayoutScopeRoot>
    );
  }

  return (
    <LayoutScopeRoot routeActive="stats-integrations">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
          </div>
          {canManage && (
            <Button
              color="primary"
              size="sm"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => setAddOpen(true)}
            >
              {t("add")}
            </Button>
          )}
        </div>

        {/* Content */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {!isLoading && (!integrations || integrations.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16">
            <Plug className="h-12 w-12 text-gray-600 mb-3" />
            <p className="text-muted-foreground mb-4">{t("emptyState")}</p>
            {canManage && (
              <Button
                color="primary"
                variant="flat"
                size="sm"
                startContent={<Plus className="h-4 w-4" />}
                onPress={() => setAddOpen(true)}
              >
                {t("addFirst")}
              </Button>
            )}
          </div>
        )}

        {integrations && integrations.length > 0 && (
          <div className="space-y-3">
            {integrations.map((integration) => (
              <IntegrationListItem
                key={integration.id}
                integration={integration}
                canManage={canManage}
                onToggleActive={handleToggleActive}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <AddIntegrationModal
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
          providers={providers ?? []}
          onSubmit={handleCreate}
          isSubmitting={createMutation.isPending}
        />

        <EditIntegrationModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          integration={editTarget}
          provider={editTarget ? getProviderForIntegration(editTarget) : null}
          onSubmit={handleEdit}
          isSubmitting={updateMutation.isPending}
        />

        <DeleteIntegrationModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          integration={deleteTarget}
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
        />
      </div>
    </LayoutScopeRoot>
  );
}
