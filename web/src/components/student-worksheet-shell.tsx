import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";

import { Activity, type ActivityVisualStatus } from "@/components/activity-callout";
import { ActivityCompletionHighlighter } from "@/components/activity-completion-highlighter";
import { CodeBlock } from "@/components/code-block";
import { PrintButton } from "@/components/print-button";
import {
  KeyConcept,
  OptionalChallenge,
  WatchOut,
} from "@/components/worksheet-blocks";
import type { ActivityEvaluation } from "@/lib/worksheet-status";
import { getWorksheetDisplayTitle, type Worksheet } from "@/lib/worksheets";
import { getOrderedActivityStates } from "@/lib/teacher-progress";

export function StudentWorksheetShell({
  worksheet,
  fallbackEvaluations,
  unlocked = true,
  prerequisiteTitles = [],
  demoActivityStates,
}: {
  worksheet: Worksheet;
  fallbackEvaluations: ActivityEvaluation[];
  unlocked?: boolean;
  prerequisiteTitles?: string[];
  demoActivityStates?: Record<string, ActivityVisualStatus>;
}) {
  const convexEnabled = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
  const orderedStates = getOrderedActivityStates(
    worksheet.activities.map((activity) => activity.id),
    fallbackEvaluations.filter(
      (evaluation): evaluation is { activityId: string; status: "completed" | "closed_incomplete" } =>
        evaluation.status === "completed" || evaluation.status === "closed_incomplete",
    ),
  );
  const displayStatusById = new Map<string, ActivityVisualStatus>();

  for (const activity of worksheet.activities) {
    const demoStatus = demoActivityStates?.[activity.id];

    if (demoStatus) {
      displayStatusById.set(activity.id, demoStatus);
      continue;
    }

    displayStatusById.set(
      activity.id,
      (orderedStates.states.get(activity.id) ?? "locked") as ActivityVisualStatus,
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6 sm:px-8">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/alumno"
          className="text-sm font-semibold text-[var(--color-graphite)] hover:text-[var(--color-midnight-ink)]"
        >
          Volver al panel
        </Link>
        <PrintButton />
      </div>

      <article className="print-page rounded-lg bg-white py-5 sm:py-8">
        <header className="mb-8 grid gap-5 pb-2">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="badge">{worksheet.level}</span>
            <span className="badge">
              {worksheet.activities.length} actividades
            </span>
          </div>
          <h1 className="text-[40px] font-semibold leading-[1.04] text-[var(--color-midnight-ink)] sm:text-[56px]">
            {getWorksheetDisplayTitle(worksheet)}
          </h1>
          {worksheet.summary ? (
            <p className="max-w-3xl text-lg leading-[1.62] text-[var(--color-graphite)]">
              {worksheet.summary}
            </p>
          ) : null}
          {!unlocked ? (
            <div className="subtle-card border-[var(--color-ember-glow)] p-4 text-sm leading-6 text-[var(--color-midnight-ink)]">
              Esta ficha tiene requisitos previos. Completa primero:{" "}
              {prerequisiteTitles.join(", ")}.
            </div>
          ) : null}
        </header>
        {unlocked ? (
          <>
            {convexEnabled && !demoActivityStates ? (
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
                      environment={
                        props.environment === "simulador" || props.environment === "placa"
                          ? props.environment
                          : undefined
                      }
                      status={displayStatusById.get(String(props.id)) ?? "locked"}
                      studentView
                    >
                      {props.children}
                    </Activity>
                  ),
                  KeyConcept,
                  WatchOut,
                  OptionalChallenge,
                  pre: CodeBlock,
                }}
              />
            </div>
          </>
        ) : null}
      </article>
    </main>
  );
}
