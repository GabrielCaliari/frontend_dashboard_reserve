"use client";

import { useSyncExternalStore } from "react";
import { getCookie } from "cookies-next";
import { AdminRole } from "@/src/shared/domain/types/@access-management";

// Cookie nao emite evento de mudanca, entao a inscricao e um no-op. O que
// interessa aqui e o getServerSnapshot: ele garante que o render do servidor e o
// primeiro render do cliente concordem (sem papel), e o valor real do cookie
// entre no commit seguinte -- em vez de divergir na hidratacao.
const subscribe = () => () => {};
const getRole = () => getCookie("session-role") as AdminRole | undefined;
const getServerRole = () => undefined;

export default function usePermissions() {
  const role = useSyncExternalStore(subscribe, getRole, getServerRole);

  const isSuperAdmin = role === AdminRole.super_admin;
  const isOwner = role === AdminRole.owner;
  const isManager = role === AdminRole.manager;
  const isEditor = role === AdminRole.editor;
  const isViewer = role === AdminRole.viewer;

  const canManageAdmins = isSuperAdmin || isManager;
  const canManageTenants = isSuperAdmin;
  const canViewReports = isSuperAdmin || isOwner;
  const canManageCampaigns = isSuperAdmin || isOwner || isManager;
  const canEditContent = isSuperAdmin || isOwner || isManager || isEditor;
  const canViewContent =
    isSuperAdmin || isOwner || isManager || isEditor || isViewer;

  return {
    role,
    isSuperAdmin,
    isOwner,
    isManager,
    isEditor,
    isViewer,
    canManageAdmins,
    canManageTenants,
    canViewReports,
    canManageCampaigns,
    canEditContent,
    canViewContent,
  };
}
