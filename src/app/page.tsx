import { getAllCourses, getLessons } from "@/lib/content";
import { getCompletedCountsByCourse } from "@/lib/progress";
import { CourseCard } from "@/components/course-card";

export default async function Home() {
  const courses = getAllCourses();
  const completedCounts = await getCompletedCountsByCourse();
  const totalLessons = courses.reduce((sum, c) => sum + getLessons(c.slug).length, 0);

  return (
    <div>
      <div className="relative overflow-hidden">
        <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-6 pb-12 pt-20 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Learn to code,{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              interview-ready
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            In-depth courses that end in a real project, with an interview-style
            quiz on every lesson.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="rounded-full border border-zinc-200 bg-white/60 px-4 py-1.5 font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
              {courses.length} courses
            </span>
            <span className="rounded-full border border-zinc-200 bg-white/60 px-4 py-1.5 font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
              {totalLessons} lessons
            </span>
            <span className="rounded-full border border-zinc-200 bg-white/60 px-4 py-1.5 font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
              A quiz on every lesson
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.slug}
              course={course}
              lessonCount={getLessons(course.slug).length}
              completedCount={completedCounts[course.slug]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
