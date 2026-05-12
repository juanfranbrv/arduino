import { BackendRequired } from "@/components/backend-required";
import { TeacherSetupForm } from "@/components/teacher-setup-form";

export default function TeacherSetupPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
      <BackendRequired>
        <section className="surface-card grid gap-5 p-7">
          <div>
            <p className="eyebrow">
              Setup profesor
            </p>
            <h1 className="mt-2 text-[32px] font-semibold leading-[1.28] text-[var(--color-midnight-ink)]">
              Crear el primer docente
            </h1>
          </div>
          <TeacherSetupForm />
        </section>
      </BackendRequired>
    </main>
  );
}
