"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";

import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { authClient } from "@/lib/auth-client";
import { convexApi } from "@/lib/convex-api";

export function StudentRegisterForm() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const navStatus = useQuery(
    convexApi.users.navStatus,
    session?.user ? {} : "skip",
  );
  const joinWithCode = useMutation(convexApi.groups.joinWithCode);
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [pendingSignOut, setPendingSignOut] = useState(false);

  useEffect(() => {
    if (!navStatus) {
      return;
    }

    if (navStatus.hasTeacherProfile) {
      router.replace("/profesor");
      return;
    }

    if (navStatus.hasStudentProfile) {
      router.replace("/alumno");
    }
  }, [navStatus, router]);

  async function signOut() {
    setPendingSignOut(true);
    await authClient.signOut();
    router.refresh();
    setPendingSignOut(false);
  }

  async function register() {
    const displayName =
      session?.user.name?.trim() || session?.user.email?.trim() || "Alumno";

    setPending(true);
    setMessage(null);

    try {
      await joinWithCode({ displayName, joinCode });
      router.push("/alumno");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Primero entra con Google y después usa el código de grupo.",
      );
    } finally {
      setPending(false);
    }
  }

  if (sessionPending) {
    return (
      <section className="grid gap-3">
        <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
          Comprobando sesión...
        </p>
      </section>
    );
  }

  if (!session?.user) {
    return (
      <div className="grid gap-4">
        <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
          Entra con tu cuenta de Google. Si todavía no estás dado de alta, el
          siguiente paso será introducir el código de grupo.
        </p>
        <GoogleSignInButton callbackURL="/registro">
          Continuar con Google
        </GoogleSignInButton>
      </div>
    );
  }

  if (navStatus === undefined) {
    return (
      <section className="grid gap-3">
        <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
          Comprobando acceso...
        </p>
      </section>
    );
  }

  if (navStatus.hasTeacherProfile) {
    return (
      <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
        Redirigiendo al panel de control...
      </p>
    );
  }

  if (navStatus.hasStudentProfile) {
    return (
      <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
        Redirigiendo a mis fichas...
      </p>
    );
  }

  return (
    <form className="grid gap-4">
      <div className="subtle-card grid gap-1 p-4">
        <p className="text-sm font-medium text-[var(--color-midnight-ink)]">
          {session.user.name || session.user.email}
        </p>
        <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
          Introduce el código facilitado en clase para completar el acceso.
        </p>
      </div>
      <label className="form-label">
        Código de grupo
        <input
          className="form-input uppercase"
          name="joinCode"
          autoComplete="off"
          spellCheck={false}
          value={joinCode}
          onChange={(event) => setJoinCode(event.target.value)}
        />
      </label>
      <button
        className="btn-primary"
        type="button"
        disabled={pending || !joinCode}
        onClick={register}
      >
        {pending ? "Accediendo..." : "Entrar con código"}
      </button>
      <button
        className="btn-secondary"
        type="button"
        onClick={signOut}
        disabled={pendingSignOut}
      >
        {pendingSignOut ? "Cerrando..." : "Cerrar sesión"}
      </button>
      {message ? (
        <p className="text-sm text-[var(--color-graphite)]" aria-live="polite">
          {message}
        </p>
      ) : null}
    </form>
  );
}
