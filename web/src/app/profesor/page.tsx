import { TeacherCourseStructurePanel } from "@/components/teacher-course-structure-panel";
import { TeacherDashboardTabs } from "@/components/teacher-dashboard-tabs";
import { TeacherProgressPanel } from "@/components/teacher-progress-panel";
import { TeacherProgressConvexPanel } from "@/components/teacher-progress-convex-panel";
import { TeacherGroupsPanel } from "@/components/teacher-groups-panel";
import { demoStudents } from "@/lib/demo-classroom";
import { getTeacherDashboardTabFromParam } from "@/lib/teacher-dashboard";
import { getPublishedWorksheets } from "@/lib/worksheets";

export default async function TeacherPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const worksheet = getPublishedWorksheets()[0];
  const convexEnabled = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
  const initialTab = getTeacherDashboardTabFromParam(
    resolvedSearchParams.tab ?? null,
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-6 sm:px-8">
      <header className="grid gap-2">
        <p className="eyebrow">Arduino 1</p>
        <h1 className="text-[40px] font-semibold leading-[1.04] text-[var(--color-midnight-ink)]">
          Seguimiento en clase
        </h1>
      </header>

      <TeacherDashboardTabs
        initialTab={initialTab}
        groupsPanel={
          convexEnabled ? (
            <TeacherGroupsPanel />
          ) : (
            <section className="subtle-card p-5 text-[var(--color-graphite)]">
              Configura Convex para crear grupos y codigos de acceso.
            </section>
          )
        }
        progressPanel={
          convexEnabled ? (
            <TeacherProgressConvexPanel />
          ) : worksheet ? (
            <TeacherProgressPanel students={demoStudents} worksheet={worksheet} />
          ) : (
            <section className="subtle-card p-5 text-[var(--color-graphite)]">
              Publica al menos una ficha para activar el seguimiento.
            </section>
          )
        }
        structurePanel={
          convexEnabled ? (
            <TeacherCourseStructurePanel />
          ) : (
            <section className="subtle-card p-5 text-[var(--color-graphite)]">
              Configura Convex para gestionar el orden y el estado de las unidades.
            </section>
          )
        }
      />
    </main>
  );
}
