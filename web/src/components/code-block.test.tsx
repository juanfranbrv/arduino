import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CodeBlock } from "./code-block";

describe("CodeBlock", () => {
  it("does not show the language label in the header", () => {
    render(
      <CodeBlock>
        <code>void setup() {"\n"}  pinMode(13, OUTPUT);{"\n"}{"}"}</code>
      </CodeBlock>,
    );

    expect(screen.getByText("Código")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copiar código" })).toBeTruthy();
    expect(screen.queryByText("cpp")).toBeNull();
  });
});
