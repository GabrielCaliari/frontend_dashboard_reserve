"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";

import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "nextjs-toploader/app";

import { ThemeProvider as NextThemesProvider } from "next-themes";

import { Toaster } from "sonner";

import { TenantQueryProvider } from "@/src/shared/query/tenant-query-provider";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <TenantQueryProvider>
      <HeroUIProvider navigate={router.push}>
        <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
        <Toaster richColors position="bottom-center" />
      </HeroUIProvider>
    </TenantQueryProvider>
  );
}
