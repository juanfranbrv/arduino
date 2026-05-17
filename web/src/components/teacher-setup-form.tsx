"use client";

import { useMutation } from "convex/react";
import { useState } from "react";

import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { convexApi } from "@/lib/convex-api";

export function TeacherSetupForm() {
  const setupTeacher = useMutation(convexApi.users.setupTeacher);
  const [displayName, setDisplayName] = useState("");
  const [setupSecret, setSetupSecret] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function setup() {
    setPending(true);
    setMessage(null);

    try {
      await setupTeacher({ displayName, setupSecret });
      setMessage("Profesor configurado.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Primero entra con Google y después usa el secreto de setup.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4">
      <GoogleSignInButton callbackURL="/setup-profesor">
        Entrar con Google
      </GoogleSignInButton>
      <label className="form-label">
        Nombre visible
        <input
          className="form-input"
          name="displayName"
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </label>
      <label className="form-label">
        Secreto de setup
        <input
          className="form-input"
          name="setupSecret"
          type="password"
          autoComplete="off"
          value={setupSecret}
          onChange={(event) => setSetupSecret(event.target.value)}
        />
      </label>
      <button
        className="btn-primary"
        type="button"
        disabled={pending || !displayName || !setupSecret}
        onClick={setup}
      >
        {pending ? "Configurando..." : "Activar profesor"}
      </button>
      {message ? (
        <p className="text-sm text-[var(--color-graphite)]" aria-live="polite">
          {message}
        </p>
      ) : null}
    </form>
  );
}
