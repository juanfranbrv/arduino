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

export const listStudentsForGroup = query({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const teacher = await getCurrentUser(ctx);

    if (!teacher || (teacher.role !== "teacher" && teacher.role !== "admin")) {
      return [];
    }

    const students = await ctx.db
      .query("students")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    return students.map((student) => ({
      _id: student._id,
      displayName: String(student.displayName ?? "Alumno sin nombre"),
      active: Boolean(student.active),
    }));
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
      throw new Error("Ya existe un grupo con ese código.");
    }

    return await ctx.db.insert("groups", {
      name: args.name.trim(),
      joinCode,
      active: true,
      createdBy: teacher._id,
    });
  },
});

export const renameGroup = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmedName = args.name.trim();

    if (!trimmedName) {
      throw new Error("Escribe un nombre de grupo.");
    }

    const teacher = await requireTeacher(ctx);
    const group = await ctx.db.get(args.groupId);

    if (!group) {
      throw new Error("Grupo no encontrado.");
    }

    if (String(group.createdBy) !== String(teacher._id)) {
      throw new Error("No puedes editar un grupo que no es tuyo.");
    }

    await ctx.db.patch(group._id, {
      name: trimmedName,
    });

    return group._id;
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

export const moveStudentToGroup = mutation({
  args: {
    studentId: v.id("students"),
    targetGroupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx);
    const student = await ctx.db.get(args.studentId);
    const targetGroup = await ctx.db.get(args.targetGroupId);

    if (!student) {
      throw new Error("Alumno no encontrado.");
    }

    if (!targetGroup) {
      throw new Error("Grupo de destino no encontrado.");
    }

    if (String(student.groupId) === String(targetGroup._id)) {
      throw new Error("El alumno ya pertenece a ese grupo.");
    }

    if (String(targetGroup.createdBy) !== String(teacher._id)) {
      throw new Error("No puedes mover alumnos a un grupo que no es tuyo.");
    }

    const currentGroup = await ctx.db.get(student.groupId);

    if (!currentGroup || String(currentGroup.createdBy) !== String(teacher._id)) {
      throw new Error("No puedes mover alumnos desde un grupo que no es tuyo.");
    }

    await ctx.db.patch(student._id, {
      groupId: targetGroup._id,
    });

    return student._id;
  },
});

export const renameStudent = mutation({
  args: {
    studentId: v.id("students"),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmedName = args.displayName.trim();

    if (!trimmedName) {
      throw new Error("Escribe un nombre de alumno.");
    }

    const teacher = await requireTeacher(ctx);
    const student = await ctx.db.get(args.studentId);

    if (!student) {
      throw new Error("Alumno no encontrado.");
    }

    const group = await ctx.db.get(student.groupId);

    if (!group || String(group.createdBy) !== String(teacher._id)) {
      throw new Error("No puedes editar alumnos de un grupo que no es tuyo.");
    }

    await ctx.db.patch(student._id, {
      displayName: trimmedName,
    });

    return student._id;
  },
});

export const removeStudent = mutation({
  args: {
    studentId: v.id("students"),
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx);
    const student = await ctx.db.get(args.studentId);

    if (!student) {
      throw new Error("Alumno no encontrado.");
    }

    const group = await ctx.db.get(student.groupId);

    if (!group || String(group.createdBy) !== String(teacher._id)) {
      throw new Error("No puedes borrar alumnos de un grupo que no es tuyo.");
    }

    const [evaluations, completions, quizAttempts] = await Promise.all([
      ctx.db
        .query("activityEvaluations")
        .withIndex("by_student_worksheet", (q) => q.eq("studentId", student._id))
        .collect(),
      ctx.db
        .query("activityCompletions")
        .withIndex("by_student_worksheet", (q) => q.eq("studentId", student._id))
        .collect(),
      ctx.db
        .query("quizAttempts")
        .withIndex("by_student", (q) => q.eq("studentId", student._id))
        .collect(),
    ]);

    await Promise.all([
      ...evaluations.map((evaluation) => ctx.db.delete(evaluation._id)),
      ...completions.map((completion) => ctx.db.delete(completion._id)),
      ...quizAttempts.map((attempt) => ctx.db.delete(attempt._id)),
    ]);

    await ctx.db.delete(student._id);

    return args.studentId;
  },
});

export const deleteGroup = mutation({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx);
    const group = await ctx.db.get(args.groupId);

    if (!group) {
      throw new Error("Grupo no encontrado.");
    }

    if (String(group.createdBy) !== String(teacher._id)) {
      throw new Error("No puedes borrar un grupo que no es tuyo.");
    }

    const students = await ctx.db
      .query("students")
      .withIndex("by_group", (q) => q.eq("groupId", group._id))
      .collect();

    if (students.length > 0) {
      throw new Error("Mueve o borra antes todos los alumnos de este grupo.");
    }

    await ctx.db.delete(group._id);

    return args.groupId;
  },
});
