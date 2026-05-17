type WorksheetOrderInput = {
  position?: number;
  slug: string;
  status: "draft" | "published" | "archived";
};

export function sortWorksheets<T extends { position?: number; slug: string }>(
  worksheets: T[],
) {
  return [...worksheets].sort(
    (a, b) =>
      (a.position ?? Number.MAX_SAFE_INTEGER) -
        (b.position ?? Number.MAX_SAFE_INTEGER) ||
      a.slug.localeCompare(b.slug, "es"),
  );
}

export function getWorksheetGraphOrder<T extends WorksheetOrderInput>(
  worksheets: T[],
  options: { preserveInputOrder?: boolean } = {},
) {
  const active = worksheets.filter((worksheet) => worksheet.status !== "archived");
  const archived = sortWorksheets(
    worksheets.filter((worksheet) => worksheet.status === "archived"),
  );

  return [
    ...(options.preserveInputOrder ? active : sortWorksheets(active)),
    ...archived,
  ];
}
