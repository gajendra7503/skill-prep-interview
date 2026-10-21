import type { NextRequest } from "next/server";
import { ApiError, handle, json, readJsonBody, requireApiUser } from "@/lib/api";
import { TutorError, streamTutorAnswer, tutorConfig, tutorQuota, type TutorTurn } from "@/lib/tutor";

/** Whether the tutor is available and how many questions the user has left today. */
export const GET = handle(async (request: NextRequest) => {
  const user = await requireApiUser(request);
  const { enabled } = tutorConfig();
  return json({ enabled, quota: await tutorQuota(user.id) });
});

/**
 * Ask the tutor about a lesson: `{ courseSlug, lessonSlug, question, history?: [{ role, content }] }`.
 * The answer streams back as plain text.
 */
export const POST = handle(async (request: NextRequest) => {
  const user = await requireApiUser(request);
  const body = await readJsonBody(request);
  const { courseSlug, lessonSlug, question } = body;
  if (typeof courseSlug !== "string" || typeof lessonSlug !== "string" || typeof question !== "string") {
    throw new ApiError(400, "invalid_request", "Send `courseSlug`, `lessonSlug` and `question`.");
  }
  const history = Array.isArray(body.history) ? (body.history as TutorTurn[]) : [];

  try {
    const stream = await streamTutorAnswer({ userId: user.id, courseSlug, lessonSlug, question, history });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch (error) {
    if (error instanceof TutorError) throw new ApiError(error.status, error.code, error.message);
    throw error;
  }
});
