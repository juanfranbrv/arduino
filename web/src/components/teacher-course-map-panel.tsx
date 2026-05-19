"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle2, ExternalLink, RotateCcw, X, XCircle } from "lucide-react";

import { convexApi } from "@/lib/convex-api";
import {
  buildCourseMapRows,
  getLastResolvedActivityId,
  getOrderedActivityStates,
  type CourseMapCell,
  type LocalTeacherProgressWorksheet,
} from "@/lib/teacher-progress";
import { getActivityStatusLabel, getWorksheetPublicationStatusLabel } from "@/lib/worksheet-status";
import { getWorksheetDisplayTitle } from "@/lib/worksheet-display";

type SelectedCourseMapCell = {
  studentId: string;
  worksheetId: string;
};

type HoveredCourseMapCell = {
  cell: CourseMapCell;
  unitNumber: number;
  x: number;
  y: number;
};

const cellClassNames: Record<CourseMapCell["state"], string> = {
  completed: "bg-emerald-100 text-emerald-800",
  current: "bg-amber-100 text-amber-900 ring-2 ring-amber-400",
  pending: "bg-slate-100 text-slate-500",
  draft: "bg-white text-[var(--color-silver-mist)]",
};

const cellLabels: Record<CourseMapCell["state"], string> = {
  completed: "Completada",
  current: "Actual",
  pending: "Pendiente",
  draft: "Borrador",
};

export function TeacherCourseMapPanel({
  localWorksheets,
}: {
  localWorksheets: LocalTeacherProgressWorksheet[];
}) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<SelectedCourseMapCell | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HoveredCourseMapCell | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const dashboard = useQuery(
    convexApi.classroom.teacherCourseMap,
    selectedGroupId ? { groupId: selectedGroupId } : {},
  );
  const setActivityStatus = useMutation(convexApi.progress.setActivityStatus);
  const completeAllActivities = useMutation(convexApi.progress.completeAllActivities);
  const resetWorksheetActivities = useMutation(convexApi.progress.resetWorksheetActivities);

  const effectiveGroupId = !dashboard?.groups.length
    ? null
    : selectedGroupId && dashboard.groups.some((group) => group._id === selectedGroupId)
      ? selectedGroupId
      : dashboard.selectedGroup?._id ?? dashboard.groups[0]._id;

  const localWorksheetBySlug = useMemo(
    () => new Map(localWorksheets.map((worksheet) => [worksheet.slug, worksheet])),
    [localWorksheets],
  );
  const worksheets = useMemo(
    () =>
      dashboard?.worksheets.map((worksheet) => {
        const localWorksheet = localWorksheetBySlug.get(worksheet.slug);

        return {
          ...worksheet,
          activityIds:
            worksheet.activityIds.length > 0
              ? worksheet.activityIds
              : localWorksheet?.activities.map((activity) => activity.id) ?? [],
          title: localWorksheet?.slug === worksheet.slug ? localWorksheet.title ?? worksheet.title : worksheet.title,
        };
      }) ?? [],
    [dashboard?.worksheets, localWorksheetBySlug],
  );
  const rows = useMemo(
    () =>
      dashboard
        ? buildCourseMapRows({
            students: dashboard.students,
            worksheets,
            evaluations: dashboard.evaluations,
          })
        : [],
    [dashboard, worksheets],
  );
  const selectedStudent = selectedCell
    ? dashboard?.students.find((student) => student._id === selectedCell.studentId) ?? null
    : null;
  const selectedWorksheet = selectedCell
    ? worksheets.find((worksheet) => worksheet._id === selectedCell.worksheetId) ?? null
    : null;
  const selectedLocalWorksheet = selectedWorksheet
    ? localWorksheetBySlug.get(selectedWorksheet.slug) ?? null
    : null;
  const selectedEvaluations =
    selectedCell && dashboard
      ? dashboard.evaluations.filter(
          (evaluation) =>
            evaluation.studentId === selectedCell.studentId &&
            evaluation.worksheetId === selectedCell.worksheetId,
        )
      : [];
  const selectedActivityStates = selectedWorksheet
    ? getOrderedActivityStates(selectedWorksheet.activityIds, selectedEvaluations)
    : { states: new Map(), currentActivityId: null };
  const selectedLastResolvedActivityId = selectedWorksheet
    ? getLastResolvedActivityId(selectedWorksheet.activityIds, selectedEvaluations)
    : null;
  const mapTableMinWidth = `max(860px, calc(13rem + 1rem + ${
    worksheets.length * 3
  }rem + ${Math.max(0, worksheets.length - 1) * 0.375}rem + 1.5rem))`;

  if (dashboard === undefined) {
    return (
      <section className="subtle-card p-5 text-[var(--color-graphite)]">
        Cargando mapa del curso...
      </section>
    );
  }

  if (!dashboard.isTeacher) {
    return (
      <section className="subtle-card p-5 text-[var(--color-graphite)]">
        Entra con tu cuenta de profesor para ver el mapa del curso.
      </section>
    );
  }

  if (!dashboard.groups.length) {
    return (
      <section className="subtle-card p-5 text-[var(--color-graphite)]">
        Crea al menos un grupo para ver el mapa del curso.
      </section>
    );
  }

  async function completeUnit() {
    if (!selectedCell || !selectedWorksheet) {
      return;
    }

    setPendingAction("complete-unit");
    setMessage(null);

    try {
      await completeAllActivities({
        studentId: selectedCell.studentId,
        worksheetId: selectedCell.worksheetId,
        activityIds: selectedWorksheet.activityIds,
      });
      setMessage("Unidad marcada como completada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se ha podido completar la unidad.");
    } finally {
      setPendingAction(null);
    }
  }

  async function resetUnit() {
    if (!selectedCell) {
      return;
    }

    setPendingAction("reset-unit");
    setMessage(null);

    try {
      await resetWorksheetActivities({
        studentId: selectedCell.studentId,
        worksheetId: selectedCell.worksheetId,
      });
      setMessage("Unidad reabierta.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se ha podido reabrir la unidad.");
    } finally {
      setPendingAction(null);
    }
  }

  async function updateActivity(
    activityId: string,
    status: "pending" | "completed" | "closed_incomplete",
  ) {
    if (!selectedCell || !selectedWorksheet) {
      return;
    }

    setPendingAction(activityId);
    setMessage(null);

    try {
      await setActivityStatus({
        studentId: selectedCell.studentId,
        worksheetId: selectedCell.worksheetId,
        activityId,
        activityIds: selectedWorksheet.activityIds,
        status,
      });
      setMessage(
        status === "pending"
          ? "Actividad reabierta."
          : `${getActivityStatusLabel(status)}.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se ha podido guardar el cambio.");
    } finally {
      setPendingAction(null);
    }
  }

  function openInTracking() {
    if (!selectedCell || !effectiveGroupId) {
      return;
    }

    window.location.assign(
      `/profesor?tab=seguimiento&groupId=${effectiveGroupId}&worksheetId=${selectedCell.worksheetId}&studentId=${selectedCell.studentId}`,
    );
  }

  return (
    <section className="surface-card grid gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="form-label w-full sm:w-64">
          Grupo
          <select
            className="form-input"
            value={effectiveGroupId ?? ""}
            onChange={(event) => {
              setSelectedGroupId(event.target.value);
              setSelectedCell(null);
            }}
          >
            {dashboard.groups.map((group) => (
              <option key={group._id} value={group._id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold leading-5 text-emerald-800">
            Completada
          </span>
          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold leading-5 text-amber-900">
            Actual
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold leading-5 text-slate-600">
            Pendiente
          </span>
          <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold leading-5 text-[var(--color-silver-mist)]">
            Borrador
          </span>
        </div>
      </div>

      {!dashboard.students.length ? (
        <p className="subtle-card p-4 text-sm text-[var(--color-graphite)]">
          Este grupo no tiene alumnos todavía.
        </p>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div
            className="grid overflow-hidden rounded-[28px] border border-[var(--color-faded-gray)] bg-white"
            style={{ minWidth: mapTableMinWidth }}
          >
            {rows.map((row) => (
              <div
                key={row.student._id}
                className="grid grid-cols-[13rem_max-content] items-center gap-4 border-b border-[var(--color-faded-gray)] p-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--color-midnight-ink)]">
                    {row.student.displayName}
                  </p>
                  <p className="text-xs font-semibold text-[var(--color-steel-gray)]">
                    {row.currentWorksheetId
                      ? `Unidad actual: ${
                          worksheets.findIndex(
                            (worksheet) => worksheet._id === row.currentWorksheetId,
                          ) + 1
                        }`
                      : "Curso completado"}
                  </p>
                </div>

                <div
                  className="grid gap-1.5"
                  style={{
                    gridTemplateColumns: `repeat(${worksheets.length}, 3rem)`,
                  }}
                >
                  {row.cells.map((cell, index) => (
                    <button
                      key={cell.worksheetId}
                      type="button"
                      className={`grid min-h-11 place-items-center rounded-[10px] text-sm font-bold transition hover:z-10 hover:ring-2 hover:ring-[var(--color-midnight-ink)] focus-visible:z-10 ${cellClassNames[cell.state]}`}
                      onBlur={() => setHoveredCell(null)}
                      onFocus={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        setHoveredCell({
                          cell,
                          unitNumber: index + 1,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseEnter={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        setHoveredCell({
                          cell,
                          unitNumber: index + 1,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() =>
                        setSelectedCell({
                          studentId: row.student._id,
                          worksheetId: cell.worksheetId,
                        })
                      }
                      aria-label={`${row.student.displayName}, ${getWorksheetDisplayTitle({
                        title: cell.worksheetTitle,
                        unitNumber: index + 1,
                      })}, ${cellLabels[cell.state]}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hoveredCell ? (
        <div
          className="pointer-events-none fixed z-[80] w-64 -translate-x-1/2 rounded-[14px] bg-[var(--color-midnight-ink)] p-3 text-left text-xs font-semibold leading-5 text-white shadow-xl"
          style={{
            left: hoveredCell.x,
            top: Math.max(12, hoveredCell.y - 86),
          }}
        >
          <span className="block text-sm">
            {getWorksheetDisplayTitle({
              title: hoveredCell.cell.worksheetTitle,
              unitNumber: hoveredCell.unitNumber,
            })}
          </span>
          <span className="block text-slate-300">
            {getCellDetail(hoveredCell.cell)}
          </span>
        </div>
      ) : null}

      {selectedCell && selectedStudent && selectedWorksheet ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/30 p-0 sm:place-items-center sm:p-6">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Cerrar detalle de unidad"
            onClick={() => setSelectedCell(null)}
          />
          <section className="relative grid max-h-[86vh] w-full gap-0 overflow-hidden rounded-t-[32px] bg-white shadow-2xl sm:max-w-lg sm:rounded-[32px]">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--color-faded-gray)] p-5">
              <div>
                <p className="text-sm font-semibold text-[var(--color-steel-gray)]">
                  {selectedStudent.displayName}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-[var(--color-midnight-ink)]">
                  {getWorksheetDisplayTitle({
                    title: selectedWorksheet.title,
                    unitNumber:
                      worksheets.findIndex((worksheet) => worksheet._id === selectedWorksheet._id) +
                      1,
                  })}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-graphite)]">
                  {selectedActivityStates.currentActivityId
                    ? `Actividad actual: ${
                        selectedWorksheet.activityIds.indexOf(
                          selectedActivityStates.currentActivityId,
                        ) + 1
                      } de ${selectedWorksheet.activityIds.length}`
                    : `${selectedWorksheet.activityIds.length}/${selectedWorksheet.activityIds.length} actividades resueltas`}
                </p>
              </div>
              <button
                type="button"
                className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--color-faded-gray)] bg-white text-[var(--color-steel-gray)]"
                onClick={() => setSelectedCell(null)}
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-[var(--color-faded-gray)] p-4">
              <button
                type="button"
                className="btn-primary gap-2"
                disabled={pendingAction !== null}
                onClick={completeUnit}
              >
                <CheckCircle2 className="size-4" />
                {pendingAction === "complete-unit" ? "Guardando..." : "Completar unidad"}
              </button>
              <button
                type="button"
                className="btn-secondary gap-2"
                disabled={pendingAction !== null}
                onClick={resetUnit}
              >
                <RotateCcw className="size-4" />
                Reabrir unidad
              </button>
              <button type="button" className="btn-secondary gap-2" onClick={openInTracking}>
                <ExternalLink className="size-4" />
                Abrir seguimiento
              </button>
            </div>

            <div className="grid max-h-[42vh] gap-2 overflow-auto p-4">
              {(selectedLocalWorksheet?.activities ?? []).map((activity, index) => {
                const state = selectedActivityStates.states.get(activity.id) ?? "locked";
                const isCurrent = state === "pending";
                const isCompleted = state === "completed";
                const isOmitted = state === "closed_incomplete";
                const canReopen =
                  (isCompleted || isOmitted) && selectedLastResolvedActivityId === activity.id;

                return (
                  <div
                    key={activity.id}
                    className="grid gap-3 rounded-[18px] border border-[var(--color-faded-gray)] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-midnight-ink)]">
                          {index + 1}. {activity.title}
                        </p>
                        <p className="text-xs font-semibold text-[var(--color-steel-gray)]">
                          {isCurrent
                            ? "Actividad actual"
                            : state === "locked"
                              ? "Bloqueada"
                              : getActivityStatusLabel(state)}
                        </p>
                      </div>
                      <span
                        className={`badge ${
                          isCompleted
                            ? "bg-emerald-100 text-emerald-800"
                            : isOmitted
                              ? "bg-orange-100 text-orange-800"
                              : isCurrent
                                ? "bg-amber-100 text-amber-900"
                                : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isCurrent
                          ? "Actual"
                          : state === "locked"
                            ? "Pendiente"
                            : getActivityStatusLabel(state)}
                      </span>
                    </div>

                    {isCurrent ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-primary min-h-10 gap-2 px-3 py-2 text-sm"
                          disabled={pendingAction !== null}
                          onClick={() => updateActivity(activity.id, "completed")}
                        >
                          <CheckCircle2 className="size-4" />
                          Completar
                        </button>
                        <button
                          type="button"
                          className="btn-secondary min-h-10 gap-2 px-3 py-2 text-sm"
                          disabled={pendingAction !== null}
                          onClick={() => updateActivity(activity.id, "closed_incomplete")}
                        >
                          <XCircle className="size-4" />
                          Omitir
                        </button>
                      </div>
                    ) : canReopen ? (
                      <button
                        type="button"
                        className="btn-secondary min-h-10 justify-self-start px-3 py-2 text-sm"
                        disabled={pendingAction !== null}
                        onClick={() => updateActivity(activity.id, "pending")}
                      >
                        Reabrir
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {message ? (
              <p className="px-5 pb-5 text-sm text-[var(--color-graphite)]" aria-live="polite">
                {message}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}
    </section>
  );
}

function getCellDetail(cell: CourseMapCell) {
  if (cell.state === "draft") {
    return getWorksheetPublicationStatusLabel(cell.worksheetStatus);
  }

  if (cell.state === "completed") {
    return `Completada: ${cell.completedCount} de ${cell.totalActivities} actividades`;
  }

  if (cell.state === "current") {
    return `Actividad actual: ${cell.currentActivityNumber ?? 1} de ${cell.totalActivities}`;
  }

  return `Pendiente: ${cell.completedCount} de ${cell.totalActivities} actividades`;
}
