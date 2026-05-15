import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import matter from "gray-matter";

loadEnvFile(path.resolve(process.cwd(), ".env.local"));

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const seedSecret = process.env.SEED_SECRET;

if (!convexUrl || !seedSecret) {
  throw new Error("Define NEXT_PUBLIC_CONVEX_URL y SEED_SECRET antes de sembrar.");
}

const worksheetRoot = path.resolve(process.cwd(), "..", "contenido", "fichas");
const client = new ConvexHttpClient(convexUrl);
const upsertWorksheet = makeFunctionReference("worksheets:upsertFromSeed");
const archiveMissingWorksheets = makeFunctionReference("worksheets:archiveMissingFromSeed");

const worksheets = fs
  .readdirSync(worksheetRoot)
  .filter((fileName) => fileName.endsWith(".mdx"))
  .map((fileName) => {
    const source = fs.readFileSync(path.join(worksheetRoot, fileName), "utf8");
    const parsed = matter(source);

    return { fileName, parsed };
  })
  .sort(
    (a, b) =>
      (a.parsed.data.unitNumber ?? Number.MAX_SAFE_INTEGER) -
        (b.parsed.data.unitNumber ?? Number.MAX_SAFE_INTEGER) ||
      a.parsed.data.slug.localeCompare(b.parsed.data.slug, "es"),
  );

for (const [index, { parsed }] of worksheets.entries()) {
  const activities = Array.from(
    parsed.content.matchAll(/<Activity\s+([^>]*?)(?:\/>|>[\s\S]*?<\/Activity>)/g),
  ).map((tag, index) => {
    const props = Object.fromEntries(
      Array.from(tag[1].matchAll(/(\w+)="([^"]*)"/g)).map((match) => [
        match[1],
        match[2],
      ]),
    );

    return {
      activityId: props.id,
      title: props.title,
      validation: props.validation,
      order: index,
    };
  });

  await client.mutation(upsertWorksheet, {
    seedSecret,
    slug: parsed.data.slug,
    title: parsed.data.title,
    coverImage: parsed.data.coverImage,
    level: parsed.data.level,
    duration: parsed.data.duration,
    position: index,
    status: parsed.data.status,
    prerequisites: parsed.data.prerequisites ?? [],
    activities,
  });

  console.log(`Seeded ${parsed.data.slug}`);
}

await client.mutation(archiveMissingWorksheets, {
  seedSecret,
  slugs: worksheets.map(({ parsed }) => parsed.data.slug),
});

console.log("Archived worksheets missing from local content.");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
