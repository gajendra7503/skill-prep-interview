const IST_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The calendar day (YYYY-MM-DD) a timestamp falls on in India Standard Time. */
export function istDay(timestamp: string | number | Date): string {
  return IST_DAY.format(new Date(timestamp));
}

function previousDay(day: string): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/**
 * Consecutive days with any activity, counting back from today — or from yesterday, so a streak isn't
 * shown as broken before the learner has had a chance to study today.
 */
export function currentStreak(timestamps: string[], now: Date = new Date()): number {
  const days = new Set(timestamps.map(istDay));
  let day = istDay(now);
  if (!days.has(day)) day = previousDay(day);
  let streak = 0;
  while (days.has(day)) {
    streak++;
    day = previousDay(day);
  }
  return streak;
}

/** How many timestamps fall within the last seven IST days, including today. */
export function countThisWeek(timestamps: string[], now: Date = new Date()): number {
  const window = new Set<string>();
  let day = istDay(now);
  for (let i = 0; i < 7; i++) {
    window.add(day);
    day = previousDay(day);
  }
  return timestamps.filter((t) => window.has(istDay(t))).length;
}

/** ISO timestamp for exactly seven days before now, for "this week" leaderboards. */
export function sevenDaysAgoIso(now: Date = new Date()): string {
  return new Date(now.getTime() - 7 * 86_400_000).toISOString();
}

/** The longest run of consecutive IST days with any activity. */
export function longestStreak(timestamps: string[]): number {
  const days = [...new Set(timestamps.map(istDay))].sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of days) {
    run = previous && previousDay(day) === previous ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}

/** Current time in milliseconds; a named helper so server components can read the clock once per render. */
export function nowMs(): number {
  return Date.now();
}
