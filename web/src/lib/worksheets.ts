import fs from "node:fs";
import path from "node:path";

import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import matter from "gray-matter";
import { z } from "zod";

export { getWorksheetBaseTitle, getWorksheetDisplayTitle } from "./worksheet-display";

export type WorksheetStatus = "draft" | "published" | "archived";

export type WorksheetActivity = {
  id: string;
  title: string;
  validation: string;
  environment?: "simulador" | "placa";
};

export type Worksheet = {
  unitNumber?: number;
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
  unitNumber: z.number().int().positive().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  level: z.string().min(1),
  duration: z.string().min(1),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  prerequisites: z.array(z.string()).default([]),
  summary: z.string().default("Ficha práctica de Arduino para trabajar en clase."),
  coverImage: z.string().optional(),
  preview: z.array(z.string()).default([]),
  materials: z.array(z.string()).default([]),
});

const contentRoot = path.resolve(process.cwd(), "..", "contenido");
const worksheetRoot = path.join(contentRoot, "fichas");
const listPublishedWorksheetsRef = makeFunctionReference<
  "query",
  Record<string, never>,
  Array<{
    slug: string;
    title: string;
    level: string;
    status: WorksheetStatus;
    prerequisites: string[];
  }>
>("worksheets:listPublished");

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
  const worksheets = getAllWorksheets();
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
    .sort(compareWorksheetsDescending);
}

export function getPublishedWorksheet(slug: string): Worksheet | null {
  return getPublishedWorksheets().find((worksheet) => worksheet.slug === slug) ?? null;
}

export function getAllWorksheets(): Worksheet[] {
  return readWorksheets().sort(compareWorksheets);
}

export function getWorksheetBySlug(slug: string): Worksheet | null {
  return getAllWorksheets().find((worksheet) => worksheet.slug === slug) ?? null;
}

export async function getPublishedWorksheetsFromCatalog(): Promise<Worksheet[]> {
  const localWorksheets = getAllWorksheets();
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    return localWorksheets
      .filter((worksheet) => worksheet.status === "published")
      .sort(compareWorksheetsDescending);
  }

  try {
    const client = new ConvexHttpClient(convexUrl);
    const remoteWorksheets = await client.query(listPublishedWorksheetsRef, {});
    const localBySlug = new Map(localWorksheets.map((worksheet) => [worksheet.slug, worksheet]));

    return remoteWorksheets
      .map((worksheet) => {
        const local = localBySlug.get(worksheet.slug);

        if (!local) {
          return null;
        }

        return {
          ...local,
          title: worksheet.title,
          level: worksheet.level,
          status: worksheet.status,
          prerequisites: worksheet.prerequisites,
        };
      })
      .filter((worksheet): worksheet is Worksheet => Boolean(worksheet))
      .sort(compareWorksheetsDescending);
  } catch {
    return localWorksheets
      .filter((worksheet) => worksheet.status === "published")
      .sort(compareWorksheetsDescending);
  }
}

export async function getPublishedWorksheetFromCatalog(slug: string): Promise<Worksheet | null> {
  const worksheets = await getPublishedWorksheetsFromCatalog();

  return worksheets.find((worksheet) => worksheet.slug === slug) ?? null;
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

function compareWorksheets(a: Worksheet, b: Worksheet) {
  return (
    (a.unitNumber ?? Number.MAX_SAFE_INTEGER) -
      (b.unitNumber ?? Number.MAX_SAFE_INTEGER) ||
    a.slug.localeCompare(b.slug, "es")
  );
}

function compareWorksheetsDescending(a: Worksheet, b: Worksheet) {
  return (
    (b.unitNumber ?? Number.MIN_SAFE_INTEGER) -
      (a.unitNumber ?? Number.MIN_SAFE_INTEGER) ||
    a.slug.localeCompare(b.slug, "es")
  );
}

function extractActivities(body: string): WorksheetActivity[] {
  const activityTags = body.matchAll(/<Activity\s+([^>]*?)(?:\/>|>[\s\S]*?<\/Activity>)/g);

  return Array.from(activityTags).map((tag) => {
    const props = parseProps(tag[1]);

    const environment =
      props.environment === "simulador" || props.environment === "placa"
        ? props.environment
        : undefined;
    const activity: WorksheetActivity = {
      id: props.id ?? "",
      title: props.title ?? "",
      validation: props.validation ?? "",
    };

    if (environment) {
      activity.environment = environment;
    }

    return activity;
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
