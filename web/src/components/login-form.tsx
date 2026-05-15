"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";

import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { authClient } from "@/lib/auth-client";
import { convexApi } from "@/lib/convex-api";

export function LoginForm() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const navStatus = useQuery(
    convexApi.users.navStatus,
    session?.user ? {} : "skip",
  );
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

  if (sessionPending) {
    return (
      <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
        Comprobando sesión...
      </p>
    );
  }

  if (!session?.user) {
    return (
      <GoogleSignInButton callbackURL="/registro">
        Entrar con Google
      </GoogleSignInButton>
    );
  }

  if (navStatus === undefined) {
    return (
      <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
        Comprobando acceso...
      </p>
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
        Redirigiendo a mis unidades...
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="subtle-card grid gap-1 p-4">
        <p className="text-sm font-medium text-[var(--color-midnight-ink)]">
          Sesión activa como {session.user.name || session.user.email}
        </p>
        <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
          Falta completar el acceso con el código de grupo.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link className="btn-primary" href="/registro">
          Continuar acceso
        </Link>
        <button
          className="btn-secondary"
          type="button"
          onClick={signOut}
          disabled={pendingSignOut}
        >
          {pendingSignOut ? "Cerrando..." : "Cerrar sesión"}
        </button>
      </div>
    </div>
  );
}
