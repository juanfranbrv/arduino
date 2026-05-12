"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button className="btn-secondary gap-2" type="button" onClick={() => window.print()}>
      <Printer className="size-4" />
      Imprimir / PDF
    </button>
  );
}
