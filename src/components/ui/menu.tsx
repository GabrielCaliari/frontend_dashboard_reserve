'use client'

import { useState } from "react";
import { LayoutDashboardIcon, Menu, TicketIcon, X } from "lucide-react";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { useRouter } from "nextjs-toploader/app";
import { HiOutlineDatabase, HiOutlineDocumentSearch } from "react-icons/hi";

export function MenuHamburguer() {
  const [isOpen, setIsOpen] = useState(false);

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
          <DropdownMenu aria-label="Menu de navegação">
            <DropdownItem key="home" onPress={() => push('/home')} startContent={<LayoutDashboardIcon size={15}/>}>
              Dashboard
            </DropdownItem>
            <DropdownItem key="about" onPress={() => push('/home/analise-de-marca')} startContent={<HiOutlineDocumentSearch size={15}/>}>
              Análise de marca
            </DropdownItem>
            <DropdownItem key="services"  onPress={() => push('/home/base-de-leads')} startContent={<HiOutlineDatabase/>}>
              Base de Leads
            </DropdownItem>
            <DropdownItem key="contact" onPress={() => push('/home/meu-perfil?callback=plans')} startContent={<TicketIcon size={15}/>}>
              Pagamentos
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
  );
}