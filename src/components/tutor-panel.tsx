"use client";

import { useRef, useState } from "react";

type Turn = { role: "user" | "assistant"; content: string };

/** Minimal rendering for tutor answers: ``` code fences, `inline code`, and paragraphs. Text is never parsed as HTML. */
function AnswerText({ text }: { text: string }) {
  const parts = text.split(/```(?:[a-zA-Z0-9+#-]*)\n?([\s\S]*?)(?:```|$)/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <pre key={i} className="my-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs leading-5 text-slate-100">
            <code>{part.replace(/\n$/, "")}</code>
          </pre>
        ) : (
          part.split(/\n{2,}/).map((para, j) =>
            para.trim() ? (
              <p key={`${i}-${j}`} className="mb-2 whitespace-pre-line last:mb-0">
                {para.split(/(`[^`\n]+`)/g).map((bit, k) =>
                  bit.startsWith("`") && bit.endsWith("`") && bit.length > 1 ? (
                    <code key={k} className="rounded bg-slate-200/70 px-1 py-0.5 font-mono text-[0.85em] dark:bg-slate-700">
                      {bit.slice(1, -1)}
                    </code>
                  ) : (
                    <span key={k}>{bit}</span>
                  )
                )}
              </p>
            ) : null
          )
        )
      )}
    </>
  );
}

/** "Ask the tutor" chat for one lesson, streaming answers from /api/v1/tutor. */
export function TutorPanel({
  courseSlug,
  lessonSlug,
  enabled,
  initialRemaining,
  dailyLimit,
}: {
  courseSlug: string;
  lessonSlug: string;
  enabled: boolean;
  initialRemaining: number;
  dailyLimit: number;
}) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(initialRemaining);
  const endRef = useRef<HTMLDivElement>(null);

  async function ask() {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setError(null);
    setQuestion("");
    const history = turns;
    setTurns([...history, { role: "user", content: q }, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/v1/tutor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseSlug, lessonSlug, question: q, history }),
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "The tutor couldn't answer right now.");
      }
      setRemaining((r) => Math.max(0, r - 1));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setTurns((prev) => [...prev.slice(0, -1), { role: "assistant", content: answer }]);
        endRef.current?.scrollIntoView({ block: "nearest" });
      }
    } catch (e) {
      setTurns(history);
      setQuestion(q);
      setError(e instanceof Error ? e.message : "The tutor couldn't answer right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="my-10 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z" />
              <path d="M9 10h6M9 13.5h4" />
            </svg>
          </span>
          <span>
            <span className="block font-semibold">Stuck? Ask the tutor</span>
            <span className="block text-sm text-slate-500">
              {enabled ? `AI answers about this lesson · ${remaining} of ${dailyLimit} questions left today` : "Not available yet"}
            </span>
          </span>
        </span>
        <span className="text-slate-400" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          {!enabled ? (
            <p className="text-sm text-slate-500">The AI tutor hasn&apos;t been switched on for this site yet. An admin can enable it by adding an Anthropic API key.</p>
          ) : (
            <>
              {turns.length > 0 && (
                <div className="mb-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1" aria-live="polite">
                  {turns.map((turn, i) => (
                    <div
                      key={i}
                      className={`rounded-lg px-4 py-3 text-sm leading-6 ${
                        turn.role === "user"
                          ? "ml-8 bg-brand-700 text-white"
                          : "mr-8 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {turn.role === "assistant" && !turn.content ? (
                        <span className="text-slate-500">Thinking…</span>
                      ) : turn.role === "assistant" ? (
                        <AnswerText text={turn.content} />
                      ) : (
                        <p className="whitespace-pre-line">{turn.content}</p>
                      )}
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
              )}
              {error && <p role="alert" className="mb-3 text-sm text-rose-700 dark:text-rose-400">{error}</p>}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void ask();
                }}
                className="flex gap-2"
              >
                <label htmlFor="tutor-question" className="sr-only">Your question</label>
                <textarea
                  id="tutor-question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void ask();
                    }
                  }}
                  rows={2}
                  maxLength={1500}
                  disabled={busy || remaining <= 0}
                  placeholder={remaining > 0 ? "e.g. Why does this example print 3 3 instead of 0 1?" : "You've used today's questions — they reset at midnight IST."}
                  className="min-w-0 flex-1 resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
                />
                <button
                  type="submit"
                  disabled={busy || !question.trim() || remaining <= 0}
                  className="self-end rounded-lg bg-brand-gradient btn-shine px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "Answering…" : "Ask"}
                </button>
              </form>
              <p className="mt-2 text-xs text-slate-500">AI answers can be wrong — check important details against the lesson. Don&apos;t share personal information.</p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
