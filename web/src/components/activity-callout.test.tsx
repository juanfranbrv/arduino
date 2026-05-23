import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Activity } from "./activity-callout";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: {
    alt: string;
    height?: number;
    src: string;
    unoptimized?: boolean;
    width?: number;
    [key: string]: unknown;
  }) => {
    delete props.height;
    delete props.unoptimized;
    delete props.width;

    return <span aria-label={alt} data-src={src} {...props} />;
  },
}));

describe("Activity", () => {
  it("shows a simulator environment marker in the activity header", () => {
    const { container } = render(
      <Activity
        id="act-01"
        title="Montar en Tinkercad"
        validation="El circuito funciona en el simulador."
        environment="simulador"
      />,
    );

    const marker = screen.getByLabelText("Actividad con simulador Tinkercad");
    const tinkercadLink = screen.getByRole("link", {
      name: /https:\/\/www\.tinkercad\.com/i,
    });
    const activityLabel = screen.getByText("Actividad 1");
    const environmentCapsule = marker.parentElement;

    expect(marker).toBeTruthy();
    expect(marker.getAttribute("data-src")).toBe("/activity-environments/tinkercad.jpg");
    expect(tinkercadLink.getAttribute("href")).toBe("https://www.tinkercad.com");
    expect(activityLabel.className).toContain("text-2xl");
    expect(environmentCapsule?.className).toContain("px-3");
    expect(marker.className).toContain("h-8");
    expect(container.querySelector("h3")?.className).toContain("sm:text-[38px]");
  });

  it("shows a real-board environment marker in the activity header", () => {
    render(
      <Activity
        id="act-02"
        title="Montar en placa"
        validation="El circuito funciona en la placa real."
        environment="placa"
      />,
    );

    const marker = screen.getByLabelText("Actividad con placa Arduino");

    expect(marker).toBeTruthy();
    expect(marker.getAttribute("data-src")).toBe("/activity-environments/arduino-uno.png");
  });
});
