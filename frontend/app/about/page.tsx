import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  title: "About — CampaignIQ",
  description: "The story behind CampaignIQ — doctoral research operationalised into a global political intelligence platform.",
};

export default function AboutPage() {
  return (
    <ComingSoon
      title="About CampaignIQ"
      description="How a doctoral thesis on the 2024 UK General Election became a global political intelligence platform, and the principles we build by."
    />
  );
}
