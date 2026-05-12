"use client";

import { useState } from "react";

export function AcademyContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const subject = encodeURIComponent("Solicitud de información sobre Portal Arduino");
    const body = encodeURIComponent(
      [
        `Nombre: ${name}`,
        `Email: ${email}`,
        "",
        message,
      ].join("\n"),
    );

    window.location.href = `mailto:info@bauset.es?subject=${subject}&body=${body}`;
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

      <button className="btn-primary justify-center" type="submit">
        Enviar mensaje
      </button>
    </form>
  );
}
