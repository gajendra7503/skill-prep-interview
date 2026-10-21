import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

const SESSION_COOKIE = "skillprep_session";
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 7;

export type Certificate = {
  id: string;
  userId: string;
  courseSlug: string;
  rank: number;
  startedAt?: string;
  issuedAt: string;
};
export type TestAttempt = {
  id: string;
  userId: string;
  courseSlug: string;
  /** Number of questions in the attempt. Attempts saved before quick tests existed omit it and were full tests. */
  questionCount?: number;
  /** The test mode (quick, full, easy, medium or hard). Missing on attempts saved before modes were recorded. */
  mode?: string;
  score: number;
  maxScore: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number;
  timeTakenSeconds: number;
  submittedAt: string;
};
export type QuestionBookmark = { userId: string; courseSlug: string; questionId: string; createdAt: string };
export type AuthUser = { id: string; email: string; name: string | null; role: string };

type CertificateRow = Prisma.CertificateGetPayload<object>;
type TestAttemptRow = Prisma.TestAttemptGetPayload<object>;

function toCertificate(row: CertificateRow): Certificate {
  return {
    id: row.id,
    userId: row.userId,
    courseSlug: row.courseSlug,
    rank: row.rank,
    startedAt: row.startedAt?.toISOString(),
    issuedAt: row.issuedAt.toISOString(),
  };
}

function toTestAttempt(row: TestAttemptRow): TestAttempt {
  return {
    id: row.id,
    userId: row.userId,
    courseSlug: row.courseSlug,
    questionCount: row.questionCount ?? undefined,
    mode: row.mode ?? undefined,
    score: row.score,
    maxScore: row.maxScore,
    correct: row.correct,
    incorrect: row.incorrect,
    unattempted: row.unattempted,
    accuracy: row.accuracy,
    timeTakenSeconds: row.timeTakenSeconds,
    submittedAt: row.submittedAt.toISOString(),
  };
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

function newSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    saved: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_LIFETIME_SECONDS * 1000),
    },
  };
}

async function deleteExpiredSessions() {
  await prisma.session.deleteMany({ where: { expiresAt: { lte: new Date() } } });
}

export async function createAccount(name: string, email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const salt = randomBytes(16).toString("hex");
  const passwordHash = (await hashPassword(password, salt)).toString("hex");
  const userId = randomUUID();
  const session = newSession(userId);

  try {
    await prisma.$transaction([
      prisma.user.create({
        data: { id: userId, email: normalizedEmail, name: name.trim(), passwordSalt: salt, passwordHash },
      }),
      prisma.session.create({ data: session.saved }),
    ]);
  } catch (error) {
    if (isUniqueViolation(error)) return null; // email already registered
    throw error;
  }
  await deleteExpiredSessions();
  return { id: userId, email: normalizedEmail, token: session.token };
}

export const LOGIN_LOCKOUT = { maxFailures: 5, windowMinutes: 15 };

export type SignInResult =
  | { ok: true; id: string; email: string; token: string; expiresAt: Date }
  | { ok: false; reason: "invalid" | "locked" };

/**
 * Checks a password and opens a session. After LOGIN_LOCKOUT.maxFailures failed attempts for an email
 * within the window, further attempts are refused until the window passes — this protects the API,
 * which has no CAPTCHA, as well as the website.
 */
export async function signIn(email: string, password: string): Promise<SignInResult> {
  const normalizedEmail = email.trim().toLowerCase().slice(0, 255);
  const since = new Date(Date.now() - LOGIN_LOCKOUT.windowMinutes * 60_000);
  const recentFailures = await prisma.loginAttempt.count({
    where: { email: normalizedEmail, succeeded: false, createdAt: { gte: since } },
  });
  if (recentFailures >= LOGIN_LOCKOUT.maxFailures) return { ok: false, reason: "locked" };

  const user = password.length <= 128 ? await prisma.user.findUnique({ where: { email: normalizedEmail } }) : null;
  let valid = false;
  if (user) {
    const actual = await hashPassword(password, user.passwordSalt);
    const expected = Buffer.from(user.passwordHash, "hex");
    valid = actual.length === expected.length && timingSafeEqual(actual, expected);
  } else {
    // Spend the same time hashing so response timing doesn't reveal whether the email exists.
    await hashPassword(password, randomBytes(16).toString("hex"));
  }

  await prisma.loginAttempt.create({ data: { email: normalizedEmail, succeeded: valid } });
  if (!user || !valid) return { ok: false, reason: "invalid" };

  const session = newSession(user.id);
  await prisma.session.create({ data: session.saved });
  await deleteExpiredSessions();
  await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 3_600_000) } } });
  return { ok: true, id: user.id, email: user.email, token: session.token, expiresAt: session.saved.expiresAt };
}

/** Resolves a session token (cookie or API bearer token) to its user. */
export async function getUserByToken(token: string): Promise<AuthUser | null> {
  if (!token || token.length > 200) return null;
  const session = await prisma.session.findFirst({
    where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() } },
    select: { user: { select: { id: true, email: true, name: true, role: true } } },
  });
  return session ? { ...session.user } : null;
}

/** Ends one session, e.g. when an API client signs out. */
export async function revokeToken(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_LIFETIME_SECONDS,
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? getUserByToken(token) : null;
}

export async function updateDisplayName(userId: string, name: string) {
  await prisma.user.updateMany({ where: { id: userId }, data: { name: name.trim() } });
}

export async function signOut() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCompletedLessonSlugs(courseSlug: string): Promise<Set<string>> {
  const user = await getCurrentUser();
  if (!user) return new Set();
  const rows = await prisma.completedLesson.findMany({
    where: { userId: user.id, courseSlug },
    select: { lessonSlug: true },
  });
  return new Set(rows.map((row) => row.lessonSlug));
}

export async function getCompletedCountsByCourse(): Promise<Record<string, number>> {
  const user = await getCurrentUser();
  if (!user) return {};
  const groups = await prisma.completedLesson.groupBy({
    by: ["courseSlug"],
    where: { userId: user.id },
    _count: { _all: true },
  });
  return Object.fromEntries(groups.map((group) => [group.courseSlug, group._count._all]));
}

export async function toggleLessonCompletion(userId: string, courseSlug: string, lessonSlug: string) {
  await prisma.$transaction(async (tx) => {
    const where = { userId_courseSlug_lessonSlug: { userId, courseSlug, lessonSlug } };
    const existing = await tx.completedLesson.findUnique({ where });
    if (existing) await tx.completedLesson.delete({ where });
    else await tx.completedLesson.create({ data: { userId, courseSlug, lessonSlug } });
  });
}

/** Sets a lesson's completion explicitly (idempotent), for API clients. */
export async function setLessonCompletion(userId: string, courseSlug: string, lessonSlug: string, done: boolean) {
  const where = { userId_courseSlug_lessonSlug: { userId, courseSlug, lessonSlug } };
  if (done) {
    await prisma.completedLesson.upsert({ where, update: {}, create: { userId, courseSlug, lessonSlug } });
  } else {
    await prisma.completedLesson.deleteMany({ where: { userId, courseSlug, lessonSlug } });
  }
}

/** Completed lesson slugs per course for one user. */
export async function getCompletedLessonsByCourse(userId: string): Promise<Record<string, string[]>> {
  const rows = await prisma.completedLesson.findMany({ where: { userId }, select: { courseSlug: true, lessonSlug: true } });
  const byCourse: Record<string, string[]> = {};
  for (const row of rows) (byCourse[row.courseSlug] ??= []).push(row.lessonSlug);
  return byCourse;
}

export async function getCertificate(userId: string, courseSlug: string) {
  const row = await prisma.certificate.findUnique({ where: { userId_courseSlug: { userId, courseSlug } } });
  return row ? toCertificate(row) : null;
}

export async function getCertificateCourseSlugs(userId: string): Promise<Set<string>> {
  const rows = await prisma.certificate.findMany({ where: { userId }, select: { courseSlug: true } });
  return new Set(rows.map((row) => row.courseSlug));
}

/**
 * Issues a certificate once every lesson in the course is complete. The rank is the
 * learner's position in the order of completion and is fixed at issue time. A unique
 * (course, rank) constraint stops two learners finishing at once from sharing a rank;
 * the loser of that race simply retries with the next rank.
 */
export async function issueCertificateIfComplete(
  userId: string,
  courseSlug: string,
  lessonSlugs: string[]
): Promise<{ certificate: Certificate; isNew: boolean } | null> {
  const existing = await getCertificate(userId, courseSlug);
  if (existing) return { certificate: existing, isNew: false };
  if (lessonSlugs.length === 0) return null;

  const completed = await prisma.completedLesson.findMany({
    where: { userId, courseSlug, lessonSlug: { in: lessonSlugs } },
    select: { lessonSlug: true, completedAt: true },
  });
  if (new Set(completed.map((row) => row.lessonSlug)).size < new Set(lessonSlugs).size) return null;
  const startedAt = completed.reduce<Date | null>(
    (earliest, row) => (!earliest || row.completedAt < earliest ? row.completedAt : earliest),
    null
  );

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const row = await prisma.$transaction(async (tx) => {
        const rank = (await tx.certificate.count({ where: { courseSlug } })) + 1;
        return tx.certificate.create({
          data: {
            id: `SP-${randomBytes(5).toString("hex").toUpperCase()}`,
            userId,
            courseSlug,
            rank,
            startedAt,
          },
        });
      });
      return { certificate: toCertificate(row), isNew: true };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      // Either this user's certificate was issued concurrently, or the rank was taken: re-check and retry.
      const issued = await getCertificate(userId, courseSlug);
      if (issued) return { certificate: issued, isNew: false };
    }
  }
  throw new Error(`Could not issue a certificate for ${courseSlug} after several attempts`);
}

export async function saveTestAttempt(attempt: Omit<TestAttempt, "id" | "submittedAt">): Promise<TestAttempt> {
  const row = await prisma.testAttempt.create({
    data: {
      id: randomUUID(),
      userId: attempt.userId,
      courseSlug: attempt.courseSlug,
      questionCount: attempt.questionCount ?? null,
      mode: attempt.mode ?? null,
      score: attempt.score,
      maxScore: attempt.maxScore,
      correct: attempt.correct,
      incorrect: attempt.incorrect,
      unattempted: attempt.unattempted,
      accuracy: attempt.accuracy,
      timeTakenSeconds: attempt.timeTakenSeconds,
    },
  });
  return toTestAttempt(row);
}

/** The user's attempts, newest first. */
export async function getTestAttempts(userId: string, courseSlug?: string): Promise<TestAttempt[]> {
  const rows = await prisma.testAttempt.findMany({
    where: { userId, ...(courseSlug ? { courseSlug } : {}) },
    orderBy: { submittedAt: "desc" },
  });
  return rows.map(toTestAttempt);
}

export async function getBookmarkedQuestionIds(userId: string, courseSlug: string): Promise<string[]> {
  const rows = await prisma.bookmark.findMany({
    where: { userId, courseSlug },
    select: { questionId: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => row.questionId);
}

/** Bookmark counts per course for one user. */
export async function getBookmarkCounts(userId: string): Promise<Record<string, number>> {
  const groups = await prisma.bookmark.groupBy({ by: ["courseSlug"], where: { userId }, _count: { _all: true } });
  return Object.fromEntries(groups.map((group) => [group.courseSlug, group._count._all]));
}

/** Sets a bookmark on or off explicitly (idempotent), for API clients. */
export async function setBookmark(userId: string, courseSlug: string, questionId: string, on: boolean) {
  if (on) {
    await prisma.bookmark.upsert({
      where: { userId_courseSlug_questionId: { userId, courseSlug, questionId } },
      update: {},
      create: { userId, courseSlug, questionId },
    });
  } else {
    await prisma.bookmark.deleteMany({ where: { userId, courseSlug, questionId } });
  }
}

/** Adds or removes a bookmark and returns whether the question is now bookmarked. */
export async function toggleBookmark(userId: string, courseSlug: string, questionId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const where = { userId_courseSlug_questionId: { userId, courseSlug, questionId } };
    if (await tx.bookmark.findUnique({ where })) {
      await tx.bookmark.delete({ where });
      return false;
    }
    await tx.bookmark.create({ data: { userId, courseSlug, questionId } });
    return true;
  });
}

/** Timestamps of everything the user has done (lessons completed, tests submitted), for streaks and weekly activity. */
export async function getActivityTimestamps(userId: string): Promise<{ lessons: string[]; tests: string[] }> {
  const [lessons, tests] = await Promise.all([
    prisma.completedLesson.findMany({ where: { userId }, select: { completedAt: true } }),
    prisma.testAttempt.findMany({ where: { userId }, select: { submittedAt: true } }),
  ]);
  return {
    lessons: lessons.map((row) => row.completedAt.toISOString()),
    tests: tests.map((row) => row.submittedAt.toISOString()),
  };
}

/** Public lookup for the verification page: the certificate and the name printed on it. */
export async function getCertificateById(id: string): Promise<{ certificate: Certificate; holderName: string } | null> {
  const row = await prisma.certificate.findUnique({
    where: { id: id.trim().toUpperCase() },
    include: { user: { select: { name: true } } },
  });
  if (!row) return null;
  return { certificate: toCertificate(row), holderName: row.user.name?.trim() || "SkillPrep learner" };
}

export type LeaderboardRow = {
  rank: number;
  userId: string;
  displayName: string;
  isViewer: boolean;
  pct: number;
  timeTakenSeconds: number;
  submittedAt: string;
};

/** "Priya Sharma" → "Priya S." so leaderboards never show a full name. */
function publicName(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Learner";
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export async function getLeaderboardOptIn(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { leaderboardOptIn: true } });
  return user?.leaderboardOptIn === true;
}

export async function setLeaderboardOptIn(userId: string, optIn: boolean): Promise<void> {
  await prisma.user.updateMany({ where: { id: userId }, data: { leaderboardOptIn: optIn } });
}

/**
 * Ranks learners by their best full-test score for a topic (ties: faster, then earlier). Only users who
 * opted in are listed; the viewer is always ranked so they can see where they stand, but appears to
 * others only if they opted in.
 */
export async function getLeaderboard(
  courseSlug: string,
  viewerId: string,
  options: { since?: string; fullTestSize: number; limit?: number }
): Promise<{ rows: LeaderboardRow[]; viewer: LeaderboardRow | null; total: number }> {
  const attempts = await prisma.testAttempt.findMany({
    where: {
      courseSlug,
      ...(options.since ? { submittedAt: { gte: new Date(options.since) } } : {}),
      // Full tests: recorded as mode "full", or (before modes existed) a full-length attempt.
      OR: [{ mode: "full" }, { mode: null, OR: [{ questionCount: options.fullTestSize }, { questionCount: null }] }],
      user: { OR: [{ leaderboardOptIn: true }, { id: viewerId }] },
    },
    include: { user: { select: { name: true, leaderboardOptIn: true } } },
  });

  const pctOf = (a: { score: number; maxScore: number }) => (a.maxScore > 0 ? Math.max(a.score, 0) / a.maxScore : 0);
  const best = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    const current = best.get(attempt.userId);
    if (
      !current ||
      pctOf(attempt) > pctOf(current) ||
      (pctOf(attempt) === pctOf(current) && attempt.timeTakenSeconds < current.timeTakenSeconds)
    ) {
      best.set(attempt.userId, attempt);
    }
  }

  const ranked = [...best.values()]
    .map((a) => ({ a, pct: Math.round(pctOf(a) * 100) }))
    .sort(
      (x, y) =>
        y.pct - x.pct ||
        x.a.timeTakenSeconds - y.a.timeTakenSeconds ||
        x.a.submittedAt.getTime() - y.a.submittedAt.getTime()
    )
    .map(({ a, pct }, i) => ({
      row: {
        rank: i + 1,
        userId: a.userId,
        displayName: publicName(a.user.name),
        isViewer: a.userId === viewerId,
        pct,
        timeTakenSeconds: a.timeTakenSeconds,
        submittedAt: a.submittedAt.toISOString(),
      } satisfies LeaderboardRow,
      optedIn: a.user.leaderboardOptIn,
    }));

  // Others only ever see opted-in learners; the viewer's own row is kept for them alone.
  const visible = ranked.filter(({ row, optedIn }) => row.isViewer || optedIn).map(({ row }) => row);
  return {
    rows: visible.slice(0, options.limit ?? 10),
    viewer: ranked.find(({ row }) => row.isViewer)?.row ?? null,
    total: ranked.length,
  };
}
