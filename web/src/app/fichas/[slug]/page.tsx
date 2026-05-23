import { notFound } from "next/navigation";

import { WorksheetPreviewShell } from "@/components/worksheet-preview-shell";
import { isAuthenticated } from "@/lib/auth-server";
import {
  getPublishedWorksheetFromCatalog,
  getPublishedWorksheetsFromCatalog,
} from "@/lib/worksheets";

export const dynamic = "force-dynamic";

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

  const continueHref = (await isAuthenticated())
    ? `/alumno/fichas/${slug}`
    : "/login";

  return <WorksheetPreviewShell worksheet={worksheet} continueHref={continueHref} />;
}
