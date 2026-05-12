"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { UserRound } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { convexApi } from "@/lib/convex-api";
import { getActivityStatusLabel, type ActivityStatus } from "@/lib/worksheet-status";

const statusOptions: ActivityStatus[] = [
  "pending",
  "completed",
  "closed_incomplete",
];

export function TeacherProgressConvexPanel() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const dashboard = useQuery(
    convexApi.classroom.teacherDashboard,
    session?.user ? {} : "skip",
  );
  const setActivityStatus = useMutation(convexApi.progress.setActivityStatus);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const selectedStudent =
    dashboard?.students.find(
      (student) => student._id === (selectedStudentId ?? dashboard.students[0]?._id),
    ) ?? null;

  const statusByActivity = useMemo(() => {
    if (!dashboard || !selectedStudent || !dashboard.selectedWorksheet) {
      return new Map<string, ActivityStatus>();
    }

    return new Map(
      dashboard.evaluations
        .filter(
          (evaluation) =>
            evaluation.studentId === selectedStudent._id &&
            evaluation.worksheetId === dashboard.selectedWorksheet?._id,
        )
        .map((evaluation) => [evaluation.activityId, evaluation.status]),
    );
  }, [dashboard, selectedStudent]);

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
        Entra con tu cuenta de profesor para gestionar el seguimiento.
      </section>
    );
  }

  if (dashboard === undefined) {
    return (
      <section className="subtle-card p-5 text-[var(--color-graphite)]">
        Cargando seguimiento...
      </section>
    );
  }

  if (!dashboard.isTeacher) {
    return (
      <section className="subtle-card p-5 text-[var(--color-graphite)]">
        Entra con tu cuenta de profesor y activa el acceso desde la pantalla de
        setup para gestionar el seguimiento.
      </section>
    );
  }

  if (!dashboard.selectedGroup || !dashboard.selectedWorksheet) {
    return (
      <section className="subtle-card p-5 text-[var(--color-graphite)]">
        Crea un grupo, alumnos y una ficha publicada en Convex para empezar.
      </section>
    );
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[16rem_1fr]">
      <aside className="grid gap-2">
        {dashboard.students.map((student) => (
          <button
            key={student._id}
            type="button"
            onClick={() => setSelectedStudentId(student._id)}
            className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 text-left transition ${
              selectedStudent?._id === student._id
                ? "border-[var(--color-jet-black)] bg-white"
                : "border-[var(--color-faded-gray)] bg-[var(--color-canvas-white)] hover:bg-white"
            }`}
          >
            <UserRound className="size-5 text-[var(--color-steel-gray)]" />
            <span className="font-semibold text-[var(--color-midnight-ink)]">
              {student.displayName}
            </span>
          </button>
        ))}
      </aside>

      {selectedStudent ? (
        <div className="surface-card grid gap-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-faded-gray)] pb-4">
            <div>
              <p className="text-sm text-[var(--color-steel-gray)]">
                {dashboard.selectedWorksheet.title}
              </p>
              <h2 className="text-2xl font-semibold text-[var(--color-midnight-ink)]">
                {selectedStudent.displayName}
              </h2>
            </div>
            <span className="badge bg-white">
              {dashboard.activities.length} actividades
            </span>
          </div>

          <div className="grid gap-3">
            {dashboard.activities.map((activity) => {
              const currentStatus = statusByActivity.get(activity.activityId) ?? "pending";

              return (
                <div
                  key={activity.activityId}
                  className="grid gap-3 rounded-[28px] border border-[var(--color-faded-gray)] bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="grid gap-1">
                      <strong className="text-lg text-[var(--color-midnight-ink)]">
                        {activity.title}
                      </strong>
                      <span className="text-sm leading-6 text-[var(--color-graphite)]">
                        {activity.validation}
                      </span>
                    </div>
                    <span className="badge bg-[var(--color-canvas-white)]">
                      {getActivityStatusLabel(currentStatus)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() =>
                          setActivityStatus({
                            studentId: selectedStudent._id,
                            worksheetId: dashboard.selectedWorksheet!._id,
                            activityId: activity.activityId,
                            status,
                          })
                        }
                        className={`rounded-xl border px-3 py-2 text-sm transition ${
                          currentStatus === status
                            ? "border-[var(--color-midnight-ink)] bg-[var(--color-midnight-ink)] text-white"
                            : "border-[var(--color-faded-gray)] bg-white text-[var(--color-midnight-ink)]"
                        }`}
                      >
                        {getActivityStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <section className="subtle-card p-5 text-[var(--color-graphite)]">
          No hay alumnos en este grupo.
        </section>
      )}
    </section>
  );
}
