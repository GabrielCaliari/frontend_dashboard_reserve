"use client";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Progress,
  useDisclosure,
} from "@nextui-org/react";

import useAdminDetails from "@/src/common/hooks/useUserDatails";

import { User, LogOut, UserCircle, TicketCheck, Menu } from "lucide-react";

import { LogoutModal } from "../email-builder/modals/logout-modal";
import { usePathname } from "next/navigation";

import Link from "next/link";

import { useRouter } from "nextjs-toploader/app";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./language-switcher";
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
          <header className="sticky top-0 z-40 flex items-center justify-between px-5 bg-[#0f0f1a]/80 backdrop-blur-md border-b border-[#1f1f2e] h-fit py-3 shadow-sm transition-all duration-300">
            <div className="flex items-center gap-3">
              <button
                onClick={openDrawer}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-gray-300" />
              </button>
              <Link
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                href="/"
              >
                <img
                  src="/zarp-logomark-h.svg"
                  alt="ZARP Logo"
                  className="max-h-[36px]"
                />
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <LanguageSwitcher variant="icon" />
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <div className="cursor-pointer relative flex items-center justify-center rounded-full w-[40px] h-[40px] bg-primary/10 hover:bg-primary/20 transition-all duration-200 border border-primary/20">
                    <User className="text-primary w-5 h-5" />
                  </div>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label={t("menuOptions")}
                  className="bg-[#1f1f2e] border border-white/10 rounded-xl"
                  variant="flat"
                >
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
