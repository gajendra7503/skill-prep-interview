import Link from "next/link";
import type { CourseMeta } from "@/lib/content/types";

export function CourseCard({
  course,
  lessonCount,
  completedCount,
}: {
  course: CourseMeta;
  lessonCount: number;
  completedCount?: number;
}) {
  const hasProgress = typeof completedCount === "number" && lessonCount > 0;
  const pct = hasProgress ? Math.round((completedCount! / lessonCount) * 100) : 0;

  return (
    <Link
      href={`/courses/${course.slug}`}
      style={{ "--accent": course.accent } as React.CSSProperties}
      className="group relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-4 flex items-center justify-between">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
          style={{ backgroundColor: "color-mix(in srgb, var(--accent) 16%, transparent)" }}
        >
          {course.icon}
        </span>
        <span className="translate-x-0 text-lg text-zinc-300 opacity-0 transition-all group-hover:translate-x-1 group-hover:text-[var(--accent)] group-hover:opacity-100 dark:text-zinc-700">
          →
        </span>
      </div>

      <h3 className="mb-1.5 text-lg font-semibold">{course.title}</h3>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {course.description}
      </p>

      <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
        <span>{lessonCount} lessons</span>
        {hasProgress && <span>{pct}% complete</span>}
      </div>
      {hasProgress && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: "var(--accent)" }}
          />
        </div>
      )}
    </Link>
  );
}
