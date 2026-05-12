import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

type Ctx = QueryCtx | MutationCtx;

export const setupTeacher = mutation({
  args: {
    setupSecret: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const expectedSecret = process.env.SETUP_TEACHER_SECRET;

    if (!expectedSecret || args.setupSecret !== expectedSecret) {
      throw new Error("Secreto de setup no valido.");
    }

    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Usuario no autenticado.");
    }

    const user = await ensureCurrentUser(ctx, {
      displayName: args.displayName,
      role: "admin",
    });

    if (user.role !== "admin") {
      await ctx.db.patch(user._id, { role: "admin" });
    }

    const existingTeacher = await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!existingTeacher) {
      await ctx.db.insert("teachers", {
        userId: user._id,
        displayName: args.displayName,
      });
    }

    return user._id;
  },
});

export const current = mutation({
  args: {
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ensureCurrentUser(ctx, {
      displayName: args.displayName,
      role: "student",
    });
  },
});

export const navStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return {
        isAuthenticated: false,
        role: null,
        hasStudentProfile: false,
        hasTeacherProfile: false,
      };
    }

    const [student, teacher] = await Promise.all([
      ctx.db
        .query("students")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique(),
      ctx.db
        .query("teachers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique(),
    ]);

    return {
      isAuthenticated: true,
      role: user.role,
      hasStudentProfile: Boolean(student),
      hasTeacherProfile:
        user.role === "teacher" || user.role === "admin" || Boolean(teacher),
    };
  },
});

export async function getCurrentUserOrThrow(ctx: Ctx) {
  const user = await getCurrentUser(ctx);

  if (!user) {
    throw new Error("Usuario sin perfil local.");
  }

  return user;
}

export async function getCurrentUser(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_auth_subject", (q) => q.eq("authSubject", identity.subject))
    .unique();

  return user ?? null;
}

export async function ensureCurrentUser(
  ctx: MutationCtx,
  args: { displayName: string; role: "student" | "teacher" | "admin" },
) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Usuario no autenticado.");
  }

  const existing = await ctx.db
    .query("users")
    .withIndex("by_auth_subject", (q) => q.eq("authSubject", identity.subject))
    .unique();

  if (existing) {
    return existing;
  }

  const userId = await ctx.db.insert("users", {
    authSubject: identity.subject,
    email: identity.email,
    name: args.displayName || identity.name || identity.email || "Usuario",
    role: args.role,
  });

  const user = await ctx.db.get(userId);

  if (!user) {
    throw new Error("No se ha podido crear el perfil local.");
  }

  return user;
}

export async function requireTeacher(ctx: Ctx) {
  const user = await getCurrentUserOrThrow(ctx);

  if (user.role !== "teacher" && user.role !== "admin") {
    throw new Error("Acceso reservado al profesor.");
  }

  return user;
}
