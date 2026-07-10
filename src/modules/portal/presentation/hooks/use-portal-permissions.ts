"use client";

import { ClientRole } from "@/src/modules/portal/domain/portal-auth";
import { readPortalProfile } from "@/src/modules/portal/presentation/hooks/use-portal-auth";

export function usePortalPermissions() {
  const profile = readPortalProfile();
  const role = profile?.role ?? null;

  const isOwner = role === ClientRole.owner;
  const isManager = role === ClientRole.manager;
  const isFuncionary = role === ClientRole.funcionary;

  return {
    role,
    isOwner,
    isManager,
    isFuncionary,
    // master doc §5.5: proposing data changes is a decision-maker action; funcionary can view but not propose
    canProposeBotConfigChange: isOwner || isManager,
    canMoveFunnelStage: isOwner || isManager,
  };
}
