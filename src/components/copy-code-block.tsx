"use client";

import { useRef, useState } from "react";

export function CopyCodeBlock({ children, ...props }: React.ComponentProps<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = preRef.current?.textContent ?? "";
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return; // clipboard API unavailable (e.g. insecure context) — fail silently
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="group relative mb-4">
      <pre
        ref={preRef}
        {...props}
        className="overflow-x-auto rounded-lg bg-zinc-900 p-4 pr-16 text-sm"
      >
        {children}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-1 text-xs font-medium text-zinc-300 opacity-60 transition hover:bg-zinc-700 hover:text-white hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
