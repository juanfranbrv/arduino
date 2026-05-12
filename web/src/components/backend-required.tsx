export function BackendRequired({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <section className="surface-card grid gap-3 p-7">
        <h1 className="text-2xl font-semibold text-[var(--color-midnight-ink)]">
          Backend pendiente
        </h1>
        <p className="text-[var(--color-graphite)]">
          Esta pantalla necesita Convex y BetterAuth configurados. Ejecuta
          `npx convex dev`, define las variables de entorno y vuelve a cargar.
        </p>
      </section>
    );
  }

  return <>{children}</>;
}
