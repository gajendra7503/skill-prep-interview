import { prisma } from "@/lib/db";
import { getAllCourses, getCourse, getLessons } from "@/lib/content";
import { getLearningPaths, pathProgress } from "@/lib/content/paths";
import type { AuthUser } from "@/lib/local-auth";

export type AssignmentKind = "course" | "path";
export type DueStatus = "done" | "overdue" | "due-soon" | "on-track" | "no-due-date";

/** What a user may see in the admin area: admins see everything, managers only their teams (read-only). */
export async function getAdminAccess(user: AuthUser | null) {
  if (!user) return { isAdmin: false, managedTeamIds: [] as number[], canAccess: false };
  const isAdmin = user.role === "admin";
  const managed = isAdmin
    ? []
    : (await prisma.teamMember.findMany({ where: { userId: user.id, role: "manager" }, select: { teamId: true } })).map((m) => m.teamId);
  return { isAdmin, managedTeamIds: managed, canAccess: isAdmin || managed.length > 0 };
}

/** The display title for an assignment target, or null if the course/path no longer exists. */
export function assignmentTitle(kind: string, slug: string): string | null {
  if (kind === "course") return getCourse(slug)?.title ?? null;
  return getLearningPaths().find((p) => p.slug === slug)?.title ?? null;
}

/** Percent complete for one assignment given a learner's completed-lesson counts per course. */
export function assignmentProgress(kind: string, slug: string, completed: Record<string, number>): number {
  if (kind === "course") {
    const total = getLessons(slug).length;
    return total > 0 ? Math.round((Math.min(completed[slug] ?? 0, total) / total) * 100) : 0;
  }
  const path = getLearningPaths().find((p) => p.slug === slug);
  return path ? pathProgress(path, completed).pct : 0;
}

export function dueStatus(pct: number, dueDate: Date | null, now: number): DueStatus {
  if (pct >= 100) return "done";
  if (!dueDate) return "no-due-date";
  // Due dates are whole days; a learner has until the end of the due day.
  const endOfDue = dueDate.getTime() + 86_400_000;
  if (now > endOfDue) return "overdue";
  return endOfDue - now <= 7 * 86_400_000 ? "due-soon" : "on-track";
}

async function completedCountsFor(userIds: string[]): Promise<Map<string, Record<string, number>>> {
  const groups = userIds.length
    ? await prisma.completedLesson.groupBy({ by: ["userId", "courseSlug"], where: { userId: { in: userIds } }, _count: { _all: true } })
    : [];
  const byUser = new Map<string, Record<string, number>>();
  for (const g of groups) {
    const counts = byUser.get(g.userId) ?? {};
    counts[g.courseSlug] = g._count._all;
    byUser.set(g.userId, counts);
  }
  return byUser;
}

/** Headline numbers for the admin overview. */
export async function getAdminOverview(now: number) {
  const weekAgo = new Date(now - 7 * 86_400_000);
  const monthAgo = new Date(now - 30 * 86_400_000);
  const [learners, teams, certificates, testsThisWeek, recentAttempts, activeLesson, activeTest] = await Promise.all([
    prisma.user.count(),
    prisma.team.count(),
    prisma.certificate.count(),
    prisma.testAttempt.count({ where: { submittedAt: { gte: weekAgo } } }),
    prisma.testAttempt.findMany({ where: { submittedAt: { gte: monthAgo } }, select: { score: true, maxScore: true } }),
    prisma.completedLesson.findMany({ where: { completedAt: { gte: weekAgo } }, select: { userId: true }, distinct: ["userId"] }),
    prisma.testAttempt.findMany({ where: { submittedAt: { gte: weekAgo } }, select: { userId: true }, distinct: ["userId"] }),
  ]);
  const activeThisWeek = new Set([...activeLesson, ...activeTest].map((r) => r.userId)).size;
  const avgScore = recentAttempts.length
    ? Math.round(recentAttempts.reduce((sum, a) => sum + (a.maxScore > 0 ? Math.max(a.score, 0) / a.maxScore : 0), 0) / recentAttempts.length * 100)
    : null;
  return { learners, teams, certificates, testsThisWeek, activeThisWeek, avgScore };
}

/** Teams with member/assignment counts and average completion, limited to `teamIds` if given. */
export async function listTeams(teamIds?: number[]) {
  const teams = await prisma.team.findMany({
    where: teamIds ? { id: { in: teamIds } } : undefined,
    include: { members: { select: { userId: true } }, assignments: true },
    orderBy: { name: "asc" },
  });
  const counts = await completedCountsFor([...new Set(teams.flatMap((t) => t.members.map((m) => m.userId)))]);
  return teams.map((team) => {
    const cells = team.members.flatMap((m) =>
      team.assignments.map((a) => assignmentProgress(a.kind, a.targetSlug, counts.get(m.userId) ?? {}))
    );
    return {
      id: team.id,
      name: team.name,
      description: team.description,
      memberCount: team.members.length,
      assignmentCount: team.assignments.length,
      avgCompletion: cells.length ? Math.round(cells.reduce((a, b) => a + b, 0) / cells.length) : null,
    };
  });
}

/** One team with its members, assignments and a member × assignment progress matrix. */
export async function getTeamDetail(teamId: number, now: number) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { joinedAt: "asc" } },
      assignments: { orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!team) return null;

  const userIds = team.members.map((m) => m.userId);
  const [counts, lastLessons, lastTests] = await Promise.all([
    completedCountsFor(userIds),
    prisma.completedLesson.groupBy({ by: ["userId"], where: { userId: { in: userIds } }, _max: { completedAt: true } }),
    prisma.testAttempt.findMany({
      where: { userId: { in: userIds } },
      orderBy: { submittedAt: "desc" },
      select: { userId: true, courseSlug: true, score: true, maxScore: true, submittedAt: true },
    }),
  ]);
  const lastLessonAt = new Map(lastLessons.map((l) => [l.userId, l._max.completedAt]));
  const latestTest = new Map<string, (typeof lastTests)[number]>();
  for (const t of lastTests) if (!latestTest.has(t.userId)) latestTest.set(t.userId, t);

  const assignments = team.assignments.map((a) => ({
    id: a.id,
    kind: a.kind as AssignmentKind,
    targetSlug: a.targetSlug,
    title: assignmentTitle(a.kind, a.targetSlug) ?? `${a.targetSlug} (removed)`,
    dueDate: a.dueDate ? a.dueDate.toISOString().slice(0, 10) : null,
  }));

  const members = team.members.map((m) => {
    const completed = counts.get(m.userId) ?? {};
    const test = latestTest.get(m.userId);
    const lastActive = [lastLessonAt.get(m.userId), test?.submittedAt].filter(Boolean).sort((x, y) => y!.getTime() - x!.getTime())[0] ?? null;
    return {
      userId: m.userId,
      name: m.user.name ?? m.user.email,
      email: m.user.email,
      role: m.role,
      lastActive: lastActive ? lastActive.toISOString() : null,
      latestTest: test
        ? { courseSlug: test.courseSlug, pct: test.maxScore > 0 ? Math.round((Math.max(test.score, 0) / test.maxScore) * 100) : 0 }
        : null,
      progress: team.assignments.map((a) => {
        const pct = assignmentProgress(a.kind, a.targetSlug, completed);
        return { assignmentId: a.id, pct, status: dueStatus(pct, a.dueDate, now) };
      }),
    };
  });

  return { id: team.id, name: team.name, description: team.description, assignments, members };
}

/** Everything assigned to a learner across their teams, with progress and due status. */
export async function getAssignmentsForUser(userId: string, now: number) {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: { team: { include: { assignments: true } } },
  });
  const completed = (await completedCountsFor([userId])).get(userId) ?? {};
  return memberships
    .flatMap((m) =>
      m.team.assignments.flatMap((a) => {
        const title = assignmentTitle(a.kind, a.targetSlug);
        if (!title) return [];
        const pct = assignmentProgress(a.kind, a.targetSlug, completed);
        return [
          {
            id: a.id,
            teamName: m.team.name,
            kind: a.kind as AssignmentKind,
            targetSlug: a.targetSlug,
            title,
            dueDate: a.dueDate ? a.dueDate.toISOString().slice(0, 10) : null,
            pct,
            status: dueStatus(pct, a.dueDate, now),
          },
        ];
      })
    )
    .sort((x, y) => (x.status === "done" ? 1 : 0) - (y.status === "done" ? 1 : 0) || (x.dueDate ?? "9999").localeCompare(y.dueDate ?? "9999"));
}

/** Courses and paths an admin can assign. */
export function assignableTargets() {
  return {
    courses: getAllCourses().map((c) => ({ slug: c.slug, title: c.title })),
    paths: getLearningPaths().map((p) => ({ slug: p.slug, title: p.title })),
  };
}
