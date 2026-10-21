import { handle, json } from "@/lib/api";
import { getMockTestSummaries } from "@/lib/content/tests";

/** Available mock tests and their modes. Public. */
export const GET = handle(async () => {
  return json({
    tests: getMockTestSummaries().map(({ course, title, mcqCount, practicalCount, modes }) => ({
      topic: course.slug,
      courseTitle: course.title,
      title,
      questionCount: mcqCount + practicalCount,
      mcqCount,
      practicalCount,
      modes,
    })),
  });
});
