import { prisma } from "@/lib/db";
import { getLearningPaths, pathProgress } from "@/lib/content/paths";
import { currentStreak, longestStreak } from "@/lib/activity";

/** Facts about a learner that XP and badges are derived from. */
export type LearnerStats = {
  lessonsCompleted: number;
  completedByCourse: Record<string, number>;
  certificates: number;
  testsTaken: number;
  topicsTested: number;
  fullTests: number;
  bestFullPct: number;
  bestHardPct: number;
  bestAnyPct: number;
  /** Best score % per topic and mode, e.g. { "javascript:full": 72 }. */
  bestByTopicMode: Record<string, number>;
  pathsCompleted: number;
  bookmarks: number;
  currentStreak: number;
  longestStreak: number;
};

export type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
  category: "lessons" | "tests" | "certificates" | "streaks" | "other";
  earned: (s: LearnerStats) => boolean;
};

export const BADGES: BadgeDefinition[] = [
  { id: "first-lesson", name: "First Steps", description: "Complete your first lesson", category: "lessons", earned: (s) => s.lessonsCompleted >= 1 },
  { id: "lessons-25", name: "Bookworm", description: "Complete 25 lessons", category: "lessons", earned: (s) => s.lessonsCompleted >= 25 },
  { id: "lessons-100", name: "Scholar", description: "Complete 100 lessons", category: "lessons", earned: (s) => s.lessonsCompleted >= 100 },
  { id: "first-test", name: "Test Taker", description: "Submit your first mock test", category: "tests", earned: (s) => s.testsTaken >= 1 },
  { id: "full-test", name: "Marathoner", description: "Finish a full 50-question test", category: "tests", earned: (s) => s.fullTests >= 1 },
  { id: "ace", name: "Ace", description: "Score 90% or more on a full test", category: "tests", earned: (s) => s.bestFullPct >= 90 },
  { id: "hard-80", name: "Hard Hitter", description: "Score 80% or more on a Hard test", category: "tests", earned: (s) => s.bestHardPct >= 80 },
  { id: "perfect", name: "Perfect Score", description: "Score 100% on any test", category: "tests", earned: (s) => s.bestAnyPct >= 100 },
  { id: "all-rounder", name: "All-Rounder", description: "Take tests in 5 different topics", category: "tests", earned: (s) => s.topicsTested >= 5 },
  { id: "certified", name: "Certified", description: "Earn your first course certificate", category: "certificates", earned: (s) => s.certificates >= 1 },
  { id: "certified-3", name: "Triple Crown", description: "Earn 3 course certificates", category: "certificates", earned: (s) => s.certificates >= 3 },
  { id: "pathfinder", name: "Pathfinder", description: "Complete a learning path", category: "certificates", earned: (s) => s.pathsCompleted >= 1 },
  { id: "streak-7", name: "On Fire", description: "Study 7 days in a row", category: "streaks", earned: (s) => s.longestStreak >= 7 },
  { id: "streak-30", name: "Unstoppable", description: "Study 30 days in a row", category: "streaks", earned: (s) => s.longestStreak >= 30 },
  { id: "collector", name: "Collector", description: "Bookmark 10 questions to revise", category: "other", earned: (s) => s.bookmarks >= 10 },
];

/** XP needed to reach each level (index 0 = level 1). */
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000];

export const XP_RULES = { perLesson: 10, perCertificate: 100, perStreakDay: 5, maxStreakDays: 30 };

const pctOf = (score: number, max: number) => (max > 0 ? Math.round((Math.max(score, 0) / max) * 100) : 0);

export async function getLearnerStats(userId: string): Promise<LearnerStats> {
  const [lessons, certificates, attempts, bookmarks] = await Promise.all([
    prisma.completedLesson.findMany({ where: { userId }, select: { courseSlug: true, completedAt: true } }),
    prisma.certificate.count({ where: { userId } }),
    prisma.testAttempt.findMany({
      where: { userId },
      select: { courseSlug: true, mode: true, questionCount: true, score: true, maxScore: true, submittedAt: true },
    }),
    prisma.bookmark.count({ where: { userId } }),
  ]);

  const completedByCourse: Record<string, number> = {};
  for (const lesson of lessons) completedByCourse[lesson.courseSlug] = (completedByCourse[lesson.courseSlug] ?? 0) + 1;

  const bestByTopicMode: Record<string, number> = {};
  let bestFullPct = 0;
  let bestHardPct = 0;
  let bestAnyPct = 0;
  let fullTests = 0;
  for (const attempt of attempts) {
    // Attempts saved before modes were recorded were quick (≤20 questions) or full tests.
    const mode = attempt.mode ?? ((attempt.questionCount ?? 50) <= 20 ? "quick" : "full");
    const pct = pctOf(attempt.score, attempt.maxScore);
    const key = `${attempt.courseSlug}:${mode}`;
    bestByTopicMode[key] = Math.max(bestByTopicMode[key] ?? 0, pct);
    bestAnyPct = Math.max(bestAnyPct, pct);
    if (mode === "full") {
      fullTests++;
      bestFullPct = Math.max(bestFullPct, pct);
    }
    if (mode === "hard") bestHardPct = Math.max(bestHardPct, pct);
  }

  const activity = [...lessons.map((l) => l.completedAt.toISOString()), ...attempts.map((a) => a.submittedAt.toISOString())];
  const pathsCompleted = getLearningPaths().filter((path) => pathProgress(path, completedByCourse).pct === 100).length;

  return {
    lessonsCompleted: lessons.length,
    completedByCourse,
    certificates,
    testsTaken: attempts.length,
    topicsTested: new Set(attempts.map((a) => a.courseSlug)).size,
    fullTests,
    bestFullPct,
    bestHardPct,
    bestAnyPct,
    bestByTopicMode,
    pathsCompleted,
    bookmarks,
    currentStreak: currentStreak(activity),
    longestStreak: longestStreak(activity),
  };
}

export type XpBreakdown = { lessons: number; tests: number; certificates: number; streak: number; total: number };

/**
 * XP from what a learner has achieved. Tests count each topic+mode's best score once (half the
 * percentage, so up to 50), so retaking a test can raise XP but not farm it.
 */
export function computeXp(stats: LearnerStats): XpBreakdown {
  const lessons = stats.lessonsCompleted * XP_RULES.perLesson;
  const tests = Object.values(stats.bestByTopicMode).reduce((sum, pct) => sum + Math.round(pct / 2), 0);
  const certificates = stats.certificates * XP_RULES.perCertificate;
  const streak = Math.min(stats.longestStreak, XP_RULES.maxStreakDays) * XP_RULES.perStreakDay;
  return { lessons, tests, certificates, streak, total: lessons + tests + certificates + streak };
}

export function levelFor(xp: number) {
  let index = 0;
  while (index + 1 < LEVEL_THRESHOLDS.length && xp >= LEVEL_THRESHOLDS[index + 1]) index++;
  const floor = LEVEL_THRESHOLDS[index];
  const next = LEVEL_THRESHOLDS[index + 1] ?? null;
  return {
    level: index + 1,
    floor,
    next,
    progressPct: next === null ? 100 : Math.round(((xp - floor) / (next - floor)) * 100),
  };
}

export type EarnedBadge = Pick<BadgeDefinition, "id" | "name" | "description" | "category"> & { awardedAt: string };

/**
 * Awards any badges the learner now qualifies for and returns the newly awarded ones. Badges are never
 * taken away, even if (say) a lesson is later marked incomplete.
 */
export async function syncBadges(userId: string): Promise<EarnedBadge[]> {
  const stats = await getLearnerStats(userId);
  const held = new Set((await prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } })).map((b) => b.badgeId));
  const fresh = BADGES.filter((badge) => !held.has(badge.id) && badge.earned(stats));
  if (fresh.length === 0) return [];
  const awardedAt = new Date();
  await prisma.userBadge.createMany({
    data: fresh.map((badge) => ({ userId, badgeId: badge.id, awardedAt })),
    skipDuplicates: true,
  });
  return fresh.map(({ id, name, description, category }) => ({ id, name, description, category, awardedAt: awardedAt.toISOString() }));
}

/** Everything the dashboard and API need: XP, level, earned and locked badges. Syncs badges first. */
export async function getGamificationSummary(userId: string) {
  await syncBadges(userId);
  const [stats, held] = await Promise.all([
    getLearnerStats(userId),
    prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true, awardedAt: true } }),
  ]);
  const awarded = new Map(held.map((b) => [b.badgeId, b.awardedAt.toISOString()]));
  const recentSince = Date.now() - 3 * 86_400_000;
  const xp = computeXp(stats);
  return {
    xp,
    ...levelFor(xp.total),
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    badges: BADGES.map(({ id, name, description, category }) => ({
      id,
      name,
      description,
      category,
      earned: awarded.has(id),
      awardedAt: awarded.get(id) ?? null,
      /** Earned in the last 3 days, so the UI can highlight it. */
      isNew: awarded.has(id) && new Date(awarded.get(id)!).getTime() >= recentSince,
    })),
  };
}

