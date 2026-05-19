import { describe, expect, it } from "vitest";

import {
  buildCourseMapRows,
  canResetResolvedActivity,
  canUpdateActivityInOrder,
  getLastResolvedActivityId,
  getOrderedActivityStates,
  resolveTeacherDashboardActivities,
} from "./teacher-progress";

describe("getOrderedActivityStates", () => {
  it("marks the first unresolved activity as current and later ones as locked", () => {
    const result = getOrderedActivityStates(["act-01", "act-02", "act-03"], []);

    expect(result.currentActivityId).toBe("act-01");
    expect(Array.from(result.states.entries())).toEqual([
      ["act-01", "pending"],
      ["act-02", "locked"],
      ["act-03", "locked"],
    ]);
  });

  it("advances current activity after completed and omitted entries", () => {
    const result = getOrderedActivityStates(["act-01", "act-02", "act-03"], [
      { activityId: "act-01", status: "completed" },
      { activityId: "act-02", status: "closed_incomplete" },
    ]);

    expect(result.currentActivityId).toBe("act-03");
    expect(Array.from(result.states.entries())).toEqual([
      ["act-01", "completed"],
      ["act-02", "closed_incomplete"],
      ["act-03", "pending"],
    ]);
  });

  it("returns no current activity when the unit is fully resolved", () => {
    const result = getOrderedActivityStates(["act-01", "act-02"], [
      { activityId: "act-01", status: "completed" },
      { activityId: "act-02", status: "completed" },
    ]);

    expect(result.currentActivityId).toBeNull();
    expect(Array.from(result.states.entries())).toEqual([
      ["act-01", "completed"],
      ["act-02", "completed"],
    ]);
  });
});

describe("canUpdateActivityInOrder", () => {
  it("allows updates only on the current unresolved activity", () => {
    const evaluations = [{ activityId: "act-01", status: "completed" as const }];

    expect(canUpdateActivityInOrder(["act-01", "act-02", "act-03"], evaluations, "act-02")).toBe(
      true,
    );
    expect(canUpdateActivityInOrder(["act-01", "act-02", "act-03"], evaluations, "act-03")).toBe(
      false,
    );
  });
});

describe("canResetResolvedActivity", () => {
  it("allows clearing only the last resolved activity in sequence", () => {
    const evaluations = [
      { activityId: "act-01", status: "completed" as const },
      { activityId: "act-02", status: "closed_incomplete" as const },
    ];

    expect(canResetResolvedActivity(["act-01", "act-02", "act-03"], evaluations, "act-02")).toBe(
      true,
    );
    expect(canResetResolvedActivity(["act-01", "act-02", "act-03"], evaluations, "act-01")).toBe(
      false,
    );
  });
});

describe("getLastResolvedActivityId", () => {
  it("returns the last resolved activity in sequence", () => {
    const evaluations = [
      { activityId: "act-01", status: "completed" as const },
      { activityId: "act-02", status: "closed_incomplete" as const },
    ];

    expect(getLastResolvedActivityId(["act-01", "act-02", "act-03"], evaluations)).toBe(
      "act-02",
    );
  });
});

describe("resolveTeacherDashboardActivities", () => {
  it("falls back to local worksheet activities when the synced worksheet has none", () => {
    const activities = resolveTeacherDashboardActivities({
      remoteActivities: [],
      selectedWorksheet: {
        slug: "led-rgb",
      },
      localWorksheets: [
        {
          slug: "led-rgb",
          activities: [
            {
              id: "act-01",
              title: "Encender un LED a 5V en el simulador",
              validation: "El alumno monta el circuito básico.",
            },
            {
              id: "act-02",
              title: "Montar un LED RGB en los pines 9, 10 y 11",
              validation: "El LED RGB responde a los tres canales.",
            },
          ],
        },
      ],
    });

    expect(activities).toEqual([
      {
        activityId: "act-01",
        title: "Encender un LED a 5V en el simulador",
        validation: "El alumno monta el circuito básico.",
        order: 0,
      },
      {
        activityId: "act-02",
        title: "Montar un LED RGB en los pines 9, 10 y 11",
        validation: "El LED RGB responde a los tres canales.",
        order: 1,
      },
    ]);
  });

  it("keeps remote activities when they are available", () => {
    const activities = resolveTeacherDashboardActivities({
      remoteActivities: [
        {
          activityId: "remote-act",
          title: "Actividad remota",
          validation: "Validación remota",
          order: 4,
        },
      ],
      selectedWorksheet: {
        slug: "led-rgb",
      },
      localWorksheets: [
        {
          slug: "led-rgb",
          activities: [
            {
              id: "act-01",
              title: "Actividad local",
              validation: "Validación local",
            },
          ],
        },
      ],
    });

    expect(activities).toEqual([
      {
        activityId: "remote-act",
        title: "Actividad remota",
        validation: "Validación remota",
        order: 4,
      },
    ]);
  });
});

describe("buildCourseMapRows", () => {
  const worksheets = [
    {
      _id: "worksheet-1",
      slug: "explorar-el-pack",
      title: "Primeros pasos con Arduino",
      status: "published" as const,
      position: 0,
      activityIds: ["u1-a1", "u1-a2"],
    },
    {
      _id: "worksheet-2",
      slug: "led-rgb",
      title: "LED RGB",
      status: "published" as const,
      position: 1,
      activityIds: ["u2-a1", "u2-a2", "u2-a3"],
    },
    {
      _id: "worksheet-3",
      slug: "zumbador-activo",
      title: "Zumbador activo",
      status: "draft" as const,
      position: 2,
      activityIds: ["u3-a1"],
    },
  ];

  it("marks the first unresolved published unit as current for each student", () => {
    const rows = buildCourseMapRows({
      students: [{ _id: "student-1", displayName: "Alex Iranzo" }],
      worksheets,
      evaluations: [
        {
          studentId: "student-1",
          worksheetId: "worksheet-1",
          activityId: "u1-a1",
          status: "completed",
        },
        {
          studentId: "student-1",
          worksheetId: "worksheet-1",
          activityId: "u1-a2",
          status: "completed",
        },
        {
          studentId: "student-1",
          worksheetId: "worksheet-2",
          activityId: "u2-a1",
          status: "completed",
        },
      ],
    });

    expect(rows).toEqual([
      {
        student: { _id: "student-1", displayName: "Alex Iranzo" },
        currentWorksheetId: "worksheet-2",
        cells: [
          expect.objectContaining({
            worksheetId: "worksheet-1",
            state: "completed",
            completedCount: 2,
            totalActivities: 2,
            currentActivityNumber: null,
          }),
          expect.objectContaining({
            worksheetId: "worksheet-2",
            state: "current",
            completedCount: 1,
            totalActivities: 3,
            currentActivityNumber: 2,
          }),
          expect.objectContaining({
            worksheetId: "worksheet-3",
            state: "draft",
            completedCount: 0,
            totalActivities: 1,
            currentActivityNumber: null,
          }),
        ],
      },
    ]);
  });

  it("keeps later published units pending until previous units are resolved", () => {
    const rows = buildCourseMapRows({
      students: [{ _id: "student-1", displayName: "Alex Iranzo" }],
      worksheets,
      evaluations: [],
    });

    expect(rows[0].cells.map((cell) => cell.state)).toEqual([
      "current",
      "pending",
      "draft",
    ]);
    expect(rows[0].cells[0]).toMatchObject({
      currentActivityNumber: 1,
      completedCount: 0,
      totalActivities: 2,
    });
  });
});
