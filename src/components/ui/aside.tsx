"use client";

import { Button } from "@nextui-org/react";
import Link from "next/link";
import { useState, useEffect } from "react";
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
} from "lucide-react";

import { HiOutlineDatabase, HiOutlineDocumentSearch } from "react-icons/hi";
import { getCookie } from "cookies-next";
import { useRouter } from 'nextjs-toploader/app';
import { useTranslations } from "next-intl";

interface SidebarProps {
  activeTab: any;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  subItems?: NavItem[];
}

export function Sidebar({ activeTab }: SidebarProps) {
  const { push } = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const t = useTranslations("sidebar");

  // Load userName from cookie after mount to avoid hydration mismatch
  useEffect(() => {
    const name = getCookie("session-name") as string;
    setUserName(name || "");
  }, []);

  // Auto-expand parent menus when a child is active
  useEffect(() => {
    if (activeTab === 'email-campaign' || activeTab === 'abandoned-carts') {
      setExpandedMenus(prev => prev.includes('email') ? prev : [...prev, 'email']);
    }
    if (activeTab === 'leads') {
      setExpandedMenus(prev => prev.includes('leads-menu') ? prev : [...prev, 'leads-menu']);
    }
  }, [activeTab]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const navItems: NavItem[] = [
    {
      id: "dashboard",
      label: t("dashboard"),
      icon: LayoutDashboardIcon,
      path: "/dashboard"
    },
    {
      id: 'leads-menu',
      label: t("leads"),
      icon: HiOutlineDatabase,
      subItems: [
        {
          id: 'leads',
          label: t("allLeads"),
          icon: UsersRound,
          path: '/dashboard/leads'
        },
        {
          id: 'abandoned-carts',
          label: t("abandonedCarts"),
          icon: ShoppingCart,
          path: '/dashboard/abandoned-carts'
        }
      ]
    },
    {
      id: 'email',
      label: t("emailCampaigns"),
      icon: Mail,
      path: '/dashboard/email-campaign'
    }
  ];

  const isItemActive = (item: NavItem): boolean => {
    if (item.id === activeTab) return true;
    if (item.subItems) {
      return item.subItems.some(subItem => subItem.id === activeTab);
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
            }
          }}
          className={`flex items-center justify-start gap-3 px-2 py-2 rounded-lg w-full ${level > 0 ? 'ml-4 max-w-[calc(100%-1rem)]' : 'max-w-full'
            } ${isDirectlyActive
              ? "bg-blue-500/20 text-blue-400"
              : isActive && !hasSubItems
                ? "bg-blue-500/10 text-blue-300"
                : "text-gray-400 hover:text-gray-200"
            }`}
        >
          <item.icon
            className={`text-2xl ${isDirectlyActive
              ? "text-blue-400"
              : isActive
                ? "text-blue-300"
                : "text-blue-400/70"
              } flex-shrink-0`}
          />
          <span className="flex-1 text-left truncate">{item.label}</span>
          {hasSubItems && (
            isExpanded ? (
              <ChevronDown className="text-lg flex-shrink-0" />
            ) : (
              <ChevronRight className="text-lg flex-shrink-0" />
            )
          )}
        </Button>

        {hasSubItems && isExpanded && (
          <div className="mt-1 space-y-1 w-full">
            {item.subItems!.map(subItem => renderNavItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <aside className="bg-[#0f0f1a] w-[310px] border-r border-gray-800 p-3 shadow-lg flex-col justify-between hidden md:flex overflow-hidden">
        <div className="w-full">
          <div className="flex flex-col w-full">
            <Link
              href="/dashboard"
              className="flex items-center justify-between hover:bg-white/5 p-2 hover:cursor-pointer hover:rounded-lg w-full"
            >
              <div className="flex items-center gap-3 rounded-lg w-full">
                <div className="relative flex items-center justify-center rounded-full w-[45px] h-[45px] bg-blue-600/30 flex-shrink-0">
                  <User color="#93c5fd" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0f0f1a] rounded-full"></div>
                </div>
                <div className="flex flex-col w-full min-w-0">
                  <h1 className="flex items-center font-bold text-base text-gray-100 capitalize tracking-wide truncate">
                    {userName}
                  </h1>
                  <p className="text-sm text-gray-500 truncate">{t("workspace")}</p>
                </div>
              </div>
            </Link>
          </div>
          <hr className="my-3 border-gray-800" />

          <nav className="flex flex-col gap-2 w-full overflow-hidden">
            {navItems.map(item => renderNavItem(item))}
          </nav>
        </div>
      </aside>
    </>
  );
}
