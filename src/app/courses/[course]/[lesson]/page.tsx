import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAdjacentLessons,
  getCourse,
  getLessonContent,
  getLessonModules,
  getLessonQuiz,
} from "@/lib/content";
import { LessonSidebar } from "@/components/lesson-sidebar";
import { MdxContent } from "@/components/mdx-content";
import { MarkCompleteButton } from "@/components/mark-complete-button";
import { Quiz } from "@/components/quiz";
import { getCompletedLessonSlugs, getCurrentUser } from "@/lib/progress";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ course: string; lesson: string }>;
}) {
  const { course: courseSlug, lesson: lessonSlug } = await params;

  const course = getCourse(courseSlug);
  const lessonData = getLessonContent(courseSlug, lessonSlug);
  if (!course || !lessonData) notFound();

  const modules = getLessonModules(courseSlug);
  const quiz = getLessonQuiz(courseSlug, lessonSlug);
  const { previous, next } = getAdjacentLessons(courseSlug, lessonSlug);
  const [completed, user] = await Promise.all([
    getCompletedLessonSlugs(courseSlug),
    getCurrentUser(),
  ]);

  return (
    <div
      className="mx-auto flex max-w-5xl gap-10 px-6 py-10"
      style={{ "--accent": course.accent } as React.CSSProperties}
    >
      <LessonSidebar
        courseSlug={courseSlug}
        modules={modules}
        activeLessonSlug={lessonSlug}
        completedSlugs={completed}
      />

      <article className="min-w-0 flex-1">
        <Link
          href={`/courses/${courseSlug}`}
          className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
            color: "color-mix(in srgb, var(--accent) 70%, black)",
          }}
        >
          <span>{course.icon}</span>
          {course.title}
        </Link>
        <h1 className="mb-2 text-3xl font-bold tracking-tight">{lessonData.frontmatter.title}</h1>
        <p className="mb-8 text-zinc-600 dark:text-zinc-400">{lessonData.frontmatter.description}</p>

        <MdxContent source={lessonData.content} />

        {quiz && (
          <div className="mt-10">
            <Quiz questions={quiz.questions} />
          </div>
        )}

        <div className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <div className="mb-6">
            <MarkCompleteButton
              courseSlug={courseSlug}
              lessonSlug={lessonSlug}
              completed={completed.has(lessonSlug)}
              signedIn={Boolean(user)}
            />
          </div>
          <div className="flex items-stretch gap-3">
            {previous ? (
              <Link
                href={`/courses/${courseSlug}/${previous.slug}`}
                className="flex flex-1 flex-col rounded-xl border border-zinc-200 px-4 py-3 transition hover:border-[var(--accent)] dark:border-zinc-800"
              >
                <span className="text-xs text-zinc-500">← Previous</span>
                <span className="font-medium">{previous.title}</span>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {next ? (
              <Link
                href={`/courses/${courseSlug}/${next.slug}`}
                className="flex flex-1 flex-col items-end rounded-xl border border-zinc-200 px-4 py-3 text-right transition hover:border-[var(--accent)] dark:border-zinc-800"
              >
                <span className="text-xs text-zinc-500">Next →</span>
                <span className="font-medium">{next.title}</span>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
