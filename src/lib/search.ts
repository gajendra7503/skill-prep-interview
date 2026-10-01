import type { SearchableLesson } from "@/lib/content/types";

function scoreLesson(lesson: SearchableLesson, query: string): number {
  const title = lesson.title.toLowerCase();
  const description = lesson.description.toLowerCase();
  const moduleName = lesson.module.toLowerCase();
  const course = lesson.courseTitle.toLowerCase();

  if (title.startsWith(query)) return 0;
  if (title.includes(query)) return 1;
  if (moduleName.includes(query)) return 2;
  if (course.includes(query)) return 3;
  if (description.includes(query)) return 4;
  return -1;
}

export function rankLessons(lessons: SearchableLesson[], rawQuery: string): SearchableLesson[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];

  return lessons
    .map((lesson) => ({ lesson, score: scoreLesson(lesson, query) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => a.score - b.score)
    .map((entry) => entry.lesson);
}
