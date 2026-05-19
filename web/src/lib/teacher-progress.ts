import type { ActivityStatus } from "@/lib/worksheet-status";

export type OrderedActivityState = Exclude<ActivityStatus, "pending"> | "pending" | "locked";

export type OrderedActivityEvaluation = {
  activityId: string;
  status: Exclude<ActivityStatus, "pending">;
};

export type TeacherDashboardActivity = {
  activityId: string;
  title: string;
  validation: string;
  order: number;
};

export type LocalTeacherProgressWorksheet = {
  slug: string;
  title?: string;
  activities: Array<{
    id: string;
    title: string;
    validation: string;
  }>;
};

export type CourseMapWorksheet = {
  _id: string;
  slug: string;
  title: string;
  status: "draft" | "published" | "archived";
  position: number;
  activityIds: string[];
};

export type CourseMapStudent = {
  _id: string;
  displayName: string;
};

export type CourseMapCellState = "completed" | "current" | "pending" | "draft";

export type CourseMapCell = {
  worksheetId: string;
  worksheetSlug: string;
  worksheetTitle: string;
  worksheetStatus: CourseMapWorksheet["status"];
  state: CourseMapCellState;
  completedCount: number;
  totalActivities: number;
  currentActivityNumber: number | null;
};

export type CourseMapRow = {
  student: CourseMapStudent;
  currentWorksheetId: string | null;
  cells: CourseMapCell[];
};

export function resolveTeacherDashboardActivities({
  remoteActivities,
  selectedWorksheet,
  localWorksheets,
}: {
  remoteActivities: TeacherDashboardActivity[];
  selectedWorksheet: { slug: string } | null;
  localWorksheets: LocalTeacherProgressWorksheet[];
}): TeacherDashboardActivity[] {
  if (remoteActivities.length > 0 || !selectedWorksheet) {
    return remoteActivities;
  }

  const localWorksheet = localWorksheets.find(
    (worksheet) => worksheet.slug === selectedWorksheet.slug,
  );

  return (
    localWorksheet?.activities.map((activity, index) => ({
      activityId: activity.id,
      title: activity.title,
      validation: activity.validation,
      order: index,
    })) ?? []
  );
}

export function buildCourseMapRows({
  students,
  worksheets,
  evaluations,
}: {
  students: CourseMapStudent[];
  worksheets: CourseMapWorksheet[];
  evaluations: Array<OrderedActivityEvaluation & { studentId: string; worksheetId: string }>;
}): CourseMapRow[] {
  return students.map((student) => {
    const studentEvaluations = evaluations.filter(
      (evaluation) => evaluation.studentId === student._id,
    );
    let foundCurrentPublishedUnit = false;
    let currentWorksheetId: string | null = null;

    const cells = worksheets.map((worksheet) => {
      const activityIds = worksheet.activityIds;
      const worksheetEvaluations = studentEvaluations.filter(
        (evaluation) => evaluation.worksheetId === worksheet._id,
      );
      const completedCount = worksheetEvaluations.filter((evaluation) =>
        activityIds.includes(evaluation.activityId),
      ).length;
      const { currentActivityId } = getOrderedActivityStates(
        activityIds,
        worksheetEvaluations,
      );
      const isResolved = activityIds.length > 0 && currentActivityId === null;
      const currentActivityNumber = currentActivityId
        ? activityIds.indexOf(currentActivityId) + 1
        : null;
      let state: CourseMapCellState = "pending";

      if (worksheet.status !== "published") {
        state = "draft";
      } else if (isResolved) {
        state = "completed";
      } else if (!foundCurrentPublishedUnit) {
        state = "current";
        foundCurrentPublishedUnit = true;
        currentWorksheetId = worksheet._id;
      }

      return {
        worksheetId: worksheet._id,
        worksheetSlug: worksheet.slug,
        worksheetTitle: worksheet.title,
        worksheetStatus: worksheet.status,
        state,
        completedCount,
        totalActivities: activityIds.length,
        currentActivityNumber: state === "current" ? currentActivityNumber : null,
      };
    });

    return {
      student,
      currentWorksheetId,
      cells,
    };
  });
}

export function getOrderedActivityStates(
  activityIds: string[],
  evaluations: OrderedActivityEvaluation[],
) {
  const evaluationById = new Map(
    evaluations.map((evaluation) => [evaluation.activityId, evaluation.status]),
  );
  const states = new Map<string, OrderedActivityState>();
  let currentActivityId: string | null = null;

  for (const activityId of activityIds) {
    const savedStatus = evaluationById.get(activityId);

    if (savedStatus === "completed" || savedStatus === "closed_incomplete") {
      states.set(activityId, savedStatus);
      continue;
    }

    if (!currentActivityId) {
      currentActivityId = activityId;
      states.set(activityId, "pending");
    } else {
      states.set(activityId, "locked");
    }
  }

  return {
    states,
    currentActivityId,
  };
}

export function canUpdateActivityInOrder(
  activityIds: string[],
  evaluations: OrderedActivityEvaluation[],
  activityId: string,
) {
  const { currentActivityId } = getOrderedActivityStates(activityIds, evaluations);

  return currentActivityId === activityId;
}

export function canResetResolvedActivity(
  activityIds: string[],
  evaluations: OrderedActivityEvaluation[],
  activityId: string,
) {
  return getLastResolvedActivityId(activityIds, evaluations) === activityId;
}

export function getLastResolvedActivityId(
  activityIds: string[],
  evaluations: OrderedActivityEvaluation[],
) {
  let lastResolvedActivityId: string | null = null;
  const evaluationById = new Map(
    evaluations.map((evaluation) => [evaluation.activityId, evaluation.status]),
  );

  for (const activityIdInOrder of activityIds) {
    const evaluation = evaluationById.get(activityIdInOrder);

    if (!evaluation) {
      break;
    }

    lastResolvedActivityId = activityIdInOrder;
  }

  return lastResolvedActivityId;
}
