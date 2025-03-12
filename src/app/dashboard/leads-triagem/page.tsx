'use client'

import { listLeadQualification } from "@/src/common/actions/list-lead-qualification";
import KanbanBoardWithAutosave, { CardType } from "@/src/components/kanban/kanban-board-with-autosave";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { useEffect, useState } from "react";

export default function Page() {
    return (
        <LayoutScopeRoot routeActive="lead-qualification">
            <h1 className="text-2xl font-bold">Leads da triagem</h1>
            <KanbanBoardWithAutosave />
        </LayoutScopeRoot>
    )
}   