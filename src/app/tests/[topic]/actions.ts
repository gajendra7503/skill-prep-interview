"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { MockAnswers, MockTestResult, QuestionReview } from "@/lib/content/types";
import { getCurrentUser } from "@/lib/local-auth";
import { checkPracticeAnswerFor, submitTestAttempt, toggleQuestionBookmarkFor } from "@/lib/services/learning";

async function requireUser(courseSlug: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/tests/${courseSlug}`)}`);
  return user;
}

export async function submitMockTest(
  courseSlug: string,
  questionIds: string[],
  answers: MockAnswers,
  timeTakenSeconds: number
): Promise<MockTestResult> {
  const user = await requireUser(courseSlug);
  const result = await submitTestAttempt(user.id, courseSlug, questionIds, answers, timeTakenSeconds);
  revalidatePath("/tests");
  revalidatePath(`/tests/${courseSlug}`);
  return result;
}

/** Adds or removes a bookmark on a question; returns whether it is now bookmarked. */
export async function toggleQuestionBookmark(courseSlug: string, questionId: string): Promise<boolean> {
  const user = await requireUser(courseSlug);
  const bookmarked = await toggleQuestionBookmarkFor(user.id, courseSlug, questionId);
  revalidatePath("/tests");
  return bookmarked;
}

/** Marks one practice-mode answer and returns the solution. Nothing is saved. */
export async function checkPracticeAnswer(
  courseSlug: string,
  questionId: string,
  answer: number | string | null
): Promise<QuestionReview> {
  await requireUser(courseSlug);
  return checkPracticeAnswerFor(courseSlug, questionId, answer);
}
