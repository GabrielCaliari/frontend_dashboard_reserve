import { Montserrat as FontSans, Montserrat as FontMono } from "next/font/google";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["100","300","400", "500", "700", "900"],
});

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["100","300","400", "500", "700"],
});
