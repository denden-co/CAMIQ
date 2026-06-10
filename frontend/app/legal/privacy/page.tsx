import { LegalPage } from "@/components/legal-page";

export const metadata = {
  title: "Privacy Policy — CampaignIQ",
  description: "How CampaignIQ collects, uses, and protects personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="10 June 2026"
      intro="CampaignIQ is a UK-based political intelligence platform. This policy explains what personal data we collect, why we collect it, and the rights you have over it under UK GDPR and the Data Protection Act 2018."
      sections={[
        {
          heading: "Who we are",
          body: [
            "CampaignIQ is operated from the United Kingdom. We act as the data controller for personal data processed through this website and platform. You can reach us through the contact page for any privacy question or request.",
          ],
        },
        {
          heading: "What we collect",
          body: ["We collect only what we need to run the service:"],
          bullets: [
            "Account data — your name and email address when you create an account.",
            "Content you upload — text and CSV datasets you submit for analysis. You are responsible for ensuring you have the right to upload this content.",
            "Usage data — pages visited and features used, to improve the product.",
            "Technical data — IP address, browser type, and device information collected automatically for security and performance.",
          ],
        },
        {
          heading: "Why we process it (lawful basis)",
          body: [
            "We process account data to perform our contract with you. We process usage and technical data under legitimate interest — keeping the service secure and improving it. Where we rely on consent (for example, optional analytics cookies), you can withdraw it at any time.",
          ],
        },
        {
          heading: "Analysis data and third-party sources",
          body: [
            "Datasets you upload for sentiment or topic analysis may contain public social media posts. We process this content solely to provide the analysis you request. We do not use your datasets to train our models, and we do not sell or share them with advertisers.",
            "Where analysis features use third-party AI providers (for example, persona or strategy generation), only the minimum text needed for the request is sent, and never your account details.",
          ],
        },
        {
          heading: "How long we keep data",
          body: [
            "Saved analyses are retained until you delete them or close your account. Account data is removed within 30 days of account closure. Server logs are kept for up to 90 days for security purposes.",
          ],
        },
        {
          heading: "International transfers",
          body: [
            "Our infrastructure providers may process data outside the UK. Where that happens, transfers are protected by UK-approved safeguards such as the UK International Data Transfer Agreement or adequacy regulations.",
          ],
        },
        {
          heading: "Your rights",
          body: ["Under UK GDPR you have the right to:"],
          bullets: [
            "Access a copy of your personal data.",
            "Correct inaccurate data.",
            "Request deletion of your data.",
            "Object to or restrict processing.",
            "Data portability — receive your data in a machine-readable format.",
            "Complain to the Information Commissioner's Office (ico.org.uk) if you believe we have mishandled your data.",
          ],
        },
        {
          heading: "Changes to this policy",
          body: [
            "We will post any changes on this page and update the date at the top. Significant changes will be flagged to account holders by email.",
          ],
        },
      ]}
    />
  );
}
