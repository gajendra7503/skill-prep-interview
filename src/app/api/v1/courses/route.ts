import { handle, json } from "@/lib/api";
import { getAllCourses, getLessons } from "@/lib/content";

/** All courses with their lesson counts. Public. */
export const GET = handle(async () => {
  return json({
    courses: getAllCourses().map((course) => ({ ...course, lessonCount: getLessons(course.slug).length })),
  });
});
