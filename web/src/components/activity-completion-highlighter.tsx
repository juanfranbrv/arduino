"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";

import { convexApi } from "@/lib/convex-api";
import { getActivityStatusLabel } from "@/lib/worksheet-status";

export function ActivityCompletionHighlighter({
  slug,
}: {
  slug: string;
}) {
  const progress = useQuery(convexApi.progress.listMineForWorksheet, {
    worksheetSlug: slug,
  });

  useEffect(() => {
    const statusById = new Map(
      (progress?.evaluations ?? []).map((evaluation) => [
        evaluation.activityId,
        evaluation.status,
      ]),
    );
    const activityNodes = document.querySelectorAll<HTMLElement>("[data-activity-id]");

    activityNodes.forEach((node) => {
      const activityId = node.dataset.activityId;
      const status = activityId ? (statusById.get(activityId) ?? "pending") : "pending";
      const completed = status === "completed";
      const closedIncomplete = status === "closed_incomplete";
      const statusNode = activityId
        ? document.querySelector<HTMLElement>(`[data-activity-status="${activityId}"]`)
        : null;

      node.dataset.activityState = status;
      node.classList.toggle("border-[var(--color-ember-glow)]", completed);
      node.classList.toggle("bg-[var(--color-canvas-white)]", completed);
      node.classList.toggle("border-[var(--color-graphite)]", closedIncomplete);
      node.classList.toggle("bg-white", closedIncomplete);
      node.classList.toggle("border-[var(--color-faded-gray)]", !completed && !closedIncomplete);
      node.classList.toggle("bg-[var(--color-whisper-gray)]", !completed && !closedIncomplete);

      if (statusNode) {
        statusNode.textContent = getActivityStatusLabel(status);
        statusNode.classList.toggle("text-[var(--color-ember-glow)]", completed);
        statusNode.classList.toggle("text-[var(--color-graphite)]", closedIncomplete);
        statusNode.classList.toggle("text-[var(--color-steel-gray)]", !completed && !closedIncomplete);
      }
    });
  }, [progress]);

  return null;
}
