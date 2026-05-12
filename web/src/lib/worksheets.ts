import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { z } from "zod";

export type WorksheetStatus = "draft" | "published" | "archived";

export type WorksheetActivity = {
  id: string;
  title: string;
  validation: string;
};

export type Worksheet = {
  slug: string;
  title: string;
  level: string;
  duration: string;
  status: WorksheetStatus;
  prerequisites: string[];
  summary: string;
  coverImage?: string;
  preview: string[];
  materials: string[];
  sourcePath: string;
  body: string;
  activities: WorksheetActivity[];
};

export type WorksheetProgress = {
  completed: number;
  total: number;
  percent: number;
};

const worksheetFrontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  level: z.string().min(1),
  duration: z.string().min(1),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  prerequisites: z.array(z.string()).default([]),
  summary: z.string().default("Ficha practica de Arduino para trabajar en clase."),
  coverImage: z.string().optional(),
  preview: z.array(z.string()).default([]),
  materials: z.array(z.string()).default([]),
});

const contentRoot = path.resolve(process.cwd(), "..", "contenido");
const worksheetRoot = path.join(contentRoot, "fichas");

export function parseWorksheetSource(source: string, sourcePath: string): Worksheet {
  const parsed = matter(source);
  const frontmatter = worksheetFrontmatterSchema.parse(parsed.data);

  return {
    ...frontmatter,
    sourcePath,
    body: parsed.content,
    activities: extractActivities(parsed.content),
  };
}

export function getWorksheetPrerequisites(worksheet: Worksheet): Worksheet[] {
  const worksheets = getPublishedWorksheets();
  const bySlug = new Map(worksheets.map((item) => [item.slug, item]));

  return worksheet.prerequisites
    .map((slug) => bySlug.get(slug))
    .filter((item): item is Worksheet => Boolean(item));
}

export function isWorksheetUnlocked(
  worksheet: Worksheet,
  completedWorksheetSlugs: string[],
) {
  const completed = new Set(completedWorksheetSlugs);

  return worksheet.prerequisites.every((slug) => completed.has(slug));
}

export function getPublishedWorksheets(): Worksheet[] {
  return readWorksheets()
    .filter((worksheet) => worksheet.status === "published")
    .sort((a, b) => a.slug.localeCompare(b.slug, "es"));
}

export function getPublishedWorksheet(slug: string): Worksheet | null {
  return getPublishedWorksheets().find((worksheet) => worksheet.slug === slug) ?? null;
}

export function calculateWorksheetProgress(
  activityIds: string[],
  completedActivityIds: string[],
): WorksheetProgress {
  const validIds = new Set(activityIds);
  const completed = new Set(
    completedActivityIds.filter((activityId) => validIds.has(activityId)),
  ).size;
  const total = activityIds.length;

  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

function readWorksheets(): Worksheet[] {
  if (!fs.existsSync(worksheetRoot)) {
    return [];
  }

  return fs
    .readdirSync(worksheetRoot)
    .filter((fileName) => fileName.endsWith(".mdx"))
    .map((fileName) => {
      const filePath = path.join(worksheetRoot, fileName);
      return parseWorksheetSource(fs.readFileSync(filePath, "utf8"), filePath);
    });
}

function extractActivities(body: string): WorksheetActivity[] {
  const activityTags = body.matchAll(/<Activity\s+([\s\S]*?)\/>/g);

  return Array.from(activityTags).map((tag) => {
    const props = parseProps(tag[1]);

    return {
      id: props.id ?? "",
      title: props.title ?? "",
      validation: props.validation ?? "",
    };
  });
}

function parseProps(input: string): Record<string, string> {
  const props: Record<string, string> = {};
  const propMatches = input.matchAll(/(\w+)="([^"]*)"/g);

  for (const match of propMatches) {
    props[match[1]] = match[2];
  }

  return props;
}
