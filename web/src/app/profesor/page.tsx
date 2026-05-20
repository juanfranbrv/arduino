import { TeacherCourseStructurePanel } from "@/components/teacher-course-structure-panel";
import { TeacherCourseMapPanel } from "@/components/teacher-course-map-panel";
import { TeacherDashboardTabs } from "@/components/teacher-dashboard-tabs";
import { TeacherProgressPanel } from "@/components/teacher-progress-panel";
import { TeacherProgressConvexPanel } from "@/components/teacher-progress-convex-panel";
import { TeacherGroupsPanel } from "@/components/teacher-groups-panel";
import { demoStudents } from "@/lib/demo-classroom";
import { getTeacherDashboardTabFromParam } from "@/lib/teacher-dashboard";
import { getAllWorksheets, getPublishedWorksheets } from "@/lib/worksheets";

export default async function TeacherPage({
  searchParams,
}: {
  searchParams?: Promise<{
    groupId?: string;
    studentId?: string;
    tab?: string;
    worksheetId?: string;
  }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const worksheet = getPublishedWorksheets()[0];
  const localWorksheets = getAllWorksheets().map((worksheet) => ({
    activityIds: worksheet.activities.map((activity) => activity.id),
    activities: worksheet.activities.map((activity) => ({
      id: activity.id,
      title: activity.title,
      validation: activity.validation,
    })),
    coverImage: worksheet.coverImage,
    level: worksheet.level,
    slug: worksheet.slug,
    status: worksheet.status,
    title: worksheet.title,
  }));
  const convexEnabled = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
  const initialTab = getTeacherDashboardTabFromParam(
    resolvedSearchParams.tab ?? null,
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
      <header className="grid gap-2">
        <p className="eyebrow">Arduino 1</p>
        <h1 className="text-[36px] font-semibold leading-[1.06] text-[var(--color-midnight-ink)] sm:text-[40px] sm:leading-[1.04]">
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
              Configura Convex para crear grupos y códigos de acceso.
            </section>
          )
        }
        progressPanel={
          convexEnabled ? (
            <TeacherProgressConvexPanel
              initialGroupId={resolvedSearchParams.groupId ?? null}
              initialStudentId={resolvedSearchParams.studentId ?? null}
              initialWorksheetId={resolvedSearchParams.worksheetId ?? null}
              localWorksheets={localWorksheets}
            />
          ) : worksheet ? (
            <TeacherProgressPanel students={demoStudents} worksheet={worksheet} />
          ) : (
            <section className="subtle-card p-5 text-[var(--color-graphite)]">
              Publica al menos una ficha para activar el seguimiento.
            </section>
          )
        }
        mapPanel={
          convexEnabled ? (
            <TeacherCourseMapPanel localWorksheets={localWorksheets} />
          ) : (
            <section className="subtle-card p-5 text-[var(--color-graphite)]">
              Configura Convex para ver el mapa del curso por grupo.
            </section>
          )
        }
        structurePanel={
          convexEnabled ? (
            <TeacherCourseStructurePanel localWorksheets={localWorksheets} />
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
