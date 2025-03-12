import { Metadata } from "next";

import "@/styles/globals.css";

import clsx from "clsx";

import { fontSans } from "@/config/fonts";

import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import { Header } from "../components/ui/header";

import NextTopLoader from "nextjs-toploader";
import { PiBotChat } from "../components/ui/pi-bot";

export const metadata: Metadata = {
  title: "PPPI | Ecossistema inteligente",
  description: "Programa de registro e proteção de marcas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head />
      <body
        className={clsx(
          "bg-[#e2e9ff] font-sans antialiased min-h-screen",
          fontSans.variable
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "white" }}>
          <Header />
          <NextTopLoader color="#006fee" showSpinner={false} height={4} />
          {children}
          <Toaster position="top-center" reverseOrder={false} />
          {/* <PiBotChat /> */}
        </Providers>
      </body>
    </html>
  );
}
