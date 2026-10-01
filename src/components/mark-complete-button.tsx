import { toggleLessonComplete } from "@/app/courses/[course]/[lesson]/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function MarkCompleteButton({
  courseSlug,
  lessonSlug,
  completed,
  signedIn,
}: {
  courseSlug: string;
  lessonSlug: string;
  completed: boolean;
  signedIn: boolean;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-sm text-zinc-500">
        Progress tracking isn&apos;t set up yet — see the README for Supabase setup.
      </p>
    );
  }

  if (!signedIn) {
    return (
      <a
        href="/login"
        className="inline-block rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        Sign in to track progress
      </a>
    );
  }

  return (
    <form action={toggleLessonComplete.bind(null, courseSlug, lessonSlug, completed)}>
      <button
        type="submit"
        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
          completed
            ? "border border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            : "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm hover:brightness-110"
        }`}
      >
        {completed ? "✓ Completed — click to unmark" : "Mark as complete"}
      </button>
    </form>
  );
}
