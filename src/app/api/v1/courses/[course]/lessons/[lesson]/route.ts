import type { NextRequest } from "next/server";
import { ApiError, handle, json, requireApiUser } from "@/lib/api";
import { getAdjacentLessons, getLessonContent, getLessonQuiz } from "@/lib/content";

/** A lesson's MDX source and quiz. Requires sign-in, like the lesson pages. */
export const GET = handle(async (request: NextRequest, ctx: RouteContext<"/api/v1/courses/[course]/lessons/[lesson]">) => {
  await requireApiUser(request);
  const { course, lesson } = await ctx.params;
  const content = getLessonContent(course, lesson);
  if (!content) throw new ApiError(404, "not_found", `Unknown lesson "${lesson}" in ${course}`);
  const { previous, next } = getAdjacentLessons(course, lesson);
  return json({
    courseSlug: course,
    slug: lesson,
    ...content.frontmatter,
    format: "mdx",
    content: content.content,
    quiz: getLessonQuiz(course, lesson),
    previous: previous ? { slug: previous.slug, title: previous.title } : null,
    next: next ? { slug: next.slug, title: next.title } : null,
  });
});
