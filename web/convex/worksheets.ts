import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const worksheets = await ctx.db
      .query("worksheets")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    return worksheets.sort((a, b) => a.slug.localeCompare(b.slug, "es"));
  },
});

export const upsertFromSeed = mutation({
  args: {
    seedSecret: v.string(),
    slug: v.string(),
    title: v.string(),
    level: v.string(),
    duration: v.string(),
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

    const existing = await ctx.db
      .query("worksheets")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    const worksheetId = existing
      ? existing._id
      : await ctx.db.insert("worksheets", {
          slug: args.slug,
          title: args.title,
          level: args.level,
          duration: args.duration,
          status: args.status,
          prerequisites: args.prerequisites,
          activityIds: args.activities.map((activity) => activity.activityId),
        });

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        level: args.level,
        duration: args.duration,
        status: args.status,
        prerequisites: args.prerequisites,
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

    return worksheetId;
  },
});
