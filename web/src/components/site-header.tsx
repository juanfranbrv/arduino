"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquareEditIcon,
  Login03Icon,
  Logout03Icon,
} from "@hugeicons/core-free-icons";

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
            <Link
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white"
              href="/login"
            >
              <HugeiconsIcon icon={Login03Icon} size={18} strokeWidth={1.7} />
              <span>Entrar</span>
            </Link>
          ) : sessionPending || navStatus === undefined ? (
            <span className="rounded-xl px-3 py-2 text-[var(--color-steel-gray)]">
              Comprobando...
            </span>
          ) : (
            <>
              {hasTeacherAccess ? (
                <Link
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white"
                  href="/profesor"
                >
                  <HugeiconsIcon
                    icon={DashboardSquareEditIcon}
                    size={18}
                    strokeWidth={1.7}
                  />
                  <span>Panel de control</span>
                </Link>
              ) : null}
              {hasStudentAccess ? (
                <Link
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white"
                  href="/alumno"
                >
                  <HugeiconsIcon
                    icon={DashboardSquareEditIcon}
                    size={18}
                    strokeWidth={1.7}
                  />
                  <span>Mis fichas</span>
                </Link>
              ) : hasTeacherAccess ? null : (
                <Link className="rounded-xl px-3 py-2 hover:bg-white" href="/registro">
                  Completar acceso
                </Link>
              )}
              <button
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white"
                type="button"
                onClick={signOut}
                disabled={pendingSignOut}
              >
                <HugeiconsIcon icon={Logout03Icon} size={18} strokeWidth={1.7} />
                <span>{pendingSignOut ? "Cerrando..." : "Salir"}</span>
              </button>
            </>
          )}
        </nav>

        <UserHeaderProfile />
      </div>
    </header>
  );
}
