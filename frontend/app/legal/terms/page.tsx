import { LegalPage } from "@/components/legal-page";

export const metadata = {
  title: "Terms of Service — CampaignIQ",
  description: "The terms governing your use of CampaignIQ.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated="10 June 2026"
      intro="These terms govern your use of the CampaignIQ platform. By creating an account or using the service you agree to them. Please read them — they are short and in plain English."
      sections={[
        {
          heading: "The service",
          body: [
            "CampaignIQ provides sentiment analysis, topic modelling, voter persona generation, AI strategy suggestions, and bias auditing for political text data. The service is provided on an \"as is\" basis while in active development, and features may change.",
          ],
        },
        {
          heading: "Your account",
          body: [
            "You are responsible for keeping your login credentials secure and for all activity under your account. You must provide accurate registration information and be at least 18 years old.",
          ],
        },
        {
          heading: "Acceptable use",
          body: ["You agree not to use CampaignIQ to:"],
          bullets: [
            "Break any law or regulation, including electoral law in any jurisdiction where you operate.",
            "Upload data you do not have the right to process.",
            "Target, harass, or suppress voters or voter groups.",
            "Generate or spread disinformation.",
            "Probe, scan, or test the vulnerability of the service without written permission.",
            "Resell or white-label the service without an agreement with us.",
          ],
        },
        {
          heading: "Analytical outputs are advisory",
          body: [
            "Sentiment scores, personas, strategy recommendations, and predictions are statistical estimates, not facts. They carry error and bias, which the platform discloses where it can. You are responsible for how you use them. CampaignIQ outputs must not be presented as polling data.",
          ],
        },
        {
          heading: "Your data and our IP",
          body: [
            "You keep all rights to the datasets you upload and the analyses generated from them. We keep all rights to the platform, models, and software. You grant us a limited licence to process your uploads solely to provide the service to you.",
          ],
        },
        {
          heading: "Liability",
          body: [
            "To the maximum extent permitted by law, CampaignIQ is not liable for indirect or consequential losses, including campaign outcomes, arising from use of the service. Nothing in these terms limits liability that cannot lawfully be limited.",
          ],
        },
        {
          heading: "Suspension and termination",
          body: [
            "We may suspend or close accounts that breach these terms, with notice where practicable. You may close your account at any time; see the Privacy Policy for what happens to your data afterwards.",
          ],
        },
        {
          heading: "Governing law",
          body: [
            "These terms are governed by the laws of England and Wales, and the courts of England and Wales have exclusive jurisdiction.",
          ],
        },
      ]}
    />
  );
}
