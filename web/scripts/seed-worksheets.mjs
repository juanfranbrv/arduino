import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import matter from "gray-matter";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const seedSecret = process.env.SEED_SECRET;

if (!convexUrl || !seedSecret) {
  throw new Error("Define NEXT_PUBLIC_CONVEX_URL y SEED_SECRET antes de sembrar.");
}

const worksheetRoot = path.resolve(process.cwd(), "..", "contenido", "fichas");
const client = new ConvexHttpClient(convexUrl);
const upsertWorksheet = makeFunctionReference("worksheets:upsertFromSeed");

for (const fileName of fs.readdirSync(worksheetRoot)) {
  if (!fileName.endsWith(".mdx")) {
    continue;
  }

  const source = fs.readFileSync(path.join(worksheetRoot, fileName), "utf8");
  const parsed = matter(source);
  const activities = Array.from(
    parsed.content.matchAll(/<Activity\s+([\s\S]*?)\/>/g),
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
    level: parsed.data.level,
    duration: parsed.data.duration,
    status: parsed.data.status,
    prerequisites: parsed.data.prerequisites ?? [],
    activities,
  });

  console.log(`Seeded ${parsed.data.slug}`);
}
