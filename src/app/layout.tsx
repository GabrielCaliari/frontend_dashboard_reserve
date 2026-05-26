import { Metadata } from "next";

import "@/src/common/styles/globals.css";

import clsx from "clsx";

import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import { Header } from "../components/ui/header";
import { Inter, Bricolage_Grotesque } from "next/font/google";

import NextTopLoader from "nextjs-toploader";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZARP | Admin Dashboard",
  description: "Painel administrativo do ecossistema ZARP",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${bricolage.variable}`} suppressHydrationWarning>
      <head />
      <body className="bg-background text-foreground antialiased min-h-screen font-sans !pointer-events-auto">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers themeProps={{ attribute: "class", defaultTheme: "system", enableSystem: true }}>
            <Header />
            <NextTopLoader color="hsl(var(--brand-green))" showSpinner={false} height={4} />
            {children}
            <Toaster position="top-center" reverseOrder={false} />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
