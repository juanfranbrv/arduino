import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export function RestrictedAccess() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-5 py-8">
      <section className="surface-card grid gap-5 p-7">
        <div className="flex gap-3">
          <LockKeyhole className="mt-1 size-6 shrink-0 text-[var(--color-steel-gray)]" aria-hidden="true" />
          <div>
            <p className="eyebrow">
              Inicia sesión
            </p>
            <h1 className="mt-2 text-[32px] font-semibold leading-[1.28] text-[var(--color-midnight-ink)]">
              Entra para continuar
            </h1>
          </div>
        </div>
        <p className="leading-[1.62] text-[var(--color-graphite)]">
          Para abrir la ficha completa y ver el progreso de actividades tienes
          que iniciar sesión.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link className="btn-primary" href="/login">
            Entrar
          </Link>
          <Link className="btn-secondary" href="/fichas">
            Ver fichas disponibles
          </Link>
        </div>
      </section>
    </main>
  );
}
