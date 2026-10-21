import Link from "next/link";
import type { ReviseLesson, TopicResult } from "@/lib/content/types";

function Swatch({ color, hollow = false }: { color: string; hollow?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2.5 w-2.5 rounded-sm ${hollow ? "border border-slate-300 dark:border-slate-600" : ""}`}
      style={{ backgroundColor: color }}
    />
  );
}

/**
 * Per-module breakdown of a test attempt: a bar per module (correct, then incorrect, over a track that
 * stands for the unattempted remainder), followed by the lessons to revise.
 */
export function TopicAnalysis({
  courseSlug,
  topics,
  revise,
}: {
  courseSlug: string;
  topics: TopicResult[];
  revise: ReviseLesson[];
}) {
  if (topics.length === 0) return null;

  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">Topic analysis</h2>
        <ul className="flex flex-wrap gap-4 text-xs text-slate-500" aria-label="Legend">
          <li className="flex items-center gap-1.5">
            <Swatch color="var(--viz-correct)" /> Correct
          </li>
          <li className="flex items-center gap-1.5">
            <Swatch color="var(--viz-incorrect)" /> Incorrect
          </li>
          <li className="flex items-center gap-1.5">
            <Swatch color="var(--viz-track)" hollow /> Not attempted
          </li>
        </ul>
      </div>

      <table className="w-full text-sm">
        <caption className="sr-only">Questions by module: correct, incorrect and not attempted</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Module</th>
            <th scope="col">Breakdown</th>
            <th scope="col">Correct</th>
          </tr>
        </thead>
        <tbody>
          {topics.map((t) => {
            const pct = (n: number) => (t.total > 0 ? (n / t.total) * 100 : 0);
            const summary = `${t.correct} correct, ${t.incorrect} incorrect, ${t.unattempted} not attempted, out of ${t.total}`;
            return (
              <tr key={t.module} className="group">
                <th scope="row" className="w-40 py-2 pr-4 text-left align-middle font-medium text-slate-700 sm:w-56 dark:text-slate-300">
                  {t.module}
                </th>
                <td className="relative py-2 align-middle">
                  <div
                    role="img"
                    aria-label={summary}
                    className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full"
                    style={{ backgroundColor: "var(--viz-track)" }}
                  >
                    {t.correct > 0 && (
                      <div className="h-full rounded-full" style={{ width: `${pct(t.correct)}%`, backgroundColor: "var(--viz-correct)" }} />
                    )}
                    {t.incorrect > 0 && (
                      <div className="h-full rounded-full" style={{ width: `${pct(t.incorrect)}%`, backgroundColor: "var(--viz-incorrect)" }} />
                    )}
                  </div>
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute -top-9 left-0 z-10 hidden whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block dark:bg-slate-100 dark:text-slate-900"
                  >
                    {summary}
                  </div>
                </td>
                <td className="w-24 py-2 pl-4 text-right align-middle tabular-nums text-slate-600 dark:text-slate-400">
                  {t.correct}/{t.total}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {revise.length > 0 ? (
        <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
          <h3 className="mb-1 text-sm font-semibold">Revise these lessons</h3>
          <p className="mb-3 text-sm text-slate-500">Based on the questions you missed or skipped.</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {revise.map((lesson) => (
              <li key={lesson.slug}>
                <Link
                  href={`/courses/${courseSlug}/${lesson.slug}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition hover:border-brand-300 hover:bg-brand-50/50 dark:border-slate-800 dark:hover:border-brand-700 dark:hover:bg-brand-950/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-800 dark:text-slate-200">{lesson.title}</span>
                    <span className="block text-xs text-slate-500">{lesson.module}</span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-slate-500">
                    {lesson.missed} missed <span className="text-brand-700 dark:text-brand-400">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-500 dark:border-slate-800">
          You answered every question correctly — nothing to revise.
        </p>
      )}
    </section>
  );
}
