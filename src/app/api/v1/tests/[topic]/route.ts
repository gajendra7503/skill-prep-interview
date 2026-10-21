import type { NextRequest } from "next/server";
import { ApiError, handle, json, requireApiUser } from "@/lib/api";
import { getMockTest, toPublicMockTest } from "@/lib/content/tests";

/**
 * A test's questions, without answers or explanations. Choose a mode from `modes`, pick its question IDs
 * (all questions of that difficulty, the whole paper, or a random quick-test subset with the stated MCQ /
 * practical split), then POST them with the answers to /api/v1/tests/{topic}/attempts.
 */
export const GET = handle(async (request: NextRequest, ctx: RouteContext<"/api/v1/tests/[topic]">) => {
  await requireApiUser(request);
  const { topic } = await ctx.params;
  const test = getMockTest(topic);
  if (!test) throw new ApiError(404, "not_found", `No mock test for "${topic}"`);
  return json(toPublicMockTest(topic, test));
});
