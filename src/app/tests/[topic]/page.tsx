import { notFound, redirect } from "next/navigation";
import { getCourse } from "@/lib/content";
import { getMockTest, toPublicMockTest } from "@/lib/content/tests";
import { getBookmarkedQuestionIds, getCurrentUser, getTestAttempts } from "@/lib/local-auth";
import { MockTestRunner } from "@/components/mock-test/mock-test-runner";

export default async function MockTestPage({ params }: PageProps<"/tests/[topic]">) {
  const { topic } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/tests/${topic}`)}`);

  const course = getCourse(topic);
  const test = getMockTest(topic);
  if (!course || !test) notFound();

  const [attempts, bookmarkedIds] = await Promise.all([
    getTestAttempts(user.id, topic),
    getBookmarkedQuestionIds(user.id, topic),
  ]);

  return (
    <div>
      <MockTestRunner
        test={toPublicMockTest(topic, test)}
        courseTitle={course.title}
        courseIcon={course.icon}
        attempts={attempts.slice(0, 5)}
        bookmarkedIds={bookmarkedIds}
      />
    </div>
  );
}
