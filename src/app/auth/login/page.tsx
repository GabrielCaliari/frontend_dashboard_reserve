import { AuthTabs } from "@/src/components/tabs/auth-tabs";
import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/src/components/ui/language-switcher";

export default async function Page() {
  const t = await getTranslations("auth");

  return (
    <div className="min-h-screen w-full bg-[#0a0a0f] overflow-x-hidden">
      <div className="min-h-screen flex flex-col">

        {/* Header */}
        <header className="shrink-0 px-4 py-4 sm:px-8 sm:py-6 lg:px-12 lg:py-10">
          <div className="flex items-center justify-between w-full max-w-screen-xl mx-auto">
            <img
              src="/zarp-logomark-h.svg"
              alt="logo"
              className="h-7 sm:h-8 lg:h-9"
            />
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="https://zarpy.app"
                className="hidden sm:inline text-sm text-blue-400 font-semibold hover:text-blue-300 transition-colors"
              >
                {t("accessSystem")}
              </Link>
              <LanguageSwitcher variant="full" />
            </div>
          </div>
        </header>

        {/* Form — centered vertically in remaining space */}
        <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8 sm:py-10">
          <div className="w-full max-w-[480px] flex flex-col">
            <div className="flex flex-col gap-2 mb-8 sm:mb-10 text-center">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-100">
                {t("adminAuth")}
              </h2>
              <span className="text-gray-400 text-sm">
                {t("fillCredentials")}
              </span>
            </div>
            <Suspense>
              <AuthTabs />
            </Suspense>
          </div>
        </main>

      </div>
    </div>
  );
}
