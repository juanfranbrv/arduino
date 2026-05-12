export type ActivityStatus = "pending" | "completed" | "closed_incomplete";

export type WorksheetStudentStatus =
  | "locked"
  | "not_started"
  | "in_progress"
  | "completed"
  | "closed_incomplete";

export type ActivityEvaluation = {
  activityId: string;
  status: ActivityStatus;
};

export type WorksheetStatusMeta = {
  slug: string;
  prerequisites: string[];
  activities: Array<{ id: string }>;
};

export function getActivityStatusLabel(status: ActivityStatus) {
  switch (status) {
    case "completed":
      return "Completada";
    case "closed_incomplete":
      return "Cerrada incompleta";
    default:
      return "Sin marcar";
  }
}

export function getWorksheetStatusLabel(status: WorksheetStudentStatus) {
  switch (status) {
    case "locked":
      return "Bloqueada";
    case "not_started":
      return "Sin empezar";
    case "in_progress":
      return "En marcha";
    case "completed":
      return "Completada";
    case "closed_incomplete":
      return "Cerrada incompleta";
  }
}

export function isWorksheetUnlocked(
  worksheet: Pick<WorksheetStatusMeta, "prerequisites">,
  completedWorksheetSlugs: string[],
) {
  const completed = new Set(completedWorksheetSlugs);

  return worksheet.prerequisites.every((slug) => completed.has(slug));
}

export function getWorksheetStudentStatus(
  worksheet: WorksheetStatusMeta,
  evaluations: ActivityEvaluation[],
  completedWorksheetSlugs: string[],
): WorksheetStudentStatus {
  if (!isWorksheetUnlocked(worksheet, completedWorksheetSlugs)) {
    return "locked";
  }

  const activityIds = new Set(worksheet.activities.map((activity) => activity.id));
  const relevant = evaluations.filter((evaluation) => activityIds.has(evaluation.activityId));

  if (relevant.length === 0) {
    return "not_started";
  }

  const statuses = new Set(relevant.map((evaluation) => evaluation.status));
  const totalActivities = worksheet.activities.length;
  const resolvedActivities = relevant.length;

  if (resolvedActivities === totalActivities && statuses.size === 1 && statuses.has("completed")) {
    return "completed";
  }

  if (
    resolvedActivities === totalActivities &&
    !statuses.has("pending") &&
    statuses.has("closed_incomplete")
  ) {
    return "closed_incomplete";
  }

  return "in_progress";
}
