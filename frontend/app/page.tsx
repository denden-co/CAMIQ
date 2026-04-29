import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  Globe2,
  Hexagon,
  type LucideIcon,
  Scale,
  Sparkles,
  Users,
} from "lucide-react";

// Six modules — displayed as a tight grid with lucide icons.
type Feature = { Icon: LucideIcon; title: string; desc: string };

const FEATURES: Feature[] = [
  {
    Icon: Activity,
    title: "Sentiment analysis",
    desc: "Multi-model ensemble with XLM-RoBERTa for 100+ languages. Confidence scores, not just labels.",
  },
  {
    Icon: Users,
    title: "Voter personas",
    desc: "Narrative personas generated from real conversation data, not invented demographics.",
  },
  {
    Icon: Sparkles,
    title: "AI strategy",
    desc: "Recommendations grounded in your data, with source-linked reasoning.",
  },
  {
    Icon: Scale,
    title: "Bias & fairness audit",
    desc: "Gini, chi-square, 4/5ths rule. Know where your model is blind before you ship a strategy.",
  },
  {
    Icon: Globe2,
    title: "Global coverage",
    desc: "FPTP, PR, MMP, two-round. UK, US, India, France, Germany, Brazil, Nigeria — and custom profiles.",
  },
  {
    Icon: Hexagon,
    title: "Topic modelling",
    desc: "BERTopic, LDA, NMF — discover what voters actually talk about, not what polls ask.",
  },
];

/**
 * Root route — `/`.
 *
 * If the user is already signed in (dev cookie present, or a Supabase session
 * cookie exists once Phase 8 lands), send them straight to the dashboard. The
 * marketing landing page below is only rendered for visitors who are not yet
 * signed in.
 *
 * Rationale: Frontend Prompt Instructions (29 Apr 2026) — "build the actual
 * usable experience as the first screen, not marketing or explanatory
 * content." For an analyst tool, the dashboard IS the experience.
 */
export default async function HomePage() {
  const cookieStore = await cookies();
  if (cookieStore.get("campaigniq_dev_auth")?.value) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background">
      {/* ──────────────────────────────── Nav ──────────────────────────────── */}
      <nav className="nav-bar sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="logomark">C</span>
              <span className="text-[15px] font-semibold tracking-tight">
                CampaignIQ
              </span>
            </Link>
            <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
              <Link href="/#features" className="hover:text-foreground">Product</Link>
              <Link href="/#pricing" className="hover:text-foreground">Pricing</Link>
              <Link href="/#research" className="hover:text-foreground">Research</Link>
              <Link href="/#docs" className="hover:text-foreground">Docs</Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="btn-gradient rounded-lg px-4 py-2 text-sm"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ──────────────────────────────── Hero ─────────────────────────────── */}
      <section className="hero-mesh">
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-20 sm:px-8 sm:pt-24">
          <div className="max-w-3xl">
            <div className="chip mb-6">
              <span className="dot" />
              Built on peer-reviewed doctoral research
            </div>

            <h1 className="font-display text-5xl font-semibold leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
              Political intelligence,
              <br />
              <span className="text-gradient">grounded in evidence.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Sentiment analysis, voter personas, and AI strategy for elections
              worldwide. Multilingual, electoral-system aware, and built from
              the ground up to earn trust.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="btn-gradient rounded-lg px-5 py-3 text-sm"
              >
                Start free — no card required
              </Link>
              <Link
                href="/#contact"
                className="rounded-lg border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-foreground/30"
              >
                Book a demo
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>Free for researchers</span>
              <span className="text-border">·</span>
              <span>GDPR-ready</span>
              <span className="text-border">·</span>
              <span>100+ languages</span>
            </div>
          </div>

          {/* Product preview card */}
          <div className="mt-16 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <span className="h-3 w-3 rounded-full bg-muted" />
              <span className="h-3 w-3 rounded-full bg-muted" />
              <span className="h-3 w-3 rounded-full bg-muted" />
              <span className="ml-3 text-xs text-muted-foreground">
                campaigniq.app / analyze / 2024-UK-general
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="border-b border-border p-6 md:border-b-0 md:border-r">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Overall sentiment
                </p>
                <p className="mt-2 text-3xl font-semibold">+0.42</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  8,412 posts analysed
                </p>
                <svg
                  className="mt-4 h-10 w-full"
                  viewBox="0 0 200 40"
                  preserveAspectRatio="none"
                >
                  <polyline
                    points="0,28 20,24 40,30 60,18 80,22 100,14 120,20 140,10 160,18 180,8 200,14"
                    fill="none"
                    stroke="hsl(var(--accent))"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div className="border-b border-border p-6 md:border-b-0 md:border-r">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Model agreement
                </p>
                <p className="mt-2 text-3xl font-semibold">80.3%</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ensemble across 5 models
                </p>
                <div className="mt-4 grid grid-cols-5 gap-1">
                  <div className="h-6 rounded bg-foreground" />
                  <div className="h-6 rounded bg-foreground" />
                  <div className="h-6 rounded bg-foreground" />
                  <div className="h-6 rounded bg-foreground" />
                  <div className="h-6 rounded bg-border" />
                </div>
              </div>
              <div className="p-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Top topics
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span>Cost of living</span>
                    <span className="text-muted-foreground">24%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>NHS</span>
                    <span className="text-muted-foreground">19%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Immigration</span>
                    <span className="text-muted-foreground">14%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Housing</span>
                    <span className="text-muted-foreground">11%</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────── Features ─────────────────────────────── */}
      <section
        id="features"
        className="border-y border-border bg-card"
      >
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <div className="max-w-2xl">
            <div className="chip chip-accent mb-4">
              <span className="dot" />
              Six modules, one workflow
            </div>
            <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
              Every tool a campaign analyst needs.
            </h2>
            <p className="mt-4 text-muted-foreground">
              From raw social data to strategic recommendations — all modules
              share the same analysis cache, country config, and audit trail.
            </p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="card-hover bg-card p-8"
              >
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card">
                  <f.Icon className="h-4 w-4 text-foreground" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Origin / research strip ─────────────────── */}
      <section
        id="research"
        className="border-b border-border bg-background"
      >
        <div className="mx-auto max-w-4xl px-5 py-14 text-center sm:px-8">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Derived from doctoral research at the University of East London
          </p>
          <p className="mt-3 text-sm text-muted-foreground/80">
            Ensemble model (weighted RoBERTa + BERTweet) — 80.3% accuracy for
            3-class sentiment. Peer-reviewed methodology.
          </p>
        </div>
      </section>

      {/* ────────────────────────────── Footer ─────────────────────────────── */}
      <footer className="bg-foreground text-background/80">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-background text-[13px] font-bold text-foreground">
                C
              </span>
              <span className="font-semibold text-background">CampaignIQ</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-background/60">
              Political intelligence, grounded in evidence. Built from doctoral
              research at the University of East London.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-background/50">
              Product
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/#features" className="hover:text-background">Features</Link></li>
              <li><Link href="/#pricing" className="hover:text-background">Pricing</Link></li>
              <li><Link href="/changelog" className="hover:text-background">Changelog</Link></li>
              <li><Link href="/status" className="hover:text-background">Status</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-background/50">
              Company
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-background">About</Link></li>
              <li><Link href="/#research" className="hover:text-background">Research</Link></li>
              <li><Link href="/blog" className="hover:text-background">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-background">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-background/50">
              Legal
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/legal/privacy" className="hover:text-background">Privacy</Link></li>
              <li><Link href="/legal/terms" className="hover:text-background">Terms</Link></li>
              <li><Link href="/legal/cookies" className="hover:text-background">Cookies</Link></li>
              <li><Link href="/legal/security" className="hover:text-background">Security</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-background/10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-background/50 sm:flex-row sm:px-8">
            <p>© 2026 CampaignIQ Ltd. All rights reserved.</p>
            <p>Made with research, in London.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
