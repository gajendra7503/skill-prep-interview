"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-brand-gradient btn-shine px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110"
    >
      Download / Print certificate
    </button>
  );
}
