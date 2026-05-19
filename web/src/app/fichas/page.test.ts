import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("public worksheets listing", () => {
  const pageSource = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");

  it("does not render material summaries in worksheet cards", () => {
    expect(pageSource).not.toContain("Materiales:");
    expect(pageSource).not.toContain("worksheet.materials.join");
  });
});
