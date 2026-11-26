-- Phase 8: per-user saved analyses with row-level security.
-- Applied to project shcmrlugoytwwgkxhedn on 2026-11-24 via the Supabase MCP.

create table if not exists public.analyses (
  id                 text primary key,
  user_id            uuid not null references auth.users (id) on delete cascade,
  name               text not null,
  country_id         text,
  source             text not null default 'paste',
  total              integer not null,
  dominant_label     text not null,
  mean_compound      double precision not null,
  languages_detected integer not null default 0,
  created_at         timestamptz not null default now(),
  batch              jsonb not null,
  original_texts     jsonb not null default '[]'::jsonb
);

create index if not exists analyses_user_created_idx
  on public.analyses (user_id, created_at desc);

alter table public.analyses enable row level security;

-- A row is visible and writable only to its owner. The API uses the
-- service-role key (bypasses RLS) but always filters by the verified
-- user id as well — belt and braces.
drop policy if exists analyses_owner on public.analyses;
create policy analyses_owner on public.analyses
  for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- The API talks to analyses with the service role; browsers never query it
-- directly. Hide it from the anon role entirely.
revoke all on public.analyses from anon;

-- Trigger helpers should not be callable via /rest/v1/rpc.
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.handle_updated_at() from anon, authenticated;

-- Review follow-up: signed-in browsers must also go through the API (size
-- caps, validation), never straight to the table. RLS stays as a second line.
revoke all on public.analyses from authenticated;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_updated_at() from public;
