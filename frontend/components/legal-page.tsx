import type { Route } from "next";
import Link from "next/link";

export interface LegalSection {
  heading: string;
  /** Paragraphs of body text. */
  body: string[];
  /** Optional bullet list rendered after the paragraphs. */
  bullets?: string[];
}

interface LegalPageProps {
  title: string;
  intro: string;
  lastUpdated: string;
  sections: LegalSection[];
}

const LEGAL_LINKS: { label: string; href: Route }[] = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Cookies", href: "/legal/cookies" },
  { label: "Security", href: "/legal/security" },
];

/**
 * Shared layout for legal pages — consistent nav, readable measure,
 * clear section hierarchy, and cross-links between policies.
 */
export function LegalPage({
  title,
  intro,
  lastUpdated,
  sections,
}: LegalPageProps) {
  return (
    <main className="min-h-screen bg-background">
      <header className="nav-bar sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="logomark">C</span>
            <span className="text-[15px] font-semibold tracking-tight">
              CampaignIQ
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          {intro}
        </p>

        <div className="divider my-10" />

        {sections.map((section) => (
          <section key={section.heading} className="mb-10">
            <h2 className="font-display text-xl font-semibold text-foreground">
              {section.heading}
            </h2>
            {section.body.map((paragraph, i) => (
              <p
                key={i}
                className="mt-3 text-[15px] leading-relaxed text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
            {section.bullets && (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-muted-foreground">
                {section.bullets.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <div className="divider my-10" />

        <nav aria-label="Legal pages" className="flex flex-wrap gap-2">
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="chip">
              {link.label}
            </Link>
          ))}
        </nav>
      </article>
    </main>
  );
}
