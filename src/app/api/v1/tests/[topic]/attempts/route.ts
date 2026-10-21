import type { NextRequest } from "next/server";
import { ApiError, handle, json, readJsonBody, requireApiUser } from "@/lib/api";
import type { MockAnswers } from "@/lib/content/types";
import { getTestAttempts } from "@/lib/local-auth";
import { submitTestAttempt } from "@/lib/services/learning";

type Ctx = RouteContext<"/api/v1/tests/[topic]/attempts">;

/** The signed-in user's attempts at this test, newest first. */
export const GET = handle(async (request: NextRequest, ctx: Ctx) => {
  const user = await requireApiUser(request);
  const { topic } = await ctx.params;
  return json({ attempts: await getTestAttempts(user.id, topic) });
});

/**
 * Submit an attempt: `{ questionIds: string[], answers: { [questionId]: optionIndex | "typed answer" }, timeTakenSeconds }`.
 * Graded on the server and saved; returns the full result with solutions.
 */
export const POST = handle(async (request: NextRequest, ctx: Ctx) => {
  const user = await requireApiUser(request);
  const { topic } = await ctx.params;
  const body = await readJsonBody(request);
  if (!Array.isArray(body.questionIds) || body.questionIds.some((id) => typeof id !== "string")) {
    throw new ApiError(400, "invalid_request", "`questionIds` must be an array of question IDs.");
  }
  const answers = body.answers ?? {};
  if (typeof answers !== "object" || Array.isArray(answers)) {
    throw new ApiError(400, "invalid_request", "`answers` must be an object keyed by question ID.");
  }
  const clean: MockAnswers = {};
  for (const [id, value] of Object.entries(answers as Record<string, unknown>)) {
    if (typeof value === "number" || typeof value === "string") clean[id] = value;
  }
  const result = await submitTestAttempt(user.id, topic, body.questionIds, clean, Number(body.timeTakenSeconds) || 0);
  return json({ result }, { status: 201 });
});
