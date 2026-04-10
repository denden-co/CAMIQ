import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CountryProvider } from "@/lib/country-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CampaignIQ — Global Political Intelligence",
  description:
    "Sentiment analysis, voter personas, and AI strategy for elections worldwide.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <CountryProvider>{children}</CountryProvider>
      </body>
    </html>
  );
}
