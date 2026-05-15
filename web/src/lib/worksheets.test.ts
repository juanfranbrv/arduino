import { describe, expect, it } from "vitest";

import {
  calculateWorksheetProgress,
  getAllWorksheets,
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

describe("local worksheet catalog", () => {
  it("contains the eight numbered Arduino units in order", () => {
    const worksheets = getAllWorksheets();

    expect(
      worksheets.map((worksheet) => ({
        unitNumber: worksheet.unitNumber,
        title: worksheet.title,
        slug: worksheet.slug,
        activities: worksheet.activities.length,
      })),
    ).toEqual([
      {
        unitNumber: 1,
        title: "Unidad 1 - Explorar el pack",
        slug: "unidad-01-explorar-el-pack",
        activities: 0,
      },
      {
        unitNumber: 2,
        title: "Unidad 2 - LEDs: del simulador a la protoboard",
        slug: "unidad-02-leds-simulador-protoboard",
        activities: 0,
      },
      {
        unitNumber: 3,
        title: "Unidad 3 - LEDs en paralelo, serie y resistencia",
        slug: "unidad-03-leds-paralelo-serie-resistencia",
        activities: 0,
      },
      {
        unitNumber: 4,
        title: "Unidad 4 - Led RGB",
        slug: "unidad-04-led-rgb",
        activities: 0,
      },
      {
        unitNumber: 5,
        title: "Unidad 5 - Pulsador de 4 patas",
        slug: "pulsadores-led",
        activities: 6,
      },
      {
        unitNumber: 6,
        title: "Unidad 6 - Zumbador activo",
        slug: "zumbador-activo",
        activities: 4,
      },
      {
        unitNumber: 7,
        title: "Unidad 7 - Zumbador pasivo",
        slug: "unidad-07-zumbador-pasivo",
        activities: 0,
      },
      {
        unitNumber: 8,
        title: "Unidad 8 - Tilt",
        slug: "unidad-08-tilt",
        activities: 0,
      },
    ]);
  });
});
