import type { ReactNode } from "react";

import { getActivityStatusLabel, type ActivityStatus } from "@/lib/worksheet-status";

export type ActivityVisualStatus = ActivityStatus | "locked";

export function Activity({
  id,
  title,
  validation,
  status = "pending",
  studentView = false,
  children,
}: {
  id: string;
  title: string;
  validation: string;
  status?: ActivityVisualStatus;
  studentView?: boolean;
  children?: ReactNode;
}) {
  const completed = status === "completed";
  const omitted = status === "closed_incomplete";
  const locked = status === "locked";
  const activityNumber = id.match(/\d+/)?.[0].replace(/^0+/, "") || id;
  const statusLabel =
    status === "pending"
      ? "Actividad actual"
      : locked
        ? "Bloqueada"
        : getActivityStatusLabel(status);

  return (
    <section
      data-activity-id={id}
      data-activity-state={status}
      className={`activity-card grid gap-5 border p-5 print:border-[var(--color-graphite)] print:bg-white ${
        completed
          ? "border-emerald-200 bg-emerald-50/80"
          : omitted
            ? "border-orange-200 bg-orange-50/90"
            : locked
              ? "border-slate-100 bg-slate-50/70 text-slate-500"
              : "border-[var(--color-faded-gray)] bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-bold uppercase text-[var(--color-midnight-ink)] print:text-[var(--color-graphite)]">
            Actividad {activityNumber}
          </p>
          <h3 className="text-[34px] font-semibold leading-[1.16] text-[var(--color-midnight-ink)]">
            {title}
          </h3>
        </div>
        {studentView ? (
          <span
            data-activity-status={id}
            className={`activity-status-badge shrink-0 ${
              completed
                ? "activity-status-badge--completed"
                : omitted
                  ? "activity-status-badge--omitted"
                  : locked
                    ? "activity-status-badge--locked"
                    : "activity-status-badge--current"
            }`}
          >
            {statusLabel}
          </span>
        ) : null}
      </div>
      <p className="activity-card__validation">
        <strong>Objetivo:</strong> {validation}
      </p>
      {children ? <div className="activity-card__body">{children}</div> : null}
    </section>
  );
}
