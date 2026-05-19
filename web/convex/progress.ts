import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { getCurrentUserOrThrow, requireTeacher } from "./users";

type ProgressCtx = QueryCtx | MutationCtx;
type ResolvedStatus = "completed" | "closed_incomplete";

function getCurrentActivityId(
  activityIds: string[],
  evaluations: Array<{ activityId: string; status: ResolvedStatus }>,
) {
  const evaluationById = new Map(
    evaluations.map((evaluation) => [evaluation.activityId, evaluation.status]),
  );

  for (const activityId of activityIds) {
    const savedStatus = evaluationById.get(activityId);

    if (savedStatus === "completed" || savedStatus === "closed_incomplete") {
      continue;
    }

    return activityId;
  }

  return null;
}

function canUpdateActivityInOrder(
  activityIds: string[],
  evaluations: Array<{ activityId: string; status: ResolvedStatus }>,
  activityId: string,
) {
  return getCurrentActivityId(activityIds, evaluations) === activityId;
}

function canResetResolvedActivity(
  activityIds: string[],
  evaluations: Array<{ activityId: string; status: ResolvedStatus }>,
  activityId: string,
) {
  const evaluationById = new Map(
    evaluations.map((evaluation) => [evaluation.activityId, evaluation.status]),
  );
  let lastResolvedActivityId: string | null = null;

  for (const activityIdInOrder of activityIds) {
    const evaluation = evaluationById.get(activityIdInOrder);

    if (!evaluation) {
      break;
    }

    lastResolvedActivityId = activityIdInOrder;
  }

  return lastResolvedActivityId === activityId;
}

async function listEvaluationsWithLegacyFallback(
  ctx: ProgressCtx,
  studentId: Id<"students">,
  worksheetId: Id<"worksheets">,
) {
  const evaluations = await ctx.db
    .query("activityEvaluations")
    .withIndex("by_student_worksheet", (q) =>
      q.eq("studentId", studentId).eq("worksheetId", worksheetId),
    )
    .collect();

  if (evaluations.length > 0) {
    return evaluations;
  }

  const completions = await ctx.db
    .query("activityCompletions")
    .withIndex("by_student_worksheet", (q) =>
      q.eq("studentId", studentId).eq("worksheetId", worksheetId),
    )
    .collect();

  return completions.map((completion) => ({
    _id: completion._id,
    _creationTime: completion._creationTime,
    studentId: completion.studentId,
    worksheetId: completion.worksheetId,
    activityId: completion.activityId,
    status: "completed" as const,
    updatedBy: completion.completedBy,
    updatedAt: completion.completedAt,
  }));
}

export const listMineForWorksheet = query({
  args: {
    worksheetSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const student = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    const worksheet = await ctx.db
      .query("worksheets")
      .withIndex("by_slug", (q) => q.eq("slug", args.worksheetSlug))
      .unique();

    if (!student || !worksheet) {
      return {
        worksheetId: worksheet?._id ?? null,
        evaluations: [],
      };
    }

    const evaluations = await listEvaluationsWithLegacyFallback(
      ctx,
      student._id,
      worksheet._id,
    );

    return {
      worksheetId: worksheet._id,
      evaluations: evaluations.map((evaluation) => ({
        activityId: evaluation.activityId,
        status: evaluation.status,
      })),
    };
  },
});

export const listForStudentWorksheet = query({
  args: {
    studentId: v.id("students"),
    worksheetId: v.id("worksheets"),
  },
  handler: async (ctx, args) => {
    await requireTeacher(ctx);

    return await listEvaluationsWithLegacyFallback(ctx, args.studentId, args.worksheetId);
  },
});

export const setActivityStatus = mutation({
  args: {
    studentId: v.id("students"),
    worksheetId: v.id("worksheets"),
    activityId: v.string(),
    activityIds: v.optional(v.array(v.string())),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("closed_incomplete"),
    ),
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx);
    const worksheetActivities = await ctx.db
      .query("worksheetActivities")
      .withIndex("by_worksheet", (q) => q.eq("worksheetId", args.worksheetId))
      .collect();
    const existingEvaluation = await ctx.db
      .query("activityEvaluations")
      .withIndex("by_student_worksheet_activity", (q) =>
        q
          .eq("studentId", args.studentId)
          .eq("worksheetId", args.worksheetId)
          .eq("activityId", args.activityId),
      )
      .unique();

    const legacyCompletion = await ctx.db
      .query("activityCompletions")
      .withIndex("by_student_worksheet_activity", (q) =>
        q
          .eq("studentId", args.studentId)
          .eq("worksheetId", args.worksheetId)
          .eq("activityId", args.activityId),
      )
      .unique();
    const allEvaluations = await listEvaluationsWithLegacyFallback(
      ctx,
      args.studentId,
      args.worksheetId,
    );
    const otherEvaluations = allEvaluations
      .filter((evaluation) => evaluation.activityId !== args.activityId)
      .map((evaluation) => ({
        activityId: evaluation.activityId,
        status: evaluation.status,
      }));
    const orderedActivityIds =
      worksheetActivities.length > 0
        ? worksheetActivities
            .sort((a, b) => a.order - b.order)
            .map((activity) => activity.activityId)
        : (args.activityIds ?? []);

    if (args.status === "pending") {
      const currentEvaluations = allEvaluations.map((evaluation) => ({
        activityId: evaluation.activityId,
        status: evaluation.status,
      }));

      if (
        !canResetResolvedActivity(orderedActivityIds, currentEvaluations, args.activityId)
      ) {
        throw new Error("Solo puedes deshacer la ultima actividad resuelta.");
      }

      if (existingEvaluation) {
        await ctx.db.delete(existingEvaluation._id);
      }
      if (legacyCompletion) {
        await ctx.db.delete(legacyCompletion._id);
      }
      return null;
    }

    if (!canUpdateActivityInOrder(orderedActivityIds, otherEvaluations, args.activityId)) {
      throw new Error("Solo puedes marcar la actividad actual del alumno.");
    }

    if (existingEvaluation) {
      await ctx.db.patch(existingEvaluation._id, {
        status: args.status,
        updatedBy: teacher._id,
        updatedAt: Date.now(),
      });
      if (legacyCompletion) {
        await ctx.db.delete(legacyCompletion._id);
      }
      return existingEvaluation._id;
    }

    if (legacyCompletion) {
      await ctx.db.delete(legacyCompletion._id);
    }

    return await ctx.db.insert("activityEvaluations", {
      studentId: args.studentId,
      worksheetId: args.worksheetId,
      activityId: args.activityId,
      status: args.status,
      updatedBy: teacher._id,
      updatedAt: Date.now(),
    });
  },
});

export const completeAllActivities = mutation({
  args: {
    studentId: v.id("students"),
    worksheetId: v.id("worksheets"),
    activityIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx);
    const worksheetActivities = await ctx.db
      .query("worksheetActivities")
      .withIndex("by_worksheet", (q) => q.eq("worksheetId", args.worksheetId))
      .collect();

    const activityIds =
      worksheetActivities.length > 0
        ? worksheetActivities
            .sort((a, b) => a.order - b.order)
            .map((activity) => activity.activityId)
        : (args.activityIds ?? []);

    for (const activityId of activityIds) {
      const existingEvaluation = await ctx.db
        .query("activityEvaluations")
        .withIndex("by_student_worksheet_activity", (q) =>
          q
            .eq("studentId", args.studentId)
            .eq("worksheetId", args.worksheetId)
            .eq("activityId", activityId),
        )
        .unique();

      const legacyCompletion = await ctx.db
        .query("activityCompletions")
        .withIndex("by_student_worksheet_activity", (q) =>
          q
            .eq("studentId", args.studentId)
            .eq("worksheetId", args.worksheetId)
            .eq("activityId", activityId),
        )
        .unique();

      if (legacyCompletion) {
        await ctx.db.delete(legacyCompletion._id);
      }

      if (existingEvaluation) {
        if (existingEvaluation.status !== "completed") {
          await ctx.db.patch(existingEvaluation._id, {
            status: "completed",
            updatedBy: teacher._id,
            updatedAt: Date.now(),
          });
        }
      } else {
        await ctx.db.insert("activityEvaluations", {
          studentId: args.studentId,
          worksheetId: args.worksheetId,
          activityId,
          status: "completed",
          updatedBy: teacher._id,
          updatedAt: Date.now(),
        });
      }
    }
  },
});

export const resetWorksheetActivities = mutation({
  args: {
    studentId: v.id("students"),
    worksheetId: v.id("worksheets"),
  },
  handler: async (ctx, args) => {
    await requireTeacher(ctx);

    const evaluations = await ctx.db
      .query("activityEvaluations")
      .withIndex("by_student_worksheet", (q) =>
        q.eq("studentId", args.studentId).eq("worksheetId", args.worksheetId),
      )
      .collect();
    const legacyCompletions = await ctx.db
      .query("activityCompletions")
      .withIndex("by_student_worksheet", (q) =>
        q.eq("studentId", args.studentId).eq("worksheetId", args.worksheetId),
      )
      .collect();

    await Promise.all([
      ...evaluations.map((evaluation) => ctx.db.delete(evaluation._id)),
      ...legacyCompletions.map((completion) => ctx.db.delete(completion._id)),
    ]);
  },
});
