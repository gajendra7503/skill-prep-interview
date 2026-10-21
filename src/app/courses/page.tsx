import { redirect } from "next/navigation";
import Link from "next/link";
import { getAllCourses, getLessons, getSearchIndex } from "@/lib/content";
import { rankLessons } from "@/lib/search";
import { getCompletedCountsByCourse, getCurrentUser } from "@/lib/progress";
import { CourseCard } from "@/components/course-card";
import { CourseIcon } from "@/components/course-icon";
import { LevelBadge } from "@/components/level-badge";
import { CourseSearch } from "@/components/course-search";
import { Pagination } from "@/components/pagination";
import { COURSES_PER_PAGE, paginate } from "@/lib/pagination";

/** Every course, with a live search, six per page. */
export default async function CoursesPage({ searchParams }: PageProps<"/courses">) {
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim().slice(0, 80);
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(query ? `/courses?q=${query}` : "/courses")}`);

  const courses = getAllCourses();
  // A search narrows the grid to courses whose title or description matches, or that have a matching lesson.
  const matchingLessons = query ? rankLessons(getSearchIndex(), query) : [];
  const shownCourses = query
    ? courses.filter(
        (c) =>
          `${c.title} ${c.description}`.toLowerCase().includes(query.toLowerCase()) ||
          matchingLessons.some((l) => l.courseSlug === c.slug)
      )
    : courses;
  const { page, totalPages, items: pageCourses } = paginate(shownCourses, params.page, COURSES_PER_PAGE);
  const completedCounts = await getCompletedCountsByCourse();

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">All courses</h1>
          <p className="mt-1 text-sm text-slate-500">
            {query
              ? `${shownCourses.length} of ${courses.length} courses match “${query}”`
              : `${courses.length} courses`}
            {totalPages > 1 && ` · page ${page} of ${totalPages}`}
          </p>
        </div>
        <CourseSearch initialQuery={query} basePath="/courses" />
      </div>

      {query && matchingLessons.length > 0 && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <p className="border-b border-slate-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800">
            Matching lessons{matchingLessons.length > 8 && ` (top 8 of ${matchingLessons.length})`}
          </p>
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {matchingLessons.slice(0, 8).map((lesson) => (
              <li key={`${lesson.courseSlug}/${lesson.slug}`}>
                <Link
                  href={`/courses/${lesson.courseSlug}/${lesson.slug}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <CourseIcon icon={lesson.courseIcon} className="text-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-900 dark:text-slate-100">{lesson.title}</span>
                    <span className="block truncate text-xs text-slate-500">{lesson.courseTitle}</span>
                  </span>
                  <LevelBadge level={lesson.level} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {query && shownCourses.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
          No courses or lessons match “{query}”. Try a different word, such as “hooks”, “SQL” or “arrays”.
        </p>
      )}

      <div className="stagger grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {pageCourses.map((course) => (
          <CourseCard
            key={course.slug}
            course={course}
            lessonCount={getLessons(course.slug).length}
            completedCount={completedCounts[course.slug]}
          />
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} basePath="/courses" query={query ? { q: query } : undefined} />
    </section>
  );
}
