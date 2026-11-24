import { createBrowserClient } from "@supabase/ssr";

/**
 * True when the Supabase env vars are set. Lets pages render (and the
 * production build prerender) without Supabase configured, so a clean
 * checkout builds. Real auth (Phase 8) requires both vars.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

/**
 * Create a browser Supabase client. Call this lazily (inside an event
 * handler or effect), never at module or render time — otherwise the
 * static prerender throws when env vars are absent.
 */
export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in frontend/.env.local."
    );
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
