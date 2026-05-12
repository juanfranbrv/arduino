import { BackendRequired } from "@/components/backend-required";
import { StudentRegisterForm } from "@/components/student-register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
      <BackendRequired>
        <section className="surface-card grid gap-5 p-7">
          <div>
            <p className="eyebrow">
              Acceso alumno
            </p>
            <h1 className="mt-2 text-[32px] font-semibold leading-[1.28] text-[var(--color-midnight-ink)]">
              Acceder al portal
            </h1>
          </div>
          <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
            El acceso se completa con tu cuenta de Google y el código de grupo
            facilitado en clase.
          </p>
          <StudentRegisterForm />
        </section>
      </BackendRequired>
    </main>
  );
}
