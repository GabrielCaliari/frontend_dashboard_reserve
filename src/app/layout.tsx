import { Metadata } from "next";

import "@/styles/globals.css";

import clsx from "clsx";

import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import { Header } from "../components/ui/header";
import { Nunito } from "next/font/google";

import NextTopLoader from "nextjs-toploader";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito",
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
    <html lang={locale} className={`${nunito.variable} dark`} suppressHydrationWarning>
      <head />
      <body className="bg-[#0a0a0f] text-gray-100 antialiased min-h-screen font-nunito !pointer-events-auto">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
            <Header />
            <NextTopLoader color="hsl(var(--foreground))" showSpinner={false} height={4} />
            {children}
            <Toaster position="top-center" reverseOrder={false} />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
