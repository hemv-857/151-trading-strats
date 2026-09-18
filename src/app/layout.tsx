import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "151 Trading Strategies — Interactive Quant Research Terminal",
  description: "An interactive companion to Kakushadze & Serur's 151 Trading Strategies. Browse 150+ strategies across 18 asset classes, run quantitative backtests, and visualize options payoff diagrams.",
  keywords: ["trading strategies", "quantitative finance", "options", "backtesting", "Black-Scholes", "momentum", "pairs trading", "151 Trading Strategies"],
  authors: [{ name: "Based on Kakushadze & Serur (2018)" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "151 Trading Strategies — Quant Research Terminal",
    description: "Browse 150+ strategies, run backtests, and visualize options payoffs.",
    siteName: "Quant Research Terminal",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <SonnerToaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
