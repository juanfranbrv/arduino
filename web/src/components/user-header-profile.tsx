"use client";

import Link from "next/link";

import { authClient } from "@/lib/auth-client";

export function UserHeaderProfile() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  if (isPending || !user) {
    return null;
  }

  const name = user.name || user.email || "Usuario";
  const initial = name.trim().charAt(0).toUpperCase() || "U";

  return (
    <Link
      href="/alumno"
      className="flex size-10 items-center justify-center overflow-hidden rounded-full border border-[var(--color-faded-gray)] bg-[var(--color-canvas-white)] text-sm font-semibold text-[var(--color-midnight-ink)]"
      title={name}
      aria-label={`Cuenta de ${name}`}
    >
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.image}
          alt=""
          className="size-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        initial
      )}
    </Link>
  );
}
