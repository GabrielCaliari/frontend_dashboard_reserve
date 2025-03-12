"use client";

import { Tabs, Tab } from "@nextui-org/react";
import { LoginForm } from "../forms/login-form";
import { useSearchParams } from "next/navigation";

export function AuthTabs() {
  const search = useSearchParams();

  return (
    <>
      <Tabs
        aria-label="metodos-de-login"
        fullWidth
      >
        <Tab key="Login" title="Login" className="text-base font-medium">
          <LoginForm />
        </Tab>
      </Tabs>
    </>
  );
}
