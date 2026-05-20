import { describe, expect, it } from "vitest";

import {
  calculateWorksheetProgress,
  getAllWorksheets,
  getWorksheetDisplayTitle,
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

<Activity id="act-01" title="Monta el circuito" validation="El LED queda conectado con resistencia." environment="placa" />

Texto entre medias.

<Activity
  id="act-02"
  title="Carga el programa"
  validation="El LED parpadea cada segundo."
  environment="simulador"
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
        environment: "placa",
      },
      {
        id: "act-02",
        title: "Carga el programa",
        validation: "El LED parpadea cada segundo.",
        environment: "simulador",
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

describe("getWorksheetDisplayTitle", () => {
  it("derives the visible unit number without storing it in the title", () => {
    expect(
      getWorksheetDisplayTitle({
        title: "Fotocélula LDR",
        unitNumber: 8,
      }),
    ).toBe("Unidad 8 - Fotocélula LDR");
  });
});

describe("local worksheet catalog", () => {
  it("contains stable Arduino unit slugs in course order", () => {
    const worksheets = getAllWorksheets();
    const worksheetSummaries = worksheets.map((worksheet) => ({
      unitNumber: worksheet.unitNumber,
      title: worksheet.title,
      slug: worksheet.slug,
      activities: worksheet.activities.length,
      status: worksheet.status,
    }));

    expect(worksheetSummaries).toHaveLength(32);
    expect(worksheetSummaries.map((worksheet) => worksheet.unitNumber)).toEqual(
      Array.from({ length: 32 }, (_, index) => index + 1),
    );
    expect(
      worksheetSummaries.every(
        (worksheet) => !/^unidad-\d{2}-/.test(worksheet.slug),
      ),
    ).toBe(true);
    expect(
      worksheetSummaries.every(
        (worksheet) => !/^Unidad\s+\d+\s+-\s+/.test(worksheet.title),
      ),
    ).toBe(true);

    expect(worksheetSummaries.slice(0, 7)).toEqual([
      {
        unitNumber: 1,
        title: "Primeros pasos con Arduino",
        slug: "explorar-el-pack",
        activities: 5,
        status: "published",
      },
      {
        unitNumber: 2,
        title: "LEDs en paralelo, serie y resistencia",
        slug: "leds-paralelo-serie-resistencia",
        activities: 6,
        status: "published",
      },
      {
        unitNumber: 3,
        title: "LED RGB",
        slug: "led-rgb",
        activities: 8,
        status: "published",
      },
      {
        unitNumber: 4,
        title: "Pulsador de 4 patas",
        slug: "pulsadores-led",
        activities: 6,
        status: "published",
      },
      {
        unitNumber: 5,
        title: "Zumbador activo",
        slug: "zumbador-activo",
        activities: 4,
        status: "draft",
      },
      {
        unitNumber: 6,
        title: "Zumbador pasivo",
        slug: "zumbador-pasivo",
        activities: 3,
        status: "draft",
      },
      {
        unitNumber: 7,
        title: "Sensor de inclinación",
        slug: "tilt",
        activities: 4,
        status: "published",
      },
    ]);

    expect(worksheetSummaries.slice(7)).toEqual([
      expect.objectContaining({
        unitNumber: 8,
        title: "Fotocélula LDR",
        slug: "fotocelula-ldr",
        activities: 6,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 9,
        title: "Servo",
        slug: "servo",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 10,
        title: "Módulo conmutador de membrana",
        slug: "teclado-membrana",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 11,
        title: "Sensor de humedad y temperatura DHT11",
        slug: "dht11",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 12,
        title: "Módulo joystick analógico",
        slug: "joystick-analogico",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 13,
        title: "Módulo receptor IR",
        slug: "receptor-ir",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 14,
        title: "Matriz de puntos LED MAX7219",
        slug: "matriz-led-max7219",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 15,
        title: "Módulo GY-521 / QMI8658",
        slug: "acelerometro-giroscopio",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 16,
        title: "Sensor PIR HC-SR501",
        slug: "pir-hc-sr501",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 17,
        title: "Módulo sensor de nivel de agua",
        slug: "sensor-nivel-agua",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 18,
        title: "Módulo reloj en tiempo real",
        slug: "rtc",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 19,
        title: "Módulo sensor de sonido",
        slug: "sensor-sonido",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 20,
        title: "Módulo RC522 RFID",
        slug: "rfid-rc522",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 21,
        title: "Pantalla LCD 1602",
        slug: "lcd-1602",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 22,
        title: "Termómetro",
        slug: "termometro",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 23,
        title: "Ocho LEDs con 74HC595",
        slug: "74hc595-ocho-leds",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 24,
        title: "El Monitor Serie",
        slug: "monitor-serie",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 25,
        title: "Módulo sensor ultrasónico",
        slug: "sensor-ultrasonico",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 26,
        title: "74HC595 y display de 7 segmentos",
        slug: "display-7-segmentos",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 27,
        title: "Display de 7 segmentos de 4 dígitos",
        slug: "display-7-segmentos-4-digitos",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 28,
        title: "Motor de corriente continua",
        slug: "motor-dc",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 29,
        title: "Relé",
        slug: "rele",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 30,
        title: "Motor paso a paso",
        slug: "motor-paso-a-paso",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 31,
        title: "Control del motor paso a paso con mando a distancia",
        slug: "stepper-ir",
        activities: 0,
        status: "draft",
      }),
      expect.objectContaining({
        unitNumber: 32,
        title: "Control del motor paso a paso con codificador rotatorio",
        slug: "stepper-encoder",
        activities: 0,
        status: "draft",
      }),
    ]);
  });
});
