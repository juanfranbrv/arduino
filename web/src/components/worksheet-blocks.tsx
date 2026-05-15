import type { ReactNode } from "react";
import { Lightbulb, Rocket, TriangleAlert } from "lucide-react";

export function KeyConcept({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside className="worksheet-callout worksheet-callout--concept">
      <div className="worksheet-callout__icon" aria-hidden="true">
        <Lightbulb />
      </div>
      <div className="grid gap-1">
        <p className="worksheet-callout__label">Concepto clave</p>
        {title ? <h3>{title}</h3> : null}
        <div>{children}</div>
      </div>
    </aside>
  );
}

export function WatchOut({ children }: { children: ReactNode }) {
  return (
    <aside className="worksheet-callout worksheet-callout--warning">
      <div className="worksheet-callout__icon" aria-hidden="true">
        <TriangleAlert />
      </div>
      <div className="grid gap-1">
        <p className="worksheet-callout__label">Ojo a esto</p>
        <div>{children}</div>
      </div>
    </aside>
  );
}

export function OptionalChallenge({ children }: { children: ReactNode }) {
  return (
    <aside className="worksheet-callout worksheet-callout--challenge">
      <div className="worksheet-callout__icon" aria-hidden="true">
        <Rocket />
      </div>
      <div className="grid gap-1">
        <p className="worksheet-callout__label">Reto opcional</p>
        <div>{children}</div>
      </div>
    </aside>
  );
}
