"use client";

import { useMutation, useQuery } from "convex/react";
import { Copy, Plus } from "lucide-react";
import { useState } from "react";

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
  const groups = useQuery(
    convexApi.groups.listForTeacher,
    session?.user ? {} : "skip",
  );
  const createGroup = useMutation(convexApi.groups.createGroup);
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState(generateJoinCode);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!session?.user) {
      setMessage("Entra con tu cuenta antes de crear grupos.");
      return;
    }

    setPending(true);
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
      setPending(false);
    }
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setMessage(`Codigo ${code} copiado.`);
  }

  return (
    <section className="surface-card grid gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Grupos</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-midnight-ink)]">
            Codigos de acceso
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
          Codigo
          <input
            className="form-input uppercase"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
          />
        </label>
        <button
          type="button"
          className="btn-primary mt-auto"
          disabled={pending || !name || !joinCode}
          onClick={submit}
        >
          <Plus className="size-4" />
          {pending ? "Creando..." : "Crear"}
        </button>
      </div>

      <div className="grid gap-2">
        {sessionPending ? (
          <p className="text-sm text-[var(--color-graphite)]">Comprobando sesion...</p>
        ) : !session?.user ? (
          <p className="subtle-card p-4 text-sm text-[var(--color-graphite)]">
            Entra con tu cuenta de profesor para crear y ver grupos.
          </p>
        ) : groups === undefined ? (
          <p className="text-sm text-[var(--color-graphite)]">Cargando grupos...</p>
        ) : groups.length ? (
          groups.map((group) => (
            <div
              key={group._id}
              className="subtle-card flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="font-semibold text-[var(--color-midnight-ink)]">
                  {group.name}
                </p>
                <p className="text-sm text-[var(--color-graphite)]">
                  Codigo de grupo:{" "}
                  <span className="font-semibold text-[var(--color-midnight-ink)]">
                    {group.joinCode}
                  </span>
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => copyCode(group.joinCode)}
              >
                <Copy className="size-4" />
                Copiar
              </button>
            </div>
          ))
        ) : (
          <p className="subtle-card p-4 text-sm text-[var(--color-graphite)]">
            Todavia no hay grupos. Crea uno y comparte el codigo en clase.
          </p>
        )}
      </div>

      {message ? (
        <p className="text-sm text-[var(--color-graphite)]" aria-live="polite">
          {message}
        </p>
      ) : null}
    </section>
  );
}
