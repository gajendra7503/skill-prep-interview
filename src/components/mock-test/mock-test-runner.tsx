"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { submitMockTest } from "@/app/tests/[topic]/actions";
import type { MockAnswers, MockTestResult, PublicMockTest, TestMode } from "@/lib/content/types";
import type { TestAttempt } from "@/lib/local-auth";
import { MockTestResultView } from "./mock-test-result";
import { CourseIcon } from "@/components/course-icon";
import { attemptModeLabel } from "@/lib/content/modes";
import {
  CodeBlock,
  OPTION_LABELS,
  RichText,
  STATUS_STYLES,
  formatClock,
  formatDuration,
  type QuestionStatus,
} from "./shared";

type Session = {
  modeKey: TestMode["key"];
  /** The questions drawn for this attempt, in paper order. */
  questionIds: string[];
  durationSeconds: number;
  startedAt: number;
  current: number;
  answers: MockAnswers;
  visited: string[];
  marked: string[];
};

type Phase = "instructions" | "test" | "submitting" | "result";

const storageKey = (courseSlug: string) => `skillprep-mock-test:${courseSlug}`;
const storageListeners = new Set<() => void>();

function subscribeToStorage(listener: () => void) {
  storageListeners.add(listener);
  return () => storageListeners.delete(listener);
}

function readRawSession(courseSlug: string): string | null {
  try {
    return window.sessionStorage.getItem(storageKey(courseSlug));
  } catch {
    return null;
  }
}

function parseSession(raw: string | null): Session | null {
  try {
    const session = raw ? (JSON.parse(raw) as Session) : null;
    // Ignore sessions saved before tests had selectable modes.
    return session && Array.isArray(session.questionIds) && session.durationSeconds > 0 ? session : null;
  } catch {
    return null;
  }
}

function writeSession(courseSlug: string, session: Session | null) {
  try {
    if (session) window.sessionStorage.setItem(storageKey(courseSlug), JSON.stringify(session));
    else window.sessionStorage.removeItem(storageKey(courseSlug));
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the test still works without resume.
  }
  storageListeners.forEach((listener) => listener());
}

/**
 * Picks the questions for an attempt: every question of the level for a difficulty mode, the whole paper for
 * the full test, and a random subset with the same MCQ/practical mix for the quick test.
 */
function drawQuestionIds(test: PublicMockTest, mode: TestMode): string[] {
  if (mode.difficulty) return test.questions.filter((q) => q.difficulty === mode.difficulty).map((q) => q.id);
  if (mode.questionCount >= test.questions.length) return test.questions.map((q) => q.id);
  const pick = (ids: string[], count: number) => {
    const pool = [...ids];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  };
  const chosen = new Set([
    ...pick(test.questions.filter((q) => q.type === "mcq").map((q) => q.id), mode.mcqCount),
    ...pick(test.questions.filter((q) => q.type === "practical").map((q) => q.id), mode.practicalCount),
  ]);
  return test.questions.filter((q) => chosen.has(q.id)).map((q) => q.id);
}

function hasAnswer(answers: MockAnswers, id: string) {
  const value = answers[id];
  return typeof value === "number" || (typeof value === "string" && value.trim() !== "");
}

export function MockTestRunner({
  test,
  courseTitle,
  courseIcon,
  attempts,
  bookmarkedIds,
}: {
  test: PublicMockTest;
  courseTitle: string;
  courseIcon: string;
  attempts: TestAttempt[];
  bookmarkedIds: string[];
}) {
  const [phase, setPhase] = useState<Phase>("instructions");
  const [session, setSession] = useState<Session | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [result, setResult] = useState<MockTestResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const sessionRef = useRef<Session | null>(null);

  // An unfinished attempt saved in this browser tab, offered for resuming on the instructions screen.
  const savedRaw = useSyncExternalStore(
    subscribeToStorage,
    () => readRawSession(test.courseSlug),
    () => null
  );
  const savedSession = useMemo(() => parseSession(savedRaw), [savedRaw]);

  const questionIds = session?.questionIds;
  const attemptQuestions = useMemo(() => {
    const byId = new Map(test.questions.map((q) => [q.id, q]));
    return (questionIds ?? []).flatMap((id) => byId.get(id) ?? []);
  }, [test.questions, questionIds]);
  const durationSeconds = session?.durationSeconds ?? 0;

  useEffect(() => {
    sessionRef.current = session;
    if (session) writeSession(test.courseSlug, session);
  }, [session, test.courseSlug]);

  const elapsedSeconds = session ? Math.floor((now - session.startedAt) / 1000) : 0;
  const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

  const submit = useCallback(
    async (toSubmit: Session) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setConfirmOpen(false);
      setPhase("submitting");
      setError(null);
      try {
        const elapsed = Math.floor((Date.now() - toSubmit.startedAt) / 1000);
        const graded = await submitMockTest(test.courseSlug, toSubmit.questionIds, toSubmit.answers, elapsed);
        writeSession(test.courseSlug, null);
        setResult(graded);
        setPhase("result");
        window.scrollTo({ top: 0 });
      } catch {
        setError("We couldn't submit your test. Check your connection and try again — your answers are saved.");
        setPhase("test");
      } finally {
        submittingRef.current = false;
      }
    },
    [test.courseSlug]
  );

  // Tick the clock while the test is running, and auto-submit when time runs out.
  useEffect(() => {
    if (phase !== "test") return;
    const timer = window.setInterval(() => {
      const current = sessionRef.current;
      const tick = Date.now();
      setNow(tick);
      if (current && tick - current.startedAt >= current.durationSeconds * 1000) void submit(current);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, submit]);

  // Warn before leaving mid-test (answers survive a reload, but the clock keeps running).
  useEffect(() => {
    if (phase !== "test") return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

  function start(length: TestMode) {
    const ids = drawQuestionIds(test, length);
    begin({
      modeKey: length.key,
      questionIds: ids,
      durationSeconds: length.durationMinutes * 60,
      startedAt: Date.now(),
      current: 0,
      answers: {},
      visited: ids.length > 0 ? [ids[0]] : [],
      marked: [],
    });
  }

  function begin(next: Session) {
    setNow(Date.now());
    setSession(next);
    setResult(null);
    setPhase("test");
  }

  function retake() {
    writeSession(test.courseSlug, null);
    setSession(null);
    setResult(null);
    setPhase("instructions");
    window.scrollTo({ top: 0 });
  }

  if (phase === "result" && result) {
    return (
      <MockTestResultView
        test={test}
        questions={attemptQuestions}
        result={result}
        bookmarkedIds={bookmarkedIds}
        onRetake={retake}
      />
    );
  }

  if (phase === "instructions" || !session) {
    const savedRemaining = savedSession
      ? Math.max(0, savedSession.durationSeconds - Math.floor((now - savedSession.startedAt) / 1000))
      : 0;
    return (
      <Instructions
        test={test}
        courseTitle={courseTitle}
        courseIcon={courseIcon}
        attempts={attempts}
        bookmarkCount={bookmarkedIds.length}
        savedRemaining={savedSession ? savedRemaining : null}
        savedMode={test.modes.find((l) => l.key === savedSession?.modeKey) ?? null}
        onStart={start}
        onResume={() => {
          if (!savedSession) return;
          if (savedRemaining === 0) void submit(savedSession);
          else begin(savedSession);
        }}
      />
    );
  }

  const questions = attemptQuestions;
  const current = questions[session.current];
  const marked = new Set(session.marked);
  const visited = new Set(session.visited);
  const firstPracticalIndex = questions.findIndex((q) => q.type === "practical");

  const statusOf = (id: string): QuestionStatus => {
    const answered = hasAnswer(session.answers, id);
    if (marked.has(id)) return answered ? "answeredMarked" : "marked";
    if (answered) return "answered";
    return visited.has(id) ? "notAnswered" : "notVisited";
  };

  const counts = questions.reduce(
    (acc, q) => ({ ...acc, [statusOf(q.id)]: acc[statusOf(q.id)] + 1 }),
    { notVisited: 0, notAnswered: 0, answered: 0, marked: 0, answeredMarked: 0 } as Record<QuestionStatus, number>
  );

  function goTo(index: number) {
    if (index < 0 || index >= questions.length) return;
    setSession((s) => {
      if (!s) return s;
      const id = questions[index].id;
      return { ...s, current: index, visited: s.visited.includes(id) ? s.visited : [...s.visited, id] };
    });
    setPaletteOpen(false);
  }

  function setAnswer(value: number | string | null) {
    setSession((s) => {
      if (!s) return s;
      const answers = { ...s.answers };
      if (value === null || (typeof value === "string" && value === "")) delete answers[current.id];
      else answers[current.id] = value;
      return { ...s, answers };
    });
  }

  function markAndNext() {
    setSession((s) => (s && !s.marked.includes(current.id) ? { ...s, marked: [...s.marked, current.id] } : s));
    goTo(Math.min(session!.current + 1, questions.length - 1));
  }

  function saveAndNext() {
    setSession((s) => (s ? { ...s, marked: s.marked.filter((id) => id !== current.id) } : s));
    goTo(Math.min(session!.current + 1, questions.length - 1));
  }

  const lowTime = remainingSeconds <= 300;
  const answer = session.answers[current.id];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="sticky top-[98px] z-30 md:top-[57px] -mx-4 mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:-mx-6 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xl" aria-hidden="true">
            <CourseIcon icon={courseIcon} />
          </span>
          <h1 className="truncate font-semibold">{test.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div
            role="timer"
            aria-label="Time remaining"
            className={`rounded-lg px-3 py-1.5 font-mono text-sm font-semibold tabular-nums ${
              lowTime
                ? "animate-pulse bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="mr-1.5 inline h-4 w-4 align-[-3px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9 2h6" /></svg>
            {formatClock(remainingSeconds)}
          </div>
          <button
            type="button"
            onClick={() => setPaletteOpen((open) => !open)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium lg:hidden dark:border-slate-700"
            aria-expanded={paletteOpen}
          >
            Questions
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={phase === "submitting"}
            className="rounded-lg bg-brand-gradient btn-shine px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
          >
            {phase === "submitting" ? "Submitting…" : "Submit test"}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section aria-label="Question" className="min-w-0">
          {firstPracticalIndex > 0 && (
            <div className="mb-4 flex gap-2" role="tablist" aria-label="Sections">
              {[
                { label: "Multiple choice", index: 0, active: current.type === "mcq" },
                { label: "Practical", index: firstPracticalIndex, active: current.type === "practical" },
              ].map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  aria-selected={tab.active}
                  onClick={() => goTo(tab.index)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    tab.active
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold">
                Question {session.current + 1} of {questions.length}
              </span>
              <span className="text-slate-500">
                Marks: <span className="font-medium text-emerald-600">+{test.marking.correct}</span>
                {" · "}
                <span className="font-medium text-rose-600">
                  {current.type === "mcq" ? test.marking.mcqWrong : test.marking.practicalWrong}
                </span>
              </span>
            </div>

            <p className="text-base font-medium leading-7">
              <RichText text={current.question} />
            </p>
            {current.code && <CodeBlock code={current.code} language={current.codeLanguage} />}

            {current.type === "mcq" ? (
              <div className="mt-4 space-y-2.5" role="radiogroup" aria-label="Options">
                {current.options.map((option, i) => {
                  const selected = answer === i;
                  return (
                    <label
                      key={i}
                      className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                        selected
                          ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
                          : "border-slate-200 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${current.id}`}
                        className="sr-only"
                        checked={selected}
                        onChange={() => setAnswer(i)}
                      />
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                          selected ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-slate-300 text-slate-500 dark:border-slate-600"
                        }`}
                      >
                        {OPTION_LABELS[i]}
                      </span>
                      <span className="flex-1 leading-6">
                        <RichText text={option} />
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4">
                <label htmlFor={`answer-${current.id}`} className="mb-1.5 block text-sm font-medium">
                  Your answer
                </label>
                <input
                  id={`answer-${current.id}`}
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={500}
                  value={typeof answer === "string" ? answer : ""}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveAndNext();
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_25%,transparent)] dark:border-slate-700 dark:bg-slate-950"
                  placeholder="Type your answer"
                />
                <p className="mt-1.5 text-xs text-slate-500">{current.answerHint}</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={markAndNext} className={secondaryButton}>
                Mark for review & next
              </button>
              <button
                type="button"
                onClick={() => setAnswer(null)}
                disabled={!hasAnswer(session.answers, current.id)}
                className={secondaryButton}
              >
                Clear response
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => goTo(session.current - 1)}
                disabled={session.current === 0}
                className={secondaryButton}
              >
                ← Previous
              </button>
              <button
                type="button"
                onClick={session.current === questions.length - 1 ? () => setConfirmOpen(true) : saveAndNext}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
              >
                {session.current === questions.length - 1 ? "Save & finish" : "Save & next →"}
              </button>
            </div>
          </div>
        </section>

        <aside
          aria-label="Question palette"
          className={`${paletteOpen ? "block" : "hidden"} self-start rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-[130px] lg:block dark:border-slate-800 dark:bg-slate-900`}
        >
          <ul className="mb-4 grid grid-cols-1 gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            {(Object.keys(STATUS_STYLES) as QuestionStatus[]).map((status) => (
              <li key={status} className="flex items-center gap-2">
                <span className={`flex h-5 min-w-5 items-center justify-center rounded border px-1 text-[10px] font-semibold ${STATUS_STYLES[status].className}`}>
                  {counts[status]}
                </span>
                {STATUS_STYLES[status].label}
              </li>
            ))}
          </ul>

          {[
            { label: "Multiple choice", items: questions.map((q, i) => ({ q, i })).filter(({ q }) => q.type === "mcq") },
            { label: "Practical", items: questions.map((q, i) => ({ q, i })).filter(({ q }) => q.type === "practical") },
          ]
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <div key={group.label} className="mb-4 last:mb-0">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.label}</h2>
                <div className="grid grid-cols-6 gap-1.5">
                  {group.items.map(({ q, i }) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`Question ${i + 1}: ${STATUS_STYLES[statusOf(q.id)].label}`}
                      aria-current={i === session.current ? "step" : undefined}
                      className={`flex h-8 items-center justify-center rounded-md border text-xs font-semibold transition ${STATUS_STYLES[statusOf(q.id)].className} ${
                        i === session.current ? "outline outline-2 outline-offset-2 outline-[var(--accent)]" : ""
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </aside>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-title"
          onKeyDown={(e) => e.key === "Escape" && setConfirmOpen(false)}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h2 id="submit-title" className="mb-1 text-lg font-semibold">
              Submit test?
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Time left: {formatClock(remainingSeconds)}. You can&apos;t change answers after submitting.
            </p>
            <dl className="mb-6 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Answered", counts.answered + counts.answeredMarked],
                ["Not answered", counts.notAnswered + counts.marked],
                ["Marked for review", counts.marked + counts.answeredMarked],
                ["Not visited", counts.notVisited],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="text-lg font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex justify-end gap-2">
              <button type="button" autoFocus onClick={() => setConfirmOpen(false)} className={secondaryButton}>
                Keep working
              </button>
              <button
                type="button"
                onClick={() => void submit(session)}
                className="rounded-lg bg-brand-gradient btn-shine px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const secondaryButton =
  "rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500";

function Instructions({
  test,
  courseTitle,
  courseIcon,
  attempts,
  bookmarkCount,
  savedRemaining,
  savedMode,
  onStart,
  onResume,
}: {
  test: PublicMockTest;
  courseTitle: string;
  courseIcon: string;
  attempts: TestAttempt[];
  bookmarkCount: number;
  savedRemaining: number | null;
  savedMode: TestMode | null;
  onStart: (length: TestMode) => void;
  onResume: () => void;
}) {
  const [selectedKey, setSelectedKey] = useState<TestMode["key"]>("full");
  const selected = test.modes.find((l) => l.key === selectedKey) ?? test.modes[0];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/tests" className="mb-6 inline-block text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        ← All tests
      </Link>
      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-3xl dark:border-slate-700 dark:bg-slate-800">
          <CourseIcon icon={courseIcon} />
        </span>
        <div>
          <p className="text-sm font-medium text-slate-500">{courseTitle}</p>
          <h1 className="text-3xl font-bold tracking-tight">{test.title}</h1>
        </div>
      </div>

      <fieldset className="mb-6">
        <legend className="mb-3 text-base font-semibold">Choose your test</legend>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Mixed difficulty</h3>
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          {test.modes
            .filter((mode) => !mode.difficulty)
            .map((mode) => (
              <ModeCard key={mode.key} mode={mode} marking={test.marking.correct} selected={mode.key === selected.key} onSelect={setSelectedKey} />
            ))}
        </div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">By difficulty</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {test.modes
            .filter((mode) => mode.difficulty)
            .map((mode) => (
              <ModeCard key={mode.key} mode={mode} marking={test.marking.correct} selected={mode.key === selected.key} onSelect={setSelectedKey} compact />
            ))}
        </div>
      </fieldset>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 text-sm leading-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-base font-semibold">Instructions</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-slate-700 dark:text-slate-300">
          <li>
            The timer starts when you begin and keeps running if you leave the page. The test submits automatically
            when time runs out.
          </li>
          <li>
            Each correct answer earns <strong>+{test.marking.correct}</strong>. A wrong multiple-choice answer costs{" "}
            <strong>{Math.abs(test.marking.mcqWrong)}</strong>; wrong practical answers cost nothing. Unanswered
            questions score 0.
          </li>
          <li>
            Practical questions need a typed answer, such as a value, a keyword or one line of output. Spacing and
            capitalisation are ignored unless the hint says otherwise.
          </li>
          <li>
            Use <em>Mark for review</em> to flag a question to revisit. Marked questions that have an answer are still
            evaluated.
          </li>
          <li>Your answers are saved in this browser tab, so you can reload without losing them.</li>
        </ul>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        {savedRemaining !== null && savedRemaining > 0 ? (
          <>
            <button type="button" onClick={onResume} className={primaryButton}>
              Resume {savedMode ? savedMode.label.toLowerCase() : "test"} ({formatClock(savedRemaining)} left)
            </button>
            <button type="button" onClick={() => onStart(selected)} className={secondaryButton}>
              Start a new {selected.label.toLowerCase()} instead
            </button>
          </>
        ) : savedRemaining === 0 ? (
          <button type="button" onClick={onResume} className={primaryButton}>
            Time&apos;s up — submit saved answers
          </button>
        ) : (
          <button type="button" onClick={() => onStart(selected)} className={primaryButton}>
            Start {selected.label.toLowerCase()} · {selected.questionCount} questions
          </button>
        )}
      </div>

      <div className="mb-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="font-semibold">Practice mode</h2>
          <p className="text-sm text-slate-500">No timer and no score — check each answer as you go and read the explanation.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href={`/tests/${test.courseSlug}/practice`} className={secondaryButton}>
            Practise all
          </Link>
          <Link href={`/tests/${test.courseSlug}/practice?filter=bookmarked`} className={secondaryButton}>
            Bookmarked ({bookmarkCount})
          </Link>
        </div>
      </div>

      {attempts.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-base font-semibold">Your recent attempts</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Test</th>
                  <th className="py-2 pr-4 font-medium">Score</th>
                  <th className="py-2 pr-4 font-medium">Accuracy</th>
                  <th className="py-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                    <td className="py-2 pr-4">
                      {new Date(a.submittedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td className="py-2 pr-4">{attemptModeLabel(a)} · {a.questionCount ?? test.questions.length} Q</td>
                    <td className="py-2 pr-4 font-medium">
                      {a.score} / {a.maxScore}
                    </td>
                    <td className="py-2 pr-4">{a.accuracy}%</td>
                    <td className="py-2">{formatDuration(a.timeTakenSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const MODE_BLURBS: Record<TestMode["key"], string> = {
  quick: "A fresh random set each attempt — good for a quick check.",
  full: "Every question in the paper — the complete mock exam.",
  easy: "Fundamentals and warm-up questions.",
  medium: "The core of what interviews ask.",
  hard: "Tricky edge cases and deeper internals.",
};

const DIFFICULTY_DOT: Record<string, string> = {
  easy: "bg-emerald-500",
  medium: "bg-amber-500",
  hard: "bg-rose-500",
};

function ModeCard({
  mode,
  marking,
  selected,
  onSelect,
  compact = false,
}: {
  mode: TestMode;
  marking: number;
  selected: boolean;
  onSelect: (key: TestMode["key"]) => void;
  compact?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer flex-col rounded-xl border bg-white p-4 transition dark:bg-slate-900 ${
        selected
          ? "border-brand-600 ring-2 ring-brand-600/20"
          : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
      }`}
    >
      <input type="radio" name="test-mode" value={mode.key} checked={selected} onChange={() => onSelect(mode.key)} className="sr-only" />
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-semibold">
          {mode.difficulty && <span aria-hidden="true" className={`h-2 w-2 rounded-full ${DIFFICULTY_DOT[mode.difficulty]}`} />}
          {mode.label}
        </span>
        <span
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 rounded-full border-2 ${
            selected
              ? "border-brand-600 bg-brand-600 shadow-[inset_0_0_0_2px_white] dark:shadow-[inset_0_0_0_2px_#0f172a]"
              : "border-slate-300 dark:border-slate-600"
          }`}
        />
      </span>
      <span className="mt-1 text-2xl font-semibold tabular-nums">
        {mode.questionCount} <span className="text-sm font-medium text-slate-500">questions</span>
      </span>
      <span className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {mode.durationMinutes} min · max {mode.questionCount * marking} marks
        {!compact && ` · ${mode.mcqCount} MCQ + ${mode.practicalCount} practical`}
      </span>
      <span className="mt-1 text-xs text-slate-500">{MODE_BLURBS[mode.key]}</span>
    </label>
  );
}

const primaryButton =
  "rounded-lg bg-brand-gradient btn-shine px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110";
