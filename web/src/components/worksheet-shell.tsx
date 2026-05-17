import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";

import { Activity } from "@/components/activity-callout";
import { CodeBlock } from "@/components/code-block";
import { PrintButton } from "@/components/print-button";
import {
  KeyConcept,
  OptionalChallenge,
  WatchOut,
} from "@/components/worksheet-blocks";
import { getOrderedActivityStates } from "@/lib/teacher-progress";
import { getWorksheetDisplayTitle, type Worksheet } from "@/lib/worksheets";

const worksheetComponents = {
  Activity,
  KeyConcept,
  WatchOut,
  OptionalChallenge,
  pre: CodeBlock,
};

export function WorksheetShell({
  worksheet,
  backHref = "/fichas",
  backLabel = "Volver a fichas",
}: {
  worksheet: Worksheet;
  backHref?: string;
  backLabel?: string;
}) {
  const displayStates = getOrderedActivityStates(
    worksheet.activities.map((activity) => activity.id),
    [],
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6 sm:px-8">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="text-sm font-semibold text-[var(--color-graphite)] hover:text-[var(--color-midnight-ink)]"
        >
          {backLabel}
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
            <p className="max-w-none text-lg font-semibold leading-[1.62] text-[var(--color-graphite)]">
              {worksheet.summary}
            </p>
          ) : null}
        </header>
        <div className="worksheet-content">
          <MDXRemote
            source={worksheet.body}
            components={{
              ...worksheetComponents,
              Activity: (props) => (
                <Activity
                  id={String(props.id)}
                  title={String(props.title)}
                  validation={String(props.validation)}
                  status={displayStates.states.get(String(props.id)) ?? "locked"}
                  studentView
                >
                  {props.children}
                </Activity>
              ),
            }}
          />
        </div>
      </article>
    </main>
  );
}
