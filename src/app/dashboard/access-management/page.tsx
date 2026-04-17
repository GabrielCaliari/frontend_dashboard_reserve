"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/react";
import {
  UserCog,
  Users,
  Building2,
  Shield,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import { Breadcrumbs } from "@/src/presentation/components/organisms/access-management/shared/breadcrumbs";
import { useAdmins } from "@/src/shared/hooks/access-management/useAdmins";
import { useUsers } from "@/src/shared/hooks/access-management/useUsers";

export default function AccessManagementOverviewPage() {
  const router = useRouter();
  const t = useTranslations("accessManagement");
  const { data: adminsData } = useAdmins({ perPage: 1 });
  const { data: usersData } = useUsers({ perPage: 1 });

  const sections = [
    {
      id: "admins",
      title: t("admins.title"),
      description: t("admins.description"),
      icon: <UserCog className="w-7 h-7" />,
      color: "bg-primary/10 text-primary border-primary/20",
      href: "/dashboard/access-management/admins",
      stat: adminsData?.meta.total,
      statLabel: t("admins.statLabel"),
    },
    {
      id: "tenants",
      title: t("tenants.title"),
      description: t("tenants.description"),
      icon: <Building2 className="w-7 h-7" />,
      color: "bg-secondary/10 text-secondary border-secondary/20",
      href: "/dashboard/access-management/tenants",
      stat: null,
      statLabel: "",
    },
    {
      id: "users",
      title: t("users.title"),
      description: t("users.description"),
      icon: <Users className="w-7 h-7" />,
      color: "bg-success/10 text-success border-success/20",
      href: "/dashboard/access-management/users",
      stat: usersData?.meta.total,
      statLabel: t("users.statLabel"),
    },
  ];

  return (
    <LayoutScopeRoot routeActive="access-management">
      <div>
        <Breadcrumbs
          items={[
            { label: t("breadcrumbs.dashboard"), href: "/dashboard" },
            { label: t("breadcrumbs.accessManagement") },
          ]}
        />

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          </div>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map((section) => (
            <Card
              key={section.id}
              isPressable
              onPress={() => router.push(section.href)}
              className="border border-divider hover:border-primary/30 transition-all hover: hover:-primary/5 group"
            >
              <CardBody className="p-6">
                <div
                  className={`inline-flex p-3 rounded-xl border ${section.color} mb-4`}
                >
                  {section.icon}
                </div>
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-semibold text-foreground">
                    {section.title}
                  </h2>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {section.description}
                </p>
                {section.stat !== undefined && section.stat !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">
                      {section.stat}
                    </span>
                    <span className="text-muted-foreground">
                      {section.statLabel}
                    </span>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </LayoutScopeRoot>
  );
}
