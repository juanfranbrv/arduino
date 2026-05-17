import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const sendMailMock = vi.fn();

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: sendMailMock,
    })),
  },
}));

describe("POST /api/contact", () => {
  beforeEach(() => {
    sendMailMock.mockResolvedValue({ messageId: "smtp-message-123" });
    vi.stubEnv("CONTACT_FROM_EMAIL", "Portal Arduino <noreply@bauset.es>");
    vi.stubEnv("SMTP_HOST", "smtp.example.com");
    vi.stubEnv("SMTP_PASS", "smtp-password");
    vi.stubEnv("SMTP_PORT", "465");
    vi.stubEnv("SMTP_SECURE", "true");
    vi.stubEnv("SMTP_USER", "smtp-user");
  });

  afterEach(() => {
    sendMailMock.mockReset();
    vi.unstubAllEnvs();
  });

  it("sends the contact message to info@bauset.es through SMTP", async () => {
    const response = await POST(
      new Request("http://localhost/api/contact", {
        body: JSON.stringify({
          email: "ana@example.com",
          message: "Quiero información sobre las clases.",
          name: "Ana",
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(sendMailMock).toHaveBeenCalledWith({
      from: "Portal Arduino <noreply@bauset.es>",
      html: expect.stringContaining("Quiero información sobre las clases."),
      replyTo: "ana@example.com",
      subject: "Solicitud de información sobre Portal Arduino",
      text: expect.stringContaining("Nombre: Ana"),
      to: "info@bauset.es",
    });
  });
});
