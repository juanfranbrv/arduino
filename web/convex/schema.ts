import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    authSubject: v.string(),
    email: v.optional(v.string()),
    name: v.string(),
    role: v.union(v.literal("student"), v.literal("teacher"), v.literal("admin")),
  }).index("by_auth_subject", ["authSubject"]),

  students: defineTable({
    userId: v.id("users"),
    groupId: v.id("groups"),
    displayName: v.string(),
    active: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_group", ["groupId"]),

  teachers: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
  }).index("by_user", ["userId"]),

  groups: defineTable({
    name: v.string(),
    joinCode: v.string(),
    active: v.boolean(),
    createdBy: v.id("users"),
  }).index("by_join_code", ["joinCode"]),

  worksheets: defineTable({
    slug: v.string(),
    title: v.string(),
    level: v.string(),
    duration: v.string(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    prerequisites: v.array(v.string()),
    activityIds: v.array(v.string()),
  }).index("by_slug", ["slug"]),

  worksheetActivities: defineTable({
    worksheetId: v.id("worksheets"),
    activityId: v.string(),
    title: v.string(),
    validation: v.string(),
    order: v.number(),
  })
    .index("by_worksheet", ["worksheetId"])
    .index("by_worksheet_activity", ["worksheetId", "activityId"]),

  activityCompletions: defineTable({
    studentId: v.id("students"),
    worksheetId: v.id("worksheets"),
    activityId: v.string(),
    completedBy: v.id("users"),
    completedAt: v.number(),
  })
    .index("by_student_worksheet", ["studentId", "worksheetId"])
    .index("by_student_worksheet_activity", [
      "studentId",
      "worksheetId",
      "activityId",
    ]),

  activityEvaluations: defineTable({
    studentId: v.id("students"),
    worksheetId: v.id("worksheets"),
    activityId: v.string(),
    status: v.union(v.literal("completed"), v.literal("closed_incomplete")),
    updatedBy: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_student_worksheet", ["studentId", "worksheetId"])
    .index("by_student_worksheet_activity", [
      "studentId",
      "worksheetId",
      "activityId",
    ]),

  quizAttempts: defineTable({
    studentId: v.id("students"),
    worksheetId: v.optional(v.id("worksheets")),
    quizSlug: v.string(),
    score: v.number(),
    maxScore: v.number(),
    submittedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_quiz", ["quizSlug"]),
});
