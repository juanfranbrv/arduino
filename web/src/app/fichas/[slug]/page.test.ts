import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("public worksheet detail", () => {
  const pageSource = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");

  it("links authenticated readers to the student worksheet experience", () => {
    expect(pageSource).toContain("isAuthenticated");
    expect(pageSource).toContain("`/alumno/fichas/${slug}`");
    expect(pageSource).toContain("continueHref={continueHref}");
  });
});
