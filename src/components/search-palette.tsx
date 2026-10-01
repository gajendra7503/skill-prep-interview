"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SearchableLesson } from "@/lib/content/types";
import { rankLessons } from "@/lib/search";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function SearchPalette({ lessons }: { lessons: SearchableLesson[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = rankLessons(lessons, query).slice(0, 8);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((open) => !open);
      } else if (e.key === "Escape") {
        close();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  function close() {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(0);
  }

  function updateQuery(value: string) {
    setQuery(value);
    setActiveIndex(0);
  }

  function goTo(item: SearchableLesson) {
    router.push(`/courses/${item.courseSlug}/${item.slug}`);
    close();
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      goTo(results[activeIndex]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
      >
        <SearchIcon className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Search lessons…</span>
        <kbd className="hidden shrink-0 rounded border border-zinc-300 px-1.5 py-0.5 text-xs text-zinc-400 sm:inline dark:border-zinc-700">
          Ctrl K
        </kbd>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-24"
          onClick={close}
        >
          <div
            className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <SearchIcon className="h-4 w-4 shrink-0 text-zinc-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => updateQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search lessons across React, Angular, and Next.js…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              />
              <kbd className="shrink-0 rounded border border-zinc-300 px-1.5 py-0.5 text-xs text-zinc-400 dark:border-zinc-700">
                Esc
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {query.trim() === "" && (
                <p className="px-3 py-6 text-center text-sm text-zinc-500">
                  Type to search {lessons.length} lessons across all three courses.
                </p>
              )}
              {query.trim() !== "" && results.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-zinc-500">No lessons found.</p>
              )}
              {results.map((item, index) => (
                <Link
                  key={`${item.courseSlug}-${item.slug}`}
                  href={`/courses/${item.courseSlug}/${item.slug}`}
                  onClick={close}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`block rounded-lg px-3 py-2 transition ${
                    index === activeIndex
                      ? "bg-indigo-50 dark:bg-indigo-950/40"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      <span className="mr-1.5">{item.courseIcon}</span>
                      {item.title}
                    </p>
                    <span className="shrink-0 text-xs text-zinc-500">{item.courseTitle}</span>
                  </div>
                  <p className="truncate text-xs text-zinc-500">{item.description}</p>
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4 border-t border-zinc-200 px-4 py-2 text-xs text-zinc-400 dark:border-zinc-800">
              <span>↑↓ Navigate</span>
              <span>↵ Open</span>
              <span>Esc Close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
