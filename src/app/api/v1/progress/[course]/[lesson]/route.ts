import type { NextRequest } from "next/server";
import { handle, json, requireApiUser } from "@/lib/api";
import { updateLessonCompletion } from "@/lib/services/learning";

type Ctx = RouteContext<"/api/v1/progress/[course]/[lesson]">;

/** Mark a lesson complete (idempotent). Returns a certificate if this finished the course. */
export const PUT = handle(async (request: NextRequest, ctx: Ctx) => {
  const user = await requireApiUser(request);
  const { course, lesson } = await ctx.params;
  const { newCertificate, newBadges } = await updateLessonCompletion(user.id, course, lesson, true);
  return json({ courseSlug: course, lessonSlug: lesson, completed: true, newCertificate, newBadges });
});

/** Mark a lesson not complete (idempotent). */
export const DELETE = handle(async (request: NextRequest, ctx: Ctx) => {
  const user = await requireApiUser(request);
  const { course, lesson } = await ctx.params;
  await updateLessonCompletion(user.id, course, lesson, false);
  return json({ courseSlug: course, lessonSlug: lesson, completed: false });
});
