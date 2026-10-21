import type { NextRequest } from "next/server";
import { ApiError, handle, json } from "@/lib/api";
import { getCourse, getLessonModules } from "@/lib/content";

/** One course with its modules and lesson outlines (no lesson bodies). Public. */
export const GET = handle(async (_request: NextRequest, ctx: RouteContext<"/api/v1/courses/[course]">) => {
  const { course: slug } = await ctx.params;
  const course = getCourse(slug);
  if (!course) throw new ApiError(404, "not_found", `Unknown course "${slug}"`);
  const modules = getLessonModules(slug).map((module) => ({
    name: module.name,
    lessons: module.lessons.map(({ slug: lessonSlug, title, description, level, order }) => ({
      slug: lessonSlug,
      title,
      description,
      level: level ?? null,
      order,
    })),
  }));
  return json({ course, modules });
});
