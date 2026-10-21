import type { NextRequest } from "next/server";
import { handle, json, requireApiUser } from "@/lib/api";
import { getCertificateCourseSlugs, getCompletedLessonsByCourse, getTestAttempts } from "@/lib/local-auth";
import { getGamificationSummary } from "@/lib/gamification";

/** The signed-in user with a progress summary. */
export const GET = handle(async (request: NextRequest) => {
  const user = await requireApiUser(request);
  const [completed, certificates, attempts, gamification] = await Promise.all([
    getCompletedLessonsByCourse(user.id),
    getCertificateCourseSlugs(user.id),
    getTestAttempts(user.id),
    getGamificationSummary(user.id),
  ]);
  return json({
    user,
    summary: {
      lessonsCompleted: Object.values(completed).reduce((sum, list) => sum + list.length, 0),
      certificates: [...certificates],
      testsTaken: attempts.length,
    },
    gamification,
  });
});
