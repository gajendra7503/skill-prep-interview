import type { NextRequest } from "next/server";
import { handle, json, requireApiUser } from "@/lib/api";
import { getAllCourses, getLessons } from "@/lib/content";
import { getCertificateCourseSlugs, getCompletedLessonsByCourse } from "@/lib/local-auth";

/** Per-course progress for the signed-in user. */
export const GET = handle(async (request: NextRequest) => {
  const user = await requireApiUser(request);
  const [completed, certified] = await Promise.all([getCompletedLessonsByCourse(user.id), getCertificateCourseSlugs(user.id)]);
  return json({
    courses: getAllCourses().map((course) => {
      const total = getLessons(course.slug).length;
      const done = completed[course.slug] ?? [];
      return {
        courseSlug: course.slug,
        completedLessons: done,
        completed: done.length,
        total,
        percent: total > 0 ? Math.round((done.length / total) * 100) : 0,
        certified: certified.has(course.slug),
      };
    }),
  });
});
