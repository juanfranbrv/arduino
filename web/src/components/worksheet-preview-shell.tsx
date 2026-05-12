import Link from "next/link";
import Image from "next/image";
import { LockKeyhole } from "lucide-react";

import { getWorksheetPrerequisites } from "@/lib/worksheets";
import type { Worksheet } from "@/lib/worksheets";

export function WorksheetPreviewShell({ worksheet }: { worksheet: Worksheet }) {
  const prerequisites = getWorksheetPrerequisites(worksheet);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8">
      <div className="mb-4">
        <Link href="/fichas" className="text-sm font-medium text-[var(--color-deep-gray)]">
          Volver a unidades
        </Link>
      </div>

      <article className="grid gap-7 rounded-[36px] bg-white p-5 shadow-[var(--shadow-subtle-2)] sm:p-8">
        <header className="grid gap-7 border-b border-[var(--color-faded-gray)] pb-7 lg:grid-cols-[1fr_22rem]">
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <span className="badge">{worksheet.level}</span>
              <span className="badge">{worksheet.duration}</span>
              <span className="badge">Trabajo guiado</span>
            </div>
            <h1 className="text-[40px] font-semibold leading-[1.25] text-[var(--color-midnight-ink)] text-balance">
              {worksheet.title}
            </h1>
            <p className="max-w-2xl text-lg leading-[1.62] text-[var(--color-graphite)]">
              {worksheet.summary}
            </p>
            <p className="max-w-2xl leading-[1.62] text-[var(--color-graphite)]">
              Una unidad pensada para clase presencial: el alumno consulta la
              explicación, realiza el montaje y el profesor valida el avance en
              el aula.
            </p>
          </div>
          <div className="relative min-h-64 overflow-hidden rounded-[48px] bg-[var(--color-canvas-white)]">
            <Image
              src={worksheet.coverImage ?? "/worksheet-placeholder.svg"}
              alt={`Vista previa de ${worksheet.title}`}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 22rem, 100vw"
              priority
            />
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="eyebrow mb-3">Materiales</p>
            <ul className="flex flex-wrap gap-2 text-sm">
              {worksheet.materials.map((material) => (
                <li key={material} className="badge bg-white">
                  {material}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-3">
            <p className="eyebrow">Qué se trabaja</p>
            <ul className="grid gap-2 text-sm leading-[1.56] text-[var(--color-graphite)]">
              {(worksheet.preview.length > 0
                ? worksheet.preview
                : ["Práctica guiada con Arduino", "Validación presencial en clase"]
              ).map((item) => (
                <li key={item} className="subtle-card p-4">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="subtle-card grid gap-3 p-6">
          <h2 className="font-semibold text-[var(--color-midnight-ink)]">Requisitos</h2>
          {prerequisites.length > 0 ? (
            <ul className="grid gap-2 text-sm text-[var(--color-graphite)]">
              {prerequisites.map((item) => (
                <li key={item.slug}>
                  Antes de esta unidad:{" "}
                  <Link
                    className="font-semibold text-[var(--color-deep-gray)]"
                    href={`/fichas/${item.slug}`}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
              Esta unidad puede empezar sin completar otras unidades previas.
            </p>
          )}
        </section>

        <aside className="subtle-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <LockKeyhole
              className="mt-1 size-5 shrink-0 text-[var(--color-steel-gray)]"
              aria-hidden="true"
            />
            <div>
              <h2 className="font-semibold text-[var(--color-midnight-ink)]">
                Continuar con la unidad
              </h2>
              <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
                Entra para abrir el contenido paso a paso, la versión imprimible
                y el seguimiento de progreso.
              </p>
            </div>
          </div>
          <Link className="btn-primary shrink-0" href="/login">
            Entrar
          </Link>
        </aside>
      </article>
    </main>
  );
}
