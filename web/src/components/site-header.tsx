"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { UserHeaderProfile } from "@/components/user-header-profile";
import { convexApi } from "@/lib/convex-api";

export function SiteHeader() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const navStatus = useQuery(
    convexApi.users.navStatus,
    session?.user ? {} : "skip",
  );
  const [pendingSignOut, setPendingSignOut] = useState(false);

  async function signOut() {
    setPendingSignOut(true);
    await authClient.signOut();
    router.refresh();
    setPendingSignOut(false);
  }

  const hasSession = Boolean(session?.user);
  const hasStudentAccess = Boolean(navStatus?.hasStudentProfile);
  const hasTeacherAccess = Boolean(navStatus?.hasTeacherProfile);

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-faded-gray)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 font-semibold text-[var(--color-midnight-ink)]"
        >
          <Image
            src="/logoweb1.png"
            alt="Bauset"
            width={180}
            height={56}
            className="h-9 w-auto"
            priority
          />
          <span>portal arduino</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1 rounded-xl bg-[var(--color-canvas-white)] p-1 text-sm font-medium text-[var(--color-graphite)]">
          {!hasSession ? (
            <>
              <Link className="rounded-xl px-3 py-2 hover:bg-white" href="/fichas">
                Unidades
              </Link>
              <Link className="rounded-xl px-3 py-2 hover:bg-white" href="/login">
                Entrar
              </Link>
            </>
          ) : sessionPending || navStatus === undefined ? (
            <span className="rounded-xl px-3 py-2 text-[var(--color-steel-gray)]">
              Comprobando...
            </span>
          ) : (
            <>
              {hasTeacherAccess ? (
                <Link className="rounded-xl px-3 py-2 hover:bg-white" href="/profesor">
                  Panel de control
                </Link>
              ) : null}
              {hasStudentAccess ? (
                <Link className="rounded-xl px-3 py-2 hover:bg-white" href="/alumno">
                  Mis fichas
                </Link>
              ) : hasTeacherAccess ? null : (
                <Link className="rounded-xl px-3 py-2 hover:bg-white" href="/registro">
                  Completar acceso
                </Link>
              )}
              <button
                className="rounded-xl px-3 py-2 hover:bg-white"
                type="button"
                onClick={signOut}
                disabled={pendingSignOut}
              >
                {pendingSignOut ? "Cerrando..." : "Salir"}
              </button>
            </>
          )}
        </nav>

        <UserHeaderProfile />
      </div>
    </header>
  );
}
