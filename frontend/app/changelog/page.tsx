import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  title: "Changelog — CampaignIQ",
  description: "What's new in CampaignIQ — product updates and release notes.",
};

export default function ChangelogPage() {
  return (
    <ComingSoon
      title="Changelog"
      description="A running log of what we ship — new features, model updates, country profiles, and quality improvements. Public and dated, so you always know what changed."
    />
  );
}
