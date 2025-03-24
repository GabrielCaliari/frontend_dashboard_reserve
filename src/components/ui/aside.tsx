"use client";

import { Button } from "@nextui-org/react";

import Link from "next/link";

import {
  Copyright,
  LayoutDashboardIcon,
  TicketIcon,
  User,
  Users,
} from "lucide-react";

import { HiOutlineDatabase, HiOutlineDocumentSearch } from "react-icons/hi";

import { getCookie } from "cookies-next";

import { useRouter } from 'nextjs-toploader/app';

interface SidebarProps {
  activeTab: any;
}

export function Sidebar({ activeTab }: SidebarProps) {

  const { push } = useRouter();

  const userName = getCookie("session-name") as string;

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboardIcon,
      path: "/dashboard"
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: HiOutlineDatabase,
      path: '/dashboard/leads'
    },
    {
      id: 'lead-qualification',
      label: 'Leads da triagem',
      icon: Users,
      path: '/dashboard/leads-triagem'
    }
  ];

  return (
    <>
      <aside className="bg-white w-[310px] border-r border-gray-300 p-3 shadow-lg flex-col justify-between hidden md:flex">
        <div>
          <div className="flex flex-col">
            <Link
              href="/dashboard"
              className="flex items-center justify-between hover:bg-slate-100 p-2 hover:cursor-pointer hover:rounded-lg"
            >
              <div className="flex items-center gap-3 rounded-lg w-full">
                <div className="relative flex items-center justify-center rounded-full w-[58px] h-[45px] bg-[#9292b2]">
                  <User color="#FFF" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex flex-col w-full">
                  <h1 className="flex items-center font-bold text-base text-black capitalize tracking-wide">
                    {userName}
                  </h1>
                  <p className="text-sm text-gray-500">Espaço de trabalho admin</p>
                </div>
              </div>
            </Link>
          </div>
          <hr className="my-3 border-gray-300" />

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Button
                key={item.id}
                size="lg"
                variant="light"
                onPress={() => push(item.path)}
                className={`flex items-center justify-start gap-3 px-2 py-2 rounded-lg ${activeTab === item.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700"
                  }`}
              >
                <item.icon
                  className={`text-2xl ${activeTab === item.id ? "text-blue-700" : "text-blue-600"
                    }`}
                />
                <span>{item.label}</span>
              </Button>
            ))}

            {/* <div className="flex items-center gap-3  px-2 py-3 cursor-not-allowed rounded-lg  text-gray-500" title="Em manuntenção...">
              <Copyright className="text-2xl" />
              <span>Monitoramento</span>
              <span className="ml-auto text-xs bg-yellow-500 text-white py-1 px-2 rounded-full">
                Manutenção
              </span>
            </div> */}
          </nav>
        </div>
      </aside>
    </>
  );
}
