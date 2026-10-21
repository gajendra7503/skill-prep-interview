import type { LessonLevel } from "@/lib/content/types";

const LEVELS: Record<LessonLevel, { label: string; short: string; className: string }> = {
  beginner: {
    label: "Beginner",
    short: "B",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
  },
  intermediate: {
    label: "Intermediate",
    short: "I",
    className: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900",
  },
  advanced: {
    label: "Advanced",
    short: "A",
    className: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  },
  pro: {
    label: "Pro",
    short: "P",
    className: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900",
  },
};

export const LEVEL_ORDER: LessonLevel[] = ["beginner", "intermediate", "advanced", "pro"];

export function levelLabel(level: LessonLevel) {
  return LEVELS[level].label;
}

/** A small coloured pill for a lesson's level. `compact` shows a single letter (for the narrow sidebar). */
export function LevelBadge({ level, compact = false }: { level?: LessonLevel; compact?: boolean }) {
  if (!level || !LEVELS[level]) return null;
  const def = LEVELS[level];
  return (
    <span
      title={def.label}
      className={`inline-flex shrink-0 items-center rounded-full font-semibold ring-1 ring-inset ${def.className} ${
        compact ? "h-4 min-w-4 justify-center px-1 text-[10px]" : "px-2 py-0.5 text-xs"
      }`}
    >
      {compact ? def.short : def.label}
      {compact && <span className="sr-only"> ({def.label})</span>}
    </span>
  );
}
