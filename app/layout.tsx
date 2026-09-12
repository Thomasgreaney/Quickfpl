import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://quickfpl.com";
const TITLE = "QuickFPL — FPL Price Tracker & AI Fantasy Premier League Tools";
const DESCRIPTION =
  "Every Fantasy Premier League player's price, ownership and price changes in one sortable table, plus an AI assistant and FPL tools for transfers, chips and mini-leagues. No fluff.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "FPL",
    "Fantasy Premier League",
    "FPL price tracker",
    "FPL price changes",
    "FPL transfers",
    "FPL AI",
    "FPL AI assistant",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "QuickFPL",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteNav />
        <div className="flex flex-1 flex-col pb-16 md:pb-0">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
