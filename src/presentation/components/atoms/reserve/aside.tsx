"use client";

import React from "react";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import TenantSelector from "@/src/presentation/components/organisms/access-management/tenant-selector";
import {
  Copyright,
  LayoutDashboardIcon,
  Mail,
  TicketIcon,
  User,
  Users,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  GroupIcon,
  UsersRound,
  FileText,
  LayoutTemplate,
  Shield,
  UserCog,
  Building2,
  UserCircle,
  UserCircle2,
  FolderOpen,
  Image,
  Settings,
  X,
  FileBarChart2,
  Calendar,
  CreditCard,
  Package,
  Briefcase,
  Bell,
  Megaphone,
  Globe,
  TrendingUp,
  Link2,
} from "lucide-react";

import { HiOutlineDatabase, HiOutlineDocumentSearch } from "react-icons/hi";
import { getCookie } from "cookies-next";
import { useRouter } from "nextjs-toploader/app";
import { useTranslations } from "next-intl";
import { useMobileDrawerStore } from "@/src/shared/stores/mobile-drawer.store";
import { useTenantStore } from "@/src/shared/stores/tenant-store";
import usePermissions from "@/src/shared/hooks/use-permissions";
import { NotificationBadge } from "@/src/presentation/components/organisms/notifications/notification-badge";

export interface SidebarProps {
  activeTab?: string; // opcional — derivado de usePathname() quando omitido
  disabledTabs?: string[];
  mobileStyle?: "footer" | "sidebar" | "hidden";
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  subItems?: NavItem[];
  badge?: React.ReactNode;
}

export function Sidebar({
  activeTab: activeTabProp,
  disabledTabs = [],
  mobileStyle = "footer",
}: SidebarProps) {
  const { push } = useRouter();
  const { isSuperAdmin, isManager } = usePermissions();
  const selectedTenant = useTenantStore((state) => state.selectedTenant);
  const [userName, setUserName] = useState<string>("");
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const { isOpen: mobileDrawerOpen, close: closeMobileDrawer } =
    useMobileDrawerStore();
  const t = useTranslations("sidebar");
  const pathname = usePathname();

  useEffect(() => {
    const name = getCookie("session-name") as string;
    setUserName(name || "");
  }, []);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId],
    );
  };

  const navItems: NavItem[] = useMemo(() => {
    if (isSuperAdmin) {
      return [
        {
          id: "dashboard-global",
          label: t("globalDashboard"),
          icon: LayoutDashboardIcon,
          path: "/dashboard/global",
        },
        {
          id: "reports",
          label: t("reports"),
          icon: FileBarChart2,
          path: "/dashboard/reports",
        },
        {
          id: "access-management",
          label: t("accessManagement"),
          icon: Shield,
          subItems: [
            {
              id: "admins",
              label: t("admins"),
              icon: UserCog,
              path: "/dashboard/access-management/admins",
            },
            {
              id: "tenants",
              label: t("tenants"),
              icon: Building2,
              path: "/dashboard/access-management/tenants",
            },
            {
              id: "users",
              label: t("users"),
              icon: Users,
              path: "/dashboard/access-management/users",
            },
          ],
        },
        {
          id: "notifications-global",
          label: t("notifications"),
          icon: Bell,
          path: "/dashboard/global/notifications",
        },
        {
          id: "profile",
          label: t("profile"),
          icon: UserCircle2,
          path: "/dashboard/profile",
        },
        {
          id: "settings",
          label: t("settings"),
          icon: Settings,
          path: "/dashboard/settings",
        },
      ];
    }

    if (isSuperAdmin) {
      return [
        {
          id: "dashboard",
          label: t("dashboard"),
          icon: LayoutDashboardIcon,
          path: "/dashboard",
        },
        {
          id: "leads-menu",
          label: t("leads"),
          icon: HiOutlineDatabase,
          subItems: [
            {
              id: "leads",
              label: t("allLeads"),
              icon: UsersRound,
              path: "/dashboard/leads",
            },
            {
              id: "lead-collections",
              label: t("leadCollections"),
              icon: FolderOpen,
              path: "/dashboard/leads/collections",
            },
            {
              id: "appointments",
              label: t("appointments"),
              icon: Calendar,
              path: "/dashboard/leads/appointments",
            },
            {
              id: "abandoned-carts",
              label: t("abandonedCarts"),
              icon: ShoppingCart,
              path: "/dashboard/abandoned-carts",
            },
          ],
        },
        {
          id: "email",
          label: t("emailCampaigns"),
          icon: Mail,
          path: "/dashboard/email-campaign",
        },
        {
          id: "cms",
          label: t("cms"),
          icon: LayoutTemplate,
          subItems: [
            {
              id: "blogs",
              label: t("blogs"),
              icon: FileText,
              path: "/dashboard/cms/blogs",
            },
            {
              id: "articles",
              label: t("articles"),
              icon: FileText,
              path: "/dashboard/cms/articles",
            },
            {
              id: "authors",
              label: t("authors"),
              icon: UserCircle,
              path: "/dashboard/cms/authors",
            },
            {
              id: "collections",
              label: t("cmsCollections"),
              icon: FolderOpen,
              path: "/dashboard/cms/collections",
            },
            {
              id: "media",
              label: t("media"),
              icon: Image,
              path: "/dashboard/cms/media",
            },
          ],
        },
        {
          id: "payments-menu",
          label: t("payments"),
          icon: CreditCard,
          subItems: [
            {
              id: "payments-products",
              label: t("paymentsProducts"),
              icon: Package,
              path: "/dashboard/payments/products",
            },
            {
              id: "payments-subscriptions",
              label: t("paymentsMovements"),
              icon: CreditCard,
              path: "/dashboard/payments/subscriptions",
            },
            {
              id: "payments-config",
              label: t("paymentsConfig"),
              icon: Settings,
              path: "/dashboard/payments/config",
            },
            {
              id: "coupons",
              label: t("couponsList"),
              icon: TicketIcon,
              path: "/dashboard/coupons",
            },
          ],
        },
        {
          id: "hotel-menu",
          label: "Hotel Marketing",
          icon: Building2,
          subItems: [
            {
              id: "hotel-overview",
              label: "Visão Geral",
              icon: LayoutDashboardIcon,
              path: "/dashboard/hotel/overview",
            },
            {
              id: "hotel-campaigns",
              label: "Campanhas",
              icon: Megaphone,
              path: "/dashboard/hotel/campaigns",
            },
            {
              id: "hotel-site",
              label: "Site",
              icon: Globe,
              path: "/dashboard/hotel/site",
            },
            {
              id: "hotel-ota",
              label: "OTA vs Direto",
              icon: TrendingUp,
              path: "/dashboard/hotel/ota",
            },
            {
              id: "hotel-reports",
              label: "Relatório Mensal",
              icon: FileText,
              path: "/dashboard/hotel/reports",
            },
            {
              id: "hotel-whatsapp-links",
              label: "Links WhatsApp",
              icon: Link2,
              path: "/dashboard/hotel/whatsapp-links",
            },
            {
              id: "hotel-config",
              label: "Configurações",
              icon: Settings,
              path: "/dashboard/hotel/config",
            },
          ],
        },
        {
          id: "notifications",
          label: t("notifications"),
          icon: Bell,
          path: "/dashboard/notifications",
          badge: <NotificationBadge />,
        },
        {
          id: "profile",
          label: t("profile"),
          icon: UserCircle2,
          path: "/dashboard/profile",
        },
        {
          id: "settings",
          label: t("settings"),
          icon: Settings,
          path: "/dashboard/settings",
        },
        {
          id: "access-management",
          label: t("accessManagement"),
          icon: Shield,
          subItems: [
            {
              id: "admins",
              label: t("admins"),
              icon: UserCog,
              path: "/dashboard/access-management/admins",
            },
            {
              id: "tenants",
              label: t("tenants"),
              icon: Building2,
              path: "/dashboard/access-management/tenants",
            },
            {
              id: "users",
              label: t("users"),
              icon: Users,
              path: "/dashboard/access-management/users",
            },
          ],
        },
      ];
    }

    // Manager = dono do hotel (portal de resultados RÉSERVE)
    if (isManager) {
      return [
        {
          id: "hotel-overview",
          label: "Visão Geral",
          icon: LayoutDashboardIcon,
          path: "/dashboard/hotel/overview",
        },
        {
          id: "hotel-campaigns",
          label: "Campanhas",
          icon: Megaphone,
          path: "/dashboard/hotel/campaigns",
        },
        {
          id: "hotel-site",
          label: "Site",
          icon: Globe,
          path: "/dashboard/hotel/site",
        },
        {
          id: "hotel-ota",
          label: "OTA vs Direto",
          icon: TrendingUp,
          path: "/dashboard/hotel/ota",
        },
        {
          id: "hotel-reports",
          label: "Relatório Mensal",
          icon: FileText,
          path: "/dashboard/hotel/reports",
        },
        {
          id: "hotel-whatsapp-links",
          label: "Links WhatsApp",
          icon: Link2,
          path: "/dashboard/hotel/whatsapp-links",
        },
        {
          id: "hotel-config",
          label: "Configurações",
          icon: Settings,
          path: "/dashboard/hotel/config",
        },
        {
          id: "notifications",
          label: t("notifications"),
          icon: Bell,
          path: "/dashboard/notifications",
          badge: <NotificationBadge />,
        },
        {
          id: "profile",
          label: t("profile"),
          icon: UserCircle2,
          path: "/dashboard/profile",
        },
        {
          id: "settings",
          label: t("settings"),
          icon: Settings,
          path: "/dashboard/settings",
        },
      ];
    }

    // Roles normais (owner, editor, viewer)
    return [
      {
        id: "leads-menu",
        label: t("leads"),
        icon: HiOutlineDatabase,
        subItems: [
          {
            id: "leads",
            label: t("allLeads"),
            icon: UsersRound,
            path: "/dashboard/leads",
          },
          {
            id: "appointments",
            label: t("appointments"),
            icon: Calendar,
            path: "/dashboard/leads/appointments",
          },
        ],
      },
      {
        id: "cms",
        label: t("cms"),
        icon: LayoutTemplate,
        subItems: [
          {
            id: "blogs",
            label: t("blogs"),
            icon: FileText,
            path: "/dashboard/cms/blogs",
          },
          {
            id: "articles",
            label: t("articles"),
            icon: FileText,
            path: "/dashboard/cms/articles",
          },
          {
            id: "authors",
            label: t("authors"),
            icon: UserCircle,
            path: "/dashboard/cms/authors",
          },
          {
            id: "media",
            label: t("media"),
            icon: Image,
            path: "/dashboard/cms/media",
          },
        ],
      },
      {
        id: "payments-menu",
        label: t("payments"),
        icon: CreditCard,
        subItems: [
          {
            id: "payments-products",
            label: t("paymentsProducts"),
            icon: Package,
            path: "/dashboard/payments/products",
          },
          {
            id: "payments-subscriptions",
            label: t("paymentsMovements"),
            icon: CreditCard,
            path: "/dashboard/payments/subscriptions",
          },
          {
            id: "payments-config",
            label: t("paymentsConfig"),
            icon: Settings,
            path: "/dashboard/payments/config",
          },
          {
            id: "coupons",
            label: t("couponsList"),
            icon: TicketIcon,
            path: "/dashboard/coupons",
          },
        ],
      },
      {
        id: "notifications",
        label: t("notifications"),
        icon: Bell,
        path: "/dashboard/notifications",
        badge: <NotificationBadge />,
      },
      {
        id: "profile",
        label: t("profile"),
        icon: UserCircle2,
        path: "/dashboard/profile",
      },
      {
        id: "settings",
        label: t("settings"),
        icon: Settings,
        path: "/dashboard/settings",
      },
      {
        id: "access-management",
        label: t("accessManagement"),
        icon: Shield,
        subItems: [
          {
            id: "admins",
            label: t("admins"),
            icon: UserCog,
            path: "/dashboard/access-management/admins",
          },
          {
            id: "users",
            label: t("users"),
            icon: Users,
            path: "/dashboard/access-management/users",
          },
        ],
      },
    ];
  }, [isSuperAdmin, isManager, t]);

  // Filter items recursively based on disabledTabs
  const filterDisabled = (items: NavItem[]): NavItem[] => {
    return items
      .filter((item) => !disabledTabs.includes(item.id))
      .map((item) => {
        if (item.subItems) {
          return { ...item, subItems: filterDisabled(item.subItems) };
        }
        return item;
      })
      .filter((item) => !item.subItems || item.subItems.length > 0);
  };

  const filteredNavItems = useMemo(
    () => filterDisabled(navItems),
    [navItems, disabledTabs],
  );

  // Deriva o activeTab a partir do pathname quando o prop não é fornecido
  const activeTab = useMemo(() => {
    if (activeTabProp != null) return activeTabProp;
    const flat: NavItem[] = [];
    const flatten = (items: NavItem[]) => {
      items.forEach((item) => {
        if (item.path) flat.push(item);
        if (item.subItems) flatten(item.subItems);
      });
    };
    flatten(filteredNavItems);
    // Ordena por comprimento do path decrescente para priorizar rotas mais específicas
    flat.sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0));
    return (
      flat.find((item) => item.path && pathname.startsWith(item.path))?.id ?? ""
    );
  }, [activeTabProp, pathname, filteredNavItems]);

  useEffect(() => {
    if (activeTab === "email-campaign" || activeTab === "abandoned-carts") {
      setExpandedMenus((prev) =>
        prev.includes("email") ? prev : [...prev, "email"],
      );
    }
    if (
      activeTab === "leads" ||
      activeTab === "lead-collections" ||
      activeTab === "appointments"
    ) {
      setExpandedMenus((prev) =>
        prev.includes("leads-menu") ? prev : [...prev, "leads-menu"],
      );
    }
    if (
      activeTab === "cms" ||
      activeTab === "blogs" ||
      activeTab === "articles" ||
      activeTab === "authors" ||
      activeTab === "collections" ||
      activeTab === "media"
    ) {
      setExpandedMenus((prev) =>
        prev.includes("cms") ? prev : [...prev, "cms"],
      );
    }
    if (
      activeTab === "admins" ||
      activeTab === "tenants" ||
      activeTab === "users"
    ) {
      setExpandedMenus((prev) =>
        prev.includes("access-management")
          ? prev
          : [...prev, "access-management"],
      );
    }
    if (
      activeTab === "payments-products" ||
      activeTab === "payments-subscriptions" ||
      activeTab === "payments-config" ||
      activeTab === "coupons"
    ) {
      setExpandedMenus((prev) =>
        prev.includes("payments-menu") ? prev : [...prev, "payments-menu"],
      );
    }
    if (
      activeTab === "hotel-overview" ||
      activeTab === "hotel-campaigns" ||
      activeTab === "hotel-site" ||
      activeTab === "hotel-ota" ||
      activeTab === "hotel-reports" ||
      activeTab === "hotel-whatsapp-links" ||
      activeTab === "hotel-config"
    ) {
      setExpandedMenus((prev) =>
        prev.includes("hotel-menu") ? prev : [...prev, "hotel-menu"],
      );
    }
  }, [activeTab]);

  const isItemActive = (item: NavItem): boolean => {
    if (item.id === activeTab) return true;
    if (item.subItems) {
      return item.subItems.some((subItem) => subItem.id === activeTab);
    }
    return false;
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedMenus.includes(item.id);
    const isActive = isItemActive(item);
    const isDirectlyActive = item.id === activeTab;

    return (
      <div key={item.id} className="w-full">
        <Button
          size="lg"
          variant="light"
          onPress={() => {
            if (hasSubItems) {
              toggleMenu(item.id);
            } else if (item.path) {
              push(item.path);
              closeMobileDrawer();
            }
          }}
          className={`flex items-center justify-start gap-3 px-2 py-2 rounded-lg w-full transition-all duration-200 ${
            level > 0 ? "ml-4 max-w-[calc(100%-1rem)]" : "max-w-full"
          } ${
            isDirectlyActive
              ? "bg-primary/20 text-primary font-medium"
              : isActive && !hasSubItems
                ? "bg-default-100 text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-default-100/50"
          }`}
        >
          <span suppressHydrationWarning>
            <item.icon
              size={20}
              className={`flex-shrink-0 transition-colors ${
                isDirectlyActive
                  ? "text-primary"
                  : isActive
                    ? "text-foreground"
                    : "text-muted-foreground"
              }`}
            />
          </span>
          <span className="flex-1 text-left truncate text-sm">
            {item.label}
          </span>
          {item.badge}
          {hasSubItems &&
            (isExpanded ? (
              <ChevronDown className="text-sm flex-shrink-0" />
            ) : (
              <ChevronRight className="text-sm flex-shrink-0" />
            ))}
        </Button>

        {hasSubItems && (
          <div
            className={`mt-1 space-y-1 w-full overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {item.subItems!.map((subItem) => renderNavItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="bg-background w-[var(--sidebar-width)] border-r border-border p-4 flex-col hidden lg:flex overflow-hidden relative z-10 transition-all h-[calc(100svh-var(--header-height))]">
        <div className="w-full flex-1 flex flex-col min-h-0">
          <div className="flex flex-col w-full shrink-0">
            <Link
              href={isSuperAdmin ? "/dashboard/global" : "/dashboard"}
              className="flex items-center justify-between hover:bg-white/5 p-3 hover:cursor-pointer rounded-xl w-full transition-colors group"
            >
              <div className="flex items-center gap-3 rounded-lg w-full">
                <div className="relative flex items-center justify-center rounded-full w-[40px] h-[40px] bg-primary/10 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <User className="text-primary w-5 h-5" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0f0f1a] rounded-full"></div>
                </div>
                <div className="flex flex-col w-full min-w-0">
                  <h1 className="flex items-center font-bold text-sm text-foreground capitalize tracking-wide truncate">
                    {userName || t("userLabel")}
                  </h1>
                  <p className="text-xs text-muted-foreground truncate">
                    {isSuperAdmin
                      ? t("globalWorkspace")
                      : selectedTenant?.name || t("defaultWorkspace")}
                  </p>
                </div>
              </div>
            </Link>
          </div>

          <div className="my-4 shrink-0 px-1 border-b border-border/60 pb-4">
            <TenantSelector />
          </div>

          <nav className="flex flex-col gap-1.5 w-full overflow-y-auto overflow-x-hidden flex-1 no-scrollbar pr-1 pb-10">
            {filteredNavItems.map((item) => renderNavItem(item))}
          </nav>
        </div>
      </aside>

      {/* Mobile Navigation */}
      {mobileStyle === "footer" && (
        <>
          {/* Backdrop */}
          <div
            className={`lg:hidden fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
              mobileDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={closeMobileDrawer}
          />

          {/* Slide-up drawer */}
          <div
            className={`lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-background border-t border-border rounded-t-2xl transition-transform duration-300 ease-in-out ${
              mobileDrawerOpen ? "translate-y-0" : "translate-y-full"
            }`}
            style={{ maxHeight: "85dvh" }}
          >
            {/* Header with user info + close */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex items-center justify-center rounded-full w-[36px] h-[36px] bg-primary/10 flex-shrink-0">
                  <User className="text-primary w-4 h-4" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0f0f1a] rounded-full" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-foreground capitalize truncate">
                    {userName || t("userLabel")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isSuperAdmin
                      ? t("globalWorkspace")
                      : selectedTenant?.name || t("defaultWorkspace")}
                  </span>
                </div>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={closeMobileDrawer}
                aria-label={t("closeMenu")}
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>

            {/* Tenant selector */}
            <div className="px-4 py-3 border-b border-border/60">
              <TenantSelector />
            </div>

            {/* Full navigation with dropdowns */}
            <nav
              className="px-2 py-2 overflow-y-auto custom-scrollbar"
              style={{ maxHeight: "calc(85dvh - 140px)" }}
            >
              <div className="flex flex-col gap-1 pb-4">
                {filteredNavItems.map((item) => renderNavItem(item))}
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
