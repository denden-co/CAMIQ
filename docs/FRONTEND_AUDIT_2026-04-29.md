# CAMIQ Frontend Audit — 2026-04-29

Audit of the current frontend against the Frontend Prompt Instructions doc (29 April 2026, e.dennis7@icloud.com → eveden02@icloud.com).

Written dyslexia-friendly: short paragraphs, plain English, scan the headings first.

---

## TL;DR

1. The biggest gap is **`/` is a marketing landing page**, not the actual app. The doc says: build the usable experience as the first screen.
2. The dashboard uses **emoji icons** (📊 ✍️ 👥 🧠 ⚖️ 🌍). The doc says: use lucide icons. Emoji look childish on operational software and render differently across OSes.
3. CLAUDE.md memory describes an "indigo-violet gradient design system" that no longer exists. The CSS has been refactored to clean monochrome + single indigo accent. **Memory needs updating to match reality.**

Most of the rubric is already met by the recent monochrome refactor. The work below is finishing the job.

---

## How the current frontend scores

Each principle from the doc, scored against the actual code as it stands today.

| # | Principle | Current state | Score |
|---|---|---|---|
| 1 | Domain fit (SaaS = quiet, utilitarian) | Home page is marketing-style; dashboard is operational-ish but cards have rainbow gradients and emoji | ⚠️ Partial |
| 2 | Workflows ergonomic | Modules are scattered across 6 separate pages; no global search/command palette; "Open module" CTA hidden until hover | ⚠️ Partial |
| 3 | Icons in buttons (lucide, not SVG) | Hero uses geometric glyphs (◆ ◇ △ ▢ ○ ⬡); dashboard uses emoji; nowhere uses lucide | ❌ Fail |
| 4 | No rounded rect with text where icon could go | Mostly OK, but "Sign in", "Start free", "Open module" could use chevron/arrow icons | ⚠️ Partial |
| 5 | Tooltips on unfamiliar icons | None implemented | ❌ Fail |
| 6 | No in-app text describing features | Home page is largely feature description; dashboard has descriptions on every module card | ❌ Fail (home), ⚠️ Partial (dashboard) |
| 7 | No marketing landing page when app is the answer | `/` IS a marketing landing page | ❌ Fail |
| 8 | Hero: real image bg, text over image, never gradient/SVG hero | `.hero-mesh` is now a flat canvas (good), but hero is text + a "product preview card" — no hero image, no full-bleed scene | ⚠️ Partial |
| 9 | No nested cards / floating-card sections | One card-styled section (Features uses `bg-card`); preview card sits inside hero section | ⚠️ Partial |
| 10 | No orbs/blobs/bokeh | None — refactor removed them | ✅ Pass |
| 11 | No font scaling with viewport (no `vw`/`clamp`) | Uses `text-5xl sm:text-6xl lg:text-7xl` — fixed breakpoints, OK | ✅ Pass |
| 12 | Letter-spacing 0, not negative | `h1, .font-display { letter-spacing: -0.03em }` | ❌ Fail |
| 13 | Avoid one-note palette (purple-blue gradients, beige, slate, etc.) | Two-tone monochrome ink + indigo accent — fine | ✅ Pass |
| 14 | Card border radius ≤ 8px | Dashboard module cards use `rounded-xl` (12px); home preview card same | ❌ Fail |
| 15 | Stable dimensions (no layout shift on hover) | Module cards `hover:-translate-y-0.5` + reveal-on-hover CTA → minor shift | ⚠️ Partial |
| 16 | No overlapping UI | OK from static read | ✅ Pass |
| 17 | Three.js for 3D, full-bleed | No 3D used — N/A | — |
| 18 | Visual assets reveal the actual product | Hero shows mock numbers (`+0.42`, `80.3%`, `Cost of living 24%`); could be a live snapshot of an actual analysis | ⚠️ Partial |
| 19 | H1 = brand/product/place name | H1 is a tagline ("Political intelligence, grounded in evidence") not "CampaignIQ" | ⚠️ Partial |
| 20 | Hero leaves hint of next section visible | Hero is `pt-20 pb-20` then features section follows — should be visible on most viewports | ✅ Likely pass |

**Summary:** 6 ✅, 8 ⚠️, 5 ❌, 1 N/A.

---

## Priority 1 — quick wins (a half-day each)

These are small, contained changes with high impact.

### 1.1 Replace emoji and glyph icons with lucide

**Why:** Two violations of the doc in one fix. Emoji look childish; geometric glyphs aren't recognisable.

**Where:**
- `frontend/app/dashboard/page.tsx` — `MODULE_CARDS` uses 📊 ✍️ 👥 🧠 ⚖️ 🌍
- `frontend/app/page.tsx` — `FEATURES` uses ◆ ◇ △ ▢ ○ ⬡

**Mapping (lucide-react names):**

| Module | Current | Lucide |
|---|---|---|
| Batch & CSV Analysis | 📊 | `BarChart3` |
| Single Text Analysis | ✍️ | `PenLine` |
| Voter Personas | 👥 | `Users` |
| AI Strategic Advisor | 🧠 | `Sparkles` or `Lightbulb` |
| Bias & Fairness Audit | ⚖️ | `Scale` |
| Country Configuration | 🌍 | `Globe2` |
| Sentiment | ◆ | `Activity` |
| Topic modelling | ⬡ | `Hexagon` or `Tags` |
| Global coverage | ○ | `Globe2` |

`lucide-react` is already in `package.json` at `^0.451.0`. Zero new dependencies.

**Snippet:**

```tsx
import { BarChart3 } from "lucide-react";

const MODULE_CARDS = [
  { title: "Batch & CSV Analysis", desc: "...", href: "/analyze", Icon: BarChart3 },
  // ...
];

<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card">
  <m.Icon className="h-4 w-4 text-foreground" strokeWidth={1.75} />
</div>
```

### 1.2 Drop the rainbow per-module gradients on dashboard cards

**Why:** "Limit dominant purple/purple-blue gradients" plus the broader rule about quiet utilitarian SaaS. Six different hue gradients on a dashboard reads as marketing.

**Where:** `frontend/app/dashboard/page.tsx` lines 22–63 — each module has a `gradient` and `iconBg` colour, then line 283 applies `bg-gradient-to-br ${m.gradient}`.

**Change:** Drop the gradient and `iconBg` fields entirely. Use the same neutral card surface for every module. Differentiation comes from the icon and the title, not the colour.

```tsx
// before
<div className={`group ... bg-gradient-to-br ${m.gradient} ... border-border/50`}>

// after
<div className="group relative h-full overflow-hidden rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/30">
```

### 1.3 Round corners to 8px (rounded-lg) where >8px

**Where:**
- `frontend/app/dashboard/page.tsx` line 282 — `rounded-xl` on module cards → `rounded-lg`
- `frontend/app/page.tsx` line 120 — preview card `rounded-xl` → `rounded-lg`
- Same line 215 — features grid wrapper `rounded-xl` → `rounded-lg`

`xl` = 12px. The doc says ≤ 8px. `lg` = 8px in the current Tailwind config.

### 1.4 Remove negative letter-spacing on H1

**Where:** `frontend/app/globals.css` lines 88–93.

**Change:**
```css
/* before */
h1, h2, h3, .font-display { letter-spacing: -0.025em; }
h1, .font-display          { letter-spacing: -0.03em; }

/* after */
h1, h2, h3, .font-display { letter-spacing: 0; }
```

The doc is explicit: "Letter spacing must be 0, not negative." Modern Inter is already optically tight enough.

### 1.5 Reveal "Open module" CTA always, not on hover

**Where:** `frontend/app/dashboard/page.tsx` line 296.

**Why:** Discoverability. The doc favours ergonomic comprehensive workflows. Hidden CTAs need a hover guess.

**Change:** Drop `opacity-0 ... group-hover:opacity-100`. Keep it visible at `text-muted-foreground` and let it deepen to `text-foreground` on hover.

---

## Priority 2 — medium effort (a day each)

### 2.1 Make `/` go to the dashboard for logged-in users

**Why:** This is the single biggest rubric-vs-reality gap. The doc:

> "When asked for a site, app, game, or tool, build the actual usable experience as the first screen, not marketing or explanatory content."

CAMIQ is an analyst tool. A signed-in analyst landing on the marketing page wastes a click.

**Change:** Server-side redirect in `frontend/app/page.tsx` (or a Next.js middleware). If `campaigniq_dev_auth` cookie set → `/dashboard`. If not → marketing page (which can stay for new visitors).

```ts
// app/page.tsx (top of file, before HomePage)
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function HomePage() {
  if (cookies().get("campaigniq_dev_auth")) redirect("/dashboard");
  return <MarketingHome />; // existing component renamed
}
```

### 2.2 Replace mock product preview with a live one

**Where:** `frontend/app/page.tsx` lines 119–191 (the preview card).

**Why:** The doc: "Primary images and media should reveal the actual product, place, object, state, gameplay, or person; you refrain from dark, blurred, cropped, stock-like, or purely atmospheric media."

The current preview is a stylised mock — "+0.42", "8,412 posts", "Cost of living 24%". Better:

- Pull a single public sample analysis (e.g. the 2024 UK general election thesis dataset you already have) and render an actual `AnalysisSummaryCard` from real data. Same component the dashboard uses.
- Or remove the preview entirely and replace with a screenshot/recorded GIF of the analyse module in motion.

### 2.3 Add a global command palette (⌘K)

**Why:** Operational tools live or die on keyboard ergonomics. The doc: "Common workflows within the app are ergonomic, efficient, and comprehensive."

Pattern: small modal with fuzzy-search across modules + recent analyses + actions ("New analysis", "Switch country", "Sign out"). Triggered by ⌘K from anywhere.

Library: `cmdk` (used by Linear, Vercel, Raycast). Single dep, ~10kb gzipped. No new framework.

### 2.4 Tighten module navigation

Each module page (`/analyze`, `/bias`, `/personas`, `/strategy`, `/countries`) should:

- Show a left-rail or top tab strip with the other modules — currently the only nav link is "← Dashboard" which is a drop-back, not lateral movement.
- Persist the selected country in the header (already done via `CountryPicker`) ✅.
- Show "currently analysing: <analysis name>" if one is active (continuity across modules).

---

## Priority 3 — bigger structural calls

### 3.1 Decide what `/` actually is

Three options, pick one:

| Option | Pros | Cons |
|---|---|---|
| **A. Marketing kept, signed-in users redirected** (Priority 2.1) | New visitors land somewhere honest; analysts skip it | Two surfaces to maintain |
| **B. App-first: `/` = dashboard, marketing moves to `/welcome`** | Closest to the rubric. Signals: this is a tool, not a brochure | New visitors hit a login wall on `/`; SEO loses keyword density on root |
| **C. Drop marketing entirely** | Cleanest. Honest. Faster to build | Loses inbound conversion path; harder to share publicly |

**My read:** Option A in the short term (≤1 day), Option B once you have real users.

### 3.2 Trim or hide the marketing page-stubs

`/about`, `/blog`, `/changelog`, `/contact`, `/legal/{cookies,privacy,security,terms}`, `/status` are all `ComingSoon` placeholders. Each one is a 404-equivalent at the moment.

- `/legal/*` should be filled in (they're not optional once you have users). At least a stub privacy + terms.
- `/blog` and `/changelog` either build them or remove from the footer until you have content.
- `/status` either point at an UptimeRobot/Better Stack page or remove.

### 3.3 Rename the misleading legacy classes

`.hero-mesh`, `.text-gradient`, `.btn-gradient`, `.gradient-border`, `.divider-gradient` are now all flat / monochrome (per the comments in `globals.css`). Names lie. New devs will be confused.

Rename in one pass:
- `.hero-mesh` → `.hero-canvas`
- `.text-gradient` → `.text-accent`
- `.btn-gradient` → `.btn-primary` (and update `buttonVariants.default`)
- `.gradient-border` → `.bordered-frame`
- `.divider-gradient` → `.divider-line`

Keep the old class names as aliases for one release cycle, then remove.

### 3.4 Update CLAUDE.md memory to match the actual design system

The memory says "indigo-violet gradient design system, mesh gradient hero, frosted glass nav bar". In reality:

- Foundation is monochrome (ink + paper + canvas).
- Single indigo accent (#4F46E5) for highlights.
- 1px borders, no glows.
- Hero is a flat canvas.

I'll edit CLAUDE.md as part of the next commit.

### 3.5 The pre-existing ESLint config issue

`eslint@8.57.1` vs `eslint-config-next@16` (wants `eslint ≥ 9`). Bumping eslint to 9 will require migrating `.eslintrc.json` to a flat-config `eslint.config.js`. ~half day of yak-shaving but blocks `npm run lint` from working at all.

---

## What's already right — don't change

- Monochrome surface (`#FAFAF9` canvas, `#0A0A0A` ink, `#FFFFFF` cards) — clean.
- Single indigo accent (#4F46E5) for emphasis — fits the rubric on palette restraint.
- 1px borders instead of shadows — "restrained visual styling".
- Inter font — solid choice for SaaS.
- The `table-premium` styling (uppercase 11px headers, hover row tint) — exactly right for analyst-density tables.
- No orbs, blobs, or bokeh — already cleaned up.
- Two-tone palette (ink + indigo) — passes the "no one-note palette" test.

---

## Suggested order of work

If you're picking up tomorrow:

1. **Morning (1–2 hours):** P1.1 (lucide icons) + P1.4 (drop negative letter-spacing) — pure CSS / component swaps, zero risk.
2. **Mid-morning:** P1.2 (kill rainbow gradients) + P1.3 (radius) + P1.5 (always-visible CTA) — same file.
3. **Afternoon:** P2.1 (logged-in redirect) + P3.4 (CLAUDE.md memory update). Commit, push, done.

That leaves Priority 2.2/2.3/2.4 and Priority 3 as a second session.

---

*Generated 2026-04-29 against commit `b9d2c96` on branch `main`.*
