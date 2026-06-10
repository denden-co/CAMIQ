# Deploying CampaignIQ (Phase 7)

Two deployments: the **frontend on Vercel** and the **API on Railway or Render**.
Deploy the API first so you have its URL for the frontend env vars.

---

## 1. API → Railway (recommended) or Render

### Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo → select `denden-co/CAMIQ`.
2. Set **Root Directory** to `api`. Railway detects Python and uses the `Procfile`.
3. Add environment variables (Settings → Variables):
   - `CORS_ORIGINS` = your Vercel URL (e.g. `https://campaigniq.vercel.app`)
   - `GOOGLE_API_KEY` (and/or other LLM provider keys) — needed by Personas and Strategy
4. Deploy. Note the public URL (e.g. `https://camiq-api.up.railway.app`).
5. Check `https://<api-url>/health` — it should report the active sentiment backend.

### Render (alternative)

The repo includes `api/render.yaml`. New → Blueprint → point at the repo, then set `CORS_ORIGINS` and provider keys in the dashboard.

### Memory note

The slim build (`requirements.txt`) runs VADER and fits the smallest instances.
For full XLM-RoBERTa + BERTopic, the build must also install
`requirements-ml.txt` and the instance needs **2 GB+ RAM**. Start slim,
upgrade once traffic justifies it.

---

## 2. Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → Add New Project → import `denden-co/CAMIQ`.
2. Set **Root Directory** to `frontend`. Framework preset: Next.js.
3. Override the **Install Command** to:
   ```
   npm install --legacy-peer-deps
   ```
4. Add environment variables:
   - `NEXT_PUBLIC_API_BASE_URL` = the API URL from step 1
5. Deploy.

---

## 3. After both are live

- [ ] Visit the site, sign in (dev-mock auth), run a single-text analysis end-to-end.
- [ ] Upload `samples/multi-lang-test.csv` as a batch and save the analysis.
- [ ] Confirm Personas and Strategy generate (requires an LLM key on the API).
- [ ] Update `CORS_ORIGINS` if you add a custom domain.

## Known limitations before Phase 8

- Auth is still the dev mock (any email + password). Do **not** share the URL
  publicly until Supabase auth lands (Phase 8).
- Saved analyses use file-backed storage on the API instance — they do not
  survive a redeploy on ephemeral filesystems. Supabase persistence arrives
  with Phase 8.
