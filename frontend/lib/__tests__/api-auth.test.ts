import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the browser Supabase client so no network or env is needed.
const getSession = vi.fn();
vi.mock("../supabase/client", () => ({
  isSupabaseConfigured: () => true,
  createClient: () => ({ auth: { getSession } }),
}));

import { authHeader, getAnalysis, SessionExpiredError } from "../api";

describe("authHeader", () => {
  beforeEach(() => getSession.mockReset());

  it("sends the Supabase access token as a bearer header", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "tok123" } } });
    expect(await authHeader()).toEqual({ Authorization: "Bearer tok123" });
  });

  it("sends nothing when there is no session", async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    expect(await authHeader()).toEqual({});
  });
});

describe("authed requests", () => {
  it("turns a 401 into SessionExpiredError", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "stale" } } });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Invalid or expired token", { status: 401 }))
    );
    await expect(getAnalysis("abc")).rejects.toBeInstanceOf(SessionExpiredError);
    vi.unstubAllGlobals();
  });
});
