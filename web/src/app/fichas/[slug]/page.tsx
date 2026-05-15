import { notFound } from "next/navigation";

import { WorksheetPreviewShell } from "@/components/worksheet-preview-shell";
import {
  getPublishedWorksheetFromCatalog,
  getPublishedWorksheetsFromCatalog,
} from "@/lib/worksheets";

export async function generateStaticParams() {
  const worksheets = await getPublishedWorksheetsFromCatalog();

  return worksheets.map((worksheet) => ({
    slug: worksheet.slug,
  }));
}

export default async function WorksheetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const worksheet = await getPublishedWorksheetFromCatalog(slug);

  if (!worksheet) {
    notFound();
  }

  return <WorksheetPreviewShell worksheet={worksheet} />;
}
