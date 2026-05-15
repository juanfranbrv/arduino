import { describe, expect, it } from "vitest";

import {
  buildReorderedIds,
  getWorksheetStatusSurfaceClassName,
  getTeacherWorksheetCoverImage,
  getTeacherDashboardHref,
  getWorksheetStatusBadgeClassName,
  getTeacherDashboardTabFromParam,
  validateWorksheetThumbnailFile,
  teacherDashboardLinks,
  teacherDashboardTabs,
} from "./teacher-dashboard";

describe("teacher dashboard navigation", () => {
  it("exposes the four professor dashboard tabs in priority order", () => {
    expect(teacherDashboardTabs.map((tab) => tab.id)).toEqual([
      "seguimiento",
      "grupos",
      "estructura",
      "enlaces",
    ]);
  });

  it("includes the key project links for development", () => {
    expect(teacherDashboardLinks.map((link) => link.label)).toEqual(
      expect.arrayContaining(["Proyecto GitHub", "Proyecto Vercel"]),
    );
  });

  it("points the Vercel project link to the configured project page", () => {
    expect(
      teacherDashboardLinks.find((link) => link.label === "Proyecto Vercel")
        ?.href,
    ).toBe("https://vercel.com/juanfranbrvs-projects/arduino");
  });

  it("resolves the active tab from the URL parameter", () => {
    expect(getTeacherDashboardTabFromParam("estructura")).toBe("estructura");
    expect(getTeacherDashboardTabFromParam("desconocida")).toBe("seguimiento");
    expect(getTeacherDashboardTabFromParam(null)).toBe("seguimiento");
  });

  it("builds dashboard links that preserve non-default tabs", () => {
    expect(getTeacherDashboardHref("estructura")).toBe("/profesor?tab=estructura");
    expect(getTeacherDashboardHref("seguimiento")).toBe("/profesor");
  });

  it("reorders ids from the visible order instead of stale local state", () => {
    expect(buildReorderedIds(["a", "b", "c"], "a", "c")).toEqual(["b", "c", "a"]);
    expect(buildReorderedIds(["a", "b", "c"], "c", "a")).toEqual(["c", "a", "b"]);
    expect(buildReorderedIds(["a", "b", "c"], "a", "a")).toEqual(["a", "b", "c"]);
  });

  it("uses distinct visual classes for draft and published worksheet badges", () => {
    expect(getWorksheetStatusBadgeClassName("draft")).toContain(
      "bg-[var(--color-canvas-white)]",
    );
    expect(getWorksheetStatusBadgeClassName("published")).toContain("bg-emerald-100");
  });

  it("uses subtle gray and green surfaces for draft and published worksheets", () => {
    expect(getWorksheetStatusSurfaceClassName("draft")).toContain(
      "bg-[var(--color-canvas-white)]",
    );
    expect(getWorksheetStatusSurfaceClassName("published")).toContain(
      "bg-emerald-50/60",
    );
  });

  it("prefers generated local worksheet covers over stale remote cover values", () => {
    expect(
      getTeacherWorksheetCoverImage(
        "pulsadores-led",
        "/worksheet-placeholder.svg",
      ),
    ).toBe("/worksheets/pulsadores-led-cover.png");

    expect(
      getTeacherWorksheetCoverImage(
        "zumbador-activo",
        "/fichas/zumbador-activo/zumbador-activo-infografia.png",
      ),
    ).toBe("/worksheets/zumbador-activo-cover.png");

    expect(
      getTeacherWorksheetCoverImage(
        "unidad-08-tilt",
        "/worksheet-placeholder.svg",
      ),
    ).toBe("/worksheets/unidad-08-tilt-cover.png");
  });

  it("keeps the remote cover for worksheets without a generated local cover", () => {
    expect(getTeacherWorksheetCoverImage("unidad-07-zumbador-pasivo", "/custom.png")).toBe(
      "/custom.png",
    );
    expect(getTeacherWorksheetCoverImage("unidad-07-zumbador-pasivo", undefined)).toBe(
      "/worksheet-placeholder.svg",
    );
  });

  it("accepts only reasonably sized image files as worksheet thumbnails", () => {
    expect(validateWorksheetThumbnailFile({ type: "image/png", size: 250_000 })).toEqual({
      ok: true,
    });
    expect(validateWorksheetThumbnailFile({ type: "application/pdf", size: 250_000 })).toEqual({
      ok: false,
      error: "El fichero debe ser una imagen.",
    });
    expect(validateWorksheetThumbnailFile({ type: "image/jpeg", size: 4_000_000 })).toEqual({
      ok: false,
      error: "La imagen no puede superar 3 MB.",
    });
  });
});
