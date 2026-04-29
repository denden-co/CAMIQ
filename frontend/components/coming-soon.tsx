import Link from "next/link";

interface ComingSoonProps {
  title: string;
  description?: string;
}

/**
 * Shared "coming soon" scaffold for not-yet-built public pages.
 * Gives legal, marketing, and meta pages a consistent placeholder
 * with proper nav/footer so links work and SEO crawlers don't 404.
 */
export function ComingSoon({ title, description }: ComingSoonProps) {
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

      <section className="mx-auto max-w-3xl px-5 py-24 sm:px-8 sm:py-32">
        <div className="chip mb-6">
          <span className="dot" />
          Coming soon
        </div>
        <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        <p className="mt-10 text-sm text-muted-foreground">
          This page is on the roadmap and will be published ahead of public
          launch. In the meantime, questions? {" "}
          <Link href="/contact" className="text-foreground underline underline-offset-4">
            Get in touch
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
