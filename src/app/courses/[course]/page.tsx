import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, getLessonModules } from "@/lib/content";
import { getCompletedLessonSlugs } from "@/lib/progress";

export default async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  const { course: courseSlug } = await params;
  const course = getCourse(courseSlug);
  if (!course) notFound();

  const modules = getLessonModules(courseSlug);
  const completed = await getCompletedLessonSlugs(courseSlug);
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const pct = totalLessons > 0 ? Math.round((completed.size / totalLessons) * 100) : 0;

  return (
    <div style={{ "--accent": course.accent } as React.CSSProperties}>
      <div
        className="border-b border-zinc-200 dark:border-zinc-800"
        style={{ backgroundColor: "color-mix(in srgb, var(--accent) 8%, transparent)" }}
      >
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="flex items-center gap-4">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl"
              style={{ backgroundColor: "color-mix(in srgb, var(--accent) 18%, transparent)" }}
            >
              {course.icon}
            </span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
              <p className="text-zinc-600 dark:text-zinc-400">{course.description}</p>
            </div>
          </div>

          {totalLessons > 0 && (
            <div className="mt-6 flex items-center gap-3">
              <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/60 dark:bg-zinc-900/60">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: "var(--accent)" }}
                />
              </div>
              <span className="shrink-0 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {completed.size}/{totalLessons} complete
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="space-y-8">
          {modules.map((module) => (
            <div key={module.name}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                {module.name}
              </h2>
              <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {module.lessons.map((lesson) => {
                  const isDone = completed.has(lesson.slug);
                  return (
                    <li key={lesson.slug}>
                      <Link
                        href={`/courses/${courseSlug}/${lesson.slug}`}
                        className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      >
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs"
                          style={
                            isDone
                              ? { backgroundColor: "var(--accent)", color: "white" }
                              : undefined
                          }
                        >
                          {isDone ? (
                            "✓"
                          ) : (
                            <span className="h-full w-full rounded-full border border-zinc-300 dark:border-zinc-600" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{lesson.title}</p>
                          <p className="truncate text-sm text-zinc-500">{lesson.description}</p>
                        </div>
                        <span className="shrink-0 text-zinc-300 dark:text-zinc-700">→</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
