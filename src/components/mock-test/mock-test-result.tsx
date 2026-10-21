"use client";

import Link from "next/link";
import { Confetti } from "@/components/confetti";
import { useState } from "react";
import type { MockTestResult, PublicMockQuestion, PublicMockTest, QuestionReview } from "@/lib/content/types";
import { CodeBlock, OPTION_LABELS, RichText, formatDuration } from "./shared";
import { TopicAnalysis } from "./topic-analysis";
import { BookmarkButton } from "./bookmark-button";

type Filter = "all" | QuestionReview["outcome"];

const OUTCOME_STYLES: Record<QuestionReview["outcome"], { label: string; className: string }> = {
  correct: { label: "Correct", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
  incorrect: { label: "Incorrect", className: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400" },
  unattempted: { label: "Not attempted", className: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

function formatMarks(marks: number) {
  return marks > 0 ? `+${marks}` : String(marks);
}

export function MockTestResultView({
  test,
  questions: attemptQuestions,
  result,
  bookmarkedIds,
  onRetake,
}: {
  test: PublicMockTest;
  bookmarkedIds: string[];
  /** The questions in this attempt, in the order they were shown. */
  questions: PublicMockQuestion[];
  result: MockTestResult;
  onRetake: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [bookmarks, setBookmarks] = useState(() => new Set(bookmarkedIds));
  const setBookmark = (questionId: string, on: boolean) =>
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (on) next.add(questionId);
      else next.delete(questionId);
      return next;
    });
  const questions = new Map(attemptQuestions.map((q, i) => [q.id, { q, number: i + 1 }]));
  const modeLabel = test.modes.find((l) => l.key === result.modeKey)?.label ?? "Test";
  const percentage = result.maxScore > 0 ? Math.round((Math.max(result.score, 0) / result.maxScore) * 100) : 0;
  const shown = result.review.filter((r) => filter === "all" || r.outcome === filter);

  const stats = [
    { label: "Correct", value: result.correct, className: "text-emerald-600 dark:text-emerald-400" },
    { label: "Incorrect", value: result.incorrect, className: "text-rose-600 dark:text-rose-400" },
    { label: "Not attempted", value: result.unattempted, className: "text-slate-500" },
    { label: "Accuracy", value: `${result.accuracy}%`, className: "" },
    { label: "Time taken", value: formatDuration(result.timeTakenSeconds), className: "" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* The result screen appears once, right after submitting: celebrate finishing the test. */}
      <Confetti />
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-1 text-sm font-medium text-slate-500">{test.title} · {modeLabel} ({result.review.length} questions) · Result</p>
        <div className="mb-6 flex flex-wrap items-end gap-x-4 gap-y-1">
          <span className="text-5xl font-bold tracking-tight" style={{ color: "var(--accent)" }}>
            {result.score}
          </span>
          <span className="pb-1.5 text-xl text-slate-500">/ {result.maxScore}</span>
          <span className="pb-1.5 text-sm text-slate-500">({percentage}%)</span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <div className={`text-xl font-semibold ${s.className}`}>{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
                <th className="py-2 pr-4 font-medium">Section</th>
                <th className="py-2 pr-4 font-medium">Score</th>
                <th className="py-2 pr-4 font-medium">Correct</th>
                <th className="py-2 pr-4 font-medium">Incorrect</th>
                <th className="py-2 font-medium">Not attempted</th>
              </tr>
            </thead>
            <tbody>
              {result.sections.map((s) => (
                <tr key={s.type} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                  <td className="py-2 pr-4 font-medium">{s.type === "mcq" ? "Multiple choice" : "Practical"}</td>
                  <td className="py-2 pr-4">
                    {s.score} / {s.maxScore}
                  </td>
                  <td className="py-2 pr-4">{s.correct}</td>
                  <td className="py-2 pr-4">{s.incorrect}</td>
                  <td className="py-2">{s.unattempted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRetake}
            className="rounded-lg bg-brand-gradient btn-shine px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
          >
            Retake test
          </button>
          <Link
            href="/tests"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-300"
          >
            All tests
          </Link>
        </div>
      </div>

      {result.newBadges && result.newBadges.length > 0 && (
        <div role="status" className="mb-8 flex flex-wrap items-center gap-4 rounded-xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-900 dark:bg-brand-950/40">
          <p className="font-semibold text-brand-900 dark:text-brand-200">
            New badge{result.newBadges.length > 1 ? "s" : ""} unlocked
          </p>
          <ul className="flex flex-wrap gap-2">
            {result.newBadges.map((badge) => (
              <li key={badge.id} title={badge.description} className="rounded-full bg-brand-700 px-3 py-1 text-sm font-semibold text-white">
                {badge.name}
              </li>
            ))}
          </ul>
          <Link href="/dashboard" className="ml-auto text-sm font-medium text-brand-800 hover:underline dark:text-brand-300">
            See all badges →
          </Link>
        </div>
      )}

      <TopicAnalysis courseSlug={test.courseSlug} topics={result.topics} revise={result.revise} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Solutions</h2>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter solutions">
          {(["all", "correct", "incorrect", "unattempted"] as const).map((f) => {
            const count = f === "all" ? result.review.length : result.review.filter((r) => r.outcome === f).length;
            return (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                  filter === f
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                }`}
              >
                {f === "all" ? "All" : OUTCOME_STYLES[f].label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-5">
        {shown.map((r) => {
          const entry = questions.get(r.id);
          if (!entry) return null;
          const { q, number } = entry;
          return (
            <article
              key={r.id}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium">
                <span className="text-slate-500">Q{number}</span>
                <span className={`rounded-full px-2 py-0.5 ${OUTCOME_STYLES[r.outcome].className}`}>
                  {OUTCOME_STYLES[r.outcome].label} · {formatMarks(r.marks)}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {r.difficulty}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {q.type === "mcq" ? "Multiple choice" : "Practical"}
                </span>
                <span className="ml-auto">
                  <BookmarkButton
                    courseSlug={test.courseSlug}
                    questionId={q.id}
                    bookmarked={bookmarks.has(q.id)}
                    onChange={setBookmark}
                  />
                </span>
              </div>
              <p className="font-medium leading-7">
                <RichText text={q.question} />
              </p>
              {q.code && <CodeBlock code={q.code} language={q.codeLanguage} />}

              {q.type === "mcq" ? (
                <ul className="mt-3 space-y-2">
                  {q.options.map((option, i) => {
                    const isCorrect = i === r.correctAnswer;
                    const isYours = i === r.yourAnswer;
                    return (
                      <li
                        key={i}
                        className={`flex gap-3 rounded-lg border px-3 py-2 text-sm ${
                          isCorrect
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                            : isYours
                              ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40"
                              : "border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <span className="font-semibold text-slate-500">{OPTION_LABELS[i]}.</span>
                        <span className="flex-1">
                          <RichText text={option} />
                        </span>
                        {isCorrect && <span className="text-xs font-semibold text-emerald-600">Correct answer</span>}
                        {isYours && !isCorrect && <span className="text-xs font-semibold text-rose-600">Your answer</span>}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
                    <dt className="text-xs text-slate-500">Your answer</dt>
                    <dd className="font-mono">{r.yourAnswer === null ? "—" : String(r.yourAnswer)}</dd>
                  </div>
                  <div className="rounded-lg border border-emerald-500 bg-emerald-50 px-3 py-2 dark:bg-emerald-950/40">
                    <dt className="text-xs text-slate-500">Correct answer</dt>
                    <dd className="font-mono">{String(r.correctAnswer)}</dd>
                  </div>
                </dl>
              )}

              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                <span className="font-semibold">Explanation: </span>
                <RichText text={r.explanation} />
              </div>
            </article>
          );
        })}
        {shown.length === 0 && <p className="text-sm text-slate-500">No questions in this category.</p>}
      </div>
    </div>
  );
}
