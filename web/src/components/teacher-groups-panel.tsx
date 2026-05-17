"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowRightLeft, Check, Copy, Pencil, Plus, Trash2, UsersRound, X } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { convexApi } from "@/lib/convex-api";

function generateJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
}

export function TeacherGroupsPanel() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const groupsArgs = useMemo(() => (session?.user ? {} : "skip"), [session?.user]);
  const basicGroups = useQuery(
    convexApi.groups.listForTeacher,
    groupsArgs,
  );
  const createGroup = useMutation(convexApi.groups.createGroup);
  const renameGroup = useMutation(convexApi.groups.renameGroup);
  const moveStudentToGroup = useMutation(convexApi.groups.moveStudentToGroup);
  const renameStudent = useMutation(convexApi.groups.renameStudent);
  const removeStudent = useMutation(convexApi.groups.removeStudent);
  const deleteGroup = useMutation(convexApi.groups.deleteGroup);
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState(generateJoinCode);
  const [originGroupId, setOriginGroupId] = useState<string>("");
  const [targetGroupId, setTargetGroupId] = useState<string>("");
  const groups = useMemo(() => basicGroups ?? [], [basicGroups]);
  const effectiveOriginGroupId = useMemo(() => {
    if (!groups.length) {
      return "";
    }

    if (originGroupId && groups.some((group) => group._id === originGroupId)) {
      return originGroupId;
    }

    return groups[0]._id;
  }, [groups, originGroupId]);
  const originStudents = useQuery(
    convexApi.groups.listStudentsForGroup,
    session?.user && effectiveOriginGroupId
      ? { groupId: effectiveOriginGroupId }
      : "skip",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pendingCreate, setPendingCreate] = useState(false);
  const [movingStudentId, setMovingStudentId] = useState<string | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentName, setEditingStudentName] = useState("");
  const effectiveTargetGroupId = useMemo(() => {
    if (!groups.length) {
      return "";
    }

    const availableTargets = groups.filter((group) => group._id !== effectiveOriginGroupId);

    if (
      targetGroupId &&
      availableTargets.some((group) => group._id === targetGroupId)
    ) {
      return targetGroupId;
    }

    return availableTargets[0]?._id ?? "";
  }, [effectiveOriginGroupId, groups, targetGroupId]);

  const originGroup = useMemo(
    () => groups.find((group) => group._id === effectiveOriginGroupId) ?? null,
    [effectiveOriginGroupId, groups],
  );
  const targetGroup = useMemo(
    () => groups.find((group) => group._id === effectiveTargetGroupId) ?? null,
    [effectiveTargetGroupId, groups],
  );

  async function submit() {
    if (!session?.user) {
      setMessage("Entra con tu cuenta antes de crear grupos.");
      return;
    }

    setPendingCreate(true);
    setMessage(null);

    try {
      await createGroup({ name, joinCode });
      setName("");
      setJoinCode(generateJoinCode());
      setMessage("Grupo creado.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se ha podido crear el grupo.",
      );
    } finally {
      setPendingCreate(false);
    }
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setMessage(`Código ${code} copiado.`);
  }

  async function moveStudent(studentId: string, displayName: string) {
    if (!targetGroup) {
      setMessage("Selecciona primero un grupo de destino.");
      return;
    }

    setMovingStudentId(studentId);
    setMessage(null);

    try {
      await moveStudentToGroup({
        studentId,
        targetGroupId: targetGroup._id,
      });
      setMessage(`${displayName} movido a ${targetGroup.name}.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se ha podido mover al alumno.",
      );
    } finally {
      setMovingStudentId(null);
    }
  }

  async function deleteSingleGroup(groupId: string, groupName: string) {
    setDeletingGroupId(groupId);
    setMessage(null);

    try {
      await deleteGroup({ groupId });
      setMessage(`${groupName} borrado.`);
      if (originGroupId === groupId) {
        setOriginGroupId("");
      }
      if (targetGroupId === groupId) {
        setTargetGroupId("");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se ha podido borrar el grupo.",
      );
    } finally {
      setDeletingGroupId(null);
    }
  }

  async function removeSingleStudent(studentId: string, displayName: string) {
    setRemovingStudentId(studentId);
    setMessage(null);

    try {
      await removeStudent({ studentId });
      setMessage(`${displayName} borrado.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se ha podido borrar al alumno.",
      );
    } finally {
      setRemovingStudentId(null);
    }
  }

  async function submitGroupRename(groupId: string) {
    setMessage(null);

    try {
      await renameGroup({ groupId, name: editingGroupName });
      setMessage("Grupo actualizado.");
      setEditingGroupId(null);
      setEditingGroupName("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se ha podido actualizar el grupo.",
      );
    }
  }

  async function submitStudentRename(studentId: string) {
    setMessage(null);

    try {
      await renameStudent({ studentId, displayName: editingStudentName });
      setMessage("Alumno actualizado.");
      setEditingStudentId(null);
      setEditingStudentName("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se ha podido actualizar el alumno.",
      );
    }
  }

  return (
    <section className="grid gap-5">
      <section className="surface-card grid gap-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Grupos</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--color-midnight-ink)]">
              Crear y repartir alumnos
            </h2>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_11rem_auto]">
          <label className="form-label">
            Nombre del grupo
            <input
              className="form-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Arduino 1"
            />
          </label>
          <label className="form-label">
            Código
            <input
              className="form-input uppercase"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            />
          </label>
          <button
            type="button"
            className="btn-primary mt-auto"
            disabled={pendingCreate || !name || !joinCode}
            onClick={submit}
          >
            <Plus className="size-4" />
            {pendingCreate ? "Creando..." : "Crear"}
          </button>
        </div>

        <div className="grid gap-2">
          {sessionPending ? (
            <p className="text-sm text-[var(--color-graphite)]">Comprobando sesión...</p>
          ) : !session?.user ? (
            <p className="subtle-card p-4 text-sm text-[var(--color-graphite)]">
              Entra con tu cuenta de profesor para crear y ver grupos.
            </p>
          ) : basicGroups === undefined ? (
            <p className="text-sm text-[var(--color-graphite)]">Cargando grupos...</p>
          ) : groups.length ? (
            groups.map((group) => (
              <div
                key={group._id}
                className="subtle-card flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  {editingGroupId === group._id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        className="form-input min-w-48"
                        value={editingGroupName}
                        onChange={(event) => setEditingGroupName(event.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => submitGroupRename(group._id)}
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setEditingGroupId(null);
                          setEditingGroupName("");
                        }}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="font-semibold text-[var(--color-midnight-ink)]">{group.name}</p>
                  )}
                  <p className="text-sm text-[var(--color-graphite)]">
                    Código de grupo:{" "}
                    <span className="font-semibold text-[var(--color-midnight-ink)]">
                      {group.joinCode}
                    </span>
                  </p>
                  <p className="text-sm text-[var(--color-steel-gray)]">
                    {group._id === effectiveOriginGroupId ? originStudents?.length ?? 0 : 0} alumno
                    {(group._id === effectiveOriginGroupId ? originStudents?.length ?? 0 : 0) === 1
                      ? ""
                      : "s"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => copyCode(group.joinCode)}
                  >
                    <Copy className="size-4" />
                    Copiar
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setEditingGroupId(group._id);
                      setEditingGroupName(group.name);
                    }}
                  >
                    <Pencil className="size-4" />
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={deletingGroupId === group._id}
                    onClick={() => deleteSingleGroup(group._id, group.name)}
                  >
                    <Trash2 className="size-4" />
                    {deletingGroupId === group._id ? "Borrando..." : "Borrar"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="subtle-card p-4 text-sm text-[var(--color-graphite)]">
              Todavía no hay grupos. Crea uno y comparte el código en clase.
            </p>
          )}
        </div>
      </section>

      <section className="surface-card grid gap-5 p-5 sm:p-6">
        <div>
          <p className="eyebrow">Mover alumnos</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-midnight-ink)]">
            Cambiar de grupo
          </h2>
        </div>

        {sessionPending ? (
          <p className="text-sm text-[var(--color-graphite)]">Comprobando sesión...</p>
        ) : !session?.user ? (
          <p className="subtle-card p-4 text-sm text-[var(--color-graphite)]">
            Entra con tu cuenta de profesor para organizar alumnos.
          </p>
        ) : originStudents === undefined ? (
          <p className="subtle-card p-4 text-sm text-[var(--color-graphite)]">
            Cargando alumnos de los grupos...
          </p>
        ) : groups.length < 2 ? (
          <p className="subtle-card p-4 text-sm text-[var(--color-graphite)]">
            Necesitas al menos dos grupos para mover alumnos entre ellos.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <label className="form-label">
                Grupo origen
                <select
                  className="form-input"
                  value={effectiveOriginGroupId}
                  onChange={(event) => {
                    const nextOrigin = event.target.value;
                    setOriginGroupId(nextOrigin);
                    if (nextOrigin === effectiveTargetGroupId) {
                      setTargetGroupId(
                        groups.find((group) => group._id !== nextOrigin)?._id ?? "",
                      );
                    }
                  }}
                >
                  {groups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid h-11 place-items-center text-[var(--color-steel-gray)]">
                <ArrowRightLeft className="size-5" />
              </div>

              <label className="form-label">
                Grupo destino
                <select
                  className="form-input"
                  value={effectiveTargetGroupId}
                  onChange={(event) => setTargetGroupId(event.target.value)}
                >
                  {groups
                    .filter((group) => group._id !== effectiveOriginGroupId)
                    .map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--color-midnight-ink)]">
                    {originGroup?.name ?? "Grupo origen"}
                  </p>
                  <p className="text-sm text-[var(--color-graphite)]">
                    {originStudents?.length ?? 0} alumno
                    {(originStudents?.length ?? 0) === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="badge bg-white">
                  Destino: {targetGroup?.name ?? "Sin seleccionar"}
                </span>
              </div>

              {originStudents?.length ? (
                originStudents.map((student) => (
                  <div
                    key={student._id}
                    className="subtle-card flex items-center justify-between gap-3 p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[var(--color-steel-gray)]">
                        <UsersRound className="size-5" />
                      </span>
                      <div className="min-w-0">
                        {editingStudentId === student._id ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              className="form-input min-w-48"
                              value={editingStudentName}
                              onChange={(event) => setEditingStudentName(event.target.value)}
                            />
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => submitStudentRename(student._id)}
                            >
                              <Check className="size-4" />
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => {
                                setEditingStudentId(null);
                                setEditingStudentName("");
                              }}
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                        ) : (
                          <p className="truncate font-semibold text-[var(--color-midnight-ink)]">
                            {student.displayName}
                          </p>
                        )}
                        <p className="text-sm text-[var(--color-graphite)]">
                          {student.active ? "Activo" : "Inactivo"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setEditingStudentId(student._id);
                          setEditingStudentName(student.displayName);
                        }}
                      >
                        <Pencil className="size-4" />
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={!targetGroup || movingStudentId === student._id}
                        onClick={() => moveStudent(student._id, student.displayName)}
                      >
                        <ArrowRightLeft className="size-4" />
                        {movingStudentId === student._id ? "Moviendo..." : "Mover"}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={removingStudentId === student._id}
                        onClick={() => removeSingleStudent(student._id, student.displayName)}
                      >
                        <Trash2 className="size-4" />
                        {removingStudentId === student._id ? "Borrando..." : "Borrar"}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="subtle-card p-4 text-sm text-[var(--color-graphite)]">
                  Este grupo no tiene alumnos.
                </p>
              )}
            </div>
          </>
        )}

        {message ? (
          <p className="text-sm text-[var(--color-graphite)]" aria-live="polite">
            {message}
          </p>
        ) : null}
      </section>
    </section>
  );
}
