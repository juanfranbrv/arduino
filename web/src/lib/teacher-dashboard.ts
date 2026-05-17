export type TeacherDashboardTabId = "seguimiento" | "grupos" | "estructura" | "enlaces";

export type TeacherDashboardTab = {
  id: TeacherDashboardTabId;
  label: string;
  description: string;
};

export type TeacherDashboardLink = {
  label: string;
  href: string;
  description: string;
};

export const teacherDashboardTabs: TeacherDashboardTab[] = [
  {
    id: "seguimiento",
    label: "Seguimiento",
    description: "Control rápido de unidades y actividades por alumno.",
  },
  {
    id: "grupos",
    label: "Grupos",
    description: "Alta de grupos y códigos para que los alumnos se unan.",
  },
  {
    id: "estructura",
    label: "Estructura",
    description: "Orden y estado de las unidades que forman el curso.",
  },
  {
    id: "enlaces",
    label: "Enlaces",
    description: "Accesos directos a los sitios técnicos del proyecto.",
  },
];

const defaultTeacherDashboardTab: TeacherDashboardTabId = "seguimiento";
const generatedWorksheetCoverImages: Record<string, string> = {
  "explorar-el-pack": "/worksheets/explorar-el-pack-cover-v2.png",
  "leds-paralelo-serie-resistencia": "/worksheets/leds-paralelo-serie-resistencia-cover.png",
  "pulsadores-led": "/worksheets/pulsadores-led-cover.png",
  "zumbador-activo": "/worksheets/zumbador-activo-cover.png",
  "tilt": "/worksheets/tilt-cover.png",
};

export function getTeacherDashboardTabFromParam(
  tab: string | null,
): TeacherDashboardTabId {
  return teacherDashboardTabs.some((item) => item.id === tab)
    ? (tab as TeacherDashboardTabId)
    : defaultTeacherDashboardTab;
}

export function getTeacherDashboardHref(tab: TeacherDashboardTabId) {
  return tab === defaultTeacherDashboardTab ? "/profesor" : `/profesor?tab=${tab}`;
}

export function buildReorderedIds(
  visibleIds: string[],
  draggedId: string,
  targetId: string,
) {
  if (draggedId === targetId) {
    return visibleIds;
  }

  const fromIndex = visibleIds.indexOf(draggedId);
  const toIndex = visibleIds.indexOf(targetId);

  if (fromIndex === -1 || toIndex === -1) {
    return visibleIds;
  }

  const nextOrder = [...visibleIds];
  nextOrder.splice(fromIndex, 1);
  nextOrder.splice(toIndex, 0, draggedId);

  return nextOrder;
}

export function getWorksheetStatusBadgeClassName(
  status: "draft" | "published" | "archived",
) {
  switch (status) {
    case "published":
      return "bg-emerald-100 text-emerald-800";
    case "archived":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-[var(--color-canvas-white)] text-[var(--color-graphite)]";
  }
}

export function getWorksheetStatusSurfaceClassName(
  status: "draft" | "published" | "archived",
) {
  switch (status) {
    case "published":
      return "border-emerald-200 bg-emerald-50/60";
    case "archived":
      return "border-slate-200 bg-slate-50";
    default:
      return "border-[var(--color-faded-gray)] bg-[var(--color-canvas-white)]";
  }
}

export function getTeacherWorksheetCoverImage(slug: string, coverImage?: string) {
  return (
    generatedWorksheetCoverImages[slug] ??
    coverImage ??
    "/worksheet-placeholder.svg"
  );
}

export function validateWorksheetThumbnailFile(file: { type: string; size: number }):
  | { ok: true }
  | { ok: false; error: string } {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "El fichero debe ser una imagen." };
  }

  if (file.size > 3_000_000) {
    return { ok: false, error: "La imagen no puede superar 3 MB." };
  }

  return { ok: true };
}

export const teacherDashboardLinks: TeacherDashboardLink[] = [
  {
    label: "Proyecto GitHub",
    href: "https://github.com/juanfranbrv/arduino",
    description: "Repositorio público con la carpeta PUBLICO y la app web.",
  },
  {
    label: "Proyecto Vercel",
    href: "https://vercel.com/juanfranbrvs-projects/arduino",
    description: "Panel de despliegues, dominios y variables del proyecto.",
  },
  {
    label: "Convex Dashboard",
    href: "https://dashboard.convex.dev/d/shocking-dogfish-273",
    description: "Backend compartido para autenticación, grupos y progreso.",
  },
  {
    label: "Web local",
    href: "http://localhost:3000",
    description: "Servidor local de desarrollo cuando esté arrancado.",
  },
];
