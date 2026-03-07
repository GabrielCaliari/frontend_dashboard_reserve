"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Skeleton,
} from "@heroui/react";
import {
  ArrowLeft,
  Building2,
  Globe,
  Hash,
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  Power,
  Trash2,
  User,
  Mail,
  Shield,
} from "lucide-react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import {
  useTenantById,
  useUpdateTenant,
  useToggleTenantStatus,
  useDeleteTenant,
} from "@/src/common/hooks/access-management/useTenants";
import { AdminRole } from "@/src/common/@types/@access-management";
import { toast } from "react-hot-toast";

/**
 * TenantDetailPage Component
 *
 * Displays detailed information about a specific tenant including:
 * - Basic tenant information (id, name, slug, domain, status)
 * - Timestamps (created_at, updated_at)
 * - List of assigned admins with their roles
 *
 * Features:
 * - Loading skeleton during data fetch
 * - Error state with retry option
 * - Empty state when tenant has no assigned admins
 * - Back button to return to tenant list
 * - Responsive layout with NextUI components
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5
 */
export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  // Fetch tenant details with assigned admins
  const { data: tenant, isLoading, error } = useTenantById({ id: tenantId });

  /**
   * Navigate back to tenant list
   */
  const handleBack = () => {
    router.push("/dashboard/access-management/tenants");
  };

  /**
   * Format date string to readable format
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Get role color for chip display
   */
  const getRoleColor = (
    role: AdminRole,
  ): "primary" | "secondary" | "success" | "warning" | "danger" => {
    switch (role) {
      case AdminRole.super_admin:
        return "danger";
      case AdminRole.owner:
        return "warning";
      case AdminRole.manager:
        return "primary";
      case AdminRole.editor:
        return "secondary";
      case AdminRole.viewer:
        return "success";
      default:
        return "primary";
    }
  };

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading) {
    return (
      <LayoutScopeRoot routeActive="access-management">
        <div className="p-6">
          {/* Back Button Skeleton */}
          <Skeleton className="w-32 h-10 rounded-lg mb-6" />

          {/* Header Skeleton */}
          <div className="mb-6">
            <Skeleton className="w-64 h-8 rounded-lg mb-2" />
            <Skeleton className="w-96 h-5 rounded-lg" />
          </div>

          {/* Tenant Info Card Skeleton */}
          <Card className="mb-6">
            <CardHeader>
              <Skeleton className="w-48 h-6 rounded-lg" />
            </CardHeader>
            <CardBody className="space-y-4">
              <Skeleton className="w-full h-6 rounded-lg" />
              <Skeleton className="w-full h-6 rounded-lg" />
              <Skeleton className="w-full h-6 rounded-lg" />
              <Skeleton className="w-full h-6 rounded-lg" />
              <Skeleton className="w-full h-6 rounded-lg" />
              <Skeleton className="w-full h-6 rounded-lg" />
              <Skeleton className="w-full h-6 rounded-lg" />
            </CardBody>
          </Card>

          {/* Admins Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="w-48 h-6 rounded-lg" />
            </CardHeader>
            <CardBody>
              <Skeleton className="w-full h-20 rounded-lg" />
            </CardBody>
          </Card>
        </div>
      </LayoutScopeRoot>
    );
  }

  // ============================================================================
  // Error State
  // ============================================================================

  if (error) {
    return (
      <LayoutScopeRoot routeActive="access-management">
        <div className="p-6">
          <Button
            variant="light"
            startContent={<ArrowLeft className="w-4 h-4" />}
            onPress={handleBack}
            className="mb-6"
          >
            Back to Tenants
          </Button>

          <div className="bg-danger/10 border border-danger/20 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-danger mb-2">
              Error Loading Tenant
            </h2>
            <p className="text-danger-500 mb-4">
              {error.message || "Failed to load tenant data. Please try again."}
            </p>
            <Button
              color="danger"
              variant="flat"
              onPress={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  // ============================================================================
  // No Data State
  // ============================================================================

  if (!tenant) {
    return (
      <LayoutScopeRoot routeActive="access-management">
        <div className="p-6">
          <Button
            variant="light"
            startContent={<ArrowLeft className="w-4 h-4" />}
            onPress={handleBack}
            className="mb-6"
          >
            Back to Tenants
          </Button>

          <div className="bg-warning-500/10 border border-warning-500/20 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-warning-500 mb-2">
              Tenant Not Found
            </h2>
            <p className="text-warning-400 mb-4">
              The requested tenant could not be found.
            </p>
            <Button color="warning" variant="flat" onPress={handleBack}>
              Return to Tenant List
            </Button>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <LayoutScopeRoot routeActive="access-management">
      <div className="p-6">
        {/* Back Button */}
        <Button
          variant="light"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={handleBack}
          className="mb-6"
        >
          Back to Tenants
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Tenant Details
          </h1>
          <p className="text-muted-foreground">
            View detailed information about this tenant account
          </p>
        </div>

        {/* Tenant Information Card */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-semibold">Tenant Information</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* ID */}
            <div className="flex items-start gap-3">
              <div className="w-32 text-muted-foreground font-medium">ID:</div>
              <div className="flex-1 text-foreground">{tenant.id}</div>
            </div>

            {/* Name */}
            <div className="flex items-start gap-3">
              <div className="w-32 text-muted-foreground font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Name:
              </div>
              <div className="flex-1 text-foreground font-medium">
                {tenant.name}
              </div>
            </div>

            {/* Slug */}
            <div className="flex items-start gap-3">
              <div className="w-32 text-muted-foreground font-medium flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Slug:
              </div>
              <div className="flex-1 text-foreground font-mono">
                {tenant.slug}
              </div>
            </div>

            {/* Domain */}
            <div className="flex items-start gap-3">
              <div className="w-32 text-muted-foreground font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Domain:
              </div>
              <div className="flex-1 text-foreground">{tenant.domain}</div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <div className="w-32 text-muted-foreground font-medium">
                Status:
              </div>
              <div className="flex-1">
                <Chip
                  color={tenant.is_active ? "success" : "danger"}
                  variant="flat"
                  size="sm"
                  startContent={
                    tenant.is_active ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )
                  }
                >
                  {tenant.is_active ? "Active" : "Inactive"}
                </Chip>
              </div>
            </div>

            {/* Created At */}
            <div className="flex items-start gap-3">
              <div className="w-32 text-muted-foreground font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Created:
              </div>
              <div className="flex-1 text-foreground">
                {formatDate(tenant.created_at)}
              </div>
            </div>

            {/* Updated At */}
            <div className="flex items-start gap-3">
              <div className="w-32 text-muted-foreground font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Updated:
              </div>
              <div className="flex-1 text-foreground">
                {formatDate(tenant.updated_at)}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Assigned Admins Card */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Assigned Admins</h2>
          </CardHeader>
          <CardBody>
            {tenant.admins && tenant.admins.length > 0 ? (
              <div className="space-y-3">
                {tenant.admins.map((relationship) => (
                  <div
                    key={relationship.admin_id}
                    className="flex items-center justify-between p-4 bg-content2 rounded-lg border border-border"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {relationship.admin?.name || "Unknown Admin"}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        {relationship.admin?.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Chip
                        color={getRoleColor(relationship.role)}
                        variant="flat"
                        size="sm"
                        startContent={<Shield className="w-3 h-3" />}
                      >
                        {relationship.role.replace("_", " ").toUpperCase()}
                      </Chip>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-2">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No Assigned Admins</p>
                  <p className="text-sm mt-1">
                    This tenant has not been assigned any admins yet.
                  </p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </LayoutScopeRoot>
  );
}
