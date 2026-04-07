import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
