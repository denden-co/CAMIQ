import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Refreshes the Supabase session cookie on every request and redirects
 * signed-out visitors away from the app pages. The dev-mock cookie is gone.
 */
export async function proxy(request: NextRequest) {
  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!hasSupabase) {
    // Not configured (e.g. a preview build): the app pages still load but
    // every API call fails with 401, which the UI reports as "sign in".
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
