import { describe, expect, it } from "vitest";

import {
  canResetResolvedActivity,
  canUpdateActivityInOrder,
  getLastResolvedActivityId,
  getOrderedActivityStates,
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
