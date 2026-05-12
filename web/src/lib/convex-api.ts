import { makeFunctionReference } from "convex/server";

import type { ActivityStatus } from "@/lib/worksheet-status";

export type ConvexDashboard = {
  isTeacher: boolean;
  selectedGroup: { _id: string; name: string } | null;
  selectedWorksheet: { _id: string; title: string } | null;
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
    createGroup: makeFunctionReference<
      "mutation",
      { name: string; joinCode: string },
      string
    >("groups:createGroup"),
    joinWithCode: makeFunctionReference<
      "mutation",
      { joinCode: string; displayName: string },
      string
    >("groups:joinWithCode"),
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
