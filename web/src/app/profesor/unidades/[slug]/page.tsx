import { notFound } from "next/navigation";

import { RestrictedAccess } from "@/components/restricted-access";
import { WorksheetShell } from "@/components/worksheet-shell";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import { convexApi } from "@/lib/convex-api";
import { getWorksheetBySlug } from "@/lib/worksheets";

export const dynamic = "force-dynamic";

export default async function TeacherWorksheetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const worksheet = getWorksheetBySlug(slug);

  if (!worksheet) {
    notFound();
  }

  if (!(await isAuthenticated())) {
    return <RestrictedAccess />;
  }

  const navStatus = await fetchAuthQuery(convexApi.users.navStatus, {});

  if (!navStatus.hasTeacherProfile) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-5 py-8">
        <section className="surface-card grid gap-4 p-7">
          <p className="eyebrow">Acceso docente</p>
          <h1 className="text-[32px] font-semibold leading-[1.28] text-[var(--color-midnight-ink)]">
            Esta vista es solo para profesor
          </h1>
          <p className="leading-[1.62] text-[var(--color-graphite)]">
            Entra con una cuenta de profesor para abrir unidades en borrador o
            revisar el contenido completo desde el panel.
          </p>
        </section>
      </main>
    );
  }

  const teacherWorksheets = await fetchAuthQuery(convexApi.worksheets.listForTeacher, {});
  const teacherWorksheet = teacherWorksheets.find((item) => item.slug === slug);
  const mergedWorksheet = teacherWorksheet
    ? {
        ...worksheet,
        title: teacherWorksheet.title,
        level: teacherWorksheet.level,
        status: teacherWorksheet.status,
        prerequisites: teacherWorksheet.prerequisites,
      }
    : worksheet;

  return (
    <WorksheetShell
      worksheet={mergedWorksheet}
      backHref="/profesor?tab=estructura"
      backLabel="Volver al panel"
    />
  );
}
