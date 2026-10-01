import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCompletedLessonSlugs(courseSlug: string): Promise<Set<string>> {
  if (!isSupabaseConfigured()) return new Set();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data } = await supabase
    .from("lesson_progress")
    .select("lesson_slug")
    .eq("user_id", user.id)
    .eq("course_slug", courseSlug)
    .eq("completed", true);

  return new Set((data ?? []).map((row) => row.lesson_slug as string));
}

export async function getCompletedCountsByCourse(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured()) return {};

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data } = await supabase
    .from("lesson_progress")
    .select("course_slug")
    .eq("user_id", user.id)
    .eq("completed", true);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const slug = row.course_slug as string;
    counts[slug] = (counts[slug] ?? 0) + 1;
  }
  return counts;
}
