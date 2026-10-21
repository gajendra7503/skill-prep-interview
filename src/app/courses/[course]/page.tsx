import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, getLessonModules, getSearchIndex } from "@/lib/content";
import { SearchPalette } from "@/components/search-palette";
import { getCompletedLessonSlugs } from "@/lib/progress";
import { getCurrentUser } from "@/lib/local-auth";
import { redirect } from "next/navigation";
import { CourseIcon } from "@/components/course-icon";
import { LEVEL_ORDER, LevelBadge, levelLabel } from "@/components/level-badge";

export default async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  const { course: courseSlug } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`);
  }

  const course = getCourse(courseSlug);
  if (!course) notFound();

  const modules = getLessonModules(courseSlug);
  const completed = await getCompletedLessonSlugs(courseSlug);
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const pct = totalLessons > 0 ? Math.round((completed.size / totalLessons) * 100) : 0;
  const levelCounts = LEVEL_ORDER.map((level) => ({
    level,
    count: modules.reduce((sum, m) => sum + m.lessons.filter((l) => l.level === level).length, 0),
  })).filter((l) => l.count > 0);

  return (
    <div>
      <div
        className="hero-animated relative overflow-hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <span aria-hidden="true" className="blob -right-16 -top-20 h-64 w-64" style={{ backgroundColor: "color-mix(in srgb, var(--accent, #9333ea) 35%, transparent)" }} />
        <div className="stagger relative mx-auto max-w-3xl px-6 py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <span
                className="animate-pop flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-4xl shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <CourseIcon icon={course.icon} />
              </span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
                <p className="text-slate-600 dark:text-slate-400">{course.description}</p>
              </div>
            </div>
            <SearchPalette lessons={getSearchIndex()} />
          </div>

          {levelCounts.length > 0 && (
            <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
              {levelCounts.map(({ level, count }, i) => (
                <span key={level} className="inline-flex items-center gap-1.5">
                  {i > 0 && <span className="text-slate-300 dark:text-slate-700">→</span>}
                  <LevelBadge level={level} />
                  <span>
                    {count} {count === 1 ? "lesson" : "lessons"}
                    <span className="sr-only"> at {levelLabel(level)} level</span>
                  </span>
                </span>
              ))}
            </p>
          )}

          {totalLessons > 0 && (
            <div className="mt-6 flex items-center gap-3">
              <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="bar-grow h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundImage: "linear-gradient(90deg, var(--accent, #9333ea), #eab308)" }}
                />
              </div>
              <span className="shrink-0 text-sm font-medium text-slate-600 dark:text-slate-400">
                {completed.size}/{totalLessons} complete
              </span>
            </div>
          )}

          {totalLessons > 0 && completed.size >= totalLessons && (
            <Link
              href={`/courses/${courseSlug}/certificate`}
              className="mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110"
              style={{ backgroundColor: "var(--accent)" }}
            >
              View your certificate →
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="space-y-8">
          {modules.map((module) => (
            <div key={module.name}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <span aria-hidden="true" className="bg-brand-gradient h-4 w-1 rounded-full" />
                {module.name}
              </h2>
              <ul className="reveal divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                {module.lessons.map((lesson) => {
                  const isDone = completed.has(lesson.slug);
                  return (
                    <li key={lesson.slug}>
                      <Link
                        href={`/courses/${courseSlug}/${lesson.slug}`}
                        className="group flex items-center gap-3 px-4 py-3.5 transition duration-200 hover:bg-gradient-to-r hover:from-brand-50 hover:to-transparent hover:pl-5 dark:hover:from-brand-950/50"
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
                            <span className="h-full w-full rounded-full border border-slate-300 dark:border-slate-600" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2 font-medium">
                            {lesson.title}
                            <LevelBadge level={lesson.level} />
                          </p>
                          <p className="truncate text-sm text-slate-500">{lesson.description}</p>
                        </div>
                        <span className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-500 dark:text-slate-700">→</span>
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
