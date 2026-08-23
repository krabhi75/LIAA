import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";
import "./nova.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KrishiSaathi AI — Liaa field CRM",
  description:
    "Hindi/Hinglish agri assistant on Agora Conversational AI, with Vobiz phone inbound and outbound.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geist.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap"
        />
      </head>
      <body className={`${inter.className} min-h-full`}>{children}</body>
    </html>
  );
}
