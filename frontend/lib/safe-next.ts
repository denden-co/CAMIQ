/**
 * Only allow redirects to a path on this site. Anything that could leave
 * the origin (absolute URLs, protocol-relative "//host", schemes) falls back
 * to the dashboard, so an auth link can never be turned into an open redirect.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/dashboard";
  }
  return next;
}
