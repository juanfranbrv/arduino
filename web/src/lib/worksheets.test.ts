import { describe, expect, it } from "vitest";

import {
  calculateWorksheetProgress,
  isWorksheetUnlocked,
  parseWorksheetSource,
} from "./worksheets";

describe("parseWorksheetSource", () => {
  it("extracts stable activities and frontmatter from an MDX worksheet", () => {
    const source = `---
title: LED intermitente
slug: led-intermitente
level: iniciacion
duration: 55 min
status: published
materials:
  - Arduino Uno
  - LED
---

# LED intermitente

<Activity id="act-01" title="Monta el circuito" validation="El LED queda conectado con resistencia." />

Texto entre medias.

<Activity
  id="act-02"
  title="Carga el programa"
  validation="El LED parpadea cada segundo."
/>
`;

    const worksheet = parseWorksheetSource(source, "led-intermitente.mdx");

    expect(worksheet).toMatchObject({
      slug: "led-intermitente",
      title: "LED intermitente",
      level: "iniciacion",
      duration: "55 min",
      status: "published",
      materials: ["Arduino Uno", "LED"],
    });
    expect(worksheet.activities).toEqual([
      {
        id: "act-01",
        title: "Monta el circuito",
        validation: "El LED queda conectado con resistencia.",
      },
      {
        id: "act-02",
        title: "Carga el programa",
        validation: "El LED parpadea cada segundo.",
      },
    ]);
  });
});

describe("calculateWorksheetProgress", () => {
  it("counts only completions that match worksheet activity ids", () => {
    const progress = calculateWorksheetProgress(
      ["act-01", "act-02", "act-03"],
      ["act-01", "unknown"],
    );

    expect(progress).toEqual({
      completed: 1,
      total: 3,
      percent: 33,
    });
  });
});

describe("isWorksheetUnlocked", () => {
  it("allows independent worksheets and blocks unmet prerequisites", () => {
    const baseWorksheet = parseWorksheetSource(
      `---
title: Base
slug: base
level: iniciacion
duration: 30 min
status: published
prerequisites: []
---
`,
      "base.mdx",
    );
    const dependentWorksheet = parseWorksheetSource(
      `---
title: Dependiente
slug: dependiente
level: iniciacion
duration: 30 min
status: published
prerequisites:
  - base
---
`,
      "dependiente.mdx",
    );

    expect(isWorksheetUnlocked(baseWorksheet, [])).toBe(true);
    expect(isWorksheetUnlocked(dependentWorksheet, [])).toBe(false);
    expect(isWorksheetUnlocked(dependentWorksheet, ["base"])).toBe(true);
  });
});
