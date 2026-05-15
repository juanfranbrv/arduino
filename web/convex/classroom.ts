import { v } from "convex/values";

import { query } from "./_generated/server";
import { getCurrentUser } from "./users";

function sortWorksheets<T extends { position?: number; slug: string }>(worksheets: T[]) {
  return worksheets.sort(
    (a, b) =>
      (a.position ?? Number.MAX_SAFE_INTEGER) -
        (b.position ?? Number.MAX_SAFE_INTEGER) ||
      a.slug.localeCompare(b.slug, "es"),
  );
}

export const teacherDashboard = query({
  args: {
    groupId: v.optional(v.id("groups")),
    worksheetId: v.optional(v.id("worksheets")),
  },
  handler: async (ctx, args) => {
    const teacher = await getCurrentUser(ctx);

    if (!teacher || (teacher.role !== "teacher" && teacher.role !== "admin")) {
      return {
        isTeacher: false,
        groups: [],
        worksheets: [],
        selectedGroup: null,
        selectedWorksheet: null,
        students: [],
        activities: [],
        evaluations: [],
      };
    }

    const groups = await ctx.db
      .query("groups")
      .filter((q) => q.eq(q.field("createdBy"), teacher._id))
      .collect();
    const sortedGroups = groups.sort((a, b) => a.name.localeCompare(b.name, "es"));
    const selectedGroup = args.groupId
      ? sortedGroups.find((group) => group._id === args.groupId)
      : sortedGroups[0];
    const worksheets = (await ctx.db.query("worksheets").collect()).filter(
      (worksheet) => worksheet.status !== "archived",
    );
    const sortedWorksheets = sortWorksheets(worksheets).map((worksheet, index) => ({
      ...worksheet,
      position: worksheet.position ?? index,
    }));
    const selectedWorksheet = args.worksheetId
      ? sortedWorksheets.find((worksheet) => worksheet._id === args.worksheetId)
      : sortedWorksheets[0];

    if (!selectedGroup || !selectedWorksheet) {
      return {
        isTeacher: true,
        groups: sortedGroups,
        worksheets: sortedWorksheets,
        selectedGroup: null,
        selectedWorksheet: null,
        students: [],
        activities: [],
        evaluations: [],
      };
    }

    const students = await ctx.db
      .query("students")
      .withIndex("by_group", (q) => q.eq("groupId", selectedGroup._id))
      .collect();
    const sortedStudents = students.sort((a, b) =>
      a.displayName.localeCompare(b.displayName, "es"),
    );
    const activities = await ctx.db
      .query("worksheetActivities")
      .withIndex("by_worksheet", (q) =>
        q.eq("worksheetId", selectedWorksheet._id),
      )
      .collect();
    const evaluations = (
      await Promise.all(
        sortedStudents.map((student) =>
          ctx.db
            .query("activityEvaluations")
            .withIndex("by_student_worksheet", (q) =>
              q
                .eq("studentId", student._id)
                .eq("worksheetId", selectedWorksheet._id),
            )
            .collect(),
        ),
      )
    ).flat();
    const legacyCompletions = (
      await Promise.all(
        sortedStudents.map((student) =>
          ctx.db
            .query("activityCompletions")
            .withIndex("by_student_worksheet", (q) =>
              q
                .eq("studentId", student._id)
                .eq("worksheetId", selectedWorksheet._id),
            )
            .collect(),
        ),
      )
    ).flat();
    const evaluationKeys = new Set(
      evaluations.map(
        (evaluation) =>
          `${evaluation.studentId}:${evaluation.worksheetId}:${evaluation.activityId}`,
      ),
    );
    const mergedEvaluations = [
      ...evaluations,
      ...legacyCompletions
        .filter(
          (completion) =>
            !evaluationKeys.has(
              `${completion.studentId}:${completion.worksheetId}:${completion.activityId}`,
            ),
        )
        .map((completion) => ({
          _id: completion._id,
          _creationTime: completion._creationTime,
          studentId: completion.studentId,
          worksheetId: completion.worksheetId,
          activityId: completion.activityId,
          status: "completed" as const,
          updatedBy: completion.completedBy,
          updatedAt: completion.completedAt,
        })),
    ];

    return {
      isTeacher: true,
      groups: sortedGroups.map((group) => ({
        _id: group._id,
        name: group.name,
      })),
      worksheets: sortedWorksheets.map((worksheet) => ({
        _id: worksheet._id,
        slug: worksheet.slug,
        title: worksheet.title,
        status: worksheet.status,
        position: worksheet.position,
      })),
      selectedGroup,
      selectedWorksheet: selectedWorksheet
        ? {
            _id: selectedWorksheet._id,
            slug: selectedWorksheet.slug,
            title: selectedWorksheet.title,
            status: selectedWorksheet.status,
            position: selectedWorksheet.position,
          }
        : null,
      students: sortedStudents.map((student) => ({
        _id: student._id,
        displayName: student.displayName,
      })),
      activities: activities.sort((a, b) => a.order - b.order),
      evaluations: mergedEvaluations,
    };
  },
});

export const studentDashboard = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return {
        student: null,
        worksheets: [],
        evaluations: [],
      };
    }

    const student = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    const worksheets = await ctx.db
      .query("worksheets")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();
    const sortedWorksheets = sortWorksheets(worksheets).map((worksheet, index) => ({
      ...worksheet,
      position: worksheet.position ?? index,
    }));

    if (!student) {
      return {
        student: null,
        worksheets: [],
        evaluations: [],
      };
    }

    const evaluations = (
      await Promise.all(
        sortedWorksheets.map((worksheet) =>
          ctx.db
            .query("activityEvaluations")
            .withIndex("by_student_worksheet", (q) =>
              q.eq("studentId", student._id).eq("worksheetId", worksheet._id),
            )
            .collect(),
        ),
      )
    ).flat();

    const legacyCompletions = (
      await Promise.all(
        sortedWorksheets.map((worksheet) =>
          ctx.db
            .query("activityCompletions")
            .withIndex("by_student_worksheet", (q) =>
              q.eq("studentId", student._id).eq("worksheetId", worksheet._id),
            )
            .collect(),
        ),
      )
    ).flat();

    const legacyKeys = new Set(
      evaluations.map(
        (evaluation) =>
          `${evaluation.studentId}:${evaluation.worksheetId}:${evaluation.activityId}`,
      ),
    );

    const mergedEvaluations = [
      ...evaluations,
      ...legacyCompletions
        .filter(
          (completion) =>
            !legacyKeys.has(
              `${completion.studentId}:${completion.worksheetId}:${completion.activityId}`,
            ),
        )
        .map((completion) => ({
          _id: completion._id,
          _creationTime: completion._creationTime,
          studentId: completion.studentId,
          worksheetId: completion.worksheetId,
          activityId: completion.activityId,
          status: "completed" as const,
          updatedBy: completion.completedBy,
          updatedAt: completion.completedAt,
        })),
    ];

    return {
      student: {
        _id: student._id,
        displayName: student.displayName,
        groupId: student.groupId,
      },
      worksheets: sortedWorksheets,
      evaluations: mergedEvaluations,
    };
  },
});
