import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  title: "Blog — CampaignIQ",
  description: "Research, methodology, and product updates from the CampaignIQ team.",
};

export default function BlogPage() {
  return (
    <ComingSoon
      title="Blog & insights"
      description="Methodology notes, research write-ups, and product updates from the CampaignIQ team. Deep dives on sentiment analysis, fairness auditing, and electoral-system modelling."
    />
  );
}
