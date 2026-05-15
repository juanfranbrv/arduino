import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("home worksheet cards", () => {
  const pageSource = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");
  const globalsSource = fs.readFileSync(path.join(__dirname, "globals.css"), "utf8");

  it("does not resize fill images with inline width or height styles", () => {
    expect(pageSource).not.toContain('width: "calc(100% + 2px)"');
    expect(pageSource).not.toContain('height: "calc(100% + 2px)"');
  });

  it("bleeds worksheet cover images only past the top and side card edges", () => {
    expect(pageSource).not.toContain("scale-[1.01]");
    expect(pageSource).toContain('className="absolute -left-2 -right-2 -top-2 bottom-0"');
    expect(pageSource).not.toContain('className="absolute -inset-2"');
  });

  it("removes the inset surface line from image-led home cards", () => {
    expect(pageSource).toContain("home-worksheet-card");
    expect(globalsSource).toContain(".home-worksheet-card");
    expect(globalsSource).toContain("box-shadow: none");
  });
});
