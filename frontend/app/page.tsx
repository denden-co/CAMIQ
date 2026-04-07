import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
        <span className="mb-6 rounded-full border border-border bg-muted px-4 py-1 text-sm text-muted-foreground">
          Global Political Intelligence Platform
        </span>
        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          CampaignIQ
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Sentiment analysis, voter personas, and AI strategy for elections
          worldwide. Multilingual, electoral-system aware, and built on
          peer-reviewed research.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/login"
            className="rounded-md bg-primary px-6 py-3 text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-border bg-background px-6 py-3 text-foreground transition hover:bg-muted"
          >
            View dashboard
          </Link>
        </div>
        <p className="mt-16 text-xs text-muted-foreground">
          Derived from doctoral research at the University of East London
        </p>
      </section>
    </main>
  );
}
