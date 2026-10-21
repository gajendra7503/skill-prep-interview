import type { NextRequest } from "next/server";
import { ApiError, handle, json, readJsonBody, requireApiUser } from "@/lib/api";
import { checkPracticeAnswerFor } from "@/lib/services/learning";

/** Practice mode: check one answer `{ questionId, answer }` and get the solution. Nothing is saved. */
export const POST = handle(async (request: NextRequest, ctx: RouteContext<"/api/v1/tests/[topic]/check">) => {
  await requireApiUser(request);
  const { topic } = await ctx.params;
  const body = await readJsonBody(request);
  if (typeof body.questionId !== "string") throw new ApiError(400, "invalid_request", "Send `questionId`.");
  const answer = typeof body.answer === "number" || typeof body.answer === "string" ? body.answer : null;
  return json({ review: checkPracticeAnswerFor(topic, body.questionId, answer) });
});
