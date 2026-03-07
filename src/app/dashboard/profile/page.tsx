"use client";

import { Card, CardBody, CardHeader, Chip, Button, Skeleton } from "@heroui/react";
import { Mail, Shield, Calendar, Building2 } from "lucide-react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { Breadcrumbs } from "@/src/components/access-management/shared/breadcrumbs";
import { RoleBadge } from "@/src/components/access-management/shared/role-badge";
import { EntityAvatar } from "@/src/components/access-management/shared/entity-avatar";
import { useCurrentAdmin } from "@/src/common/hooks/use-current-admin";
import { useAdminById } from "@/src/common/hooks/access-management/useAdmins";
import { formatDate } from "@/src/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";

export default function ProfilePage() {
  const currentAdmin = useCurrentAdmin();
  const { data: admin, isLoading } = useAdminById({ id: currentAdmin.id, enabled: !!currentAdmin.id });

  if (isLoading) {
    return (
      <LayoutScopeRoot routeActive="profile">
        <div className="p-6 max-w-3xl">
          <Skeleton className="w-48 h-5 rounded mb-4" />
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-14 h-14 rounded-full" />
            <div><Skeleton className="w-48 h-7 rounded mb-2" /><Skeleton className="w-32 h-4 rounded" /></div>
          </div>
          <Card><CardBody className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="w-full h-6 rounded" />)}</CardBody></Card>
        </div>
      </LayoutScopeRoot>
    );
  }

  const profile = admin || { name: currentAdmin.name, email: currentAdmin.email, role: currentAdmin.role, is_active: true, created_at: "", updated_at: "", tenants: [] };

  return (
    <LayoutScopeRoot routeActive="profile">
      <div className="p-6 max-w-3xl">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "My Profile" }]} />

        <div className="flex items-center gap-5 mb-8">
          <EntityAvatar name={profile.name} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
            <p className="text-muted-foreground text-sm mb-2">{profile.email}</p>
            <div className="flex items-center gap-2">
              <RoleBadge role={profile.role} showTooltip />
              <Chip color={profile.is_active ? "success" : "danger"} size="sm" variant="flat"
                startContent={profile.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}>
                {profile.is_active ? "Active" : "Inactive"}
              </Chip>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader><h2 className="text-lg font-semibold">Account Details</h2></CardHeader>
          <CardBody>
            <div className="space-y-4">
              {[
                { icon: <Mail className="w-4 h-4" />,     label: "Email",   value: profile.email },
                { icon: <Shield className="w-4 h-4" />,   label: "Role",    value: <RoleBadge role={profile.role} showTooltip /> },
                { icon: <Calendar className="w-4 h-4" />, label: "Member since", value: profile.created_at ? formatDate(profile.created_at) : "—" },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-4 p-3 bg-content2 rounded-lg">
                  <div className="flex items-center gap-2 w-32 text-muted-foreground text-sm">{icon}{label}</div>
                  <div className="text-sm text-foreground">{value}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {admin?.tenants && admin.tenants.length > 0 && (
          <Card>
            <CardHeader><h2 className="text-lg font-semibold">My Tenants</h2></CardHeader>
            <CardBody>
              <div className="space-y-3">
                {admin.tenants.map((rel) => (
                  <div key={rel.tenant_id} className="flex items-center justify-between p-4 bg-content2 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg"><Building2 className="w-4 h-4 text-primary" /></div>
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">{rel.tenant?.name || "Unknown"}</h3>
                        <p className="text-xs text-muted-foreground">{rel.tenant?.slug}</p>
                      </div>
                    </div>
                    <RoleBadge role={rel.role} />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </LayoutScopeRoot>
  );
}
