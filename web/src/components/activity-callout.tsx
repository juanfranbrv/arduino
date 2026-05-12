import { CheckCircle2, CircleDashed, CircleOff } from "lucide-react";

import { getActivityStatusLabel, type ActivityStatus } from "@/lib/worksheet-status";

export function Activity({
  id,
  title,
  validation,
  status = "pending",
  studentView = false,
}: {
  id: string;
  title: string;
  validation: string;
  status?: ActivityStatus;
  studentView?: boolean;
}) {
  const completed = status === "completed";
  const closedIncomplete = status === "closed_incomplete";
  const Icon = completed ? CheckCircle2 : closedIncomplete ? CircleOff : CircleDashed;

  return (
    <section
      data-activity-id={id}
      data-activity-state={status}
      className={`grid gap-2 rounded-[28px] border-l-4 p-5 print:border-[var(--color-graphite)] print:bg-white ${
        completed
          ? "border-[var(--color-ember-glow)] bg-[var(--color-canvas-white)]"
          : closedIncomplete
            ? "border-[var(--color-graphite)] bg-white"
          : "border-[var(--color-faded-gray)] bg-[var(--color-whisper-gray)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={`mt-1 size-5 shrink-0 print:text-[var(--color-graphite)] ${
            completed
              ? "text-[var(--color-ember-glow)]"
              : closedIncomplete
                ? "text-[var(--color-graphite)]"
                : "text-[var(--color-steel-gray)]"
          }`}
        />
        <div>
          <p className="text-sm font-semibold uppercase print:text-[var(--color-graphite)]">
            <span
              className={
                completed
                  ? "text-[var(--color-ember-glow)]"
                  : closedIncomplete
                    ? "text-[var(--color-graphite)]"
                    : "text-[var(--color-graphite)]"
              }
            >
              Actividad {id}
            </span>
            {studentView ? (
              <span
                data-activity-status={id}
                className={`ml-2 ${
                  completed
                    ? "text-[var(--color-ember-glow)]"
                    : closedIncomplete
                      ? "text-[var(--color-graphite)]"
                      : "text-[var(--color-steel-gray)]"
                }`}
              >
                {getActivityStatusLabel(status)}
              </span>
            ) : null}
          </p>
          <h3 className="text-xl font-medium text-[var(--color-midnight-ink)]">{title}</h3>
        </div>
      </div>
      <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
        <strong>Criterio de validación:</strong> {validation}
      </p>
    </section>
  );
}
