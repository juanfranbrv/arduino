"use client";

import { type ReactNode, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

function extractText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractText).join("");
  }

  if (node && typeof node === "object" && "props" in node) {
    const props = node.props as { children?: ReactNode };
    return extractText(props.children);
  }

  return "";
}

export function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const code = useMemo(() => extractText(children).trimEnd(), [children]);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="code-block">
      <div className="code-block__header">
        <span>Codigo</span>
        <div className="flex items-center">
          <button
            type="button"
            className="code-block__copy"
            onClick={copyCode}
            aria-label="Copiar codigo"
            title="Copiar codigo"
          >
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          </button>
        </div>
      </div>
      <pre>{children}</pre>
    </div>
  );
}
