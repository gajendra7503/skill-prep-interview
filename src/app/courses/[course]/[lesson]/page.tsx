import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  getAdjacentLessons,
  getCourse,
  getLessonContent,
  getLessonModules,
  getLessonQuiz,
  getSearchIndex,
} from "@/lib/content";
import { SearchPalette } from "@/components/search-palette";
import { LessonSidebar } from "@/components/lesson-sidebar";
import { MdxContent } from "@/components/mdx-content";
import { MarkCompleteButton } from "@/components/mark-complete-button";
import { Quiz } from "@/components/quiz";
import { getCompletedLessonSlugs, getCurrentUser } from "@/lib/progress";
import { CourseIcon } from "@/components/course-icon";
import { LevelBadge } from "@/components/level-badge";
import { TutorPanel } from "@/components/tutor-panel";
import { tutorConfig, tutorQuota } from "@/lib/tutor";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ course: string; lesson: string }>;
}) {
  const { course: courseSlug, lesson: lessonSlug } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/courses/${courseSlug}/${lessonSlug}`)}`);
  }

  const course = getCourse(courseSlug);
  const lessonData = getLessonContent(courseSlug, lessonSlug);
  if (!course || !lessonData) notFound();

  const modules = getLessonModules(courseSlug);
  const quiz = getLessonQuiz(courseSlug, lessonSlug);
  const { previous, next } = getAdjacentLessons(courseSlug, lessonSlug);
  const completed = await getCompletedLessonSlugs(courseSlug);
  const tutor = tutorConfig();
  const quota = tutor.enabled ? await tutorQuota(user.id) : { remaining: 0, limit: tutor.dailyLimit };

  return (
    <div
      className="mx-auto flex max-w-5xl gap-10 px-6 py-10"
    >
      <LessonSidebar
        courseSlug={courseSlug}
        modules={modules}
        activeLessonSlug={lessonSlug}
        completedSlugs={completed}
      />

      <article className="min-w-0 flex-1">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/courses/${courseSlug}`}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
                color: "color-mix(in srgb, var(--accent) 70%, black)",
              }}
            >
              <CourseIcon icon={course.icon} />
              {course.title}
            </Link>
            <LevelBadge level={lessonData.frontmatter.level} />
          </div>
          <SearchPalette lessons={getSearchIndex()} />
        </div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight">{lessonData.frontmatter.title}</h1>
        <p className="mb-8 text-slate-600 dark:text-slate-400">{lessonData.frontmatter.description}</p>

        <MdxContent source={lessonData.content} />

        <TutorPanel
          courseSlug={courseSlug}
          lessonSlug={lessonSlug}
          enabled={tutor.enabled}
          initialRemaining={quota.remaining}
          dailyLimit={quota.limit}
        />

        {quiz && (
          <div className="mt-10">
            <Quiz questions={quiz.questions} />
          </div>
        )}

        <div className="mt-10 border-t border-slate-200 pt-6 dark:border-slate-800">
          <div className="mb-6">
            <MarkCompleteButton
              courseSlug={courseSlug}
              lessonSlug={lessonSlug}
              completed={completed.has(lessonSlug)}
              signedIn
            />
          </div>
          <div className="flex items-stretch gap-3">
            {previous ? (
              <Link
                href={`/courses/${courseSlug}/${previous.slug}`}
                className="flex flex-1 flex-col rounded-xl border border-slate-200 px-4 py-3 transition hover:border-[var(--accent)] dark:border-slate-800"
              >
                <span className="text-xs text-slate-500">← Previous</span>
                <span className="font-medium">{previous.title}</span>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {next ? (
              <Link
                href={`/courses/${courseSlug}/${next.slug}`}
                className="flex flex-1 flex-col items-end rounded-xl border border-slate-200 px-4 py-3 text-right transition hover:border-[var(--accent)] dark:border-slate-800"
              >
                <span className="text-xs text-slate-500">Next →</span>
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
