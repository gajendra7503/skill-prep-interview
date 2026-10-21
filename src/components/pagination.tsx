import Link from "next/link";

const base =
  "flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors";
const idle =
  "border-slate-200 bg-white text-slate-700 hover:border-brand-400 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-brand-400";
const active = "border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500";
const disabled = "cursor-not-allowed border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-700";

export function Pagination({
  page,
  totalPages,
  basePath,
  anchor,
  query,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  anchor?: string;
  /** Extra query parameters to keep on every page link (e.g. an active search). */
  query?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const href = (n: number) => {
    const params = new URLSearchParams(query);
    if (n > 1) params.set("page", String(n));
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}${anchor ? `#${anchor}` : ""}`;
  };
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className={`${base} ${idle}`} rel="prev">
          ← Previous
        </Link>
      ) : (
        <span className={`${base} ${disabled}`} aria-disabled="true">
          ← Previous
        </span>
      )}

      {pages.map((n) =>
        n === page ? (
          <span key={n} className={`${base} ${active}`} aria-current="page">
            {n}
          </span>
        ) : (
          <Link key={n} href={href(n)} className={`${base} ${idle}`} aria-label={`Page ${n}`}>
            {n}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link href={href(page + 1)} className={`${base} ${idle}`} rel="next">
          Next →
        </Link>
      ) : (
        <span className={`${base} ${disabled}`} aria-disabled="true">
          Next →
        </span>
      )}
    </nav>
  );
}
