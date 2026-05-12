import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { getCurrentUserOrThrow, requireTeacher } from "./users";

type ProgressCtx = QueryCtx | MutationCtx;

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
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("closed_incomplete"),
    ),
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx);
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

    if (args.status === "pending") {
      if (existingEvaluation) {
        await ctx.db.delete(existingEvaluation._id);
      }
      if (legacyCompletion) {
        await ctx.db.delete(legacyCompletion._id);
      }
      return null;
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
