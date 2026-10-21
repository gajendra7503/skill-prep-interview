import Link from "next/link";
import type { LearningPath } from "@/lib/content/paths";
import { pathProgress } from "@/lib/content/paths";
import { CourseIcon } from "@/components/course-icon";

const STEP_STYLES = {
  done: "border-emerald-500 bg-emerald-500 text-white",
  "in-progress": "border-brand-600 bg-white text-brand-700 dark:bg-slate-900 dark:text-brand-400",
  "not-started": "border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-900",
} as const;

/** A learning path: ordered course steps with per-step status and overall progress. */
export function PathCard({
  path,
  completed,
  showProgress,
}: {
  path: LearningPath;
  completed: Record<string, number>;
  showProgress: boolean;
}) {
  const progress = pathProgress(path, completed);
  const finished = progress.pct === 100;

  return (
    <article className="card-lift group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700">
      <span aria-hidden="true" className="bg-brand-gradient absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
      <div className="flex-1 p-6">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{path.title}</h3>
          {showProgress && finished && (
            <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
              Complete
            </span>
          )}
        </div>
        <p className="mb-5 text-sm leading-6 text-slate-600 dark:text-slate-400">{path.description}</p>

        <ol className="space-y-2.5" aria-label={`${path.title} steps`}>
          {progress.steps.map((step, i) => (
            <li key={step.course.slug} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold ${
                  STEP_STYLES[showProgress ? step.status : "not-started"]
                }`}
                aria-hidden="true"
              >
                {showProgress && step.status === "done" ? "✓" : i + 1}
              </span>
              <Link
                href={`/courses/${step.course.slug}`}
                className="flex min-w-0 flex-1 items-center gap-2 font-medium text-slate-800 hover:text-brand-700 dark:text-slate-200 dark:hover:text-brand-400"
              >
                <CourseIcon icon={step.course.icon} />
                <span className="truncate">{step.course.title}</span>
              </Link>
              <span className="shrink-0 text-xs tabular-nums text-slate-500">
                {showProgress ? `${step.done}/${step.lessonCount}` : `${step.lessonCount} lessons`}
                <span className="sr-only">
                  {showProgress ? (step.status === "done" ? ", complete" : step.status === "in-progress" ? ", in progress" : ", not started") : ""}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="border-t border-slate-100 px-6 py-4 dark:border-slate-800">
        {showProgress && (
          <div className="mb-3">
            <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-500">
              <span>
                {progress.doneLessons} of {path.lessonCount} lessons
              </span>
              <span className="tabular-nums">{progress.pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="bar-gradient bar-grow h-full rounded-full" style={{ width: `${progress.pct}%` }} />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-500">{path.outcome}</span>
          {progress.next && (
            <Link
              href={`/courses/${progress.next.course.slug}`}
              className="shrink-0 font-medium text-brand-700 hover:underline dark:text-brand-400"
            >
              {showProgress && progress.doneLessons > 0 ? `Continue: ${progress.next.course.title}` : "Start path"} →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
