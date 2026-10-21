import { getLessons } from "@/lib/content";
import { getMockTest, gradeMockTest, reviewQuestion } from "@/lib/content/tests";
import type { MockAnswers, MockTestResult, QuestionReview } from "@/lib/content/types";
import {
  issueCertificateIfComplete,
  saveTestAttempt,
  setLessonCompletion,
  toggleBookmark,
  type Certificate,
} from "@/lib/local-auth";
import { syncBadges, type EarnedBadge } from "@/lib/gamification";

/** A request the caller got wrong (unknown course, bad input). Routes map this to a 4xx response. */
export class ServiceError extends Error {
  constructor(
    readonly code: "not_found" | "invalid_request",
    message: string
  ) {
    super(message);
  }
}

function requireTest(courseSlug: string) {
  const test = getMockTest(courseSlug);
  if (!test) throw new ServiceError("not_found", `No mock test for "${courseSlug}"`);
  return test;
}

function requireQuestion(courseSlug: string, questionId: string) {
  const question = requireTest(courseSlug).questions.find((q) => q.id === questionId);
  if (!question) throw new ServiceError("not_found", `Unknown question "${questionId}"`);
  return question;
}

/** Grades a test attempt on the server and saves it. Shared by the test page and the API. */
export async function submitTestAttempt(
  userId: string,
  courseSlug: string,
  questionIds: unknown,
  answers: MockAnswers,
  timeTakenSeconds: number
): Promise<MockTestResult> {
  const test = requireTest(courseSlug);
  let result: MockTestResult;
  try {
    result = gradeMockTest(test, questionIds, answers ?? {}, Number(timeTakenSeconds) || 0, getLessons(courseSlug));
  } catch {
    throw new ServiceError("invalid_request", "questionIds is not a valid question set for any test mode");
  }
  await saveTestAttempt({
    userId,
    courseSlug,
    questionCount: result.review.length,
    mode: result.modeKey,
    score: result.score,
    maxScore: result.maxScore,
    correct: result.correct,
    incorrect: result.incorrect,
    unattempted: result.unattempted,
    accuracy: result.accuracy,
    timeTakenSeconds: result.timeTakenSeconds,
  });
  const newBadges = await syncBadges(userId);
  return { ...result, newBadges: newBadges.map(({ id, name, description }) => ({ id, name, description })) };
}

/** Marks one practice answer and returns the solution. Nothing is saved. */
export function checkPracticeAnswerFor(courseSlug: string, questionId: string, answer: number | string | null): QuestionReview {
  return reviewQuestion(requireQuestion(courseSlug, questionId), answer ?? undefined);
}

export async function toggleQuestionBookmarkFor(userId: string, courseSlug: string, questionId: string): Promise<boolean> {
  requireQuestion(courseSlug, questionId);
  const bookmarked = await toggleBookmark(userId, courseSlug, questionId);
  await syncBadges(userId);
  return bookmarked;
}

export function assertQuestionExists(courseSlug: string, questionId: string) {
  requireQuestion(courseSlug, questionId);
}

/**
 * Sets a lesson's completion and, when that finishes the course, issues the certificate.
 * Returns the certificate if one was newly issued.
 */
export async function updateLessonCompletion(
  userId: string,
  courseSlug: string,
  lessonSlug: string,
  done: boolean
): Promise<{ newCertificate: Certificate | null; newBadges: EarnedBadge[] }> {
  const lessons = getLessons(courseSlug);
  if (lessons.length === 0) throw new ServiceError("not_found", `Unknown course "${courseSlug}"`);
  if (!lessons.some((lesson) => lesson.slug === lessonSlug)) {
    throw new ServiceError("not_found", `Unknown lesson "${lessonSlug}" in ${courseSlug}`);
  }
  await setLessonCompletion(userId, courseSlug, lessonSlug, done);
  const result = done ? await issueCertificateIfComplete(userId, courseSlug, lessons.map((l) => l.slug)) : null;
  const newBadges = await syncBadges(userId);
  return { newCertificate: result?.isNew ? result.certificate : null, newBadges };
}
