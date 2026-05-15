import { notFound } from "next/navigation";

import { RestrictedAccess } from "@/components/restricted-access";
import { StudentWorksheetShell } from "@/components/student-worksheet-shell";
import type { ActivityVisualStatus } from "@/components/activity-callout";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import { convexApi } from "@/lib/convex-api";
import { getWorksheetStudentStatus } from "@/lib/worksheet-status";
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

export default async function StudentWorksheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ demoEstados?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const worksheet = await getPublishedWorksheetFromCatalog(slug);

  if (!worksheet) {
    notFound();
  }

  const canShowFullWorksheet =
    Boolean(process.env.NEXT_PUBLIC_CONVEX_URL) && (await isAuthenticated());

  if (!canShowFullWorksheet) {
    return <RestrictedAccess />;
  }

  const dashboard = await fetchAuthQuery(convexApi.classroom.studentDashboard, {});
  const completedWorksheetSlugs: string[] = [];
  const currentWorksheetEntry = dashboard.worksheets.find((item) => item.slug === slug);

  for (const item of dashboard.worksheets) {
    const publishedWorksheet = await getPublishedWorksheetFromCatalog(item.slug);
    if (!publishedWorksheet) {
      continue;
    }

    const evaluations = dashboard.evaluations
      .filter((evaluation) => evaluation.worksheetId === item._id)
      .map((evaluation) => ({
        activityId: evaluation.activityId,
        status: evaluation.status,
      }));

    const status = getWorksheetStudentStatus(
      {
        slug: item.slug,
        prerequisites: item.prerequisites,
        activities: publishedWorksheet.activities,
      },
      evaluations,
      completedWorksheetSlugs,
    );

    if (status === "completed") {
      completedWorksheetSlugs.push(item.slug);
    }
  }

  const currentEvaluations = currentWorksheetEntry
    ? dashboard.evaluations
        .filter((evaluation) => evaluation.worksheetId === currentWorksheetEntry._id)
        .map((evaluation) => ({
          activityId: evaluation.activityId,
          status: evaluation.status,
        }))
    : [];
  const prerequisiteTitles = currentWorksheetEntry
    ? dashboard.worksheets
        .filter((item) => currentWorksheetEntry.prerequisites.includes(item.slug))
        .map((item) => item.title)
    : [];
  const unlocked = currentWorksheetEntry
    ? currentWorksheetEntry.prerequisites.every((slug) =>
        completedWorksheetSlugs.includes(slug),
      )
    : true;
  const demoActivityStates: Record<string, ActivityVisualStatus> | undefined =
    resolvedSearchParams.demoEstados === "1"
      ? {
          "act-01": "completed",
          "act-02": "closed_incomplete",
          "act-03": "pending",
          "act-04": "locked",
        }
      : undefined;

  return (
    <StudentWorksheetShell
      worksheet={worksheet}
      fallbackEvaluations={currentEvaluations}
      unlocked={unlocked}
      prerequisiteTitles={prerequisiteTitles}
      demoActivityStates={demoActivityStates}
    />
  );
}
