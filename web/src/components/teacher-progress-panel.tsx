"use client";

import { Check, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

import type { DemoStudent } from "@/lib/demo-classroom";
import type { Worksheet } from "@/lib/worksheets";

export function TeacherProgressPanel({
  students,
  worksheet,
}: {
  students: DemoStudent[];
  worksheet: Worksheet;
}) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id);
  const [completedByStudent, setCompletedByStudent] = useState(
    Object.fromEntries(
      students.map((student) => [student.id, new Set(student.completedActivityIds)]),
    ) as Record<string, Set<string>>,
  );
  const selectedStudent = students.find((student) => student.id === selectedStudentId);

  const completedCount = useMemo(() => {
    if (!selectedStudent) {
      return 0;
    }

    return worksheet.activities.filter((activity) =>
      completedByStudent[selectedStudent.id]?.has(activity.id),
    ).length;
  }, [completedByStudent, selectedStudent, worksheet.activities]);

  function toggleActivity(studentId: string, activityId: string) {
    setCompletedByStudent((current) => {
      const next = { ...current };
      const studentActivities = new Set(next[studentId] ?? []);

      if (studentActivities.has(activityId)) {
        studentActivities.delete(activityId);
      } else {
        studentActivities.add(activityId);
      }

      next[studentId] = studentActivities;
      return next;
    });
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[16rem_1fr]">
      <aside className="grid gap-2">
        {students.map((student) => (
          <button
            key={student.id}
            type="button"
            onClick={() => setSelectedStudentId(student.id)}
            className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 text-left transition ${
              selectedStudentId === student.id
                ? "border-[var(--color-jet-black)] bg-white"
                : "border-[var(--color-faded-gray)] bg-[var(--color-canvas-white)] hover:bg-white"
            }`}
          >
            <UserRound className="size-5 text-[var(--color-steel-gray)]" />
            <span className="font-semibold text-[var(--color-midnight-ink)]">
              {student.name}
            </span>
          </button>
        ))}
      </aside>

      {selectedStudent ? (
        <div className="surface-card grid gap-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-faded-gray)] pb-4">
            <div>
              <p className="text-sm text-[var(--color-steel-gray)]">
                {worksheet.title}
              </p>
              <h2 className="text-2xl font-semibold text-[var(--color-midnight-ink)]">
                {selectedStudent.name}
              </h2>
            </div>
            <span className="badge bg-white">
              {completedCount}/{worksheet.activities.length}
            </span>
          </div>

          <div className="grid gap-3">
            {worksheet.activities.map((activity) => {
              const completed = completedByStudent[selectedStudent.id]?.has(
                activity.id,
              );

              return (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => toggleActivity(selectedStudent.id, activity.id)}
                  className={`grid min-h-20 gap-1 rounded-[28px] border p-4 text-left transition ${
                    completed
                      ? "border-[var(--color-ember-glow)] bg-[var(--color-canvas-white)]"
                      : "border-[var(--color-faded-gray)] bg-white hover:bg-[var(--color-canvas-white)]"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <strong className="text-lg text-[var(--color-midnight-ink)]">
                      {activity.title}
                    </strong>
                    {completed ? (
                      <Check className="size-5 shrink-0 text-[var(--color-ember-glow)]" />
                    ) : null}
                  </span>
                  <span className="text-sm leading-6 text-[var(--color-graphite)]">
                    {activity.validation}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
