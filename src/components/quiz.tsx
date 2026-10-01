"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/content/types";

export function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const score = Object.entries(answers).filter(
    ([qIndex, optIndex]) => questions[Number(qIndex)].correctIndex === optIndex
  ).length;

  function selectAnswer(questionIndex: number, optionIndex: number) {
    if (questionIndex in answers) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  }

  function retake() {
    setAnswers({});
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
            style={{ backgroundColor: "color-mix(in srgb, var(--accent, #6366f1) 18%, transparent)" }}
          >
            ✦
          </span>
          Check your understanding
        </h2>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            allAnswered
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {allAnswered ? `Score: ${score}/${questions.length}` : `${answeredCount}/${questions.length} answered`}
        </span>
      </div>

      <div className="space-y-6">
        {questions.map((q, qIndex) => {
          const selected = answers[qIndex];
          const isAnswered = selected !== undefined;

          return (
            <div key={qIndex}>
              <p className="mb-2 font-medium">
                {qIndex + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((option, optIndex) => {
                  const isCorrect = optIndex === q.correctIndex;
                  const isSelected = optIndex === selected;

                  let style =
                    "border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600";
                  let icon: string | null = null;
                  if (isAnswered) {
                    if (isCorrect) {
                      style = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950";
                      icon = "✓";
                    } else if (isSelected) {
                      style = "border-red-500 bg-red-50 dark:bg-red-950";
                      icon = "✗";
                    } else {
                      style = "border-zinc-200 bg-white opacity-60 dark:border-zinc-800 dark:bg-zinc-900";
                    }
                  }

                  return (
                    <button
                      key={optIndex}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => selectAnswer(qIndex, optIndex)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition disabled:cursor-default ${style}`}
                    >
                      <span className="flex-1">{option}</span>
                      {icon && (
                        <span
                          className={`shrink-0 font-bold ${
                            icon === "✓" ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          {icon}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {isAnswered && q.explanation && (
                <p className="mt-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">
                  {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {allAnswered && (
        <button
          type="button"
          onClick={retake}
          className="mt-6 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          ↻ Retake quiz
        </button>
      )}
    </div>
  );
}
