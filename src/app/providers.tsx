"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";

import { NextUIProvider } from "@nextui-org/system";
import { useRouter } from 'nextjs-toploader/app';

import { ThemeProvider as NextThemesProvider } from "next-themes";

import { QueryClient, QueryClientProvider } from "react-query";

import { Toaster } from "sonner";

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

  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <NextUIProvider navigate={router.push}>
        <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
        <Toaster richColors position="bottom-center"/>
      </NextUIProvider>
    </QueryClientProvider>
  );
}
