import Link from "next/link";

const FEATURES = [
  {
    icon: "📊",
    title: "Sentiment Analysis",
    desc: "Multi-model NLP engine with XLM-RoBERTa for 100+ languages",
  },
  {
    icon: "👥",
    title: "Voter Personas",
    desc: "LLM-generated personas grounded in real conversation data",
  },
  {
    icon: "🧠",
    title: "AI Strategy",
    desc: "Data-driven campaign recommendations from multiple LLM providers",
  },
  {
    icon: "⚖️",
    title: "Bias Audit",
    desc: "Statistical fairness checks across language groups and labels",
  },
  {
    icon: "🌍",
    title: "Global Coverage",
    desc: "Any country, any election — FPTP, PR, MMP, two-round systems",
  },
  {
    icon: "📈",
    title: "Topic Modelling",
    desc: "BERTopic, LDA, NMF — discover what voters are really saying",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* ── Hero ──────────────────────────────────── */}
      <section className="hero-mesh relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-40 h-60 w-60 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-purple-500/8 blur-3xl" />

        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <span className="text-lg font-bold tracking-tight text-foreground">
            Campaign<span className="text-gradient">IQ</span>
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="btn-gradient rounded-lg px-4 py-2 text-sm"
            >
              Dashboard
            </Link>
          </div>
        </nav>

        <div className="mx-auto flex max-w-5xl flex-col items-center px-5 pb-20 pt-16 text-center sm:px-8 sm:pb-28 sm:pt-24">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Global Political Intelligence
          </span>

          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-7xl">
            Intelligence that
            <br />
            <span className="text-gradient">wins elections</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Sentiment analysis, voter personas, and AI-powered strategy for
            elections worldwide. Multilingual, electoral-system aware, and
            built on peer-reviewed research.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/login"
              className="btn-gradient rounded-xl px-8 py-3.5 text-sm font-semibold shadow-lg"
            >
              Get started free
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-border bg-white/80 px-8 py-3.5 text-sm font-semibold text-foreground shadow-sm backdrop-blur-sm transition hover:shadow-md hover:border-primary/30"
            >
              View demo dashboard
            </Link>
          </div>
        </div>

        {/* Gradient divider */}
        <div className="divider-gradient" />
      </section>

      {/* ── Features grid ─────────────────────────── */}
      <section className="bg-white px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Every tool a campaign analyst needs
            </h2>
            <p className="mt-3 text-muted-foreground">
              Six integrated modules — from raw text to actionable strategy.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border/60 bg-white p-6 shadow-soft transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary/20"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-xl">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Origin strip ──────────────────────────── */}
      <section className="border-t border-border/40 bg-muted/30 px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Derived from doctoral research at the University of East London
          </p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            Ensemble model (weighted RoBERTa + BERTweet) — 80.3% accuracy
            for 3-class sentiment
          </p>
        </div>
      </section>
    </main>
  );
}
