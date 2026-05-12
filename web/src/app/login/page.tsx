import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
      <section className="surface-card grid gap-5 p-7">
        <div>
          <p className="eyebrow">
            Acceso
          </p>
          <h1 className="mt-2 text-[32px] font-semibold leading-[1.28] text-[var(--color-midnight-ink)]">
            Entrar en el portal
          </h1>
        </div>
        <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
          Acceso reservado a alumnos y profesores de la academia. Entra con tu
          cuenta de Google. Si eres alumno y todavía no has completado el alta,
          después podrás introducir el código de grupo.
        </p>
        <LoginForm />
        <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
          Si todavía no has accedido antes, el sistema te pedirá el código de
          grupo al volver de Google.
        </p>
      </section>
    </main>
  );
}
