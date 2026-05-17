import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireTeacher } from "./users";
import { getWorksheetGraphOrder, sortWorksheets } from "./worksheetOrder";

const legacyWorksheetSlugs: Record<string, string> = {
  "explorar-el-pack": "unidad-01-explorar-el-pack",
  "leds-paralelo-serie-resistencia": "unidad-02-leds-paralelo-serie-resistencia",
  "led-rgb": "unidad-03-led-rgb",
  "zumbador-pasivo": "unidad-06-zumbador-pasivo",
  tilt: "unidad-07-tilt",
  servo: "unidad-08-servo",
  "sensor-ultrasonico": "unidad-09-sensor-ultrasonico",
  "teclado-membrana": "unidad-10-teclado-membrana",
  dht11: "unidad-11-dht11",
  "joystick-analogico": "unidad-12-joystick-analogico",
  "receptor-ir": "unidad-13-receptor-ir",
  "matriz-led-max7219": "unidad-14-matriz-led-max7219",
  "acelerometro-giroscopio": "unidad-15-acelerometro-giroscopio",
  "pir-hc-sr501": "unidad-16-pir-hc-sr501",
  "sensor-nivel-agua": "unidad-17-sensor-nivel-agua",
  rtc: "unidad-18-rtc",
  "sensor-sonido": "unidad-19-sensor-sonido",
  "rfid-rc522": "unidad-20-rfid-rc522",
  "lcd-1602": "unidad-21-lcd-1602",
  termometro: "unidad-22-termometro",
  "74hc595-ocho-leds": "unidad-23-74hc595-ocho-leds",
  "monitor-serie": "unidad-24-monitor-serie",
  "fotocelula-ldr": "unidad-25-fotocelula-ldr",
  "display-7-segmentos": "unidad-26-display-7-segmentos",
  "display-7-segmentos-4-digitos": "unidad-27-display-7-segmentos-4-digitos",
  "motor-dc": "unidad-28-motor-dc",
  rele: "unidad-29-rele",
  "motor-paso-a-paso": "unidad-30-motor-paso-a-paso",
  "stepper-ir": "unidad-31-stepper-ir",
  "stepper-encoder": "unidad-32-stepper-encoder",
};

async function syncWorksheetGraph(
  ctx: MutationCtx,
  worksheets: Array<{
    _id: Id<"worksheets">;
    slug: string;
    status: "draft" | "published" | "archived";
    position?: number;
  }>,
  options: { preserveInputOrder?: boolean } = {},
) {
  const sorted = getWorksheetGraphOrder(worksheets, options);
  const previousPublishedSlugs: string[] = [];

  await Promise.all(
    sorted.map((worksheet, index) => {
      const prerequisites = [...previousPublishedSlugs];

      if (worksheet.status === "published") {
        previousPublishedSlugs.push(worksheet.slug);
      }

      return ctx.db.patch(worksheet._id, {
        position: index,
        prerequisites,
      });
    }),
  );
}

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const worksheets = await ctx.db
      .query("worksheets")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    return sortWorksheets(worksheets).map((worksheet, index) => ({
      ...worksheet,
      position: worksheet.position ?? index,
    }));
  },
});

export const listForTeacher = query({
  args: {},
  handler: async (ctx) => {
    await requireTeacher(ctx);

    const worksheets = await ctx.db.query("worksheets").collect();

    return sortWorksheets(
      worksheets.filter((worksheet) => worksheet.status !== "archived"),
    ).map((worksheet, index) => ({
      ...worksheet,
      position: worksheet.position ?? index,
    }));
  },
});

export const reorder = mutation({
  args: {
    orderedWorksheetIds: v.array(v.id("worksheets")),
  },
  handler: async (ctx, args) => {
    await requireTeacher(ctx);

    const worksheets = await ctx.db.query("worksheets").collect();
    const worksheetById = new Map(
      worksheets.map((worksheet) => [String(worksheet._id), worksheet]),
    );
    const ordered = args.orderedWorksheetIds
      .map((worksheetId) => worksheetById.get(String(worksheetId)))
      .filter(
        (worksheet): worksheet is NonNullable<typeof worksheet> => Boolean(worksheet),
      );
    const remaining = worksheets.filter(
      (worksheet) => !args.orderedWorksheetIds.some((id) => id === worksheet._id),
    );
    const reordered = [...ordered, ...sortWorksheets(remaining)];

    await syncWorksheetGraph(ctx, reordered, { preserveInputOrder: true });

    return reordered.map((worksheet) => worksheet._id);
  },
});

export const updateMetadata = mutation({
  args: {
    worksheetId: v.id("worksheets"),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    ),
    level: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireTeacher(ctx);

    const worksheet = await ctx.db.get(args.worksheetId);

    if (!worksheet) {
      throw new Error("Unidad no encontrada.");
    }

    const patch: Record<string, string> = {};

    if (args.status !== undefined) {
      patch.status = args.status;
    }

    if (args.level !== undefined) {
      patch.level = args.level;
    }

    if (args.title !== undefined) {
      const title = args.title.trim();

      if (!title) {
        throw new Error("El título no puede estar vacío.");
      }

      patch.title = title;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.worksheetId, patch);
    }

    const worksheets = await ctx.db.query("worksheets").collect();
    await syncWorksheetGraph(ctx, worksheets);

    return args.worksheetId;
  },
});

export const upsertFromSeed = mutation({
  args: {
    seedSecret: v.string(),
    slug: v.string(),
    title: v.string(),
    level: v.string(),
    coverImage: v.optional(v.string()),
    duration: v.string(),
    position: v.number(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    prerequisites: v.array(v.string()),
    activities: v.array(
      v.object({
        activityId: v.string(),
        title: v.string(),
        validation: v.string(),
        order: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const expectedSecret = process.env.SEED_SECRET;

    if (!expectedSecret || args.seedSecret !== expectedSecret) {
      throw new Error("Secreto de seed no valido.");
    }

    const existingBySlug = await ctx.db
      .query("worksheets")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    const legacySlug = legacyWorksheetSlugs[args.slug];
    const existingByLegacySlug =
      existingBySlug || !legacySlug
        ? null
        : await ctx.db
            .query("worksheets")
            .withIndex("by_slug", (q) => q.eq("slug", legacySlug))
            .unique();
    const existing = existingBySlug ?? existingByLegacySlug;
    const worksheetId = existing
      ? existing._id
      : await ctx.db.insert("worksheets", {
          slug: args.slug,
          title: args.title,
          coverImage: args.coverImage,
          coverImageStorageId: undefined,
          level: args.level,
          duration: args.duration,
          position: args.position,
          status: args.status,
          prerequisites: args.prerequisites,
          activityIds: args.activities.map((activity) => activity.activityId),
        });

    if (existing) {
      await ctx.db.patch(existing._id, {
        slug: args.slug,
        title: args.title,
        ...(args.coverImage ? { coverImage: args.coverImage } : {}),
        level: args.level,
        duration: args.duration,
        status: args.status,
        prerequisites: args.prerequisites,
        position: args.position,
        activityIds: args.activities.map((activity) => activity.activityId),
      });
    }

    const currentActivities = await ctx.db
      .query("worksheetActivities")
      .withIndex("by_worksheet", (q) => q.eq("worksheetId", worksheetId))
      .collect();

    for (const activity of currentActivities) {
      if (
        !args.activities.some(
          (nextActivity) => nextActivity.activityId === activity.activityId,
        )
      ) {
        await ctx.db.delete(activity._id);
      }
    }

    for (const activity of args.activities) {
      const existingActivity = currentActivities.find(
        (currentActivity) => currentActivity.activityId === activity.activityId,
      );

      if (existingActivity) {
        await ctx.db.patch(existingActivity._id, activity);
      } else {
        await ctx.db.insert("worksheetActivities", {
          worksheetId,
          ...activity,
        });
      }
    }

    await syncWorksheetGraph(ctx, await ctx.db.query("worksheets").collect());

    return worksheetId;
  },
});

export const archiveMissingFromSeed = mutation({
  args: {
    seedSecret: v.string(),
    slugs: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const expectedSecret = process.env.SEED_SECRET;

    if (!expectedSecret || args.seedSecret !== expectedSecret) {
      throw new Error("Secreto de seed no valido.");
    }

    const activeSlugs = new Set(args.slugs);
    const worksheets = await ctx.db.query("worksheets").collect();

    await Promise.all(
      worksheets
        .filter((worksheet) => !activeSlugs.has(worksheet.slug))
        .map((worksheet) =>
          ctx.db.patch(worksheet._id, {
            status: "archived" as const,
          }),
        ),
    );

    await syncWorksheetGraph(ctx, await ctx.db.query("worksheets").collect());

    return true;
  },
});

export const generateCoverImageUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireTeacher(ctx);

    return await ctx.storage.generateUploadUrl();
  },
});

export const updateCoverImage = mutation({
  args: {
    worksheetId: v.id("worksheets"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await requireTeacher(ctx);

    const worksheet = await ctx.db.get(args.worksheetId);

    if (!worksheet) {
      throw new Error("Unidad no encontrada.");
    }

    const url = await ctx.storage.getUrl(args.storageId);

    if (!url) {
      throw new Error("No se ha podido leer la imagen subida.");
    }

    await ctx.db.patch(args.worksheetId, {
      coverImage: url,
      coverImageStorageId: args.storageId,
    });

    return url;
  },
});
