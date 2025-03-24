import { Metadata } from "next";

import "@/styles/globals.css";

import clsx from "clsx";

import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import { Header } from "../components/ui/header";
import { Space_Grotesk } from "next/font/google"

import NextTopLoader from "nextjs-toploader";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
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
    <html lang="pt-br" className={spaceGrotesk.variable} suppressHydrationWarning>
      <head />
      <body
        className="bg-[#e2e9ff] antialiased min-h-screen font-sans"
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
