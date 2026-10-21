import Link from "next/link";
import type { CourseMeta } from "@/lib/content/types";
import { CourseIcon } from "@/components/course-icon";

export function CourseCard({
  course,
  lessonCount,
  completedCount,
  certified = false,
}: {
  course: CourseMeta;
  lessonCount: number;
  completedCount?: number;
  certified?: boolean;
}) {
  const hasProgress = typeof completedCount === "number" && lessonCount > 0;
  const pct = hasProgress ? Math.round((completedCount! / lessonCount) * 100) : 0;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="card-lift group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
    >
      <span aria-hidden="true" className="bg-brand-gradient absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[26px] transition duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:border-brand-200 group-hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:group-hover:border-brand-800 dark:group-hover:bg-brand-950">
            <CourseIcon icon={course.icon} />
          </span>
          {certified && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
              Certified
            </span>
          )}
        </div>

        <h3 className="mb-1.5 text-base font-semibold text-slate-900 dark:text-white">{course.title}</h3>
        <p className="flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{course.description}</p>

        {hasProgress && (
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-500">
              <span>Progress</span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="bar-gradient bar-grow h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-sm dark:border-slate-800">
        <span className="text-slate-500">{lessonCount} lessons</span>
        <span className="font-medium text-brand-700 transition group-hover:translate-x-1 dark:text-brand-400">
          {completedCount ? "Continue" : "View course"} →
        </span>
      </div>
    </Link>
  );
}
