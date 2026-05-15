"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";

import { authClient } from "@/lib/auth-client";
import { convexApi } from "@/lib/convex-api";
import {
  getWorksheetStatusLabel,
  getWorksheetStudentStatus,
  type ActivityEvaluation,
} from "@/lib/worksheet-status";

type WorksheetCard = {
  slug: string;
  title: string;
  level: string;
  duration: string;
  prerequisites: string[];
  activities: Array<{ id: string; title: string; validation: string }>;
  coverImage?: string;
  summary: string;
};

export function StudentDashboard({
  worksheets,
}: {
  worksheets: WorksheetCard[];
}) {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const dashboard = useQuery(
    convexApi.classroom.studentDashboard,
    session?.user ? {} : "skip",
  );

  if (sessionPending) {
    return (
      <section className="subtle-card p-5 text-[var(--color-graphite)]">
        Comprobando sesión...
      </section>
    );
  }

  if (!session?.user) {
    return (
      <section className="subtle-card p-5 text-[var(--color-graphite)]">
        Entra con tu cuenta para ver tus unidades y su estado.
      </section>
    );
  }

  if (dashboard === undefined) {
    return (
      <section className="subtle-card p-5 text-[var(--color-graphite)]">
        Cargando unidades...
      </section>
    );
  }

  if (!dashboard.student) {
    return (
      <section className="subtle-card p-5 text-[var(--color-graphite)]">
        Tu cuenta todavía no está unida a un grupo. Usa el código facilitado en clase.
      </section>
    );
  }

  const localWorksheetBySlug = new Map(
    worksheets.map((worksheet) => [worksheet.slug, worksheet]),
  );
  const evaluationsByWorksheet = new Map<string, ActivityEvaluation[]>();
  for (const evaluation of dashboard.evaluations) {
    const list = evaluationsByWorksheet.get(evaluation.worksheetId) ?? [];
    list.push({ activityId: evaluation.activityId, status: evaluation.status });
    evaluationsByWorksheet.set(evaluation.worksheetId, list);
  }

  const completedWorksheetSlugs: string[] = [];
  const cards = dashboard.worksheets
    .map((convexWorksheet) => {
      const localWorksheet = localWorksheetBySlug.get(convexWorksheet.slug);

      if (!localWorksheet) {
        return null;
      }

      const evaluations = convexWorksheet
      ? (evaluationsByWorksheet.get(convexWorksheet._id) ?? [])
      : [];
      const worksheetStatus = getWorksheetStudentStatus(
        {
          slug: convexWorksheet.slug,
          prerequisites: convexWorksheet.prerequisites,
          activities: localWorksheet.activities,
        },
        evaluations,
        completedWorksheetSlugs,
      );

      if (worksheetStatus === "completed") {
        completedWorksheetSlugs.push(convexWorksheet.slug);
      }

      return {
        ...localWorksheet,
        title: convexWorksheet.title,
        level: convexWorksheet.level,
        duration: convexWorksheet.duration,
        prerequisites: convexWorksheet.prerequisites,
        worksheetStatus,
        evaluations,
      };
    })
    .filter((worksheet): worksheet is NonNullable<typeof worksheet> => Boolean(worksheet));

  return (
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((worksheet) => (
        <Link
          key={worksheet.slug}
          href={`/alumno/fichas/${worksheet.slug}`}
          className="surface-card flex h-full flex-col overflow-hidden bg-white"
        >
          <div className="relative aspect-[4/3] bg-[var(--color-canvas-white)]">
            <Image
              src={worksheet.coverImage ?? "/worksheet-placeholder.svg"}
              alt={`Imagen de ${worksheet.title}`}
              fill
              className="object-cover"
              sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
            />
          </div>
          <div className="grid flex-1 content-start gap-3 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="eyebrow">{worksheet.level}</p>
              <span className="badge bg-white">
                {getWorksheetStatusLabel(worksheet.worksheetStatus)}
              </span>
            </div>
            <h2 className="text-xl font-medium leading-[1.35] text-[var(--color-midnight-ink)]">
              {worksheet.title}
            </h2>
            <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
              {worksheet.summary}
            </p>
            <p className="text-sm text-[var(--color-steel-gray)]">
              {worksheet.duration} · {worksheet.activities.length} actividades
            </p>
          </div>
        </Link>
      ))}
    </section>
  );
}
