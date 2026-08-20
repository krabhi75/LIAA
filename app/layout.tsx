import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import "./nova.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MolVaani — Agora voice that closes the sauda",
  description:
    "Live Agora Conversational AI sales desk: barge-in, tools, CRM, and human escalation.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${inter.className} min-h-full`}>{children}</body>
    </html>
  );
}
