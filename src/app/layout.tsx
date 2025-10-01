import { Metadata } from "next";

import "@/styles/globals.css";

import clsx from "clsx";

import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import { Header } from "../components/ui/header";
import { Nunito } from "next/font/google"

import NextTopLoader from "nextjs-toploader";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
})

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
    <html lang="pt-br" className={nunito.variable} suppressHydrationWarning>
      <head />
      <body
        className="bg-[#e2e9ff] antialiased min-h-screen font-nunito !pointer-events-auto"
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
