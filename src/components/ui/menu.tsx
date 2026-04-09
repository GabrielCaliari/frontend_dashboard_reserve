"use client";

import { useState } from "react";
import { LayoutDashboardIcon, Menu, TicketIcon, X, Mail } from "lucide-react";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { useRouter } from "nextjs-toploader/app";
import { HiOutlineDatabase, HiOutlineDocumentSearch } from "react-icons/hi";
import { useTranslations } from "next-intl";

export function MenuHamburguer() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("menu");

  const { push } = useRouter();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="lg:hidden">
      <Dropdown>
        <DropdownTrigger>
          <Button isIconOnly variant="light" onClick={toggleMenu}>
            {isOpen ? <X /> : <Menu />}
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label={t("navigationMenu")}>
          <DropdownItem
            key="dashboard"
            onPress={() => push("/dashboard")}
            startContent={<LayoutDashboardIcon size={15} />}
          >
            Dashboard
          </DropdownItem>
          <DropdownItem
            key="leads"
            onPress={() => push("/dashboard/leads")}
            startContent={<HiOutlineDatabase size={15} />}
          >
            {t("leadsAllLeads")}
          </DropdownItem>
          <DropdownItem
            key="email-campaign"
            onPress={() => push("/dashboard/email-campaign")}
            startContent={<Mail size={15} />}
          >
            {t("emailCampaigns")}
          </DropdownItem>
          <DropdownItem
            key="abandoned-carts"
            onPress={() => push("/dashboard/abandoned-carts")}
            startContent={<Mail size={15} />}
          >
            {t("emailAbandonedCarts")}
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
