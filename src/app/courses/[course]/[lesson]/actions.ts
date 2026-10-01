"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function toggleLessonComplete(
  courseSlug: string,
  lessonSlug: string,
  currentlyCompleted: boolean
) {
  if (!isSupabaseConfigured()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (currentlyCompleted) {
    await supabase
      .from("lesson_progress")
      .delete()
      .match({ user_id: user.id, course_slug: courseSlug, lesson_slug: lessonSlug });
  } else {
    await supabase.from("lesson_progress").upsert({
      user_id: user.id,
      course_slug: courseSlug,
      lesson_slug: lessonSlug,
      completed: true,
      completed_at: new Date().toISOString(),
    });
  }

  revalidatePath(`/courses/${courseSlug}/${lessonSlug}`);
  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath("/dashboard");
}
