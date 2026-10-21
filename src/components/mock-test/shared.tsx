/** Renders `backtick` spans as inline code; everything else as plain text. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(`[^`\n]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") && part.length > 1 ? (
          <code key={i} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] dark:bg-slate-800">
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i} className="whitespace-pre-line">
            {part}
          </span>
        )
      )}
    </>
  );
}

export function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      {language && (
        <div className="border-b border-slate-800 px-4 py-1.5 font-mono text-xs uppercase tracking-wide text-slate-500">
          {language}
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-6 text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

export type QuestionStatus = "notVisited" | "notAnswered" | "answered" | "marked" | "answeredMarked";

export const STATUS_STYLES: Record<QuestionStatus, { label: string; className: string }> = {
  notVisited: {
    label: "Not visited",
    className: "border-slate-300 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
  },
  notAnswered: {
    label: "Not answered",
    className: "border-rose-500 bg-rose-500 text-white",
  },
  answered: {
    label: "Answered",
    className: "border-emerald-500 bg-emerald-500 text-white",
  },
  marked: {
    label: "Marked for review",
    className: "border-violet-500 bg-violet-500 text-white",
  },
  answeredMarked: {
    label: "Answered & marked (will be evaluated)",
    className: "border-violet-500 bg-violet-500 text-white ring-2 ring-emerald-400 ring-offset-1 dark:ring-offset-slate-900",
  },
};
