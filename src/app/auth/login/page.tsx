import { AuthTabs } from "@/src/components/tabs/auth-tabs";
import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/src/components/ui/language-switcher";

export default async function Page() {
  const t = await getTranslations("auth");

  return (
    <div className="h-screen w-screen grid grid-cols-1 lg:grid-cols-[1fr_auto] bg-[#0a0a0f] overflow-x-hidden">
      <div className="flex flex-col gap-2">
        <div className="p-12 pt-12 pb-0 pl-12 pr-12">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <img src="/zarp-logomark-h.svg" alt="logo" className="max-h-[36px]" />
            </div>
            <div className="flex items-center gap-4">
              <Link href="https://zarpy.app" className="text-sm text-blue-400 font-semibold hover:text-blue-300">
                {t("accessSystem")}
              </Link>
              <LanguageSwitcher variant="full" />
            </div>
          </div>
        </div>
        <div className="mt-16 w-full max-w-[480px] flex flex-col self-center transition-all duration-450 ease-in-out px-4 sm:px-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-center text-gray-100">
              {t("adminAuth")}
            </h2>
            <span className="text-gray-400 text-sm text-center">
              {t("fillCredentials")}
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
