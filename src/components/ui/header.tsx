"use client";
import { useState, useEffect } from "react";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Progress,
  useDisclosure,
} from "@heroui/react";

import useAdminDetails from "@/src/common/hooks/useUserDatails";

import {
  User,
  LogOut,
  UserCircle,
  TicketCheck,
  Menu,
  Moon,
  Sun,
} from "lucide-react";

import { LogoutModal } from "../email-builder/modals/logout-modal";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import Link from "next/link";

import { useRouter } from "nextjs-toploader/app";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeSwitcher } from "./theme-switcher";
import { useMobileDrawerStore } from "@/src/common/stores/mobile-drawer.store";
export function Header() {
  const { data } = useAdminDetails();

  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

  const pathname = usePathname();

  const usedPercentage = data && (data.used_search / data.max_search) * 100;

  const { push } = useRouter();

  const t = useTranslations("header");

  const openDrawer = useMobileDrawerStore((s) => s.open);

  return (
    <>
      {pathname !== "/auth/login" && (
        <>
          <header className="sticky top-0 z-40 flex items-center justify-between px-5 bg-background/88 backdrop-blur-md border-b border-border h-fit py-3 transition-all duration-300">
            <div className="flex items-center gap-3">
              <button
                onClick={openDrawer}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-foreground" />
              </button>
              <Link
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                href="/"
              >
                <img
                  src="/reserve-logomark-h-light.svg"
                  alt="Reserve Logo"
                  className="max-h-[36px] dark:hidden block"
                />
                <img
                  src="/reserve-logomark-h-dark.svg"
                  alt="Reserve Logo"
                  className="max-h-[36px] hidden dark:block"
                />
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeSwitcher />
              <LanguageSwitcher />
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <div className="cursor-pointer relative flex items-center justify-center rounded-full w-[40px] h-[40px] bg-primary/10 hover:bg-primary/20 transition-all duration-200 border border-primary/20">
                    <User className="text-primary w-5 h-5" />
                  </div>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label={t("menuOptions")}
                  className="bg-popover border border-border rounded-xl"
                  variant="flat"
                >
                  <DropdownItem
                    key="profile"
                    onPress={() => push("/dashboard/profile")}
                    startContent={<UserCircle size={18} />}
                  >
                    {t("profile")}
                  </DropdownItem>
                  <DropdownItem
                    key="desconectar"
                    className="text-danger hover:bg-danger/10 data-[hover=true]:bg-danger/10"
                    color="danger"
                    onPress={onOpen}
                    startContent={<LogOut size={18} />}
                  >
                    {t("disconnect")}
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </header>
          <LogoutModal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            key={1}
            onClose={onClose}
          />
        </>
      )}
    </>
  );
}
