import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { ensureCurrentUser, getCurrentUser, requireTeacher } from "./users";

export const listForTeacher = query({
  args: {},
  handler: async (ctx) => {
    const teacher = await getCurrentUser(ctx);

    if (!teacher || (teacher.role !== "teacher" && teacher.role !== "admin")) {
      return [];
    }

    return await ctx.db
      .query("groups")
      .filter((q) => q.eq(q.field("createdBy"), teacher._id))
      .collect();
  },
});

export const createGroup = mutation({
  args: {
    name: v.string(),
    joinCode: v.string(),
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx);
    const joinCode = args.joinCode.trim().toUpperCase();
    const existing = await ctx.db
      .query("groups")
      .withIndex("by_join_code", (q) => q.eq("joinCode", joinCode))
      .unique();

    if (existing) {
      throw new Error("Ya existe un grupo con ese codigo.");
    }

    return await ctx.db.insert("groups", {
      name: args.name.trim(),
      joinCode,
      active: true,
      createdBy: teacher._id,
    });
  },
});

export const joinWithCode = mutation({
  args: {
    joinCode: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ensureCurrentUser(ctx, {
      displayName: args.displayName,
      role: "student",
    });
    const joinCode = args.joinCode.trim().toUpperCase();
    const group = await ctx.db
      .query("groups")
      .withIndex("by_join_code", (q) => q.eq("joinCode", joinCode))
      .unique();

    if (!group || !group.active) {
      throw new Error("Código de grupo no válido.");
    }

    const existingStudent = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existingStudent) {
      await ctx.db.patch(existingStudent._id, {
        groupId: group._id,
        displayName: args.displayName,
        active: true,
      });
      return existingStudent._id;
    }

    return await ctx.db.insert("students", {
      userId: user._id,
      groupId: group._id,
      displayName: args.displayName,
      active: true,
    });
  },
});
