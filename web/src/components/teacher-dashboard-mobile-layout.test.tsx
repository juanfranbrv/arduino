import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TeacherDashboardTabs } from "./teacher-dashboard-tabs";
import { TeacherProgressConvexPanel } from "./teacher-progress-convex-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

const dashboard = {
  activities: [
    {
      activityId: "activity-1",
      order: 0,
      title: "Montaje inicial con cableado largo",
      validation: "El alumno enseña el montaje y explica la resistencia usada.",
    },
  ],
  evaluations: [],
  groups: [{ _id: "group-1", name: "jueves" }],
  isTeacher: true,
  selectedGroup: { _id: "group-1", name: "jueves" },
  selectedWorksheet: {
    _id: "worksheet-1",
    status: "published",
    title: "Pulsadores LED con explicación de montaje",
  },
  students: [{ _id: "student-1", displayName: "Nora Vidal" }],
  worksheets: [
    {
      _id: "worksheet-1",
      status: "published",
      title: "Pulsadores LED con explicación de montaje",
    },
  ],
};

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: { user: { id: "teacher-1" } },
      isPending: false,
    }),
  },
}));

vi.mock("@/lib/convex-api", () => ({
  convexApi: {
    classroom: {
      teacherDashboard: "teacherDashboard",
    },
    progress: {
      completeAllActivities: "completeAllActivities",
      setActivityStatus: "setActivityStatus",
    },
  },
}));

vi.mock("convex/react", () => ({
  useMutation: () => vi.fn(),
  useQuery: () => dashboard,
}));

describe("teacher dashboard mobile layout", () => {
  it("allows the tab panel heading to shrink and wrap inside narrow screens", () => {
    const { container } = render(
      <TeacherDashboardTabs
        groupsPanel={<div />}
        mapPanel={<div />}
        progressPanel={<div />}
        structurePanel={<div />}
      />,
    );

    const panelHeader = container.querySelector("[data-testid='teacher-tab-panel-heading']");
    expect(panelHeader?.className).toContain("min-w-0");

    const heading = screen.getByRole("heading", {
      name: "Control rápido de unidades y actividades por alumno.",
    });
    expect(heading.className).toContain("break-words");
  });

  it("keeps progress filters and student cards shrinkable on mobile", () => {
    const { container } = render(<TeacherProgressConvexPanel />);

    const filters = container.querySelector("[data-testid='teacher-progress-filters']");
    expect(filters?.className).toContain("min-w-0");

    for (const control of screen.getAllByRole("combobox")) {
      expect(control.className).toContain("w-full");
      expect(control.className).toContain("min-w-0");
    }

    const activityCard = container.querySelector("[data-testid='teacher-activity-card']");
    expect(activityCard?.className).toContain("min-w-0");
  });

  it("places the mobile student picker with the group and unit filters", () => {
    const { container } = render(<TeacherProgressConvexPanel />);

    const filters = container.querySelector("[data-testid='teacher-progress-filters']");
    expect(filters).toBeTruthy();
    expect(
      within(filters as HTMLElement).getByRole("button", { name: "Alumno" }),
    ).toBeTruthy();

    const studentHeader = container.querySelector("[data-testid='teacher-student-header']");
    expect(studentHeader).toBeTruthy();
    expect(
      within(studentHeader as HTMLElement).queryByRole("button", { name: "Alumno" }),
    ).toBeNull();
    expect(within(studentHeader as HTMLElement).getByText("1 actividades")).toBeTruthy();
  });
});
