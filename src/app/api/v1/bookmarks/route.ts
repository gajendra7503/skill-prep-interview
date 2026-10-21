import type { NextRequest } from "next/server";
import { ApiError, handle, json, requireApiUser } from "@/lib/api";
import { getBookmarkedQuestionIds } from "@/lib/local-auth";

/** Bookmarked question IDs for one topic: `GET /api/v1/bookmarks?topic=javascript`. */
export const GET = handle(async (request: NextRequest) => {
  const user = await requireApiUser(request);
  const topic = request.nextUrl.searchParams.get("topic");
  if (!topic) throw new ApiError(400, "invalid_request", "Pass the `topic` query parameter.");
  return json({ topic, questionIds: await getBookmarkedQuestionIds(user.id, topic) });
});
