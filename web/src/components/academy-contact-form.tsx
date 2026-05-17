"use client";

import { useState } from "react";

export function AcademyContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const response = await fetch("/api/contact", {
      body: JSON.stringify({ email, message, name }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!response.ok) {
      setStatus("error");
      return;
    }

    setName("");
    setEmail("");
    setMessage("");
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <section className="surface-card grid min-h-[22rem] content-center gap-4 p-6 text-center">
        <div className="grid gap-2">
          <h3 className="text-2xl font-semibold leading-[1.28] text-[var(--color-midnight-ink)]">
            Mensaje enviado.
          </h3>
          <p className="text-base leading-[1.62] text-[var(--color-graphite)]">
            Hemos recibido tu solicitud y responderemos lo antes posible.
          </p>
        </div>
        <button
          className="justify-self-center text-sm font-medium text-[var(--color-midnight-ink)] underline underline-offset-4"
          type="button"
          onClick={() => setStatus("idle")}
        >
          Enviar otro mensaje
        </button>
      </section>
    );
  }

  return (
    <form className="surface-card grid gap-4 p-6" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <label className="form-label" htmlFor="contact-name">
          Nombre
        </label>
        <input
          id="contact-name"
          className="form-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>

      <div className="grid gap-2">
        <label className="form-label" htmlFor="contact-email">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          className="form-input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="grid gap-2">
        <label className="form-label" htmlFor="contact-message">
          Mensaje
        </label>
        <textarea
          id="contact-message"
          className="form-input min-h-32 resize-y"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Quiero más información sobre las clases de Arduino."
          required
        />
      </div>

      {status === "error" ? (
        <p className="text-sm font-medium text-[var(--color-midnight-ink)]">
          No se ha podido enviar el mensaje. Inténtalo de nuevo.
        </p>
      ) : null}

      <button
        className="btn-primary justify-center"
        disabled={status === "sending"}
        type="submit"
      >
        {status === "sending" ? "Enviando..." : "Enviar mensaje"}
      </button>
    </form>
  );
}
