import type {
  MetricGroupResponse,
  MetricValueResponse,
} from "@/src/shared/domain/types/@stats";
import type { GateableModule, ModuleFlags } from "./tenant-modules";

type AccessRule = {
  modules?: readonly GateableModule[];
  permissions?: readonly string[];
  requireAll?: boolean;
};

const MODULE_ALIASES: Array<[GateableModule, readonly string[]]> = [
  ["leads", ["lead", "appointment", "abandoned-cart"]],
  ["cms", ["cms", "blog", "article", "author", "media", "storage"]],
  ["mailer", ["mailer", "campaign", "email", "sms", "sender"]],
  ["payments", ["payment", "billing", "subscription", "stripe", "guest"]],
  ["coupons", ["coupon"]],
  ["reports", ["report"]],
  ["notifications", ["notification"]],
  ["hotel", ["hotel", "ota", "whatsapp"]],
  ["metrics", ["metric", "analytics"]],
];

const GROUP_RULES: Record<string, AccessRule> = {
  leads: { modules: ["leads"], permissions: ["leads.read"] },
  cms: {
    modules: ["cms"],
    permissions: ["cms.article.read", "cms.blog.read", "cms.author.read"],
  },
  storage: {
    modules: ["cms"],
    permissions: ["cms.media-asset.read", "cms.media-collection.read"],
  },
  email: { modules: ["mailer"], permissions: ["mailer.campaign.manage"] },
  users: { permissions: ["users.read"] },
  payments: { modules: ["payments"], permissions: ["payments.read"] },
  hotel: { modules: ["hotel"], permissions: ["hotel.read"] },
};

export function metricModuleFor(
  group: Pick<MetricGroupResponse, "moduleKey">,
): GateableModule | undefined {
  const key = group.moduleKey.toLocaleLowerCase();
  return MODULE_ALIASES.find(([, aliases]) =>
    aliases.some((alias) => key.includes(alias)),
  )?.[0];
}

function metricRule(groupKey: string, metricKey: string): AccessRule {
  const group = groupKey.toLocaleLowerCase();
  const key = metricKey.toLocaleLowerCase();

  if (group === "conversions") {
    if (key.includes("lead_to_paying")) {
      return {
        modules: ["leads", "payments"],
        permissions: ["leads.read", "payments.read"],
        requireAll: true,
      };
    }
    if (key.includes("paying") || key.includes("revenue")) {
      return { modules: ["payments"], permissions: ["payments.read"] };
    }
    return { modules: ["leads"], permissions: ["leads.read"] };
  }

  if (group === "leads" && key.includes("collection")) {
    return { modules: ["leads"], permissions: ["leads.collection.read"] };
  }
  if (group === "cms") {
    if (key.includes("author"))
      return { modules: ["cms"], permissions: ["cms.author.read"] };
    if (key.includes("blog") && !key.includes("article")) {
      return { modules: ["cms"], permissions: ["cms.blog.read"] };
    }
    return { modules: ["cms"], permissions: ["cms.article.read"] };
  }
  if (group === "storage") {
    const permission = key.includes("collection")
      ? "cms.media-collection.read"
      : "cms.media-asset.read";
    return { modules: ["cms"], permissions: [permission] };
  }

  return (
    GROUP_RULES[group] ?? {
      modules: metricModuleFor({ moduleKey: group })
        ? [metricModuleFor({ moduleKey: group })!]
        : undefined,
      permissions: ["metrics.dashboard.read"],
    }
  );
}

function satisfiesRule(
  rule: AccessRule,
  flags: ModuleFlags | undefined,
  permissions: ReadonlySet<string> | undefined,
  isMasterTenant: boolean,
) {
  if (isMasterTenant) return true;

  const moduleChecks =
    rule.modules?.map((moduleKey) => flags?.[moduleKey] === true) ?? [];
  const modulesEnabled =
    moduleChecks.length === 0
      ? true
      : rule.requireAll
        ? moduleChecks.every(Boolean)
        : moduleChecks.some(Boolean);
  if (!modulesEnabled) return false;
  if (
    !permissions ||
    (!permissions.has("*") && !permissions.has("metrics.dashboard.read"))
  )
    return false;

  const permissionChecks =
    rule.permissions?.map((permission) => permissions.has(permission)) ?? [];
  if (permissionChecks.length === 0 || permissions.has("*")) return true;
  return rule.requireAll
    ? permissionChecks.every(Boolean)
    : permissionChecks.some(Boolean);
}

export function canViewMetric(
  group: Pick<MetricGroupResponse, "moduleKey">,
  metric: Pick<MetricValueResponse, "key">,
  flags: ModuleFlags | undefined,
  permissions: ReadonlySet<string> | undefined,
  isMasterTenant = false,
) {
  return satisfiesRule(
    metricRule(group.moduleKey, metric.key),
    flags,
    permissions,
    isMasterTenant,
  );
}

export function canViewMetricGroup(
  group: {
    moduleKey: MetricGroupResponse["moduleKey"];
    metrics: readonly Pick<MetricValueResponse, "key">[];
  },
  flags: ModuleFlags | undefined,
  permissions: ReadonlySet<string> | undefined,
  isMasterTenant = false,
) {
  return group.metrics.some((metric) =>
    canViewMetric(group, metric, flags, permissions, isMasterTenant),
  );
}

export function filterDashboardGroups(
  groups: MetricGroupResponse[],
  flags: ModuleFlags | undefined,
  permissions: ReadonlySet<string> | undefined,
  isMasterTenant = false,
): MetricGroupResponse[] {
  const organized = new Map<string, MetricGroupResponse>();

  for (const group of groups) {
    for (const metric of group.metrics) {
      if (!canViewMetric(group, metric, flags, permissions, isMasterTenant))
        continue;
      const moduleKey =
        group.moduleKey.toLocaleLowerCase() === "conversions"
          ? metric.key.toLocaleLowerCase().includes("paying") ||
            metric.key.toLocaleLowerCase().includes("revenue")
            ? "payments"
            : "leads"
          : group.moduleKey;
      if (
        group.moduleKey.toLocaleLowerCase() === "conversions" &&
        metric.key.toLocaleLowerCase().includes("lead_to_paying")
      ) {
        continue; // taxa cruzada nao pertence a nenhum painel de modulo unico
      }

      const current = organized.get(moduleKey);
      if (current) {
        current.metrics.push(metric);
      } else {
        organized.set(moduleKey, { ...group, moduleKey, metrics: [metric] });
      }
    }
  }

  return [...organized.values()];
}
