# CAMIQ Loop Prompt (Loop Engineering)

Reusable prompt for verification loops. Paste it into Claude Code or Cowork.
Fill the parts in `[brackets]`.

---

## The template

```
/goal
Resume the CAMIQ project. Ship a working, professional app.

/context
- Repo: ~/Desktop/Cam/CAMIQ (frontend :3000, API :8000)
- Source of truth: CLAUDE.md. Benchmark rubric: docs/FRONTEND_AUDIT_2026-04-29.md

/loop (max 2 iterations)
1. START — run both dev servers. Confirm :3000 and :8000 respond.
2. VERIFY — in Chrome, test these pages: /, /login, /dashboard,
   /analyze, /personas, /strategy, /bias, /countries.
   For each page check:
   a. Page loads with no console errors.
   b. Data fetches succeed (CountryPicker, Recent Analyses).
   c. One real user journey works end to end
      (e.g. log in → analyze a text → see results → export).
3. BENCHMARK — compare UX against top companies in this industry:
   Quorum, FiscalNote, Brandwatch (and Linear/Vercel for UI polish).
   Note gaps in clarity, trust signals, and onboarding.
4. FIX — fix every Critical/High issue found. Commit each fix
   with a clear message. Skip cosmetic issues unless quick.
5. RE-VERIFY — repeat step 2 on the fixed areas only.

/done-when
- All 8 pages load clean (no console errors, no failed fetches).
- The core journey works end to end.
- All Critical/High issues fixed and committed.

/stop-if
- Same fix fails twice → stop and ask me.
- A fix needs a design decision → stop and ask me.

/report
End with: health score before/after, issues found → fixed,
what's still open, and the exact commits made.
```

---

## Why each block exists

| Block | Job |
|---|---|
| `/goal` | One sentence. The outcome, not the activity. |
| `/context` | Where things live, so the agent doesn't guess. |
| `/loop` | Numbered steps. "Verify" is defined concretely — pages, checks, journeys. |
| `/done-when` | Measurable exit criteria. Without this, "iterate 2 times" is arbitrary. |
| `/stop-if` | Escape hatches so the loop can't thrash or make decisions for you. |
| `/report` | Forces evidence, not vibes. |

## Rules of thumb

- Name the pages and journeys. "Check the code works" is too vague to loop on.
- Cap iterations AND define done. Whichever comes first wins.
- One focus per loop. UX loop and security loop are separate runs.
- In Claude Code, `/qa` (gstack) already does steps 2, 4, 5 — you can
  replace the loop body with: "Run /qa on http://localhost:3000, Standard tier."
