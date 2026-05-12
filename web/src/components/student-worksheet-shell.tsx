import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";

import { Activity } from "@/components/activity-callout";
import { ActivityCompletionHighlighter } from "@/components/activity-completion-highlighter";
import { PrintButton } from "@/components/print-button";
import { isWorksheetUnlocked, type ActivityEvaluation } from "@/lib/worksheet-status";
import {
  getWorksheetPrerequisites,
  type Worksheet,
} from "@/lib/worksheets";

export function StudentWorksheetShell({
  worksheet,
  fallbackEvaluations,
  completedWorksheetSlugs = [],
}: {
  worksheet: Worksheet;
  fallbackEvaluations: ActivityEvaluation[];
  completedWorksheetSlugs?: string[];
}) {
  const convexEnabled = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
  const evaluationById = new Map(
    fallbackEvaluations.map((evaluation) => [evaluation.activityId, evaluation.status]),
  );
  const unlocked = isWorksheetUnlocked(worksheet, completedWorksheetSlugs);
  const prerequisites = getWorksheetPrerequisites(worksheet);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6 sm:px-8">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/alumno"
          className="text-sm font-semibold text-[var(--color-graphite)] hover:text-[var(--color-midnight-ink)]"
        >
          Volver al panel
        </Link>
        <PrintButton />
      </div>

      <article className="print-page surface-card p-5 sm:p-8">
        <header className="mb-8 grid gap-5 border-b border-[var(--color-faded-gray)] pb-7">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="badge">{worksheet.level}</span>
            <span className="badge">{worksheet.duration}</span>
            <span className="badge">
              {worksheet.activities.length} actividades
            </span>
          </div>
          <h1 className="text-[40px] font-semibold leading-[1.04] text-[var(--color-midnight-ink)] sm:text-[56px]">
            {worksheet.title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--color-graphite)]">
            Si has entrado como alumno, las actividades validadas por el profesor
            aparecen destacadas con un icono y un cambio visual claro.
          </p>
          {!unlocked ? (
            <div className="subtle-card border-[var(--color-ember-glow)] p-4 text-sm leading-6 text-[var(--color-midnight-ink)]">
              Esta ficha tiene requisitos previos. Completa primero:{" "}
              {prerequisites.map((item) => item.title).join(", ")}.
            </div>
          ) : null}
        </header>
        {unlocked ? (
          <>
            {convexEnabled ? (
              <ActivityCompletionHighlighter slug={worksheet.slug} />
            ) : null}
            <div className="worksheet-content">
              <MDXRemote
                source={worksheet.body}
                components={{
                  Activity: (props) => (
                    <Activity
                      id={String(props.id)}
                      title={String(props.title)}
                      validation={String(props.validation)}
                      status={evaluationById.get(String(props.id)) ?? "pending"}
                      studentView
                    />
                  ),
                }}
              />
            </div>
          </>
        ) : null}
      </article>
    </main>
  );
}
