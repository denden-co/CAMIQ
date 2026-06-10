# CAMIQ Frontend Improvement Plan

*Making CAMIQ feel like a polished, professional product website.*

Author notes: Written in a dyslexia-friendly style — short paragraphs, clear headings, plain English. Skim the headings first, dive into a section when you need detail.

---

## 1. Where you are today (the good news)

You've already done a lot right.

- **Stack:** Next.js 14+ (App Router), TypeScript, Tailwind, shadcn/ui, Recharts, next-intl.
- **Design:** Phase 6 premium redesign done — indigo-violet gradient, Inter font, frosted glass nav, PageShell, gradient cards.
- **Modules live:** Analyze, Bias, Countries, Dashboard, Personas, Strategy, plus Login + Auth.
- **Data auth:** Supabase client installed; dev-mode localStorage mock in place.

In short: the **logged-in product** works. What's missing is the **website around it** — everything a visitor sees before logging in, plus the polish and plumbing that makes the whole thing feel professional.

---

## 2. What a professional website has that CAMIQ is missing

Grouped into seven areas. Each one becomes a phase below.

1. **Public marketing pages** — hero, features, pricing, about, blog, contact.
2. **Trust, legal & security** — privacy, terms, cookies, security page, status page.
3. **SEO & performance** — meta tags, Open Graph, sitemap, structured data, image optimisation.
4. **Product-app polish** — 404/500 pages, error boundaries, toasts, empty states, settings, command palette.
5. **Growth & engagement** — newsletter, lead-capture form, FAQ, help.
6. **Accessibility & internationalisation** — WCAG 2.1 AA, keyboard nav, dyslexia-friendly options, language switcher.
7. **Monitoring & ops** — error tracking, analytics, changelog.

---

## 3. The seven-phase plan

### Phase 1 — Foundations (1–2 days)

Why: shared plumbing that everything else leans on.

Build:

- Site-wide layout with header + footer
- Global error boundary
- Custom 404 and 500 pages
- Toast / notification system
- `sitemap.xml` and `robots.txt`
- Re-usable `SEO` component for page meta

### Phase 2 — Public marketing site (3–5 days)

Why: right now only logged-in users get a story. Visitors need a reason to sign up.

Pages to build:

- **Home** — upgraded hero, feature highlights, social proof, product preview, clear CTAs.
- **Features** — walk through the 6 modules with screenshots and GIFs.
- **Pricing** — tiers, FAQ, comparison table. Can say "beta / coming soon."
- **About** — your PhD origin story, mission, research credibility.
- **Contact** — form + email + calendar link.
- **Blog / Insights** — MDX-based. You have rich PhD material; this is a strong SEO play.

### Phase 3 — Trust, legal & security (2 days)

Why: UK/EU requirement before anyone signs up with real data.

Build:

- Privacy Policy (UK GDPR-compliant)
- Terms of Service
- Cookie Policy
- Security page — how data is stored, Supabase RLS, encryption
- Cookie consent banner with granular opt-in (UK/EU users)
- Simple public status page

### Phase 4 — SEO & performance (1–2 days)

Why: if Google can't find CAMIQ, the rest doesn't matter.

Build:

- Meta tags, Open Graph, Twitter cards on every page
- JSON-LD structured data (Organization, SoftwareApplication)
- Dynamic sitemap generation
- Image audit — use `next/image` everywhere
- Core Web Vitals pass (LCP, CLS, INP under thresholds)
- Keyword-optimised copy on marketing pages

### Phase 5 — Product-app polish (2–3 days)

Why: the logged-in experience has rough edges that scream "prototype."

Build:

- User menu — avatar, settings, logout in nav
- Settings page — profile, password, API keys, theme
- In-app notification centre
- Empty states on every table/list
- Command palette (⌘K quick nav)
- Keyboard shortcuts, documented
- First-time onboarding tour for the 6 modules

### Phase 6 — Growth & engagement (1–2 days)

Why: capture interest before visitors bounce.

Build:

- Newsletter signup (Resend or Mailchimp)
- Demo-request / lead-capture form with email notification
- FAQ / help page with search
- Optional waitlist mode for pre-launch
- Help widget (Intercom or open-source alt)

### Phase 7 — Accessibility, i18n & monitoring (2–3 days)

Why: quality markers that separate amateur from pro. The accessibility bit matters to you personally too.

Build:

- **Accessibility pass**: WCAG 2.1 AA audit, keyboard nav, focus states, colour contrast, reduced-motion support.
- **Dyslexia-friendly options**: OpenDyslexic font toggle, adjustable font size, high-contrast mode.
- **Language switcher**: `next-intl` is already installed — wire up English plus one or two more languages.
- **Sentry** for error tracking (frontend + backend).
- **Plausible or GA4** for privacy-respecting analytics.
- **Changelog page** (MDX) so users see what's new.

---

## 4. Suggested order

If I were running this, I'd do it in this order:

1. Phase 1 — Foundations (blocker)
2. Phase 3 — Legal (must-have before public)
3. Phase 2 — Marketing site (the visible win)
4. Phase 4 — SEO (so the marketing site gets traffic)
5. Phase 5 — Product polish (clean up logged-in app)
6. Phase 7 — Accessibility + monitoring (quality markers)
7. Phase 6 — Growth (once the house is in order)

**Total rough effort:** 12–19 focused days. Could compress to 7–10 days for an MVP version of each phase.

---

## 5. What we will NOT do (to keep scope honest)

- Full redesign of the already-polished module UIs — Phase 6 work stays.
- Native mobile apps — web-only.
- Full Stripe billing — only if pricing decision is "paid."
- Real-time Twitter/X ingestion — that's Phase 9 of your original plan, separate track.

---

## 6. Decisions I need from you before we start

1. **Launch timing** — public soon, or still pre-launch / research phase?
2. **Pricing model** — free, freemium, paid, or enterprise-only?
3. **Blog** — yes (SEO value given your PhD material) or skip for now?
4. **Cookie consent flavour** — UK/EU granular, or lighter global banner?
5. **Design direction** — keep Phase 6 indigo-violet look, or light refresh too?
6. **Language priorities** — which 1–2 extra languages matter most?

---

## 7. Next step

Once you answer the six questions above, I'll:

1. Break the chosen phases into small tickets.
2. Start building, one phase at a time.
3. Keep you in the loop after each phase so you can review and steer.

I can also create a project tracker in Excel or Notion if you'd like to manage the phases visually — let me know.
