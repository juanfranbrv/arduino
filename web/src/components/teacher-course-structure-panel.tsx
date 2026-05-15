"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Check, GripVertical, ImagePlus, Pencil, Rocket, X } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { convexApi } from "@/lib/convex-api";
import {
  buildReorderedIds,
  getTeacherWorksheetCoverImage,
  getWorksheetStatusBadgeClassName,
  getWorksheetStatusSurfaceClassName,
  validateWorksheetThumbnailFile,
} from "@/lib/teacher-dashboard";
import { getWorksheetPublicationStatusLabel } from "@/lib/worksheet-status";

const levelOptions = ["iniciacion", "intermedio"] as const;
const statusOptions = ["draft", "published"] as const;

export function TeacherCourseStructurePanel() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const worksheets = useQuery(
    convexApi.worksheets.listForTeacher,
    session?.user ? {} : "skip",
  );
  const reorderWorksheets = useMutation(convexApi.worksheets.reorder);
  const updateWorksheetMetadata = useMutation(convexApi.worksheets.updateMetadata);
  const generateCoverImageUploadUrl = useMutation(
    convexApi.worksheets.generateCoverImageUploadUrl,
  );
  const updateWorksheetCoverImage = useMutation(convexApi.worksheets.updateCoverImage);
  const [localOrder, setLocalOrder] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [pendingWorksheetId, setPendingWorksheetId] = useState<string | null>(null);
  const [editingWorksheetId, setEditingWorksheetId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const orderedWorksheets = useMemo(() => {
    if (!worksheets) {
      return [];
    }

    const fallbackOrder = worksheets.map((worksheet) => worksheet._id);
    const effectiveOrder =
      localOrder.length === worksheets.length &&
      localOrder.every((worksheetId) =>
        worksheets.some((worksheet) => worksheet._id === worksheetId),
      )
        ? localOrder
        : fallbackOrder;

    const worksheetById = new Map(
      worksheets.map((worksheet) => [worksheet._id, worksheet]),
    );

    return effectiveOrder
      .map((worksheetId) => worksheetById.get(worksheetId))
      .filter(
        (worksheet): worksheet is NonNullable<typeof worksheet> => Boolean(worksheet),
      );
  }, [localOrder, worksheets]);

  if (sessionPending) {
    return (
      <section className="subtle-card p-5 text-[var(--color-graphite)]">
        Comprobando sesion...
      </section>
    );
  }

  if (!session?.user) {
    return (
      <section className="subtle-card p-5 text-[var(--color-graphite)]">
        Entra con tu cuenta de profesor para gestionar la estructura del curso.
      </section>
    );
  }

  if (worksheets === undefined) {
    return (
      <section className="subtle-card p-5 text-[var(--color-graphite)]">
        Cargando unidades...
      </section>
    );
  }

  if (!worksheets.length) {
    return (
      <section className="subtle-card p-5 text-[var(--color-graphite)]">
        No hay unidades sincronizadas todavia.
      </section>
    );
  }

  async function saveOrder(nextOrder: string[]) {
    setPendingWorksheetId(draggedId);
    setMessage(null);

    try {
      await reorderWorksheets({ orderedWorksheetIds: nextOrder });
      setMessage("Orden del curso actualizado.");
    } catch (error) {
      setLocalOrder([]);
      setMessage(
        error instanceof Error ? error.message : "No se ha podido guardar el nuevo orden.",
      );
    } finally {
      setPendingWorksheetId(null);
      setDraggedId(null);
      setDropTargetId(null);
    }
  }

  async function updateMetadata(
    worksheetId: string,
    changes: { status?: "draft" | "published"; level?: string; title?: string },
  ) {
    setPendingWorksheetId(worksheetId);
    setMessage(null);

    try {
      await updateWorksheetMetadata({ worksheetId, ...changes });
      setMessage("Unidad actualizada.");
      return true;
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se ha podido actualizar la unidad.",
      );
      return false;
    } finally {
      setPendingWorksheetId(null);
    }
  }

  function startEditingTitle(worksheetId: string, title: string) {
    setEditingWorksheetId(worksheetId);
    setDraftTitle(title);
    setMessage(null);
  }

  function cancelEditingTitle() {
    setEditingWorksheetId(null);
    setDraftTitle("");
  }

  async function saveEditingTitle(worksheetId: string) {
    const title = draftTitle.trim();

    if (!title) {
      setMessage("El titulo no puede estar vacio.");
      return;
    }

    const updated = await updateMetadata(worksheetId, { title });

    if (updated) {
      cancelEditingTitle();
    }
  }

  async function uploadCoverImage(worksheetId: string, file: File) {
    const validation = validateWorksheetThumbnailFile(file);

    if (!validation.ok) {
      setMessage(validation.error);
      return;
    }

    setPendingWorksheetId(worksheetId);
    setMessage(null);

    try {
      const uploadUrl = await generateCoverImageUploadUrl({});
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResult.ok) {
        throw new Error("No se ha podido subir la imagen.");
      }

      const { storageId } = (await uploadResult.json()) as { storageId: string };
      await updateWorksheetCoverImage({ worksheetId, storageId });
      setMessage("Miniatura actualizada.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se ha podido actualizar la miniatura.",
      );
    } finally {
      setPendingWorksheetId(null);
    }
  }

  return (
    <section className="grid gap-4">
      <section className="surface-card grid gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-faded-gray)] pb-4">
          <div className="grid gap-2">
            <p className="text-sm text-[var(--color-steel-gray)]">
              Arrastra las unidades para reordenar el curso. La home y el area
              de alumno solo muestran las publicadas.
            </p>
            <h3 className="text-2xl font-semibold text-[var(--color-midnight-ink)]">
              Estructura del curso
            </h3>
          </div>
          <span className="badge bg-white">{worksheets.length} unidades</span>
        </div>

        <div className="subtle-card grid gap-2 p-4 text-sm leading-[1.56] text-[var(--color-graphite)]">
          <p className="inline-flex items-center gap-2">
            <Rocket className="size-4" />
            Los requisitos se calculan automaticamente: una unidad publicada
            exige haber completado las unidades publicadas anteriores.
          </p>
        </div>

        <div className="grid gap-3">
          {orderedWorksheets.map((worksheet) => {
            const isDragging = draggedId === worksheet._id;
            const isDropTarget = dropTargetId === worksheet._id;
            const isPending = pendingWorksheetId === worksheet._id;
            const visibleOrder = orderedWorksheets.map((item) => item._id);
            const coverInputId = `cover-${worksheet._id}`;

            return (
              <article
                key={worksheet._id}
                draggable={!isPending}
                onDragStart={() => setDraggedId(worksheet._id)}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDropTargetId(null);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (draggedId && draggedId !== worksheet._id) {
                    setDropTargetId(worksheet._id);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();

                  if (!draggedId || draggedId === worksheet._id) {
                    return;
                  }

                  const nextOrder = buildReorderedIds(
                    visibleOrder,
                    draggedId,
                    worksheet._id,
                  );

                  if (nextOrder === visibleOrder) {
                    return;
                  }
                  setLocalOrder(nextOrder);
                  void saveOrder(nextOrder);
                }}
                className={`grid gap-4 rounded-[28px] border p-3 transition sm:p-4 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-stretch ${
                  isDragging
                    ? "cursor-grabbing border-[var(--color-midnight-ink)] opacity-70"
                    : isDropTarget
                      ? "border-[var(--color-midnight-ink)] bg-[var(--color-canvas-white)]"
                      : getWorksheetStatusSurfaceClassName(worksheet.status)
                }`}
              >
                <label
                  htmlFor={coverInputId}
                  className="group relative min-h-36 w-full cursor-pointer overflow-hidden rounded-[28px] border border-[var(--color-faded-gray)] bg-[var(--color-canvas-white)] lg:h-full lg:min-h-44"
                >
                    <span className="sr-only">Cambiar miniatura de {worksheet.title}</span>
                    <Image
                      src={getTeacherWorksheetCoverImage(
                        worksheet.slug,
                        worksheet.coverImage,
                      )}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="(min-width: 1024px) 224px, 100vw"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
                      <ImagePlus className="size-5" />
                    </span>
                    <input
                      id={coverInputId}
                      type="file"
                      accept="image/*"
                      disabled={isPending}
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";

                        if (file) {
                          void uploadCoverImage(worksheet._id, file);
                        }
                      }}
                    />
                </label>

                <div className="flex min-w-0 flex-col justify-between gap-5 py-1 lg:py-2">
                  <div className="grid gap-4">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        {editingWorksheetId === worksheet._id ? (
                          <form
                            className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center"
                            onSubmit={(event) => {
                              event.preventDefault();
                              void saveEditingTitle(worksheet._id);
                            }}
                          >
                            <input
                              value={draftTitle}
                              onChange={(event) => setDraftTitle(event.target.value)}
                              disabled={isPending}
                              className="form-input min-h-10 min-w-0 flex-1 px-3 py-2 text-lg font-semibold text-[var(--color-midnight-ink)]"
                              aria-label={`Editar titulo de ${worksheet.title}`}
                              autoFocus
                            />
                            <button
                              type="submit"
                              disabled={isPending}
                              className="grid size-10 shrink-0 place-items-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                              aria-label="Confirmar titulo"
                            >
                              <Check className="size-4" />
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={cancelEditingTitle}
                              className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--color-faded-gray)] bg-white text-[var(--color-graphite)] hover:border-[var(--color-midnight-ink)]"
                              aria-label="Cancelar edicion"
                            >
                              <X className="size-4" />
                            </button>
                          </form>
                        ) : (
                          <div className="flex min-w-0 items-start gap-2">
                            <Link
                              href={`/profesor/unidades/${worksheet.slug}`}
                              className="min-w-0 text-xl font-semibold leading-[1.35] text-[var(--color-midnight-ink)] hover:underline"
                            >
                              {worksheet.title}
                            </Link>
                            <button
                              type="button"
                              onClick={() =>
                                startEditingTitle(worksheet._id, worksheet.title)
                              }
                              className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl text-[var(--color-steel-gray)] hover:bg-[var(--color-canvas-white)] hover:text-[var(--color-midnight-ink)]"
                              aria-label={`Editar titulo de ${worksheet.title}`}
                            >
                              <Pencil className="size-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        aria-label={`Arrastrar ${worksheet.title}`}
                        className="grid size-11 shrink-0 cursor-grab place-items-center rounded-full bg-[var(--color-canvas-white)] text-[var(--color-steel-gray)] active:cursor-grabbing"
                      >
                        <GripVertical className="size-5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="badge bg-[var(--color-canvas-white)]">
                        {worksheet.activityIds.length} actividades
                      </span>
                      <span
                        className={`badge ${getWorksheetStatusBadgeClassName(
                          worksheet.status,
                        )}`}
                      >
                        {getWorksheetPublicationStatusLabel(worksheet.status)}
                      </span>
                    </div>
                  </div>

                  <div
                    data-testid={`worksheet-metadata-${worksheet._id}`}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <label className="form-label">
                      Estado
                      <select
                        className="form-input"
                        value={worksheet.status === "archived" ? "draft" : worksheet.status}
                        disabled={isPending}
                        onChange={(event) =>
                          void updateMetadata(worksheet._id, {
                            status: event.target.value as "draft" | "published",
                          })
                        }
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {getWorksheetPublicationStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="form-label">
                      Nivel
                      <select
                        className="form-input"
                        value={worksheet.level}
                        disabled={isPending}
                        onChange={(event) =>
                          void updateMetadata(worksheet._id, {
                            level: event.target.value,
                          })
                        }
                      >
                        {levelOptions.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {message ? (
          <p className="text-sm text-[var(--color-graphite)]" aria-live="polite">
            {message}
          </p>
        ) : null}
      </section>
    </section>
  );
}
