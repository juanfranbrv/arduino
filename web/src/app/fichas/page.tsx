import Image from "next/image";
import Link from "next/link";

import {
  getPublishedWorksheetsFromCatalog,
  getWorksheetDisplayTitle,
} from "@/lib/worksheets";

export default async function WorksheetsPage() {
  const worksheets = await getPublishedWorksheetsFromCatalog();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-12 sm:px-8">
      <header className="grid gap-2">
        <p className="eyebrow">
          Fichas publicadas
        </p>
        <h1 className="text-[40px] font-semibold leading-[1.25] text-[var(--color-midnight-ink)]">
          Materiales para clase
        </h1>
      </header>

      <section className="grid gap-5 md:grid-cols-2">
        {worksheets.map((worksheet) => (
          <Link
            key={worksheet.slug}
            href={`/fichas/${worksheet.slug}`}
            className="surface-card flex h-full flex-col overflow-hidden bg-white"
          >
            <div className="relative aspect-[16/9] bg-[var(--color-canvas-white)]">
              <Image
                src={worksheet.coverImage ?? "/worksheet-placeholder.svg"}
                alt={`Imagen de ${worksheet.title}`}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            </div>
            <div className="grid flex-1 content-start gap-4 bg-white p-7">
              <div className="flex flex-wrap gap-2">
                <span className="badge bg-white">{worksheet.level}</span>
                <span className="badge bg-white">{worksheet.duration}</span>
                <span className="badge bg-white">{worksheet.activities.length} actividades</span>
              </div>
              <h2 className="text-2xl font-medium leading-[1.35] text-[var(--color-midnight-ink)]">
                {getWorksheetDisplayTitle(worksheet)}
              </h2>
              <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
                {worksheet.summary}
              </p>
              <p className="text-sm text-[var(--color-graphite)]">
                Materiales: {worksheet.materials.join(", ")}
              </p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
