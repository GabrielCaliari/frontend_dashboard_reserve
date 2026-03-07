"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button, Card, CardBody, CardHeader, Chip, Skeleton,
} from "@nextui-org/react";
import {
  ArrowLeft, Edit, Power, Trash2, Calendar, Mail, User, Shield, CheckCircle, XCircle,
} from "lucide-react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { AdminFormModal } from "@/src/components/access-management/admins/AdminFormModal";
import { ConfirmationDialog } from "@/src/components/access-management/shared/confirmation-dialog";
import { Breadcrumbs } from "@/src/components/access-management/shared/breadcrumbs";
import { RoleBadge } from "@/src/components/access-management/shared/role-badge";
import { EntityAvatar } from "@/src/components/access-management/shared/entity-avatar";
import {
  useAdminById, useUpdateAdmin, useUpdateAdminRole, useToggleAdminStatus, useDeleteAdmin,
} from "@/src/common/hooks/access-management/useAdmins";
import { useCurrentAdmin } from "@/src/common/hooks/use-current-admin";
import type { UpdateAdminDto, AdminRole } from "@/src/common/@types/@access-management";
import type { UpdateAdminFormData } from "@/src/common/schemas/access-management/admin-schema";
import { formatDate } from "@/src/lib/utils";
import { toast } from "react-hot-toast";

export default function AdminDetailPage() {
  const params       = useParams();
  const router       = useRouter();
  const adminId      = params.id as string;
  const currentAdmin = useCurrentAdmin();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog]     = useState<{
    isOpen: boolean; title: string; message: string;
    variant: "danger" | "warning" | "default"; onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", variant: "default", onConfirm: () => {} });

  const { data: admin, isLoading, error } = useAdminById({ id: adminId });
  const updateAdminMutation  = useUpdateAdmin();
  const updateRoleMutation   = useUpdateAdminRole();
  const toggleStatusMutation = useToggleAdminStatus();
  const deleteAdminMutation  = useDeleteAdmin();

  const handleBack = () => router.push("/dashboard/access-management/admins");

  const handleEditSubmit = async (formData: UpdateAdminFormData) => {
    if (!admin) return;
    try {
      const { role, ...rest } = formData;
      if (Object.values(rest).some(Boolean)) {
        await updateAdminMutation.mutateAsync({ id: admin.id, data: rest });
      }
      if (role && role !== admin.role) {
        await updateRoleMutation.mutateAsync({ id: admin.id, role: role as AdminRole });
      }
      setIsEditModalOpen(false);
    } catch {}
  };

  const handleToggleStatus = () => {
    if (!admin) return;
    if (admin.id === currentAdmin.id && admin.is_active) {
      toast.error("You cannot deactivate your own account");
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: admin.is_active ? "Deactivate Admin" : "Activate Admin",
      message: admin.is_active
        ? "This admin will lose access to the system."
        : "This admin will regain access to the system.",
      variant: admin.is_active ? "warning" : "default",
      onConfirm: async () => {
        try {
          await toggleStatusMutation.mutateAsync({ id: admin.id, isActive: admin.is_active });
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch {}
      },
    });
  };

  const handleDeleteClick = () => {
    if (!admin) return;
    if (admin.id === currentAdmin.id) {
      toast.error("You cannot delete your own account");
      return;
    }
    setConfirmDialog({
      isOpen: true, title: "Delete Admin",
      message: "This action cannot be undone.",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteAdminMutation.mutateAsync(admin.id);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          router.push("/dashboard/access-management/admins");
        } catch {}
      },
    });
  };

  if (isLoading) {
    return (
      <LayoutScopeRoot routeActive="admins">
        <div className="p-6">
          <Skeleton className="w-32 h-10 rounded-lg mb-6" />
          <div className="mb-6"><Skeleton className="w-64 h-8 rounded-lg mb-2" /><Skeleton className="w-96 h-5 rounded-lg" /></div>
          <Card className="mb-6"><CardBody className="space-y-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="w-full h-6 rounded-lg" />)}</CardBody></Card>
        </div>
      </LayoutScopeRoot>
    );
  }

  if (error || !admin) {
    return (
      <LayoutScopeRoot routeActive="admins">
        <div className="p-6">
          <Button variant="light" startContent={<ArrowLeft className="w-4 h-4" />} onPress={handleBack} className="mb-6">Back to Admins</Button>
          <div className="bg-danger/10 border border-danger/20 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-danger mb-2">{error ? "Error Loading Admin" : "Admin Not Found"}</h2>
            <p className="text-danger-500 mb-4">{error?.message || "The requested admin could not be found."}</p>
            <Button color="danger" variant="flat" onPress={error ? () => window.location.reload() : handleBack}>
              {error ? "Retry" : "Return to List"}
            </Button>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  const isSelf = admin.id === currentAdmin.id;

  return (
    <>
      <LayoutScopeRoot routeActive="admins">
        <div className="p-6 max-w-4xl">
          <Breadcrumbs items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Access Management" },
            { label: "Admins", href: "/dashboard/access-management/admins" },
            { label: admin.name },
          ]} />

          <Button variant="light" startContent={<ArrowLeft className="w-4 h-4" />} onPress={handleBack} className="mb-6">Back to Admins</Button>

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <EntityAvatar name={admin.name} size="lg" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">{admin.name}</h1>
                <p className="text-muted-foreground text-sm">{admin.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button color="primary" variant="flat" startContent={<Edit className="w-4 h-4" />} onPress={() => setIsEditModalOpen(true)}>Edit</Button>
              <Button
                color={admin.is_active ? "warning" : "success"} variant="flat"
                startContent={<Power className="w-4 h-4" />}
                onPress={handleToggleStatus}
                isDisabled={isSelf && admin.is_active}
              >
                {admin.is_active ? "Deactivate" : "Activate"}
              </Button>
              <Button color="danger" variant="flat" startContent={<Trash2 className="w-4 h-4" />} onPress={handleDeleteClick} isDisabled={isSelf}>Delete</Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader><h2 className="text-lg font-semibold">Admin Information</h2></CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: <User className="w-4 h-4" />, label: "Name",    value: admin.name },
                  { icon: <Mail className="w-4 h-4" />, label: "Email",   value: admin.email },
                  { icon: <Shield className="w-4 h-4" />, label: "Role",  value: <RoleBadge role={admin.role} showTooltip /> },
                  { label: "Status", value: (
                    <Chip color={admin.is_active ? "success" : "danger"} variant="flat" size="sm"
                      startContent={admin.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}>
                      {admin.is_active ? "Active" : "Inactive"}
                    </Chip>
                  )},
                  { icon: <Calendar className="w-4 h-4" />, label: "Created",  value: formatDate(admin.created_at) },
                  { icon: <Calendar className="w-4 h-4" />, label: "Updated",  value: formatDate(admin.updated_at) },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 p-3 bg-content2 rounded-lg">
                    <div className="flex items-center gap-2 w-24 text-muted-foreground text-sm flex-shrink-0">
                      {icon}{label}
                    </div>
                    <div className="text-sm text-foreground">{value}</div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Assigned Tenants</h2></CardHeader>
            <CardBody>
              {admin.tenants && admin.tenants.length > 0 ? (
                <div className="space-y-3">
                  {admin.tenants.map((rel) => (
                    <div key={rel.tenant_id} className="flex items-center justify-between p-4 bg-content2 rounded-lg border border-border">
                      <div>
                        <h3 className="font-semibold text-foreground">{rel.tenant?.name || "Unknown Tenant"}</h3>
                        <p className="text-xs text-muted-foreground">{rel.tenant?.slug}</p>
                      </div>
                      <RoleBadge role={rel.role} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>No assigned tenants yet.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </LayoutScopeRoot>

      <AdminFormModal
        isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}
        admin={admin} onSubmit={handleEditSubmit} isLoading={updateAdminMutation.isPending || updateRoleMutation.isPending}
      />
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm} title={confirmDialog.title} message={confirmDialog.message}
        variant={confirmDialog.variant} confirmText={confirmDialog.variant === "danger" ? "Delete" : "Confirm"}
        isLoading={toggleStatusMutation.isPending || deleteAdminMutation.isPending}
      />
    </>
  );
}
