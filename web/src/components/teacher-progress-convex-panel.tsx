"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle2, CheckCheck, ChevronDown, Lock, UserRound, X, XCircle } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { convexApi } from "@/lib/convex-api";
import {
  getActivityStatusLabel,
  getWorksheetPublicationStatusLabel,
} from "@/lib/worksheet-status";
import {
  getLastResolvedActivityId,
  getOrderedActivityStates,
  resolveTeacherDashboardActivities,
  type LocalTeacherProgressWorksheet,
  type OrderedActivityEvaluation,
} from "@/lib/teacher-progress";
import { getWorksheetDisplayTitle } from "@/lib/worksheet-display";

export function TeacherProgressConvexPanel({
  initialGroupId = null,
  initialStudentId = null,
  initialWorksheetId = null,
  localWorksheets = [],
}: {
  initialGroupId?: string | null;
  initialStudentId?: string | null;
  initialWorksheetId?: string | null;
  localWorksheets?: LocalTeacherProgressWorksheet[];
}) {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialGroupId);
  const [selectedWorksheetId, setSelectedWorksheetId] = useState<string | null>(initialWorksheetId);
  const dashboardArgs = useMemo(
    () =>
      session?.user
        ? {
            ...(selectedGroupId ? { groupId: selectedGroupId } : {}),
            ...(selectedWorksheetId ? { worksheetId: selectedWorksheetId } : {}),
          }
        : "skip",
    [selectedGroupId, selectedWorksheetId, session?.user],
  );
  const dashboard = useQuery(
    convexApi.classroom.teacherDashboard,
    dashboardArgs,
  );
  const setActivityStatus = useMutation(convexApi.progress.setActivityStatus);
  const completeAllActivities = useMutation(convexApi.progress.completeAllActivities);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialStudentId);
  const [pendingActivityId, setPendingActivityId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
  const effectiveGroupId = !dashboard?.groups.length
    ? null
    : selectedGroupId && dashboard.groups.some((group) => group._id === selectedGroupId)
      ? selectedGroupId
      : dashboard.selectedGroup?._id ?? dashboard.groups[0]._id;
  const effectiveWorksheetId = !dashboard?.worksheets.length
    ? null
    : selectedWorksheetId &&
        dashboard.worksheets.some((worksheet) => worksheet._id === selectedWorksheetId)
      ? selectedWorksheetId
      : dashboard.selectedWorksheet?._id ?? dashboard.worksheets[0]._id;
  const effectiveStudentId = !dashboard?.students.length
    ? null
    : selectedStudentId &&
        dashboard.students.some((student) => student._id === selectedStudentId)
      ? selectedStudentId
      : dashboard.students[0]._id;

  const evaluationsByStudent = useMemo(() => {
    const map = new Map<string, OrderedActivityEvaluation[]>();

    dashboard?.students.forEach((student) => {
      map.set(student._id, []);
    });

    dashboard?.evaluations.forEach((evaluation) => {
      const current = map.get(evaluation.studentId) ?? [];
      current.push({
        activityId: evaluation.activityId,
        status: evaluation.status,
      });
      map.set(evaluation.studentId, current);
    });

    return map;
  }, [dashboard]);

  const selectedStudent =
    dashboard?.students.find((student) => student._id === effectiveStudentId) ?? null;
  const dashboardActivities = useMemo(
    () =>
      dashboard
        ? resolveTeacherDashboardActivities({
            remoteActivities: dashboard.activities,
            selectedWorksheet: dashboard.selectedWorksheet,
            localWorksheets,
          })
        : [],
    [dashboard, localWorksheets],
  );
  const dashboardActivityIds = useMemo(
    () => dashboardActivities.map((activity) => activity.activityId),
    [dashboardActivities],
  );
  const selectedStudentEvaluations = useMemo(
    () => (selectedStudent ? evaluationsByStudent.get(selectedStudent._id) ?? [] : []),
    [evaluationsByStudent, selectedStudent],
  );
  const selectedStudentProgress = useMemo(
    () =>
      dashboard
        ? getOrderedActivityStates(
            dashboardActivityIds,
            selectedStudentEvaluations,
          )
        : { states: new Map(), currentActivityId: null },
    [dashboard, dashboardActivityIds, selectedStudentEvaluations],
  );
  const lastResolvedActivityId = useMemo(
    () =>
      dashboard
        ? getLastResolvedActivityId(
            dashboardActivityIds,
            selectedStudentEvaluations,
          )
        : null,
    [dashboard, dashboardActivityIds, selectedStudentEvaluations],
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

  if (!dashboard.groups.length || !dashboard.worksheets.length) {
    return (
      <section className="subtle-card p-5 text-[var(--color-graphite)]">
        Crea al menos un grupo y sincroniza al menos una unidad para empezar.
      </section>
    );
  }

  async function updateActivity(
    activityId: string,
    status: "pending" | "completed" | "closed_incomplete",
  ) {
    const currentWorksheet = dashboard?.selectedWorksheet;

    if (!selectedStudent || !currentWorksheet) {
      return;
    }

    setPendingActivityId(activityId);
    setMessage(null);

    try {
      await setActivityStatus({
        studentId: selectedStudent._id,
        worksheetId: currentWorksheet._id,
        activityId,
        activityIds: dashboardActivityIds,
        status,
      });
      setMessage(
        status === "pending"
          ? `${selectedStudent.displayName}: actividad reabierta.`
          : `${selectedStudent.displayName}: ${getActivityStatusLabel(status).toLowerCase()}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se ha podido guardar el cambio.",
      );
    } finally {
      setPendingActivityId(null);
    }
  }

  async function handleCompleteAll() {
    const currentWorksheet = dashboard?.selectedWorksheet;

    if (!selectedStudent || !currentWorksheet) {
      return;
    }

    setPendingActivityId("all");
    setMessage(null);

    try {
      await completeAllActivities({
        studentId: selectedStudent._id,
        worksheetId: currentWorksheet._id,
        activityIds: dashboardActivityIds,
      });
      setMessage(
        `${selectedStudent.displayName}: todas las actividades marcadas como completadas.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se han podido completar todas las actividades.",
      );
    } finally {
      setPendingActivityId(null);
    }
  }

  return (
    <section className="grid gap-4">
      <section className="surface-card grid gap-4 p-4 sm:p-5">
        <div className="grid gap-3 xl:grid-cols-[21.5rem_minmax(0,1fr)] xl:gap-9">
          <label className="form-label">
            Grupo
            <select
              className="form-input"
              value={effectiveGroupId ?? ""}
              onChange={(event) => {
                setSelectedGroupId(event.target.value);
                setSelectedStudentId(null);
              }}
            >
              {dashboard.groups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-label">
            Unidad
            <select
              className="form-input"
              value={effectiveWorksheetId ?? ""}
              onChange={(event) => setSelectedWorksheetId(event.target.value)}
            >
              {dashboard.worksheets.map((worksheet, index) => (
                <option key={worksheet._id} value={worksheet._id}>
                  {getWorksheetDisplayTitle({
                    title: worksheet.title,
                    unitNumber: index + 1,
                  })} · {getWorksheetPublicationStatusLabel(worksheet.status)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {!dashboard.students.length ? (
        <p className="subtle-card p-4 text-sm text-[var(--color-graphite)]">
          Este grupo no tiene alumnos todavía.
        </p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[24rem_minmax(0,1fr)] xl:items-start">
          <section className="hidden surface-card gap-3 p-4 sm:p-5 xl:sticky xl:top-4 xl:grid xl:max-h-[calc(100vh-8rem)] xl:overflow-auto">
            <div className="grid gap-2">
              {dashboard.students.map((student) => {
                const studentEvaluations = evaluationsByStudent.get(student._id) ?? [];
                const progress = getOrderedActivityStates(
                  dashboardActivityIds,
                  studentEvaluations,
                );
                const resolvedCount = studentEvaluations.length;
                const currentActivity = dashboardActivities.find(
                  (activity) => activity.activityId === progress.currentActivityId,
                );

                return (
                  <button
                    key={student._id}
                    type="button"
                    onClick={() => setSelectedStudentId(student._id)}
                    className={`rounded-[28px] border p-4 text-left transition ${
                      selectedStudent?._id === student._id
                        ? "border-[var(--color-midnight-ink)] bg-white"
                        : "border-[var(--color-faded-gray)] bg-[var(--color-canvas-white)] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[var(--color-steel-gray)]">
                          <UserRound className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[var(--color-midnight-ink)]">
                            {student.displayName}
                          </p>
                          <p className="text-sm text-[var(--color-graphite)]">
                            {resolvedCount}/{dashboardActivities.length} actividades resueltas
                          </p>
                        </div>
                      </div>
                      <span className="badge bg-white">
                        {currentActivity ? `Actual: ${currentActivity.order + 1}` : "Unidad completada"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedStudent && dashboard.selectedWorksheet ? (
            <section className="surface-card grid gap-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-faded-gray)] pb-4">
                <div>
                  <p className="text-sm text-[var(--color-steel-gray)]">
                    {getWorksheetDisplayTitle({
                      title: dashboard.selectedWorksheet.title,
                      unitNumber:
                        dashboard.worksheets.findIndex(
                          (w) => w._id === dashboard.selectedWorksheet?._id,
                        ) + 1,
                    })}
                  </p>
                  <h2 className="text-2xl font-semibold text-[var(--color-midnight-ink)]">
                    {selectedStudent.displayName}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="btn-secondary gap-2"
                    disabled={pendingActivityId !== null}
                    onClick={handleCompleteAll}
                  >
                    <CheckCheck className="size-4" />
                    {pendingActivityId === "all" ? "Guardando..." : "Completar todas"}
                  </button>
                  <span className="badge bg-white">
                    {getWorksheetPublicationStatusLabel(
                      dashboard.selectedWorksheet.status,
                    )}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary xl:hidden"
                    onClick={() => setIsStudentPickerOpen(true)}
                  >
                    Alumno
                    <ChevronDown className="size-4" />
                  </button>
                  <span className="badge bg-white">
                    {dashboardActivities.length} actividades
                  </span>
                </div>
              </div>

              <div className="grid gap-3">
                {dashboardActivities.map((activity) => {
                  const state = selectedStudentProgress.states.get(activity.activityId) ?? "locked";
                  const isCurrent = state === "pending";
                  const isCompleted = state === "completed";
                  const isOmitted = state === "closed_incomplete";
                  const isLocked = state === "locked";
                  const canReopen =
                    (isCompleted || isOmitted) &&
                    lastResolvedActivityId === activity.activityId;

                  return (
                    <div
                      key={activity.activityId}
                      className={`grid gap-3 rounded-[28px] border p-4 ${
                        isCompleted
                          ? "border-emerald-200 bg-emerald-50/80"
                          : isOmitted
                            ? "border-orange-200 bg-orange-50/90"
                            : isLocked
                              ? "border-slate-100 bg-slate-50/70"
                              : "border-[var(--color-midnight-ink)] bg-white"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="grid gap-1">
                          <strong className="text-lg text-[var(--color-midnight-ink)]">
                            Actividad {activity.order + 1}
                          </strong>
                          <span className="text-base font-semibold text-[var(--color-midnight-ink)]">
                            {activity.title}
                          </span>
                          <span className="text-sm leading-6 text-[var(--color-graphite)]">
                            {activity.validation}
                          </span>
                        </div>

                        <span
                          className={`activity-status-badge shrink-0 ${
                            isCompleted
                              ? "activity-status-badge--completed"
                              : isOmitted
                                ? "activity-status-badge--omitted"
                                : isLocked
                                  ? "activity-status-badge--locked"
                                  : "activity-status-badge--current"
                          }`}
                        >
                          {isCurrent
                            ? "Actividad actual"
                            : isLocked
                              ? "Bloqueada"
                              : getActivityStatusLabel(state)}
                        </span>
                      </div>

                      {isCurrent ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={pendingActivityId !== null}
                            onClick={() => updateActivity(activity.activityId, "completed")}
                          >
                            <CheckCircle2 className="size-4" />
                            {pendingActivityId === activity.activityId ? "Guardando..." : "Completar"}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            disabled={pendingActivityId !== null}
                            onClick={() => updateActivity(activity.activityId, "closed_incomplete")}
                          >
                            <XCircle className="size-4" />
                            Omitir
                          </button>
                        </div>
                      ) : canReopen ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn-secondary"
                            disabled={pendingActivityId !== null}
                            onClick={() => updateActivity(activity.activityId, "pending")}
                          >
                            {pendingActivityId === activity.activityId ? "Guardando..." : "Reabrir"}
                          </button>
                        </div>
                      ) : isLocked ? (
                        <div className="flex items-center gap-2 text-sm text-[var(--color-steel-gray)]">
                          <Lock className="size-4" />
                          Se desbloquea al resolver la actividad anterior.
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {message ? (
                <p className="text-sm text-[var(--color-graphite)]" aria-live="polite">
                  {message}
                </p>
              ) : null}
            </section>
          ) : null}
        </div>
      )}

      {selectedStudent && dashboard.students.length ? (
        <div
          className={`fixed inset-0 z-50 xl:hidden ${
            isStudentPickerOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
          aria-hidden={!isStudentPickerOpen}
        >
          <button
            type="button"
            className={`absolute inset-0 bg-black/30 transition ${
              isStudentPickerOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setIsStudentPickerOpen(false)}
            aria-label="Cerrar selector de alumnos"
          />
          <section
            className={`absolute inset-x-0 bottom-0 max-h-[78vh] rounded-t-[32px] bg-white p-4 shadow-2xl transition-transform duration-200 ${
              isStudentPickerOpen ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--color-faded-gray)]" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Alumnos</p>
                <h3 className="mt-1 text-xl font-semibold text-[var(--color-midnight-ink)]">
                  Cambiar alumno
                </h3>
              </div>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-full border border-[var(--color-faded-gray)] bg-white text-[var(--color-steel-gray)]"
                onClick={() => setIsStudentPickerOpen(false)}
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid max-h-[58vh] gap-2 overflow-auto pb-2">
              {dashboard.students.map((student) => {
                const studentEvaluations = evaluationsByStudent.get(student._id) ?? [];
                const progress = getOrderedActivityStates(
                  dashboardActivityIds,
                  studentEvaluations,
                );
                const resolvedCount = studentEvaluations.length;
                const currentActivity = dashboardActivities.find(
                  (activity) => activity.activityId === progress.currentActivityId,
                );

                return (
                  <button
                    key={student._id}
                    type="button"
                    onClick={() => {
                      setSelectedStudentId(student._id);
                      setIsStudentPickerOpen(false);
                    }}
                    className={`rounded-[24px] border p-4 text-left transition ${
                      selectedStudent._id === student._id
                        ? "border-[var(--color-midnight-ink)] bg-[var(--color-canvas-white)]"
                        : "border-[var(--color-faded-gray)] bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-canvas-white)] text-[var(--color-steel-gray)]">
                          <UserRound className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[var(--color-midnight-ink)]">
                            {student.displayName}
                          </p>
                          <p className="text-sm text-[var(--color-graphite)]">
                            {resolvedCount}/{dashboardActivities.length} actividades resueltas
                          </p>
                        </div>
                      </div>
                      <span className="badge bg-[var(--color-canvas-white)]">
                        {currentActivity ? `Actual: ${currentActivity.order + 1}` : "Unidad completada"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
