import { StudentDashboard } from "@/components/student-dashboard";
import { getAllWorksheets } from "@/lib/worksheets";

export default function StudentPage() {
  const worksheets = getAllWorksheets();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8">
      <header className="grid gap-2">
        <p className="eyebrow">Alumno</p>
        <h1 className="text-[40px] font-semibold leading-[1.04] text-[var(--color-midnight-ink)]">
          Mis unidades
        </h1>
        <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
          Consulta tus unidades y el estado de cada actividad.
        </p>
      </header>

      <StudentDashboard worksheets={worksheets} />
    </main>
  );
}
