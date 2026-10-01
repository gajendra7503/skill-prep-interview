import Link from "next/link";
import type { LessonModule } from "@/lib/content/types";

export function LessonSidebar({
  courseSlug,
  modules,
  activeLessonSlug,
  completedSlugs,
}: {
  courseSlug: string;
  modules: LessonModule[];
  activeLessonSlug?: string;
  completedSlugs: Set<string>;
}) {
  return (
    <nav className="sticky top-20 h-fit max-h-[calc(100vh-6rem)] w-64 shrink-0 overflow-y-auto border-r border-zinc-200 pr-4 dark:border-zinc-800">
      {modules.map((module) => (
        <div key={module.name} className="mb-6">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {module.name}
          </h4>
          <ul className="space-y-1">
            {module.lessons.map((lesson) => {
              const isActive = lesson.slug === activeLessonSlug;
              const isDone = completedSlugs.has(lesson.slug);
              return (
                <li key={lesson.slug}>
                  <Link
                    href={`/courses/${courseSlug}/${lesson.slug}`}
                    className={`flex items-center gap-2 rounded-md border-l-2 px-2 py-1.5 text-sm transition ${
                      isActive
                        ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] font-medium text-zinc-900 dark:text-zinc-50"
                        : "border-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] text-white ${
                        isDone ? "" : "border border-zinc-300 dark:border-zinc-600"
                      }`}
                      style={isDone ? { backgroundColor: "var(--accent)" } : undefined}
                    >
                      {isDone ? "✓" : ""}
                    </span>
                    {lesson.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
