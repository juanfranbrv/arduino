import type { ActivityStatus } from "@/lib/worksheet-status";

export type OrderedActivityState = Exclude<ActivityStatus, "pending"> | "pending" | "locked";

export type OrderedActivityEvaluation = {
  activityId: string;
  status: Exclude<ActivityStatus, "pending">;
};

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
