import Link from "next/link";
import { redirect } from "next/navigation";
import { getMockTestSummaries } from "@/lib/content/tests";
import { getCurrentUser, getTestAttempts } from "@/lib/local-auth";
import { Pagination } from "@/components/pagination";
import { COURSES_PER_PAGE, paginate } from "@/lib/pagination";
import { CourseIcon } from "@/components/course-icon";

export default async function TestsPage({ searchParams }: PageProps<"/tests">) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/tests")}`);

  const summaries = getMockTestSummaries();
  const attempts = await getTestAttempts(user.id);
  const { page, totalPages, items } = paginate(summaries, (await searchParams).page, COURSES_PER_PAGE);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <h1 className="mb-1 text-3xl font-bold tracking-tight">Mock tests</h1>
      <p className="mb-8 text-slate-600 dark:text-slate-400">
        Pick a topic, then choose a 20-question quick test, the full 50-question paper, or an Easy, Medium or Hard test. Every test is timed and mixes multiple-choice with practical questions.
        Correct answers earn +2; wrong multiple-choice answers cost 0.5.
      </p>

      <div className="stagger grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ course, title, mcqCount, practicalCount, modes }) => {
          const mine = attempts.filter((a) => a.courseSlug === course.slug);
          // Quick and full tests have different maximum marks, so compare attempts as percentages.
          const best = mine.reduce<number | null>((max, a) => {
            const pct = a.maxScore > 0 ? Math.round((Math.max(a.score, 0) / a.maxScore) * 100) : 0;
            return max === null || pct > max ? pct : max;
          }, null);

          return (
            <Link
              key={course.slug}
              href={`/tests/${course.slug}`}
              className="card-lift group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
            >
              <span aria-hidden="true" className="bg-brand-gradient absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
              <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-200/40 blur-2xl transition-opacity duration-500 group-hover:opacity-100 dark:bg-brand-700/30 md:opacity-0" />
              <div className="mb-4 flex items-center justify-between">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-2xl transition duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:border-brand-200 group-hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:group-hover:border-brand-800 dark:group-hover:bg-brand-950"
                >
                  <CourseIcon icon={course.icon} />
                </span>
                {best !== null && (
                  <span className="rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 dark:from-amber-950 dark:to-yellow-950 dark:text-amber-300 dark:ring-amber-900">
                    Best {best}%
                  </span>
                )}
              </div>
              <h2 className="mb-1.5 text-lg font-semibold">{title}</h2>
              <p className="mb-4 flex-1 text-sm text-slate-600 dark:text-slate-400">
                {mcqCount} multiple-choice · {practicalCount} practical in the full paper
              </p>
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>
                  {modes
                    .filter((m) => !m.difficulty)
                    .map((m) => m.questionCount)
                    .join(" or ")}{" "}
                  questions · Easy, Medium &amp; Hard modes
                </span>
                <span>{mine.length > 0 ? `${mine.length} attempt${mine.length === 1 ? "" : "s"}` : "Not attempted"}</span>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-400">
                {mine.length > 0 ? "Try again" : "Start test"}
                <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
              </span>
            </Link>
          );
        })}
      </div>

      {summaries.length === 0 && <p className="text-slate-500">No mock tests are available yet.</p>}
      <Pagination page={page} totalPages={totalPages} basePath="/tests" />
    </div>
  );
}
