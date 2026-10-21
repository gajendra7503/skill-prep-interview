"use client";

import { useState, useTransition } from "react";
import { toggleQuestionBookmark } from "@/app/tests/[topic]/actions";

/** Toggles a saved bookmark on a test question, updating immediately and rolling back if the save fails. */
export function BookmarkButton({
  courseSlug,
  questionId,
  bookmarked,
  onChange,
}: {
  courseSlug: string;
  questionId: string;
  bookmarked: boolean;
  onChange: (questionId: string, bookmarked: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function toggle() {
    const next = !bookmarked;
    onChange(questionId, next);
    setFailed(false);
    startTransition(async () => {
      try {
        const saved = await toggleQuestionBookmark(courseSlug, questionId);
        if (saved !== next) onChange(questionId, saved);
      } catch {
        onChange(questionId, !next);
        setFailed(true);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={bookmarked}
      title={failed ? "Couldn't save — try again" : bookmarked ? "Remove bookmark" : "Bookmark to revise later"}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition disabled:opacity-60 ${
        bookmarked
          ? "border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300"
          : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
      }`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d="M6 3h12v18l-6-4.5L6 21z" />
      </svg>
      {failed ? "Retry" : bookmarked ? "Bookmarked" : "Bookmark"}
    </button>
  );
}
