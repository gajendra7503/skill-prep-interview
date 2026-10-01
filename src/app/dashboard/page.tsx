import { redirect } from "next/navigation";
import { getAllCourses, getLessons } from "@/lib/content";
import { getCompletedCountsByCourse, getCurrentUser } from "@/lib/progress";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";
import { CourseCard } from "@/components/course-card";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseSetupNotice />;
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const courses = getAllCourses();
  const completedCounts = await getCompletedCountsByCourse();

  const totalLessons = courses.reduce((sum, c) => sum + getLessons(c.slug).length, 0);
  const totalCompleted = Object.values(completedCounts).reduce((sum, n) => sum + n, 0);
  const overallPct = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-1 text-3xl font-bold tracking-tight">Your progress</h1>
      <p className="mb-6 text-zinc-600 dark:text-zinc-400">Signed in as {user.email}</p>

      <div className="mb-10 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold">{overallPct}%</span>
          <span className="text-sm text-zinc-500">
            {totalCompleted} of {totalLessons} lessons complete
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
        {courses.map((course) => (
          <CourseCard
            key={course.slug}
            course={course}
            lessonCount={getLessons(course.slug).length}
            completedCount={completedCounts[course.slug] ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
