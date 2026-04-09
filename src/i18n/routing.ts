import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt", "en"],
  defaultLocale: "pt",
  localePrefix: "as-needed",
});

export const { locales, defaultLocale, localePrefix } = routing;
export type AppLocale = (typeof locales)[number];
