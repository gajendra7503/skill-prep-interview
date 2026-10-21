"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLessons } from "@/lib/content";
import { syncBadges } from "@/lib/gamification";
import {
  getCurrentUser,
  issueCertificateIfComplete,
  toggleLessonCompletion,
} from "@/lib/local-auth";

export async function toggleLessonComplete(courseSlug: string, lessonSlug: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await toggleLessonCompletion(user.id, courseSlug, lessonSlug);
  const lessonSlugs = getLessons(courseSlug).map((lesson) => lesson.slug);
  const result = await issueCertificateIfComplete(user.id, courseSlug, lessonSlugs);
  await syncBadges(user.id);

  revalidatePath(`/courses/${courseSlug}/${lessonSlug}`);
  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath("/dashboard");
  if (result?.isNew) redirect(`/courses/${courseSlug}/certificate`);
}
