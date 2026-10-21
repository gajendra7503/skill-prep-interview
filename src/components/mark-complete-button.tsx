import { toggleLessonComplete } from "@/app/courses/[course]/[lesson]/actions";

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
  if (!signedIn) {
    return (
      <a
        href="/login"
        className="inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-900"
      >
        Sign in to track progress
      </a>
    );
  }

  return (
    <form action={toggleLessonComplete.bind(null, courseSlug, lessonSlug)}>
      <button
        type="submit"
        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
          completed
            ? "border border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            : "bg-brand-gradient btn-shine text-white shadow-sm hover:brightness-110"
        }`}
      >
        {completed ? "Completed - click to unmark" : "Mark as complete"}
      </button>
    </form>
  );
}
