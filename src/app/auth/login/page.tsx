import { AuthTabs } from "@/src/components/tabs/auth-tabs";
import Link from "next/link";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="h-screen w-screen grid grid-cols-1 lg:grid-cols-[1fr_auto] bg-white overflow-x-hidden">
      <div className="flex flex-col gap-2">
        <div className="p-12 pt-12 pb-0 pl-12 pr-12">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <img src="/logo-mark.png" alt="logo" className="max-w-[40px]" />
              <h1 className="font-bold text-lg text-primary">PPPI</h1>
            </div>
            <Link href="https://app.pppi.com.br" className="text-sm text-primary font-semibold">
              Acessar sistema
            </Link>
          </div>
        </div>
        <div className="mt-16 w-full max-w-[480px] flex flex-col self-center transition-all duration-450 ease-in-out px-4 sm:px-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-center">
              Autenticação administrativa
            </h2>
            <span className="text-gray-500 text-sm text-center">
              Preencha suas credenciais abaixo para continuar
            </span>
          </div>
          <div className="mt-12 p-5 lg:p-0">
            <Suspense>
              <AuthTabs />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
