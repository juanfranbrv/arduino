import { TeacherProgressPanel } from "@/components/teacher-progress-panel";
import { TeacherProgressConvexPanel } from "@/components/teacher-progress-convex-panel";
import { TeacherGroupsPanel } from "@/components/teacher-groups-panel";
import { demoStudents } from "@/lib/demo-classroom";
import { getPublishedWorksheets } from "@/lib/worksheets";

export default function TeacherPage() {
  const worksheet = getPublishedWorksheets()[0];
  const convexEnabled = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-6 sm:px-8">
      <header className="grid gap-2">
        <p className="eyebrow">Arduino 1</p>
        <h1 className="text-[40px] font-semibold leading-[1.04] text-[var(--color-midnight-ink)]">
          Seguimiento en clase
        </h1>
      </header>

      {convexEnabled ? <TeacherGroupsPanel /> : null}

      {convexEnabled ? <TeacherProgressConvexPanel /> : worksheet ? (
        <TeacherProgressPanel students={demoStudents} worksheet={worksheet} />
      ) : null}
    </main>
  );
}
