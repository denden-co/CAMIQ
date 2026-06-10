import { LegalPage } from "@/components/legal-page";

export const metadata = {
  title: "Cookie Policy — CampaignIQ",
  description: "How CampaignIQ uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      lastUpdated="10 June 2026"
      intro="This page lists the cookies and similar technologies CampaignIQ uses, what they do, and the choices you have. We keep it deliberately minimal — no advertising or cross-site tracking cookies, ever."
      sections={[
        {
          heading: "Strictly necessary",
          body: [
            "These are required for the platform to work and cannot be switched off:",
          ],
          bullets: [
            "Authentication cookie — keeps you signed in between pages.",
            "Security tokens — protect forms against cross-site request forgery.",
          ],
        },
        {
          heading: "Preferences (local storage)",
          body: [
            "We use your browser's local storage — not cookies — to remember choices like your selected country profile. This data never leaves your device and is cleared when you clear your browser data.",
          ],
        },
        {
          heading: "Analytics",
          body: [
            "We do not currently run any analytics cookies. If we introduce privacy-respecting analytics in future, they will be off by default and this page will be updated first, with an opt-in control.",
          ],
        },
        {
          heading: "Managing cookies",
          body: [
            "You can block or delete cookies in your browser settings at any time. Blocking strictly necessary cookies will prevent sign-in from working.",
          ],
        },
      ]}
    />
  );
}
