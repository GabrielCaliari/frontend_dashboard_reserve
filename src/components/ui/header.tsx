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

export function Header() {
  const { data } = useAdminDetails();

  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

  const pathname = usePathname();

  const usedPercentage = data && (data.used_search / data.max_search) * 100;

  const { push } = useRouter();

  return (
    <>
      {pathname !== "/auth/login" && (
        <>
          <header className="flex items-center justify-between px-5 bg-white border h-fit py-3">
            <Link className="flex items-center gap-2" href="/">
              <img src="/logo-mark.png" alt="Logo" className="max-w-[40px]" />
              <h1 className="text-2xl font-bold text-primary">PPPI</h1>
            </Link>
            <Dropdown>
              <div className="lg:flex items-center gap-3 hidden">
                <DropdownTrigger>
                  <div className=" cursor-pointer relative flex items-center justify-center rounded-full w-[45px] h-[45px] bg-[#9292b2]">
                    <User color="#FFF" size={24} />
                  </div>
                </DropdownTrigger>
              </div>
              <DropdownMenu aria-label="Menu de opções">
                <DropdownItem
                  key="desconectar"
                  className="text-danger"
                  color="danger"
                  onPress={onOpen}
                  startContent={<LogOut size={20} />}
                >
                  Desconectar
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
