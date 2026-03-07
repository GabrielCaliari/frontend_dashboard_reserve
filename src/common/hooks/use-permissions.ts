'use client'

import { getCookie } from 'cookies-next';
import { AdminRole } from '@/src/common/@types/@access-management';

export default function usePermissions() {
    const role = getCookie('session-role') as AdminRole | undefined;

    const isSuperAdmin = role === AdminRole.super_admin;
    const isOwner      = role === AdminRole.owner;
    const isManager    = role === AdminRole.manager;
    const isEditor     = role === AdminRole.editor;
    const isViewer     = role === AdminRole.viewer;

    const canManageAdmins    = isSuperAdmin;
    const canManageTenants   = isSuperAdmin;
    const canViewReports     = isSuperAdmin || isOwner;
    const canManageCampaigns = isSuperAdmin || isOwner || isManager;
    const canEditContent     = isSuperAdmin || isOwner || isManager || isEditor;
    const canViewContent     = isSuperAdmin || isOwner || isManager || isEditor || isViewer;

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
