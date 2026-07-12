import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { PracticeProvider } from "@/context/PracticeContext";
import { ThemeWrapper } from "@/components/ThemeWrapper";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Proof of Practice — A Private Practice Journal",
  description: "Log your daily practice sessions, build verified streaks, and mint on-chain milestones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <PracticeProvider>
          <ThemeWrapper>
            {children}
            <Analytics />
          </ThemeWrapper>
        </PracticeProvider>
      </body>
    </html>
  );
}
