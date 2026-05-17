export function getWorksheetBaseTitle(title: string) {
  return title.replace(/^Unidad\s+\d+\s+-\s+/i, "");
}

export function getWorksheetDisplayTitle({
  title,
  unitNumber,
}: {
  title: string;
  unitNumber?: number;
}) {
  const baseTitle = getWorksheetBaseTitle(title);

  return unitNumber ? `Unidad ${unitNumber} - ${baseTitle}` : baseTitle;
}
