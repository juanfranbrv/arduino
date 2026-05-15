import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TeacherCourseStructurePanel } from "./teacher-course-structure-panel";

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
  useMutation: () => vi.fn(),
  useQuery: () => [
    {
      _id: "worksheet-1",
      activityIds: [],
      coverImage: "/worksheet-placeholder.svg",
      level: "iniciacion",
      slug: "pulsadores-led",
      status: "draft",
      title: "Unidad 5 - Pulsador de 4 patas",
    },
  ],
}));

describe("TeacherCourseStructurePanel", () => {
  it("renders course unit cards with a large thumbnail column and compact metadata controls", () => {
    const { container } = render(<TeacherCourseStructurePanel />);

    expect(screen.getByRole("link", { name: "Unidad 5 - Pulsador de 4 patas" })).toBeTruthy();

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
});
