import { AuthTabs } from "@/src/components/tabs/auth-tabs";
import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/src/components/ui/language-switcher";
import { ThemeSwitcher } from "@/src/components/ui/theme-switcher";

export default async function Page() {
  const t = await getTranslations("auth");

  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="shrink-0 px-4 py-4 sm:px-8 sm:py-6 lg:px-12 lg:py-10">
          <div className="flex items-center justify-between w-full max-w-screen-xl mx-auto">
            <img
              src="/reserve-logomark-h-light.svg"
              alt="logo"
              className="h-7 sm:h-8 lg:h-9 dark:hidden block"
            />
            <img
              src="/reserve-logomark-h-dark.svg"
              alt="logo"
              className="h-7 sm:h-8 lg:h-9 hidden dark:block"
            />
            <div className="flex items-center gap-3 sm:gap-4">
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {/* Form — centered vertically in remaining space */}
        <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8 sm:py-10">
          <div className="w-full max-w-[480px] flex flex-col">
            <div className="flex flex-col gap-2 mb-8 sm:mb-10 text-center">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                {t("adminAuth")}
              </h2>
              <span className="text-muted-foreground text-sm">
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
