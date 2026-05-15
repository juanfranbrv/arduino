import { makeFunctionReference } from "convex/server";

import type { ActivityStatus } from "@/lib/worksheet-status";

export type ConvexDashboard = {
  isTeacher: boolean;
  groups: Array<{ _id: string; name: string }>;
  worksheets: Array<{
    _id: string;
    slug: string;
    title: string;
    status: "draft" | "published" | "archived";
    position: number;
  }>;
  selectedGroup: { _id: string; name: string } | null;
  selectedWorksheet: {
    _id: string;
    slug: string;
    title: string;
    status: "draft" | "published" | "archived";
    position: number;
  } | null;
  students: Array<{ _id: string; displayName: string }>;
  activities: Array<{
    activityId: string;
    title: string;
    validation: string;
    order: number;
  }>;
  evaluations: Array<{
    studentId: string;
    worksheetId: string;
    activityId: string;
    status: Exclude<ActivityStatus, "pending">;
  }>;
};

export type StudentDashboard = {
  student: { _id: string; displayName: string; groupId: string } | null;
  worksheets: Array<{
    _id: string;
    slug: string;
    title: string;
    level: string;
    duration: string;
    prerequisites: string[];
    activityIds: string[];
  }>;
  evaluations: Array<{
    studentId: string;
    worksheetId: string;
    activityId: string;
    status: Exclude<ActivityStatus, "pending">;
  }>;
};

export type TeacherGroup = {
  _id: string;
  name: string;
  joinCode: string;
  active: boolean;
};

export type TeacherWorksheet = {
  _id: string;
  slug: string;
  title: string;
  coverImage?: string;
  level: string;
  duration: string;
  position: number;
  status: "draft" | "published" | "archived";
  prerequisites: string[];
  activityIds: string[];
};

export type UserNavStatus = {
  isAuthenticated: boolean;
  role: "student" | "teacher" | "admin" | null;
  hasStudentProfile: boolean;
  hasTeacherProfile: boolean;
};

export const convexApi = {
  classroom: {
    teacherDashboard: makeFunctionReference<
      "query",
      { groupId?: string; worksheetId?: string },
      ConvexDashboard
    >("classroom:teacherDashboard"),
    studentDashboard: makeFunctionReference<
      "query",
      Record<string, never>,
      StudentDashboard
    >("classroom:studentDashboard"),
  },
  progress: {
    listMineForWorksheet: makeFunctionReference<
      "query",
      { worksheetSlug: string },
      {
        worksheetId: string | null;
        evaluations: Array<{
          activityId: string;
          status: Exclude<ActivityStatus, "pending">;
        }>;
      }
    >("progress:listMineForWorksheet"),
    setActivityStatus: makeFunctionReference<
      "mutation",
      {
        studentId: string;
        worksheetId: string;
        activityId: string;
        status: ActivityStatus;
      },
      string | null
    >("progress:setActivityStatus"),
  },
  groups: {
    listForTeacher: makeFunctionReference<"query", Record<string, never>, TeacherGroup[]>(
      "groups:listForTeacher",
    ),
    listStudentsForGroup: makeFunctionReference<
      "query",
      { groupId: string },
      Array<{
        _id: string;
        displayName: string;
        active: boolean;
      }>
    >("groups:listStudentsForGroup"),
    createGroup: makeFunctionReference<
      "mutation",
      { name: string; joinCode: string },
      string
    >("groups:createGroup"),
    renameGroup: makeFunctionReference<
      "mutation",
      { groupId: string; name: string },
      string
    >("groups:renameGroup"),
    moveStudentToGroup: makeFunctionReference<
      "mutation",
      { studentId: string; targetGroupId: string },
      string
    >("groups:moveStudentToGroup"),
    renameStudent: makeFunctionReference<
      "mutation",
      { studentId: string; displayName: string },
      string
    >("groups:renameStudent"),
    removeStudent: makeFunctionReference<
      "mutation",
      { studentId: string },
      string
    >("groups:removeStudent"),
    deleteGroup: makeFunctionReference<
      "mutation",
      { groupId: string },
      string
    >("groups:deleteGroup"),
    joinWithCode: makeFunctionReference<
      "mutation",
      { joinCode: string; displayName: string },
      string
    >("groups:joinWithCode"),
  },
  worksheets: {
    listForTeacher: makeFunctionReference<"query", Record<string, never>, TeacherWorksheet[]>(
      "worksheets:listForTeacher",
    ),
    reorder: makeFunctionReference<
      "mutation",
      { orderedWorksheetIds: string[] },
      string[]
    >("worksheets:reorder"),
    updateMetadata: makeFunctionReference<
      "mutation",
      {
        worksheetId: string;
        status?: "draft" | "published" | "archived";
        level?: string;
        title?: string;
      },
      string
    >("worksheets:updateMetadata"),
    generateCoverImageUploadUrl: makeFunctionReference<
      "mutation",
      Record<string, never>,
      string
    >("worksheets:generateCoverImageUploadUrl"),
    updateCoverImage: makeFunctionReference<
      "mutation",
      { worksheetId: string; storageId: string },
      string
    >("worksheets:updateCoverImage"),
  },
  users: {
    navStatus: makeFunctionReference<
      "query",
      Record<string, never>,
      UserNavStatus
    >("users:navStatus"),
    setupTeacher: makeFunctionReference<
      "mutation",
      { setupSecret: string; displayName: string },
      string
    >("users:setupTeacher"),
  },
};
