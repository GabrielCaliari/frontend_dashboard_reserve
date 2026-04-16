"use client";

import { Tabs, Tab } from "@heroui/react";
import { LoginForm } from "../forms/login-form";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export function AuthTabs() {
  const t = useTranslations("auth");
  const search = useSearchParams();

  return (
    <>
      <LoginForm />
    </>
  );
}
