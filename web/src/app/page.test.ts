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

  it("embeds the two featured YouTube videos on the Arduino section", () => {
    expect(pageSource).toContain(
      "https://www.youtube-nocookie.com/embed/WYnGz3CFDjk",
    );
    expect(pageSource).toContain(
      "https://www.youtube-nocookie.com/embed/NMzRGKAEysM",
    );
  });

  it("stacks the featured videos without visible captions", () => {
    expect(pageSource).toContain(
      'className="grid w-full gap-5"',
    );
    expect(pageSource).not.toContain('description="Primeros proyectos');
    expect(pageSource).not.toContain('description="Montajes guiados');
    expect(pageSource).not.toContain("<h3");
    expect(pageSource).not.toContain("<p>{description}</p>");
  });

  it("matches the information section column rhythm in the Arduino video section", () => {
    expect(pageSource).toContain(
      'className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]"',
    );
    expect(pageSource).not.toContain("lg:grid-cols-[1.05fr_0.95fr]");
    expect(pageSource).toContain(
      'className="max-w-xl text-base leading-[1.62] text-[var(--color-graphite)] sm:text-lg"',
    );
  });

  it("keeps the Arduino section CTAs at the standard button height", () => {
    expect(pageSource).toContain('className="flex flex-wrap items-start gap-3"');
  });
});
