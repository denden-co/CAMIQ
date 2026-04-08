import type { Metadata } from "next";
import "./globals.css";
import { CountryProvider } from "@/lib/country-context";

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
    <html lang="en">
      <body>
        <CountryProvider>{children}</CountryProvider>
      </body>
    </html>
  );
}
