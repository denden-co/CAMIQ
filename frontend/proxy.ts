import { NextResponse, type NextRequest } from "next/server";

// DEV-ONLY mock auth — bypasses Supabase.
// Swap back to the Supabase proxy helper (lib/supabase/middleware.ts)
// when you're ready to wire real auth again.
export function proxy(request: NextRequest) {
  const isAuthed = request.cookies.get("campaigniq_dev_auth")?.value === "1";

  if (!isAuthed && request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
