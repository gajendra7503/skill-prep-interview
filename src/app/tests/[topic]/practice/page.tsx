import { notFound, redirect } from "next/navigation";
import { getCourse } from "@/lib/content";
import { getMockTest, toPublicMockTest } from "@/lib/content/tests";
import { getBookmarkedQuestionIds, getCurrentUser } from "@/lib/local-auth";
import { PracticeRunner, type PracticeFilter, type PracticeLevel } from "@/components/mock-test/practice-runner";

const FILTERS: PracticeFilter[] = ["all", "mcq", "practical", "bookmarked"];
const LEVELS: PracticeLevel[] = ["all", "easy", "medium", "hard"];

export default async function PracticePage({ params, searchParams }: PageProps<"/tests/[topic]/practice">) {
  const { topic } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/tests/${topic}/practice`)}`);

  const course = getCourse(topic);
  const test = getMockTest(topic);
  if (!course || !test) notFound();

  const query = await searchParams;
  const filter = FILTERS.find((f) => f === query.filter) ?? "all";
  const level = LEVELS.find((l) => l === query.level) ?? "all";
  const bookmarkedIds = await getBookmarkedQuestionIds(user.id, topic);
  const publicTest = toPublicMockTest(topic, test);

  const bookmarked = new Set(bookmarkedIds);
  const matchesFilter = (q: (typeof publicTest.questions)[number], f: PracticeFilter) =>
    f === "all" ? true : f === "bookmarked" ? bookmarked.has(q.id) : q.type === f;
  const matchesLevel = (q: (typeof publicTest.questions)[number], l: PracticeLevel) => l === "all" || q.difficulty === l;
  const questions = publicTest.questions.filter((q) => matchesFilter(q, filter) && matchesLevel(q, level));
  // Each chip shows how many questions it would give alongside the other active filter.
  const countWhere = (pred: (q: (typeof publicTest.questions)[number]) => boolean) => publicTest.questions.filter(pred).length;

  return (
    <PracticeRunner
      // Remount when the filter changes so position and answers reset.
      key={`${filter}-${level}`}
      courseSlug={topic}
      courseTitle={course.title}
      courseIcon={course.icon}
      title={test.title}
      filter={filter}
      level={level}
      questions={questions}
      counts={Object.fromEntries(FILTERS.map((f) => [f, countWhere((q) => matchesFilter(q, f) && matchesLevel(q, level))])) as Record<PracticeFilter, number>}
      levelCounts={Object.fromEntries(LEVELS.map((l) => [l, countWhere((q) => matchesFilter(q, filter) && matchesLevel(q, l))])) as Record<PracticeLevel, number>}
      initialBookmarks={bookmarkedIds}
    />
  );
}
