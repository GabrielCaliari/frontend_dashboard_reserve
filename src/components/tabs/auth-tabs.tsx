"use client";

import { Tabs, Tab } from "@nextui-org/react";
import { LoginForm } from "../forms/login-form";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export function AuthTabs() {
  const t = useTranslations("auth");
  const search = useSearchParams();

  return (
    <>
      <Tabs
        aria-label={t("loginMethods")}
        fullWidth
      >
        <Tab key="Login" title={t("login")} className="text-base font-medium">
          <LoginForm />
        </Tab>
      </Tabs>
    </>
  );
}
