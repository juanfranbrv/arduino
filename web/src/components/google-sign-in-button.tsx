"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export function GoogleSignInButton({
  children = "Entrar con Google",
  callbackURL = "/registro",
}: {
  children?: string;
  callbackURL?: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function signInWithGoogle() {
    setPending(true);
    setMessage(null);

    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });

    setPending(false);

    if (result?.error) {
      setMessage(result.error.message ?? "No se ha podido iniciar sesión.");
    }
  }

  return (
    <div className="grid gap-3">
      <button
        className="btn-primary"
        type="button"
        disabled={pending}
        onClick={signInWithGoogle}
      >
        {pending ? "Abriendo Google..." : children}
      </button>
      {message ? (
        <p className="text-sm text-[var(--color-graphite)]" aria-live="polite">
          {message}
        </p>
      ) : null}
    </div>
  );
}
