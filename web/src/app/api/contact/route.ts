import nodemailer from "nodemailer";

export const runtime = "nodejs";

const CONTACT_RECIPIENT = "info@bauset.es";

type ContactRequest = {
  email?: unknown;
  message?: unknown;
  name?: unknown;
};

export async function POST(request: Request) {
  let payload: ContactRequest;

  try {
    payload = (await request.json()) as ContactRequest;
  } catch {
    return Response.json({ error: "Solicitud no válida." }, { status: 400 });
  }

  const name = parseRequiredString(payload.name);
  const email = parseRequiredString(payload.email);
  const message = parseRequiredString(payload.message);

  if (!name || !email || !message || !isValidEmail(email)) {
    return Response.json({ error: "Revisa los datos del formulario." }, { status: 400 });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT ?? 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!smtpHost || !smtpUser || !smtpPass || !from || !Number.isFinite(smtpPort)) {
    return Response.json(
      { error: "El envío de correo no está configurado." },
      { status: 500 },
    );
  }

  const transporter = nodemailer.createTransport({
    auth: {
      pass: smtpPass,
      user: smtpUser,
    },
    host: smtpHost,
    port: smtpPort,
    secure: process.env.SMTP_SECURE === "true",
  });

  try {
    await transporter.sendMail({
      from,
      html: buildHtmlMessage({ email, message, name }),
      replyTo: email,
      subject: "Solicitud de información sobre Portal Arduino",
      text: buildTextMessage({ email, message, name }),
      to: CONTACT_RECIPIENT,
    });
  } catch {
    return Response.json(
      { error: "No se ha podido enviar el mensaje." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}

function parseRequiredString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildTextMessage({
  email,
  message,
  name,
}: {
  email: string;
  message: string;
  name: string;
}) {
  return [
    "Nueva solicitud de información desde el Portal Arduino.",
    "",
    `Nombre: ${name}`,
    `Email: ${email}`,
    "",
    message,
  ].join("\n");
}

function buildHtmlMessage({
  email,
  message,
  name,
}: {
  email: string;
  message: string;
  name: string;
}) {
  return [
    "<p>Nueva solicitud de información desde el Portal Arduino.</p>",
    "<dl>",
    `<dt>Nombre</dt><dd>${escapeHtml(name)}</dd>`,
    `<dt>Email</dt><dd>${escapeHtml(email)}</dd>`,
    "</dl>",
    `<p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>`,
  ].join("");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
