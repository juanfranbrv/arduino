import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TeacherCourseStructurePanel } from "./teacher-course-structure-panel";

const queryState = vi.hoisted(() => ({
  updateMetadata: vi.fn(),
  worksheets: [
    {
      _id: "worksheet-1",
      activityIds: [],
      coverImage: "/worksheet-placeholder.svg",
      duration: "1 sesión",
      level: "iniciacion",
      position: 0,
      prerequisites: [],
      slug: "pulsadores-led",
      status: "draft" as const,
      title: "Pulsador de 4 patas",
    },
  ],
}));

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: {
    alt: string;
    fill?: boolean;
    src: string;
    unoptimized?: boolean;
    [key: string]: unknown;
  }) => {
    delete props.fill;
    delete props.unoptimized;

    return <span aria-label={alt || undefined} data-src={src} {...props} />;
  },
}));

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
    worksheets: {
      generateCoverImageUploadUrl: "generateCoverImageUploadUrl",
      listForTeacher: "listForTeacher",
      reorder: "reorder",
      updateCoverImage: "updateCoverImage",
      updateMetadata: "updateMetadata",
    },
  },
}));

vi.mock("convex/react", () => ({
  useMutation: (reference: string) =>
    reference === "updateMetadata" ? queryState.updateMetadata : vi.fn(),
  useQuery: () => queryState.worksheets,
}));

describe("TeacherCourseStructurePanel", () => {
  beforeEach(() => {
    queryState.updateMetadata = vi.fn().mockResolvedValue("worksheet-1");
    queryState.worksheets = [
      {
        _id: "worksheet-1",
        activityIds: [],
        coverImage: "/worksheet-placeholder.svg",
        duration: "1 sesión",
        level: "iniciacion",
        position: 0,
        prerequisites: [],
        slug: "pulsadores-led",
        status: "draft",
        title: "Pulsador de 4 patas",
      },
    ];
  });

  it("renders course unit cards with a large thumbnail column and compact metadata controls", () => {
    const { container } = render(<TeacherCourseStructurePanel />);

    expect(screen.getByRole("link", { name: "Unidad 1 - Pulsador de 4 patas" })).toBeTruthy();

    const card = container.querySelector("article");
    expect(card?.className).toContain("lg:grid-cols-[14rem_minmax(0,1fr)]");

    const thumbnailLabel = container.querySelector("label[for='cover-worksheet-1']");
    expect(thumbnailLabel?.className).toContain("lg:min-h-44");
    expect(thumbnailLabel?.className).toContain("lg:h-full");

    const controls = container.querySelector("[data-testid='worksheet-metadata-worksheet-1']");
    expect(controls?.className).toContain("sm:grid-cols-2");
  });

  it("shows generated local thumbnails when Convex still has a placeholder", () => {
    const { container } = render(<TeacherCourseStructurePanel />);

    const image = container.querySelector("[data-src='/worksheets/pulsadores-led-cover.png']");
    expect(image).toBeTruthy();
  });

  it("uses local content metadata without overriding remote editable metadata", () => {
    const { container } = render(
      <TeacherCourseStructurePanel
        localWorksheets={[
          {
            activityIds: ["act-01", "act-02"],
            coverImage: "/worksheets/pulsadores-led-cover-updated.png",
            level: "intermedio",
            slug: "pulsadores-led",
            status: "published",
            title: "Pulsador actualizado",
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Unidad 1 - Pulsador de 4 patas" })).toBeTruthy();
    expect(screen.getByText("2 actividades")).toBeTruthy();
    expect(screen.getAllByText("Borrador").length).toBeGreaterThan(0);
    expect(container.querySelector("[data-src='/worksheets/pulsadores-led-cover-updated.png']")).toBeTruthy();
    expect((screen.getByLabelText("Estado") as HTMLSelectElement).value).toBe("draft");
    expect((screen.getByLabelText("Nivel") as HTMLSelectElement).value).toBe("iniciacion");
  });

  it("shows local-only worksheets before they have been seeded to Convex", () => {
    queryState.worksheets = [];

    render(
      <TeacherCourseStructurePanel
        localWorksheets={[
          {
            activityIds: ["act-01"],
            coverImage: "/worksheets/led-rgb-cover.png",
            level: "iniciacion",
            slug: "led-rgb",
            status: "published",
            title: "LED RGB",
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Unidad 1 - LED RGB" })).toBeTruthy();
    expect(screen.getByText("1 actividades")).toBeTruthy();
    expect(screen.getByText("Pendiente de sincronizar")).toBeTruthy();
    expect((screen.getByLabelText("Estado") as HTMLSelectElement).disabled).toBe(true);
  });

  it("keeps dashboard status changes visible even when local metadata was used first", async () => {
    render(
      <TeacherCourseStructurePanel
        localWorksheets={[
          {
            activityIds: ["act-01"],
            coverImage: "/worksheets/pulsadores-led-cover.png",
            level: "iniciacion",
            slug: "pulsadores-led",
            status: "published",
            title: "Pulsador de 4 patas",
          },
        ]}
      />,
    );

    fireEvent.change(screen.getByLabelText("Estado"), {
      target: { value: "draft" },
    });

    await waitFor(() =>
      expect(queryState.updateMetadata).toHaveBeenCalledWith({
        status: "draft",
        worksheetId: "worksheet-1",
      }),
    );
    expect((screen.getByLabelText("Estado") as HTMLSelectElement).value).toBe("draft");
    expect(screen.getAllByText("Borrador").length).toBeGreaterThan(0);
  });

  it("shows the number of published worksheets next to the total count", () => {
    queryState.worksheets = [
      {
        _id: "worksheet-1",
        activityIds: [],
        coverImage: "/worksheet-placeholder.svg",
        duration: "1 sesión",
        level: "iniciacion",
        position: 0,
        prerequisites: [],
        slug: "pulsadores-led",
        status: "published",
        title: "Pulsador de 4 patas",
      },
      {
        _id: "worksheet-2",
        activityIds: [],
        coverImage: "/worksheet-placeholder.svg",
        duration: "1 sesión",
        level: "iniciacion",
        position: 1,
        prerequisites: [],
        slug: "zumbador-pasivo",
        status: "draft",
        title: "Zumbador pasivo",
      },
    ];

    render(<TeacherCourseStructurePanel />);

    expect(screen.getByText("1 publicadas / 2 unidades")).toBeTruthy();
  });
});
