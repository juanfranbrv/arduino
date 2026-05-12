import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Play, Phone } from "lucide-react";

import { AcademyContactForm } from "@/components/academy-contact-form";
import { getPublishedWorksheets } from "@/lib/worksheets";

export default function Home() {
  const worksheets = getPublishedWorksheets();
  const featuredWorksheets = worksheets.slice(0, 6);
  const year = new Date().getFullYear();

  return (
    <main className="flex flex-1 flex-col">
      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center">
          <div className="flex flex-col justify-center gap-5">
            <h1 className="max-w-3xl text-[40px] font-semibold leading-[1.25] text-[var(--color-midnight-ink)] text-balance sm:text-[56px] sm:leading-[1.12]">
              Robótica, electrónica y programación para aprender construyendo.
            </h1>
            <p className="max-w-2xl text-base leading-[1.62] text-[var(--color-graphite)] sm:text-lg">
              Este portal acompaña las clases: muestra unidades de trabajo,
              organiza actividades y permite validar el progreso en el curso.
              Arduino se trabaja como una puerta de entrada para crear
              mecanismos, artefactos y robots programables.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link className="btn-primary" href="/registro">
                Registrarse
              </Link>
              <Link className="btn-secondary" href="/login">
                Entrar
              </Link>
            </div>
          </div>
          <div className="hidden lg:flex lg:justify-end">
            <div className="surface-card relative aspect-square w-full max-w-[24rem] overflow-hidden">
              <Image
                src="/worksheet-placeholder.svg"
                alt="Vista previa temporal de unidad"
                fill
                className="object-cover"
                sizes="24rem"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-canvas-white)]">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-12 sm:px-8">
          <div className="grid gap-2">
            <p className="eyebrow">Unidades del curso</p>
            <h2 className="text-[32px] font-semibold leading-[1.28] text-[var(--color-midnight-ink)] text-balance">
              Unidades para trabajar en clase
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {featuredWorksheets.map((worksheet, index) => (
              <Link
                key={worksheet.slug}
                href={`/fichas/${worksheet.slug}`}
                className="surface-card group overflow-hidden"
              >
                <div className="relative aspect-[4/3] bg-[var(--color-canvas-white)]">
                  <Image
                    src={worksheet.coverImage ?? "/worksheet-placeholder.svg"}
                    alt={`Imagen de ${worksheet.title}`}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
                    priority={index < 2}
                  />
                </div>
                <div className="grid gap-3 p-6">
                  <p className="eyebrow">{worksheet.level}</p>
                  <h2 className="text-lg font-medium leading-[1.35] text-[var(--color-midnight-ink)] text-pretty">
                    {worksheet.title}
                  </h2>
                  <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
                    {worksheet.summary}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <Link className="btn-secondary" href="/fichas">
              Ver todas las unidades
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-5">
            <div className="grid gap-2">
              <p className="eyebrow">Qué es Arduino</p>
              <h2 className="text-[32px] font-semibold leading-[1.28] text-[var(--color-midnight-ink)] text-balance">
                Una base accesible para empezar en robótica
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-[1.62] text-[var(--color-graphite)] sm:text-lg">
              Arduino permite construir proyectos reales combinando placa,
              sensores, componentes, movimiento y código. En clase se aprende
              montando, probando y entendiendo cómo una idea se convierte en un
              artefacto programable.
            </p>
            <p className="max-w-2xl text-base leading-[1.62] text-[var(--color-graphite)] sm:text-lg">
              La electrónica importa, pero como herramienta para llegar a algo
              más tangible: automatismos, mecanismos interactivos y primeros
              robots capaces de reaccionar, iluminarse, moverse o responder al
              entorno.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link className="btn-secondary" href="/fichas">
                Ver ejemplos de unidades
              </Link>
              <a
                className="btn-secondary"
                href="https://bauset.es"
                target="_blank"
                rel="noreferrer"
              >
                Visita nuestra web
              </a>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <PromoVideoCard
              title="Vídeo: sensores y respuesta"
              description="Primeros proyectos donde la placa interpreta el entorno y activa una respuesta visible."
            />
            <PromoVideoCard
              title="Vídeo: mecanismos programables"
              description="Montajes guiados para pasar del circuito básico a artefactos y robots programables."
            />
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-canvas-white)]">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-5">
            <div className="grid gap-2">
              <p className="eyebrow">Más información</p>
              <h2 className="text-[32px] font-semibold leading-[1.28] text-[var(--color-midnight-ink)] text-balance">
                Solicita información
              </h2>
            </div>
            <p className="max-w-xl text-base leading-[1.62] text-[var(--color-graphite)] sm:text-lg">
              Si quieres saber cómo son las clases, qué edades participan o qué
              tipo de proyectos y robots se construyen, puedes enviar un mensaje
              desde aquí.
            </p>
            <div className="subtle-card grid gap-3 p-6">
              <p className="text-sm font-medium uppercase tracking-[0.04em] text-[var(--color-graphite)]">
                Academia Bauset
              </p>
              <p className="text-base leading-[1.62] text-[var(--color-midnight-ink)]">
                Robótica, programación e informática en un entorno presencial,
                guiado y orientado a proyectos.
              </p>
              <a
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-midnight-ink)]"
                href="tel:+34961493901"
              >
                <Phone className="size-4" />
                96 149 39 01
              </a>
            </div>
          </div>

          <AcademyContactForm />
        </div>
      </section>

      <footer className="border-t border-[var(--color-faded-gray)] bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-6 text-sm text-[var(--color-graphite)] sm:px-8 md:flex-row md:items-center md:justify-between">
          <p>© {year} Bauset. Portal Arduino para clases presenciales.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span>Creación del portal Arduino</span>
            <a
              className="inline-flex items-center gap-1 text-[var(--color-midnight-ink)]"
              href="https://bauset.es"
              target="_blank"
              rel="noreferrer"
            >
              bauset.es
              <ArrowUpRight className="size-4" />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function PromoVideoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="surface-card overflow-hidden">
      <div className="relative aspect-[4/3] bg-[var(--color-canvas-white)]">
        <Image
          src="/worksheet-placeholder.svg"
          alt={title}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 22vw, 100vw"
        />
        <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--color-midnight-ink)]">
          Vídeo
        </span>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-white text-[var(--color-midnight-ink)] shadow-[var(--shadow-md)]">
            <Play className="ml-1 size-6 fill-current" />
          </span>
        </span>
      </div>
      <div className="grid gap-2 p-6">
        <h3 className="text-lg font-medium leading-[1.35] text-[var(--color-midnight-ink)]">
          {title}
        </h3>
        <p className="text-sm leading-[1.56] text-[var(--color-graphite)]">
          {description}
        </p>
      </div>
    </article>
  );
}
