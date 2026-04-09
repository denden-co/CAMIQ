# Phase 4 Feature Spec: Macro Indicators + Manifesto Alignment

**Status:** Draft
**Author:** Everton Dennis
**Date:** 2026-04-09
**Target phase:** Phase 4 (after Phase 3 BERTopic)

---

## 1. Problem

CAMIQ currently tells users:

- **What voters feel** (sentiment via XLM-RoBERTa)
- **What voters talk about** (topic modelling — Phase 3)

It does not tell users:

- **Why** voters feel that way (real-world conditions — inflation, unemployment, housing)
- **Whether parties are addressing those concerns** in their manifestos

This is the gap between *descriptive* analytics (what's happening) and *diagnostic + prescriptive* analytics (why, and what candidates could do about it). Closing it is what turns CAMIQ from a sentiment dashboard into a political intelligence platform.

## 2. Users and jobs to be done

| User | Job to be done |
|---|---|
| **Campaign strategist / consultancy client** | "Tell me which voter concerns my party's manifesto is underselling, grounded in real data" |
| **Journalist** | "Show me an evidence-based answer to 'are the parties ignoring the cost of living crisis?'" |
| **Academic researcher** | "Give me a reproducible way to map public sentiment to macro indicators and policy positions" |
| **Think tank / NGO** | "Audit whether manifestos align with what citizens actually need, country by country" |

All four map cleanly onto the consultancy-first revenue model (£15k–£50k bespoke reports).

## 3. User story

> As a **political strategist** analysing the UK 2029 election, I want to see how the **cost of living situation** maps against each party's **manifesto coverage of that issue**, so I can identify which parties are leaving voter concerns unaddressed and brief my client accordingly.

## 4. Scope

### In scope (MVP)

1. **Macro Indicators panel** per country, showing 6 core indicators with trend sparklines
2. **Voter concern extraction** — top topics from BERTopic, tagged with concern categories
3. **Manifesto ingestion** — upload or URL-fetch manifesto PDFs/text per party
4. **Alignment matrix** — rows: voter concerns, columns: parties, cells: alignment score 0–10
5. **Export** — PDF report and CSV of the alignment matrix

### Out of scope (v1)

- Real-time macro data streaming (batch refresh is fine)
- Automated manifesto discovery (user uploads or pastes URL)
- Multi-language manifesto scoring beyond the country's primary language
- Causal claims ("inflation *caused* this sentiment shift")
- Seat-level predictions

## 5. Data sources

All free, authoritative, citable. No paid APIs in MVP.

### Cost of living & inflation
- **World Bank Open Data** — `api.worldbank.org/v2/` — CPI, food inflation, all countries, monthly where available
- **OECD SDMX** — `stats.oecd.org/SDMX-JSON` — CPI, harmonised for OECD members
- **ONS (UK)** — `api.ons.gov.uk` — CPI, CPIH, RPI
- **BLS (US)** — `api.bls.gov/publicAPI/v2` — CPI-U, core CPI
- **Eurostat** — `ec.europa.eu/eurostat/api` — HICP for EU states

### Employment
- World Bank, OECD, national statistics offices (same endpoints above)

### Housing
- **OECD Affordable Housing Database**
- **ONS House Price Index** (UK)
- **FHFA House Price Index** (US)

### Energy
- **IEA** (limited free tier)
- **Our World in Data** — `ourworldindata.org/grapher` CSVs

### Public sentiment baselines
- **Eurobarometer** — `europa.eu/eurobarometer` — biannual, free
- **Pew Research** — published reports, manual scrape acceptable
- **OECD Trust in Government**

### Fallback
If no country-specific source is available, **World Bank WDI** covers all 7 countries in our current catalogue.

## 6. The 6 core indicators (MVP)

| Indicator | Unit | Why it matters politically |
|---|---|---|
| CPI inflation (YoY) | % | Single strongest driver of incumbent dissatisfaction |
| Unemployment rate | % | Tied to economic anxiety, labour market narratives |
| Real wage growth | % | "Are people actually better off?" |
| House price to income ratio | ratio | Generational inequality, housing crisis framing |
| Energy price index | index | Cost of living subtheme, especially post-2022 |
| GDP growth (YoY) | % | Incumbent economic-story anchor |

Each rendered as: current value, 12-month sparkline, country rank vs OECD median, last-updated date.

## 7. Voter concern extraction

Depends on Phase 3 (BERTopic) shipping first.

- Run BERTopic on saved analyses for the country
- Each topic → concern category via LLM classifier against a fixed taxonomy:
  `economy`, `cost_of_living`, `housing`, `healthcare`, `immigration`, `climate`, `crime`, `education`, `foreign_policy`, `democracy`, `other`
- Score each concern by: share of discourse × mean negative sentiment intensity
- Output: ranked list of top 5–10 concerns with % weight

## 8. Manifesto ingestion

Keep simple in v1:

- **Upload flow**: user uploads a manifesto PDF per party, or pastes a URL
- **Text extraction**: `pdfplumber` (already compatible with our Python stack)
- **Chunking**: by heading, else by 500-token sliding window
- **Storage**: `manifestos/<country_id>/<party_id>.json` with `{party_id, source_url, extracted_at, chunks: [...]}`

Future (v2): scheduled auto-scrape from a curated source list per country.

## 9. Manifesto alignment scoring (the core innovation)

This is the feature that justifies the price tag — and the feature critics will scrutinise hardest. It has to be **transparent, rubric-driven, and reproducible**.

### Scoring rubric (per concern × party)

Given a concern (e.g. "cost of living") and a party's manifesto chunks, an LLM scores 0–10 on five sub-dimensions:

| Dimension | Weight | What it measures |
|---|---|---|
| **Coverage** | 25% | Does the manifesto mention this concern at all? How often? |
| **Specificity** | 25% | Are there concrete policies, or only vague aspirations? |
| **Evidence** | 15% | Does the party cite data, studies, or targets? |
| **Feasibility signal** | 15% | Are mechanisms (funding, delivery) described? |
| **Alignment with macro indicator direction** | 20% | If inflation is the issue, does the policy plausibly address inflation vs. deflect to an adjacent issue? |

Final score = weighted sum, 0–10. Each cell in the alignment matrix shows the score plus a **"Show evidence"** link that reveals the exact manifesto quotes the LLM used.

### Rubric transparency

- Rubric published in-app and in the methodology doc
- Every score is accompanied by the model version, temperature, and timestamp
- Quotes are verbatim from manifesto, not LLM-generated summaries
- Users can override scores manually with an audit log entry

### Ethical guardrails

- No per-voter targeting
- No "how to beat Party X" prescriptions
- Academic/consultancy framing only
- Bias audit: compare scores across at least 2 LLM providers (Gemini + Claude) and flag material disagreements

## 10. API shape

New endpoints under `/api/macro` and `/api/manifestos`:

```
GET  /api/macro/indicators/{country_id}
     → {country_id, updated_at, indicators: [{key, label, value, unit, series: [...], source}]}

POST /api/macro/refresh/{country_id}
     → force-refresh from sources (rate-limited, admin only)

POST /api/manifestos/upload
     body: multipart {country_id, party_id, file}
     → {manifesto_id, party_id, chunks_count, extracted_at}

GET  /api/manifestos/{country_id}
     → list all manifestos for a country

POST /api/alignment/score
     body: {country_id, concern_ids?: [...], manifesto_ids?: [...]}
     → {matrix: [{concern, party, score, sub_scores, evidence_quotes}]}

GET  /api/alignment/{country_id}
     → most recent cached matrix
```

All gated by the existing `X-User-Email` dev-mock auth header for now, swappable to Supabase JWT later.

## 11. UI mockup

New page: `/countries/[id]/alignment`

```
┌────────────────────────────────────────────────────────────────┐
│ UK General Election — Projected 2029                          │
│ Macro Context & Manifesto Alignment                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ ┌─ Macro Indicators ─────────────────────────────────────────┐│
│ │ CPI 4.1% ↗  Unemp 4.5% →  Wages -0.8% ↘  H/I 8.2x ↗       ││
│ │ Energy idx 128 ↗          GDP 0.4% →                       ││
│ │ [sparklines under each]                                    ││
│ │ Source: ONS, updated 2026-03-31                            ││
│ └────────────────────────────────────────────────────────────┘│
│                                                                │
│ ┌─ Top Voter Concerns ───────────────────────────────────────┐│
│ │ 1. Cost of living    42%  ████████████                     ││
│ │ 2. Housing           18%  ██████                           ││
│ │ 3. Healthcare        14%  ████                             ││
│ │ 4. Immigration       11%  ███                              ││
│ │ 5. Climate            8%  ██                               ││
│ └────────────────────────────────────────────────────────────┘│
│                                                                │
│ ┌─ Manifesto Alignment Matrix ───────────────────────────────┐│
│ │              Lab   Con   Ref   LD    Grn                   ││
│ │ Cost of liv  7.2   5.1   3.4   6.8   8.0  ← click for why ││
│ │ Housing      6.5   4.2   2.1   7.8   8.5                   ││
│ │ Healthcare   8.1   5.9   4.5   6.2   7.4                   ││
│ │ Immigration  4.8   7.2   9.1   3.5   2.8                   ││
│ │ Climate      5.5   3.1   1.2   7.0   9.5                   ││
│ │                                                            ││
│ │ [Export PDF] [Export CSV] [View methodology]               ││
│ └────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

Colour the cells on a red→green gradient so the whole story reads in one glance — important for screenshot-driven consultancy outputs.

## 12. Success metrics

### Build-phase (internal)
- All 7 countries have at least 4 of 6 core indicators populated from a free source
- End-to-end demo: upload 3 UK manifestos → matrix renders in under 60 seconds
- Two-LLM bias check shows median score disagreement < 1.5 points

### Commercial
- At least 1 consultancy RFP mentions this feature by name within 3 months of launch
- At least 1 academic paper citation within 12 months
- First paid bespoke report using the alignment matrix delivered within 6 months

## 13. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| LLM scoring seen as black-box | High | Publish rubric, show verbatim quotes, two-LLM agreement check |
| Manifesto PDFs are messy | High | `pdfplumber` + manual cleanup fallback, allow paste-text input |
| Macro API rate limits / downtime | Medium | Cache aggressively, 24h TTL, graceful "last-known" fallback |
| Political bias accusations | High | Score all parties by the same rubric, ethics disclaimer, academic framing |
| Causation overreach in UI copy | Medium | Strict copy review — "associated with" not "caused by" |
| Data licensing | Low | All sources are free/open; cite attribution in-app and in exports |

## 14. Dependencies

- **Hard**: Phase 3 (BERTopic) must ship first — alignment matrix is meaningless without voter concerns
- **Soft**: At least one LLM provider key configured (Gemini free tier is enough for MVP)
- **Soft**: `pdfplumber` added to `requirements-ml.txt`

## 15. Rollout plan

1. **Week 1**: Macro Indicators panel only — World Bank API integration, 7 countries, 6 indicators, cached JSON
2. **Week 2**: Manifesto upload + text extraction, storage schema
3. **Week 3**: LLM scoring pipeline with rubric, single-provider (Gemini free tier)
4. **Week 4**: Alignment matrix UI, exports, methodology page
5. **Week 5**: Two-LLM bias check, polish, demo video for sales

Total estimate: **5 weeks part-time**, assuming Phase 3 BERTopic is already landed.

## 16. Open questions

1. Do we want to **lock the concern taxonomy globally** or allow country-specific taxonomies? (Lean: global for comparability, with an "other" bucket.)
2. Is there a role for **time-series alignment** — how has a party's manifesto coverage of a concern changed election-over-election? (Nice-to-have, not MVP.)
3. Should the alignment matrix be **public or login-gated**? Public draws traffic; gated protects the moat. (Lean: free teaser, paid detailed reports.)
4. Do we partner with an **academic institution** (UEL, LSE, Oxford Internet Institute) to co-brand the methodology paper? (Strong yes — instant credibility.)

---

**Next action:** decide whether to promote this ahead of Phase 3 (it can't — hard dependency on BERTopic) or slot it as Phase 4 immediately after. Recommend: Phase 4, immediately after BERTopic, so the whole "sentiment → topics → macro → manifestos" story lands as one coherent narrative.
