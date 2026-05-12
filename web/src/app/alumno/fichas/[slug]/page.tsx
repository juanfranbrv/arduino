import { notFound } from "next/navigation";

import { RestrictedAccess } from "@/components/restricted-access";
import { StudentWorksheetShell } from "@/components/student-worksheet-shell";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import { convexApi } from "@/lib/convex-api";
import { getWorksheetStudentStatus } from "@/lib/worksheet-status";
import {
  getPublishedWorksheet,
  getPublishedWorksheets,
} from "@/lib/worksheets";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getPublishedWorksheets().map((worksheet) => ({
    slug: worksheet.slug,
  }));
}

export default async function StudentWorksheetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const worksheet = getPublishedWorksheet(slug);

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
    const publishedWorksheet = getPublishedWorksheet(item.slug);
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
      publishedWorksheet,
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

  return (
    <StudentWorksheetShell
      worksheet={worksheet}
      fallbackEvaluations={currentEvaluations}
      completedWorksheetSlugs={completedWorksheetSlugs}
    />
  );
}
