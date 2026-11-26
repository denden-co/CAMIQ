import { describe, expect, it } from "vitest";
import { safeNextPath } from "../safe-next";

describe("safeNextPath", () => {
  it("keeps a same-site relative path", () => {
    expect(safeNextPath("/auth/update-password")).toBe("/auth/update-password");
    expect(safeNextPath("/dashboard?tab=1")).toBe("/dashboard?tab=1");
  });
  it("falls back to /dashboard for anything that could leave the site", () => {
    expect(safeNextPath("https://evil.example/phish")).toBe("/dashboard");
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
    expect(safeNextPath("javascript:alert(1)")).toBe("/dashboard");
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath("")).toBe("/dashboard");
  });
});
