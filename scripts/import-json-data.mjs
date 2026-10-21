// One-off import of the old file store (data/auth.json) into MySQL via Prisma.
// Safe to re-run: rows that already exist are skipped. Usage: npm run db:import-json
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

const root = process.cwd();
const file = path.join(root, "data", "auth.json");
if (!fs.existsSync(file)) {
  console.log("No data/auth.json found — nothing to import.");
  process.exit(0);
}

// The generated Prisma client is TypeScript, so load it through jiti (already a dependency of the toolchain).
const require = createRequire(path.join(root, "package.json"));
const { createJiti } = await import(pathToFileURL(require.resolve("jiti")).href);
const jiti = createJiti(root + "/", { alias: { "@": path.join(root, "src") } });
const { prisma } = await jiti.import("./src/lib/db.ts");

const db = JSON.parse(fs.readFileSync(file, "utf8"));
const users = db.users ?? [];
const now = Date.now();

const data = {
  users: users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name ?? null,
    passwordSalt: u.passwordSalt,
    passwordHash: u.passwordHash,
    leaderboardOptIn: u.leaderboardOptIn === true,
  })),
  sessions: (db.sessions ?? [])
    .filter((s) => s.expiresAt > now)
    .map((s) => ({ tokenHash: s.tokenHash, userId: s.userId, expiresAt: new Date(s.expiresAt) })),
  completedLessons: users.flatMap((u) =>
    (u.completedLessons ?? []).map((l) => ({
      userId: u.id,
      courseSlug: l.courseSlug,
      lessonSlug: l.lessonSlug,
      completedAt: new Date(l.completedAt),
    }))
  ),
  certificates: (db.certificates ?? []).map((c) => ({
    id: c.id,
    userId: c.userId,
    courseSlug: c.courseSlug,
    rank: c.rank,
    startedAt: c.startedAt ? new Date(c.startedAt) : null,
    issuedAt: new Date(c.issuedAt),
  })),
  testAttempts: (db.testAttempts ?? []).map((a) => ({
    id: a.id,
    userId: a.userId,
    courseSlug: a.courseSlug,
    questionCount: a.questionCount ?? null,
    mode: a.mode ?? null,
    score: a.score,
    maxScore: a.maxScore,
    correct: a.correct,
    incorrect: a.incorrect,
    unattempted: a.unattempted,
    accuracy: a.accuracy,
    timeTakenSeconds: a.timeTakenSeconds,
    submittedAt: new Date(a.submittedAt),
  })),
  bookmarks: (db.bookmarks ?? []).map((b) => ({
    userId: b.userId,
    courseSlug: b.courseSlug,
    questionId: b.questionId,
    createdAt: new Date(b.createdAt),
  })),
};

try {
  // Users first (everything else references them), all in one transaction.
  const result = await prisma.$transaction(async (tx) => ({
    users: (await tx.user.createMany({ data: data.users, skipDuplicates: true })).count,
    sessions: (await tx.session.createMany({ data: data.sessions, skipDuplicates: true })).count,
    completedLessons: (await tx.completedLesson.createMany({ data: data.completedLessons, skipDuplicates: true })).count,
    certificates: (await tx.certificate.createMany({ data: data.certificates, skipDuplicates: true })).count,
    testAttempts: (await tx.testAttempt.createMany({ data: data.testAttempts, skipDuplicates: true })).count,
    bookmarks: (await tx.bookmark.createMany({ data: data.bookmarks, skipDuplicates: true })).count,
  }));
  console.log("Imported (new rows):", result);
  console.log("In file:", Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])));
} finally {
  await prisma.$disconnect();
}
