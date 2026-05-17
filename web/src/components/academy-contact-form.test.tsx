import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AcademyContactForm } from "./academy-contact-form";

describe("AcademyContactForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("submits contact details to the server contact endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<AcademyContactForm />);

    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ana@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Mensaje"), {
      target: { value: "Quiero información sobre las clases." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(fetchMock).toHaveBeenCalledWith("/api/contact", {
      body: JSON.stringify({
        email: "ana@example.com",
        message: "Quiero información sobre las clases.",
        name: "Ana",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    expect(await screen.findByText("Mensaje enviado.")).toBeTruthy();
    expect(screen.queryByLabelText("Nombre")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Enviar otro mensaje" }));

    expect(screen.getByLabelText("Nombre")).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Mensaje")).toBeTruthy();
  });
});
