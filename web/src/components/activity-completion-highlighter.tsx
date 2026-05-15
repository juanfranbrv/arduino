"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";

import { convexApi } from "@/lib/convex-api";
import { getActivityStatusLabel } from "@/lib/worksheet-status";
import { getOrderedActivityStates } from "@/lib/teacher-progress";

export function ActivityCompletionHighlighter({
  slug,
}: {
  slug: string;
}) {
  const progress = useQuery(convexApi.progress.listMineForWorksheet, {
    worksheetSlug: slug,
  });

  useEffect(() => {
    const orderedStates = getOrderedActivityStates(
      Array.from(
        document.querySelectorAll<HTMLElement>("[data-activity-id]"),
      ).map((node) => node.dataset.activityId ?? "").filter(Boolean),
      (progress?.evaluations ?? []).map((evaluation) => ({
        activityId: evaluation.activityId,
        status: evaluation.status,
      })),
    );
    const activityNodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-activity-id]"),
    );

    activityNodes.forEach((node) => {
      const activityId = node.dataset.activityId;
      const status = activityId ? orderedStates.states.get(activityId) ?? "locked" : "locked";
      const completed = status === "completed";
      const closedIncomplete = status === "closed_incomplete";
      const locked = status === "locked";
      const statusNode = activityId
        ? document.querySelector<HTMLElement>(`[data-activity-status="${activityId}"]`)
        : null;

      node.dataset.activityState = status;
      node.classList.toggle("border-emerald-200", completed);
      node.classList.toggle("bg-emerald-50/80", completed);
      node.classList.toggle("border-orange-200", closedIncomplete);
      node.classList.toggle("bg-orange-50/90", closedIncomplete);
      node.classList.toggle("border-slate-100", locked);
      node.classList.toggle("bg-slate-50/70", locked);
      node.classList.toggle(
        "border-[var(--color-faded-gray)]",
        !completed && !closedIncomplete && !locked,
      );
      node.classList.toggle("bg-white", !completed && !closedIncomplete && !locked);

      if (statusNode) {
        statusNode.textContent =
          status === "pending"
            ? "Actividad actual"
            : locked
              ? "Bloqueada"
              : getActivityStatusLabel(status);
        statusNode.classList.toggle("activity-status-badge--completed", completed);
        statusNode.classList.toggle("activity-status-badge--omitted", closedIncomplete);
        statusNode.classList.toggle("activity-status-badge--locked", locked);
        statusNode.classList.toggle("activity-status-badge--current", status === "pending");
      }
    });
  }, [progress]);

  return null;
}
