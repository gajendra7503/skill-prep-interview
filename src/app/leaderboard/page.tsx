import Link from "next/link";
import { redirect } from "next/navigation";
import { getMockTest, getMockTestSummaries } from "@/lib/content/tests";
import { getCurrentUser, getLeaderboard, getLeaderboardOptIn } from "@/lib/local-auth";
import { CourseIcon } from "@/components/course-icon";
import { sevenDaysAgoIso } from "@/lib/activity";
import { setLeaderboardVisibility } from "./actions";

type Period = "week" | "all";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default async function LeaderboardPage({ searchParams }: PageProps<"/leaderboard">) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/leaderboard")}`);

  const topics = getMockTestSummaries();
  const query = await searchParams;
  const topic = topics.find((t) => t.course.slug === query.topic) ?? topics[0];
  const period: Period = query.period === "all" ? "all" : "week";
  if (!topic) return <p className="px-6 py-12 text-slate-500">No tests are available yet.</p>;

  const fullTestSize = getMockTest(topic.course.slug)?.questions.length ?? 50;
  const since = period === "week" ? sevenDaysAgoIso() : undefined;
  const [board, optedIn] = await Promise.all([
    getLeaderboard(topic.course.slug, user.id, { since, fullTestSize, limit: 10 }),
    getLeaderboardOptIn(user.id),
  ]);
  const viewerOffBoard = board.viewer && !board.rows.some((row) => row.isViewer);
  const href = (slug: string, p: Period) => `/leaderboard?topic=${slug}${p === "all" ? "&period=all" : ""}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <h1 className="mb-1 text-3xl font-semibold tracking-tight">Leaderboard</h1>
      <p className="mb-8 max-w-2xl text-slate-600 dark:text-slate-400">
        Ranked by best Full test score, with ties going to the faster time. Only learners who choose to appear are listed,
        shown by first name and last initial.
      </p>

      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {optedIn ? (
            <>You appear on leaderboards by first name and last initial.</>
          ) : (
            <>You&apos;re hidden from leaderboards. You can still see your own rank below.</>
          )}
        </p>
        <form action={setLeaderboardVisibility}>
          <input type="hidden" name="optIn" value={optedIn ? "0" : "1"} />
          <button
            type="submit"
            className={
              optedIn
                ? "rounded-md border border-slate-200 px-3.5 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
                : "rounded-md bg-brand-gradient btn-shine px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            }
          >
            {optedIn ? "Hide me" : "Show me on leaderboards"}
          </button>
        </form>
      </div>

      <nav aria-label="Topic" className="mb-4 flex flex-wrap gap-2">
        {topics.map((t) => (
          <Link
            key={t.course.slug}
            href={href(t.course.slug, period)}
            aria-current={t.course.slug === topic.course.slug ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              t.course.slug === topic.course.slug
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700"
            }`}
          >
            <CourseIcon icon={t.course.icon} /> {t.course.title}
          </Link>
        ))}
      </nav>

      <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="flex items-center gap-2 font-semibold">
            <CourseIcon icon={topic.course.icon} /> {topic.course.title}
          </h2>
          <div className="flex rounded-md bg-slate-100 p-0.5 text-sm dark:bg-slate-800" role="tablist" aria-label="Period">
            {(["week", "all"] as const).map((p) => (
              <Link
                key={p}
                href={href(topic.course.slug, p)}
                role="tab"
                aria-selected={p === period}
                className={`rounded px-3 py-1 font-medium transition ${
                  p === period
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {p === "week" ? "This week" : "All time"}
              </Link>
            ))}
          </div>
        </div>

        {board.rows.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-medium">No ranked attempts {period === "week" ? "this week" : "yet"}</p>
            <p className="mt-1 text-sm text-slate-500">Take the full {topic.course.title} test to set the first score.</p>
            <Link
              href={`/tests/${topic.course.slug}`}
              className="mt-4 inline-block rounded-md bg-brand-gradient btn-shine px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              Take the full test
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th scope="col" className="w-16 px-6 py-3 font-medium">Rank</th>
                <th scope="col" className="px-3 py-3 font-medium">Learner</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Best score</th>
                <th scope="col" className="hidden px-3 py-3 text-right font-medium sm:table-cell">Time</th>
                <th scope="col" className="hidden px-6 py-3 text-right font-medium sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {[...board.rows, ...(viewerOffBoard && board.viewer ? [board.viewer] : [])].map((row, i, all) => (
                <tr
                  key={row.userId}
                  className={`border-t border-slate-100 dark:border-slate-800 ${row.isViewer ? "bg-brand-50/60 dark:bg-brand-950/30" : ""} ${
                    viewerOffBoard && i === all.length - 1 ? "border-t-2 border-dashed" : ""
                  }`}
                >
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold tabular-nums ${
                        row.rank <= 3
                          ? "bg-brand-700 text-white"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-medium">
                    {row.displayName}
                    {row.isViewer && (
                      <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
                        You{optedIn ? "" : " · only you see this"}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{row.pct}%</td>
                  <td className="hidden px-3 py-3 text-right tabular-nums text-slate-600 sm:table-cell dark:text-slate-400">
                    {formatDuration(row.timeTakenSeconds)}
                  </td>
                  <td className="hidden px-6 py-3 text-right text-slate-600 sm:table-cell dark:text-slate-400">
                    {new Date(row.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {board.viewer === null && board.rows.length > 0 && (
          <p className="border-t border-slate-100 px-6 py-3 text-sm text-slate-500 dark:border-slate-800">
            You don&apos;t have a ranked score here yet —{" "}
            <Link href={`/tests/${topic.course.slug}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">
              take the full test
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}
