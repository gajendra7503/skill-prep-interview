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
  /** How far along the Beginner → Pro journey the lesson sits. */
  level?: LessonLevel;
  order: number;
};

export type LessonLevel = "beginner" | "intermediate" | "advanced" | "pro";

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

export type Difficulty = "easy" | "medium" | "hard";

type MockQuestionBase = {
  id: string;
  /** Slug of the lesson this question tests; drives the topic analysis on the results page. */
  lesson?: string;
  question: string;
  code?: string;
  codeLanguage?: string;
  difficulty: Difficulty;
  explanation: string;
};

export type MockMcqQuestion = MockQuestionBase & {
  type: "mcq";
  options: string[];
  correctIndex: number;
};

export type MockPracticalQuestion = MockQuestionBase & {
  type: "practical";
  answerHint: string;
  acceptedAnswers: string[];
  caseSensitive?: boolean;
};

export type MockQuestion = MockMcqQuestion | MockPracticalQuestion;

export type MockTest = {
  title: string;
  durationMinutes: number;
  questions: MockQuestion[];
};

/** What the browser receives while the test is running: no answers or explanations. */
export type PublicMockQuestion =
  | Omit<MockMcqQuestion, "correctIndex" | "explanation" | "lesson">
  | Omit<MockPracticalQuestion, "acceptedAnswers" | "caseSensitive" | "explanation" | "lesson">;

/**
 * A way to sit the test: a quick random subset or the full paper (mixed difficulty), or every question
 * of one difficulty level.
 */
export type TestMode = {
  key: "quick" | "full" | Difficulty;
  /** Set for difficulty modes: every question in the attempt has this difficulty. */
  difficulty?: Difficulty;
  label: string;
  questionCount: number;
  mcqCount: number;
  practicalCount: number;
  durationMinutes: number;
};

export type PublicMockTest = {
  courseSlug: string;
  title: string;
  durationMinutes: number;
  marking: MarkingScheme;
  modes: TestMode[];
  questions: PublicMockQuestion[];
};

export type MarkingScheme = { correct: number; mcqWrong: number; practicalWrong: number };

/** A submitted answer: an option index for MCQs, typed text for practical questions. */
export type MockAnswers = Record<string, number | string>;

export type QuestionReview = {
  id: string;
  outcome: "correct" | "incorrect" | "unattempted";
  marks: number;
  yourAnswer: number | string | null;
  correctAnswer: number | string;
  explanation: string;
  difficulty: MockQuestion["difficulty"];
};

export type SectionResult = {
  type: MockQuestion["type"];
  total: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  score: number;
  maxScore: number;
};

/** How the learner did on one module of the course. */
export type TopicResult = {
  module: string;
  total: number;
  correct: number;
  incorrect: number;
  unattempted: number;
};

/** A lesson worth revisiting because questions on it were missed or skipped. */
export type ReviseLesson = {
  slug: string;
  title: string;
  module: string;
  missed: number;
};

export type MockTestResult = {
  modeKey: TestMode["key"];
  score: number;
  maxScore: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number;
  timeTakenSeconds: number;
  sections: SectionResult[];
  topics: TopicResult[];
  revise: ReviseLesson[];
  review: QuestionReview[];
  /** Badges this attempt unlocked (filled in after saving). */
  newBadges?: { id: string; name: string; description: string }[];
};
