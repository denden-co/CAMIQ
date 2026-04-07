# CampaignIQ Frontend

Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase Auth.

## Setup

```bash
cd frontend
npm install
```

Copy the env file from the repo root and fill in any missing values:

```bash
cp ../.env.example .env.local
```

Make sure these are set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Run

```bash
npm run dev          # http://localhost:3000
npm run build        # production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # vitest
```

## Structure

```
frontend/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Marketing landing
│   ├── globals.css          # Tailwind + theme tokens
│   ├── login/page.tsx       # Sign in / sign up
│   └── dashboard/
│       ├── page.tsx         # Protected dashboard
│       └── sign-out-button.tsx
├── components/ui/button.tsx # shadcn-style button
├── lib/
│   ├── utils.ts             # cn() helper
│   └── supabase/
│       ├── client.ts        # Browser client
│       ├── server.ts        # Server Component client
│       └── middleware.ts    # Session refresh + route guard
├── middleware.ts            # Next.js middleware entry
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Auth flow

The middleware refreshes the Supabase session on every request and redirects
unauthenticated users away from `/dashboard`. Sign-up automatically creates a
row in `public.profiles` via a database trigger (see the initial migration).
