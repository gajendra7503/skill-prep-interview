"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { checkPracticeAnswer } from "@/app/tests/[topic]/actions";
import type { PublicMockQuestion, QuestionReview } from "@/lib/content/types";
import { CourseIcon } from "@/components/course-icon";
import { BookmarkButton } from "./bookmark-button";
import { CodeBlock, OPTION_LABELS, RichText } from "./shared";

export type PracticeFilter = "all" | "mcq" | "practical" | "bookmarked";
export type PracticeLevel = "all" | "easy" | "medium" | "hard";

const LEVEL_LABELS: Record<PracticeLevel, string> = { all: "All levels", easy: "Easy", medium: "Medium", hard: "Hard" };
const LEVEL_DOT: Record<string, string> = { easy: "bg-emerald-500", medium: "bg-amber-500", hard: "bg-rose-500" };

const FILTER_LABELS: Record<PracticeFilter, string> = {
  all: "All questions",
  mcq: "Multiple choice",
  practical: "Practical",
  bookmarked: "Bookmarked",
};

/** Untimed practice: answer one question, check it against the server's solution, move on. Nothing is saved. */
export function PracticeRunner({
  courseSlug,
  courseTitle,
  courseIcon,
  title,
  filter,
  level,
  questions,
  counts,
  levelCounts,
  initialBookmarks,
}: {
  courseSlug: string;
  courseTitle: string;
  courseIcon: string;
  title: string;
  filter: PracticeFilter;
  level: PracticeLevel;
  questions: PublicMockQuestion[];
  counts: Record<PracticeFilter, number>;
  levelCounts: Record<PracticeLevel, number>;
  initialBookmarks: string[];
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [reviews, setReviews] = useState<Record<string, QuestionReview>>({});
  const [bookmarks, setBookmarks] = useState(() => new Set(initialBookmarks));
  const [error, setError] = useState<string | null>(null);
  const [checking, startChecking] = useTransition();

  const current = questions[index];
  const review = current ? reviews[current.id] : undefined;
  const answer = current ? answers[current.id] : undefined;
  const hasAnswer = typeof answer === "number" || (typeof answer === "string" && answer.trim() !== "");
  const checked = Object.values(reviews);
  const correctCount = checked.filter((r) => r.outcome === "correct").length;

  function setBookmark(questionId: string, on: boolean) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (on) next.add(questionId);
      else next.delete(questionId);
      return next;
    });
  }

  function check() {
    if (!current || !hasAnswer) return;
    setError(null);
    startChecking(async () => {
      try {
        const result = await checkPracticeAnswer(courseSlug, current.id, answer ?? null);
        setReviews((prev) => ({ ...prev, [current.id]: result }));
      } catch {
        setError("Couldn't check that answer. Please try again.");
      }
    });
  }

  const hrefFor = (f: PracticeFilter, l: PracticeLevel) => {
    const params = new URLSearchParams();
    if (f !== "all") params.set("filter", f);
    if (l !== "all") params.set("level", l);
    const query = params.toString();
    return `/tests/${courseSlug}/practice${query ? `?${query}` : ""}`;
  };

  function go(to: number) {
    setIndex(Math.min(Math.max(to, 0), questions.length - 1));
    setError(null);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link href={`/tests/${courseSlug}`} className="mb-6 inline-block text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        ← Back to {title}
      </Link>

      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-2xl dark:border-slate-700 dark:bg-slate-800">
          <CourseIcon icon={courseIcon} />
        </span>
        <div>
          <p className="text-sm font-medium text-slate-500">{courseTitle} · Practice mode</p>
          <h1 className="text-2xl font-semibold tracking-tight">Untimed practice</h1>
        </div>
      </div>

      <nav aria-label="Question filter" className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(FILTER_LABELS) as PracticeFilter[]).map((f) => (
          <Link
            key={f}
            href={hrefFor(f, level)}
            aria-current={f === filter ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              f === filter
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700"
            }`}
          >
            {FILTER_LABELS[f]} <span className="tabular-nums opacity-70">({counts[f]})</span>
          </Link>
        ))}
      </nav>

      <nav aria-label="Difficulty filter" className="-mt-3 mb-6 flex flex-wrap gap-2">
        {(Object.keys(LEVEL_LABELS) as PracticeLevel[]).map((l) => (
          <Link
            key={l}
            href={hrefFor(filter, l)}
            aria-current={l === level ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
              l === level
                ? "bg-brand-700 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700"
            }`}
          >
            {l !== "all" && <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${LEVEL_DOT[l]}`} />}
            {LEVEL_LABELS[l]} <span className="tabular-nums opacity-70">({levelCounts[l]})</span>
          </Link>
        ))}
      </nav>

      {!current ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="font-medium">{filter === "bookmarked" ? "No bookmarked questions yet" : "No questions here"}</p>
          <p className="mt-1 text-sm text-slate-500">
            {filter === "bookmarked"
              ? "Bookmark questions while practising or when reviewing test solutions, and they'll collect here."
              : "Try another filter."}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
            <span>
              Question <span className="font-semibold text-slate-800 dark:text-slate-200">{index + 1}</span> of {questions.length}
            </span>
            <span className="tabular-nums">
              {checked.length} checked · {correctCount} correct
            </span>
          </div>

          <article className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {current.type === "mcq" ? "Multiple choice" : "Practical"}
                <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                <span className="capitalize">{current.difficulty}</span>
              </span>
              <BookmarkButton
                courseSlug={courseSlug}
                questionId={current.id}
                bookmarked={bookmarks.has(current.id)}
                onChange={setBookmark}
              />
            </div>

            <p className="font-medium leading-7">
              <RichText text={current.question} />
            </p>
            {current.code && <CodeBlock code={current.code} language={current.codeLanguage} />}

            {current.type === "mcq" ? (
              <div className="mt-4 space-y-2.5" role="radiogroup" aria-label="Options">
                {current.options.map((option, i) => {
                  const selected = answer === i;
                  const isCorrect = review && i === review.correctAnswer;
                  const isWrongPick = review && selected && !isCorrect;
                  return (
                    <label
                      key={i}
                      className={`flex gap-3 rounded-lg border px-4 py-3 text-sm transition ${review ? "cursor-default" : "cursor-pointer"} ${
                        isCorrect
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                          : isWrongPick
                            ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40"
                            : selected
                              ? "border-brand-600 bg-brand-50 dark:bg-brand-950/40"
                              : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`practice-${current.id}`}
                        className="sr-only"
                        checked={selected}
                        disabled={!!review}
                        onChange={() => setAnswers((prev) => ({ ...prev, [current.id]: i }))}
                      />
                      <span className="font-semibold text-slate-500">{OPTION_LABELS[i]}.</span>
                      <span className="flex-1 leading-6">
                        <RichText text={option} />
                      </span>
                      {isCorrect && <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Correct answer</span>}
                      {isWrongPick && <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Your answer</span>}
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4">
                <label htmlFor={`practice-answer-${current.id}`} className="mb-1.5 block text-sm font-medium">
                  Your answer
                </label>
                <input
                  id={`practice-answer-${current.id}`}
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={500}
                  disabled={!!review}
                  value={typeof answer === "string" ? answer : ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && !review && check()}
                  placeholder="Type your answer"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:disabled:bg-slate-900"
                />
                <p className="mt-1.5 text-xs text-slate-500">{current.answerHint}</p>
              </div>
            )}

            {review && (
              <div
                role="status"
                className={`mt-5 rounded-lg border p-4 text-sm leading-6 ${
                  review.outcome === "correct"
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
                    : "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40"
                }`}
              >
                <p className="mb-1 font-semibold">
                  {review.outcome === "correct" ? "Correct" : "Not quite"}
                  <span className="ml-2 font-normal capitalize text-slate-500">· {review.difficulty}</span>
                </p>
                {current.type === "practical" && review.outcome !== "correct" && (
                  <p className="mb-1">
                    Correct answer: <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono dark:bg-slate-900">{String(review.correctAnswer)}</code>
                  </p>
                )}
                <p className="text-slate-700 dark:text-slate-300">
                  <RichText text={review.explanation} />
                </p>
              </div>
            )}

            {error && (
              <p role="alert" className="mt-4 text-sm text-rose-700 dark:text-rose-400">
                {error}
              </p>
            )}
          </article>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className={secondaryButton}>
              ← Previous
            </button>
            <div className="flex gap-2">
              {!review && (
                <button type="button" onClick={() => go(index + 1)} disabled={index === questions.length - 1} className={secondaryButton}>
                  Skip
                </button>
              )}
              {review ? (
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  disabled={index === questions.length - 1}
                  className={primaryButton}
                >
                  {index === questions.length - 1 ? "Last question" : "Next question →"}
                </button>
              ) : (
                <button type="button" onClick={check} disabled={!hasAnswer || checking} className={primaryButton}>
                  {checking ? "Checking…" : "Check answer"}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const primaryButton =
  "rounded-md bg-brand-gradient btn-shine px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";
