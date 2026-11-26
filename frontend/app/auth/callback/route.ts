import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-next";

/**
 * Lands invite / password-reset / magic links. Supabase sends the browser
 * here with a one-time `code`; we exchange it for a session cookie, then
 * continue to `next` (same-site paths only).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  // Missing or used-up code: send them to request a fresh link.
  return NextResponse.redirect(`${origin}/auth/reset-password?error=link`);
}
