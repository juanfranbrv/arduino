import type { ReactNode } from "react";
import Image from "next/image";

import { getActivityStatusLabel, type ActivityStatus } from "@/lib/worksheet-status";

export type ActivityVisualStatus = ActivityStatus | "locked";
export type ActivityEnvironment = "simulador" | "placa";

const activityEnvironmentMeta: Record<
  ActivityEnvironment,
  { alt: string; label: string; src: string }
> = {
  simulador: {
    alt: "Actividad con simulador Tinkercad",
    label: "Simulador",
    src: "/activity-environments/tinkercad.jpg",
  },
  placa: {
    alt: "Actividad con placa Arduino",
    label: "Placa",
    src: "/activity-environments/arduino-uno.png",
  },
};

export function Activity({
  id,
  title,
  validation,
  environment,
  status = "pending",
  studentView = false,
  children,
}: {
  id: string;
  title: string;
  validation: string;
  environment?: ActivityEnvironment;
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
  const environmentMeta = environment ? activityEnvironmentMeta[environment] : null;

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
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <p className="text-2xl font-bold uppercase leading-none text-[var(--color-midnight-ink)] print:text-[var(--color-graphite)]">
              Actividad {activityNumber}
            </p>
            {environmentMeta ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-slate-600 shadow-sm">
                <Image
                  src={environmentMeta.src}
                  alt={environmentMeta.alt}
                  width={32}
                  height={32}
                  unoptimized
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className="hidden sm:inline">{environmentMeta.label}</span>
              </span>
            ) : null}
          </div>
          <h3 className="text-[34px] font-semibold leading-[1.16] text-[var(--color-midnight-ink)] sm:text-[38px]">
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
