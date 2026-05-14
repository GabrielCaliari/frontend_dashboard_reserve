"use client";

import KanbanBoardWithAutosave, {
  CardType,
} from "@/src/presentation/components/organisms/kanban/kanban-board-with-autosave";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import { useTranslations } from "next-intl";

export default function Page() {
  const t = useTranslations("dashboard");

  return (
    <LayoutScopeRoot routeActive="lead-qualification">
      <h1 className="text-2xl font-bold text-foreground">
        {t("leadsScreeningTitle")}
      </h1>
      <KanbanBoardWithAutosave />
    </LayoutScopeRoot>
  );
}
