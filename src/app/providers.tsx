"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";

import { HeroUIProvider } from "@heroui/system";
import { useRouter } from 'nextjs-toploader/app';

import { ThemeProvider as NextThemesProvider } from "next-themes";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60 * 1000, // 1 minute - data considered fresh for 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes - cache garbage collection time (formerly cacheTime)
    },
  },
});

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider navigate={router.push}>
        <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
        <Toaster richColors position="bottom-center"/>
      </HeroUIProvider>
    </QueryClientProvider>
  );
}
