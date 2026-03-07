"use client";

import { Plug, Pencil, Trash2 } from "lucide-react";
import { Button } from "@nextui-org/react";
import { Switch } from "@/src/components/ui/switch";
import type { StatsIntegration } from "@/src/common/@types/@stats";
import { useTranslations } from "next-intl";

interface IntegrationListItemProps {
  integration: StatsIntegration;
  canManage: boolean;
  onToggleActive: (id: string, active: boolean) => void;
  onEdit: (integration: StatsIntegration) => void;
  onDelete: (integration: StatsIntegration) => void;
}

export function IntegrationListItem({
  integration,
  canManage,
  onToggleActive,
  onEdit,
  onDelete,
}: IntegrationListItemProps) {
  const t = useTranslations("stats.integrations");

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-800 bg-[#16162a] p-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Plug className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-100 truncate">
            {integration.label}
          </p>
          <p className="text-xs text-gray-400">{integration.key}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <Switch
          checked={integration.active}
          onCheckedChange={(checked) => {
            if (canManage) onToggleActive(integration.id, checked);
          }}
        />
        <span
          className={`text-xs font-medium ${
            integration.active ? "text-emerald-400" : "text-gray-500"
          }`}
        >
          {integration.active ? t("active") : t("inactive")}
        </span>

        {canManage && (
          <>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => onEdit(integration)}
              aria-label={t("edit")}
            >
              <Pencil className="h-4 w-4 text-gray-400" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onPress={() => onDelete(integration)}
              aria-label={t("delete")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
