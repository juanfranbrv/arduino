import { notFound } from "next/navigation";

import { WorksheetPreviewShell } from "@/components/worksheet-preview-shell";
import { getPublishedWorksheet, getPublishedWorksheets } from "@/lib/worksheets";

export function generateStaticParams() {
  return getPublishedWorksheets().map((worksheet) => ({
    slug: worksheet.slug,
  }));
}

export default async function WorksheetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const worksheet = getPublishedWorksheet(slug);

  if (!worksheet) {
    notFound();
  }

  return <WorksheetPreviewShell worksheet={worksheet} />;
}
