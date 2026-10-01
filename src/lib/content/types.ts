export type CourseMeta = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
};

export type LessonFrontmatter = {
  title: string;
  description: string;
  module: string;
  order: number;
};

export type LessonSummary = LessonFrontmatter & {
  slug: string;
  courseSlug: string;
};

export type LessonModule = {
  name: string;
  lessons: LessonSummary[];
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

export type LessonQuiz = {
  questions: QuizQuestion[];
};

export type SearchableLesson = LessonSummary & {
  courseTitle: string;
  courseIcon: string;
};
