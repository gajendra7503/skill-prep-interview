"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const DEBOUNCE_MS = 300;

/** Search box for the course list. Filters as you type by updating `?q=` (the server does the filtering). */
export function CourseSearch({ initialQuery, basePath = "/" }: { initialQuery: string; basePath?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function navigate(next: string) {
    const q = next.trim().slice(0, 80);
    startTransition(() => {
      router.replace(q ? `${basePath}?q=${encodeURIComponent(q)}` : basePath, { scroll: false });
    });
  }

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate(next), DEBOUNCE_MS);
  }

  function clear() {
    if (timer.current) clearTimeout(timer.current);
    setValue("");
    navigate("");
  }

  return (
    <form
      role="search"
      className="flex w-full items-center gap-2 sm:w-80"
      onSubmit={(e) => {
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        navigate(value);
      }}
    >
      <label htmlFor="course-search" className="sr-only">
        Search courses and lessons
      </label>
      <div className="relative flex-1">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          id="course-search"
          type="search"
          name="q"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={80}
          autoComplete="off"
          placeholder="Search courses and lessons…"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 [&::-webkit-search-cancel-button]:hidden"
        />
        {isPending && (
          <span
            aria-hidden="true"
            className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600"
          />
        )}
      </div>
      {value && (
        <button
          type="button"
          onClick={clear}
          className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          Clear
        </button>
      )}
      <span className="sr-only" aria-live="polite">
        {isPending ? "Searching…" : ""}
      </span>
    </form>
  );
}
