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

import { User, LogOut, UserCircle, TicketCheck } from "lucide-react";

import { LogoutModal } from "../modals/logout-modal";
import { usePathname } from "next/navigation";

import Link from "next/link";

import { useRouter } from "nextjs-toploader/app";
import { MenuHamburguer } from "./menu";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./language-switcher";

export function Header() {
  const { data } = useAdminDetails();

  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

  const pathname = usePathname();

  const usedPercentage = data && (data.used_search / data.max_search) * 100;

  const { push } = useRouter();

  const t = useTranslations("header");

  return (
    <>
      {pathname !== "/auth/login" && (
        <>
          <header className="flex items-center justify-between px-5 bg-[#0f0f1a] border-b border-gray-800 h-fit py-3">
            <Link className="flex items-center gap-2" href="/">
              <img src="/zarp-logomark-h.svg" alt="ZARP Logo" className="max-h-[36px]" />
            </Link>
            <Dropdown>
              <div className="lg:flex items-center gap-3 hidden">
                <LanguageSwitcher variant="icon" />
                <DropdownTrigger>
                  <div className="cursor-pointer relative flex items-center justify-center rounded-full w-[45px] h-[45px] bg-blue-600/30">
                    <User color="#93c5fd" size={24} />
                  </div>
                </DropdownTrigger>
              </div>
              <DropdownMenu aria-label={t("menuOptions")}>
                <DropdownItem
                  key="desconectar"
                  className="text-danger"
                  color="danger"
                  onPress={onOpen}
                  startContent={<LogOut size={20} />}
                >
                  {t("disconnect")}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <MenuHamburguer />
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
