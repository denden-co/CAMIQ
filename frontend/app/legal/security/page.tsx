import { LegalPage } from "@/components/legal-page";

export const metadata = {
  title: "Security — CampaignIQ",
  description: "How CampaignIQ keeps your data and account safe.",
};

export default function SecurityPage() {
  return (
    <LegalPage
      title="Security"
      lastUpdated="10 June 2026"
      intro="Political data deserves serious protection. This page describes the measures CampaignIQ takes to keep your account and datasets safe, and how to report a vulnerability."
      sections={[
        {
          heading: "Encryption",
          body: [
            "All traffic between your browser and CampaignIQ is encrypted with TLS. Data at rest is encrypted by our infrastructure providers using industry-standard AES-256.",
          ],
        },
        {
          heading: "Access control",
          body: [
            "Your analyses are private to your account. Access is enforced at the database layer with row-level security, so one user's data is never visible to another. Administrative access to production systems is restricted and logged.",
          ],
        },
        {
          heading: "Data isolation and minimisation",
          body: [
            "Uploaded datasets are processed only to deliver the analysis you request. We do not use customer data to train models. Where external AI providers are used for generation features, requests contain only the text required — never account identifiers.",
          ],
        },
        {
          heading: "Dependencies and patching",
          body: [
            "We monitor our software dependencies for published vulnerabilities and apply security patches promptly. The platform is built on actively maintained, widely audited open-source frameworks.",
          ],
        },
        {
          heading: "Responsible disclosure",
          body: [
            "If you believe you have found a security vulnerability in CampaignIQ, please report it through the contact page with enough detail to reproduce it. We ask that you do not access other users' data or disrupt the service while investigating. We will acknowledge reports promptly and keep you informed as we fix confirmed issues.",
          ],
        },
        {
          heading: "Incident response",
          body: [
            "If a breach affecting personal data occurs, we will assess and contain it, notify the ICO where required within 72 hours, and inform affected users without undue delay.",
          ],
        },
      ]}
    />
  );
}
