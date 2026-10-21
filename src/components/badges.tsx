import type { BadgeDefinition } from "@/lib/gamification";

const GLYPHS: Record<BadgeDefinition["category"], string> = {
  // Open book
  lessons: "M4 5.5C4 4.7 4.7 4 5.5 4H10c1.1 0 2 .9 2 2v13c0-1.1-.9-2-2-2H4zM20 5.5c0-.8-.7-1.5-1.5-1.5H14c-1.1 0-2 .9-2 2v13c0-1.1.9-2 2-2h6z",
  // Check in a circle
  tests: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12.5l2.5 2.5L16 9.5",
  // Ribbon medal
  certificates: "M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM9 13.5 7.5 21 12 18.5 16.5 21 15 13.5",
  // Flame
  streaks: "M12 21c3.9 0 6.5-2.6 6.5-6.2 0-3.6-2.6-5.6-4.1-8.8-.6 1.9-1.6 3-2.9 3.6C11 7.6 10 5.6 9.4 3.5 7 6.4 5.5 9.4 5.5 14.8 5.5 18.4 8.1 21 12 21z",
  // Bookmark
  other: "M7 3.5h10v17l-5-3.7-5 3.7z",
};

/** A badge medallion: brand-coloured when earned, muted when locked. */
export function BadgeIcon({ category, earned, size = "md" }: { category: BadgeDefinition["category"]; earned: boolean; size?: "md" | "lg" }) {
  const box = size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const icon = size === "lg" ? "h-7 w-7" : "h-5 w-5";
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full ${box} ${
        earned
          ? "bg-brand-700 text-white shadow-sm ring-4 ring-brand-100 dark:ring-brand-950"
          : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
      }`}
    >
      <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={GLYPHS[category]} />
      </svg>
    </span>
  );
}

type Summary = {
  xp: { lessons: number; tests: number; certificates: number; streak: number; total: number };
  level: number;
  floor: number;
  next: number | null;
  progressPct: number;
  badges: { id: string; name: string; description: string; category: BadgeDefinition["category"]; earned: boolean; awardedAt: string | null; isNew: boolean }[];
};

/** Dashboard section: level with XP progress and breakdown, then every badge (earned first). */
export function LevelAndBadges({ summary }: { summary: Summary }) {
  const earned = summary.badges.filter((b) => b.earned);
  const ordered = [...earned.sort((a, b) => (b.awardedAt ?? "").localeCompare(a.awardedAt ?? "")), ...summary.badges.filter((b) => !b.earned)];

  return (
    <section className="mb-8 grid gap-4 lg:grid-cols-[300px_1fr]">
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Your level</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tabular-nums">Level {summary.level}</span>
        </div>
        <p className="mt-1 text-sm tabular-nums text-slate-600 dark:text-slate-400">
          {summary.xp.total.toLocaleString("en-IN")} XP
          {summary.next !== null && <> · {(summary.next - summary.xp.total).toLocaleString("en-IN")} to level {summary.level + 1}</>}
        </p>
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
          role="progressbar"
          aria-valuenow={summary.progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress to level ${summary.level + 1}`}
        >
          <div className="h-full rounded-full bg-brand-600" style={{ width: `${summary.progressPct}%` }} />
        </div>
        <dl className="mt-5 space-y-1.5 text-sm">
          {[
            ["Lessons", summary.xp.lessons],
            ["Test scores", summary.xp.tests],
            ["Certificates", summary.xp.certificates],
            ["Streak bonus", summary.xp.streak],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-slate-600 dark:text-slate-400">
              <dt>{label}</dt>
              <dd className="tabular-nums">{Number(value).toLocaleString("en-IN")} XP</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-slate-500">10 XP a lesson, 100 a certificate, up to 50 per test mode for your best score, 5 per streak day.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-semibold">Badges</h2>
          <span className="text-sm text-slate-500">
            {earned.length} of {summary.badges.length} earned
          </span>
        </div>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ordered.map((badge) => {
            return (
              <li
                key={badge.id}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  badge.earned ? "border-slate-200 dark:border-slate-700" : "border-dashed border-slate-200 dark:border-slate-800"
                }`}
              >
                <BadgeIcon category={badge.category} earned={badge.earned} />
                <div className="min-w-0">
                  <p className={`flex items-center gap-2 text-sm font-semibold ${badge.earned ? "" : "text-slate-500"}`}>
                    {badge.name}
                    {badge.isNew && (
                      <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-800 dark:bg-brand-900 dark:text-brand-200">
                        New
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {badge.description}
                    {!badge.earned && <span className="sr-only"> (locked)</span>}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
