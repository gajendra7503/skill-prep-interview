import Link from "next/link";
import { redirect } from "next/navigation";
import { getAllCourses, getLessons } from "@/lib/content";
import { getCompletedCountsByCourse, getCurrentUser } from "@/lib/progress";
import { getActivityTimestamps, getTestAttempts } from "@/lib/local-auth";
import { countThisWeek, currentStreak } from "@/lib/activity";
import { getGamificationSummary } from "@/lib/gamification";
import { LevelAndBadges } from "@/components/badges";
import { AssignedToYou } from "@/components/assigned-to-you";
import { getAssignmentsForUser } from "@/lib/teams";
import { nowMs } from "@/lib/activity";
import { attemptModeLabel } from "@/lib/content/modes";
import { CourseIcon } from "@/components/course-icon";
import { ScoreSparkline } from "@/components/score-sparkline";
import { CountUp } from "@/components/count-up";

const percentOf = (score: number, max: number) => (max > 0 ? Math.round((Math.max(score, 0) / max) * 100) : 0);

function StatTile({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="card-lift rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
        <CountUp value={value} />
      </p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const courses = getAllCourses();
  const [completedCounts, activity, attempts, gamification, assignments] = await Promise.all([
    getCompletedCountsByCourse(),
    getActivityTimestamps(user.id),
    getTestAttempts(user.id),
    getGamificationSummary(user.id),
    getAssignmentsForUser(user.id, nowMs()),
  ]);

  const totalLessons = courses.reduce((sum, c) => sum + getLessons(c.slug).length, 0);
  const totalCompleted = Object.values(completedCounts).reduce((sum, n) => sum + n, 0);
  const overallPct = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  const streak = currentStreak([...activity.lessons, ...activity.tests]);
  const lessonsThisWeek = countThisWeek(activity.lessons);
  const testsThisWeek = countThisWeek(activity.tests);
  const recent = attempts.slice(0, 5);
  const recentAverage = recent.length
    ? Math.round(recent.reduce((sum, a) => sum + percentOf(a.score, a.maxScore), 0) / recent.length)
    : null;

  // One row per topic the learner has tested in, oldest attempt first for the sparkline.
  const topicRows = courses.flatMap((course) => {
    const mine = attempts.filter((a) => a.courseSlug === course.slug).reverse();
    if (mine.length === 0) return [];
    const pcts = mine.map((a) => percentOf(a.score, a.maxScore));
    return [
      {
        course,
        attempts: mine.length,
        latest: pcts[pcts.length - 1],
        best: Math.max(...pcts),
        points: mine.map((a, i) => ({
          pct: pcts[i],
          label: `${new Date(a.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })} · ${attemptModeLabel(a)} test`,
        })),
      },
    ];
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <section className="bg-brand-gradient relative mb-8 overflow-hidden rounded-3xl p-8 text-white shadow-xl shadow-brand-900/25 sm:p-10">
        <div aria-hidden="true">
          <span className="blob -right-10 -top-16 h-56 w-56 bg-fuchsia-400/50" />
          <span className="blob -bottom-24 left-1/3 h-56 w-56 bg-amber-300/40" />
        </div>
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-white/70">Your progress</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              {user.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Welcome back"}
            </h1>
            <p className="mt-2 max-w-md text-white/80">
              {streak > 0
                ? `You're on a ${streak}-day streak. Keep it going today.`
                : "Pick up where you left off, or start something new today."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="btn-shine rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 shadow-md transition hover:-translate-y-0.5"
              >
                Continue learning →
              </Link>
              <Link
                href="/tests"
                className="rounded-lg border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
              >
                Take a mock test
              </Link>
            </div>
          </div>
          <div
            className="animate-pop relative mx-auto grid h-36 w-36 shrink-0 place-items-center rounded-full md:mx-0"
            style={{ background: `conic-gradient(#fde047 ${overallPct * 3.6}deg, rgb(255 255 255 / 0.2) 0deg)` }}
            role="img"
            aria-label={`${overallPct}% of all lessons complete`}
          >
            <div className="grid h-28 w-28 place-items-center rounded-full bg-brand-800/80 text-center backdrop-blur">
              <div>
                <p className="text-3xl font-bold">
                  <CountUp value={`${overallPct}%`} />
                </p>
                <p className="text-[11px] uppercase tracking-wider text-white/70">complete</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AssignedToYou assignments={assignments} />

      <section aria-label="Activity summary" className="stagger mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Learning streak"
          value={`${streak} ${streak === 1 ? "day" : "days"}`}
          detail={streak > 0 ? "Keep it going — study today" : "Complete a lesson or test to start one"}
        />
        <StatTile label="Lessons this week" value={lessonsThisWeek} detail="Completed in the last 7 days" />
        <StatTile label="Tests this week" value={testsThisWeek} detail={`${attempts.length} taken in total`} />
        <StatTile
          label="Recent test average"
          value={recentAverage === null ? "—" : `${recentAverage}%`}
          detail={recent.length ? `Across your last ${recent.length} ${recent.length === 1 ? "test" : "tests"}` : "No tests taken yet"}
        />
      </section>

      <LevelAndBadges summary={gamification} />

      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-semibold">Course progress</h2>
          <span className="text-sm text-slate-500">
            {totalCompleted} of {totalLessons} lessons complete · <span className="font-medium text-slate-700 dark:text-slate-300">{overallPct}%</span>
          </span>
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
          role="progressbar"
          aria-valuenow={overallPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Lessons completed across all courses"
        >
          <div className="bar-gradient bar-grow h-full rounded-full transition-all" style={{ width: `${overallPct}%` }} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="font-semibold">Mock test performance</h2>
          <span className="text-xs text-slate-500">Score % by attempt, oldest to newest · scale 0–100%</span>
        </div>
        {topicRows.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="font-medium">No tests taken yet</p>
            <p className="mt-1 text-sm text-slate-500">Your scores will appear here, one row per topic.</p>
            <Link
              href="/tests"
              className="mt-4 inline-block rounded-md bg-brand-gradient btn-shine px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              Take a mock test
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-6 py-3 font-medium">Topic</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Attempts</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Latest</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Best</th>
                  <th scope="col" className="px-6 py-3 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {topicRows.map((row) => (
                  <tr key={row.course.slug} className="border-t border-slate-100 dark:border-slate-800">
                    <th scope="row" className="px-6 py-3 text-left font-medium">
                      <Link href={`/tests/${row.course.slug}`} className="inline-flex items-center gap-2.5 hover:text-brand-700 dark:hover:text-brand-400">
                        <span className="text-lg">
                          <CourseIcon icon={row.course.icon} />
                        </span>
                        {row.course.title}
                      </Link>
                    </th>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-600 dark:text-slate-400">{row.attempts}</td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums">{row.latest}%</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-600 dark:text-slate-400">{row.best}%</td>
                    <td className="px-6 py-3">
                      <ScoreSparkline points={row.points} topic={row.course.title} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}
