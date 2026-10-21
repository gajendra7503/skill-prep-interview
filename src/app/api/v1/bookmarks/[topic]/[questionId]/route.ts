import type { NextRequest } from "next/server";
import { handle, json, requireApiUser } from "@/lib/api";
import { setBookmark } from "@/lib/local-auth";
import { assertQuestionExists } from "@/lib/services/learning";

type Ctx = RouteContext<"/api/v1/bookmarks/[topic]/[questionId]">;

/** Bookmark a question (idempotent). */
export const PUT = handle(async (request: NextRequest, ctx: Ctx) => {
  const user = await requireApiUser(request);
  const { topic, questionId } = await ctx.params;
  assertQuestionExists(topic, questionId);
  await setBookmark(user.id, topic, questionId, true);
  return json({ topic, questionId, bookmarked: true });
});

/** Remove a bookmark (idempotent). */
export const DELETE = handle(async (request: NextRequest, ctx: Ctx) => {
  const user = await requireApiUser(request);
  const { topic, questionId } = await ctx.params;
  await setBookmark(user.id, topic, questionId, false);
  return json({ topic, questionId, bookmarked: false });
});
