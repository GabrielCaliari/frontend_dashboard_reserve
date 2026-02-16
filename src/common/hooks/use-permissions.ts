'use client'

import { getCookie } from 'cookies-next';
import { AdminRole } from '@/src/common/@types/@auth';

export default function usePermissions() {
    const role = getCookie('session-role') as AdminRole | undefined;

    const isSuperAdmin = role === AdminRole.super_admin;
    const isCompanyAdmin = role === AdminRole.company_admin;
    const isTenantAdmin = role === AdminRole.tenant_admin;

    const canManageAdmins = isSuperAdmin;
    const canManageTenants = isSuperAdmin;
    const canViewReports = isSuperAdmin || isCompanyAdmin;
    const canManageCampaigns = isSuperAdmin || isCompanyAdmin || isTenantAdmin;

    return {
        role,
        isSuperAdmin,
        isCompanyAdmin,
        isTenantAdmin,
        canManageAdmins,
        canManageTenants,
        canViewReports,
        canManageCampaigns,
    };
}
