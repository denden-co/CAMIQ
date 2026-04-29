import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  title: "Status — CampaignIQ",
  description: "Live status of CampaignIQ services — API, analysis engine, and LLM providers.",
};

export default function StatusPage() {
  return (
    <ComingSoon
      title="System status"
      description="Live uptime and incident history for the CampaignIQ API, analysis engine, and connected LLM providers."
    />
  );
}
