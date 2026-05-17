import { describe, expect, it } from "vitest";

import { getWorksheetGraphOrder } from "../../convex/worksheetOrder";

const baseWorksheets = [
  { slug: "unidad-01", status: "published" as const, position: 0 },
  { slug: "unidad-02", status: "published" as const, position: 1 },
  { slug: "unidad-03", status: "draft" as const, position: 2 },
];

describe("getWorksheetGraphOrder", () => {
  it("keeps the caller order when a teacher drags units into a new order", () => {
    const draggedOrder = [baseWorksheets[2], baseWorksheets[0], baseWorksheets[1]];

    expect(
      getWorksheetGraphOrder(draggedOrder, { preserveInputOrder: true }).map(
        (worksheet) => worksheet.slug,
      ),
    ).toEqual(["unidad-03", "unidad-01", "unidad-02"]);
  });
});
