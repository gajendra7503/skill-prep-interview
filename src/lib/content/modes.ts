import type { TestMode } from "./types";

/** Display names for test modes. Kept free of server imports so client components can use it too. */
export const MODE_LABELS: Record<TestMode["key"], string> = {
  quick: "Quick",
  full: "Full",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/** Label for a saved attempt. Attempts saved before modes were recorded are inferred from their size. */
export function attemptModeLabel(attempt: { mode?: string; questionCount?: number }): string {
  if (attempt.mode && attempt.mode in MODE_LABELS) return MODE_LABELS[attempt.mode as TestMode["key"]];
  return (attempt.questionCount ?? 50) <= 20 ? MODE_LABELS.quick : MODE_LABELS.full;
}
