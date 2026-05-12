import { calculateWorksheetProgress, getPublishedWorksheets } from "@/lib/worksheets";

export type DemoStudent = {
  id: string;
  name: string;
  group: string;
  completedActivityIds: string[];
};

export const demoStudents: DemoStudent[] = [
  {
    id: "student-ana",
    name: "Ana Garcia",
    group: "Arduino 1",
    completedActivityIds: ["act-01", "act-02"],
  },
  {
    id: "student-mario",
    name: "Mario Lopez",
    group: "Arduino 1",
    completedActivityIds: ["act-01"],
  },
  {
    id: "student-nora",
    name: "Nora Ruiz",
    group: "Arduino 1",
    completedActivityIds: [],
  },
];

export function getDemoStudentProgress(student: DemoStudent) {
  const worksheet = getPublishedWorksheets()[0];
  const activityIds = worksheet?.activities.map((activity) => activity.id) ?? [];

  return {
    worksheet,
    progress: calculateWorksheetProgress(activityIds, student.completedActivityIds),
  };
}
