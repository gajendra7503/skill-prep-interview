import fs from "node:fs";
import path from "node:path";
import { getAllCourses } from "./index";
import type {
  CourseMeta,
  LessonSummary,
  MarkingScheme,
  MockAnswers,
  MockQuestion,
  MockTest,
  MockTestResult,
  PublicMockTest,
  QuestionReview,
  ReviseLesson,
  SectionResult,
  TopicResult,
  Difficulty,
  TestMode,
} from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");

export const MARKING: MarkingScheme = { correct: 2, mcqWrong: -0.5, practicalWrong: 0 };
export const QUICK_TEST_SIZE = 20;

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
];

const scaledMinutes = (test: MockTest, count: number) =>
  Math.max(5, Math.round((test.durationMinutes * count) / test.questions.length));

/**
 * The ways a test can be taken. Mixed difficulty: a quick test that keeps the full paper's
 * MCQ/practical ratio, and the full paper. By difficulty: every question of one level. Time is scaled
 * from the full paper by question count.
 */
export function getTestModes(test: MockTest): TestMode[] {
  const total = test.questions.length;
  const mcq = test.questions.filter((q) => q.type === "mcq").length;
  const modes: TestMode[] = [];

  if (total > QUICK_TEST_SIZE) {
    const quickMcq = Math.round((QUICK_TEST_SIZE * mcq) / total);
    modes.push({
      key: "quick",
      label: "Quick test",
      questionCount: QUICK_TEST_SIZE,
      mcqCount: quickMcq,
      practicalCount: QUICK_TEST_SIZE - quickMcq,
      durationMinutes: scaledMinutes(test, QUICK_TEST_SIZE),
    });
  }
  modes.push({
    key: "full",
    label: "Full test",
    questionCount: total,
    mcqCount: mcq,
    practicalCount: total - mcq,
    durationMinutes: test.durationMinutes,
  });

  for (const level of DIFFICULTIES) {
    const pool = test.questions.filter((q) => q.difficulty === level.key);
    if (pool.length === 0) continue;
    const poolMcq = pool.filter((q) => q.type === "mcq").length;
    modes.push({
      key: level.key,
      difficulty: level.key,
      label: `${level.label} test`,
      questionCount: pool.length,
      mcqCount: poolMcq,
      practicalCount: pool.length - poolMcq,
      durationMinutes: scaledMinutes(test, pool.length),
    });
  }
  return modes;
}

/**
 * Checks that the submitted question IDs form a valid attempt — no duplicates or unknown IDs — and works
 * out its mode: a difficulty mode must contain exactly that level's questions; the mixed modes must match
 * on size and MCQ/practical split. Returns the questions in paper order.
 */
function resolveAttempt(test: MockTest, questionIds: unknown): { questions: MockQuestion[]; mode: TestMode } | null {
  if (!Array.isArray(questionIds)) return null;
  const ids = new Set(questionIds);
  if (ids.size !== questionIds.length) return null;
  const questions = test.questions.filter((q) => ids.has(q.id));
  if (questions.length !== questionIds.length || questions.length === 0) return null;

  const modes = getTestModes(test);
  const level = questions[0].difficulty;
  const levelMode = modes.find((m) => m.difficulty === level);
  if (levelMode && questions.every((q) => q.difficulty === level) && questions.length === levelMode.questionCount) {
    return { questions, mode: levelMode };
  }

  const mcq = questions.filter((q) => q.type === "mcq").length;
  const mode = modes.find((m) => !m.difficulty && m.questionCount === questions.length && m.mcqCount === mcq);
  return mode ? { questions, mode } : null;
}

export function getMockTest(courseSlug: string): MockTest | null {
  const fullPath = path.join(CONTENT_DIR, courseSlug, "mock-test.json");
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, "utf-8")) as MockTest;
}

export type MockTestSummary = {
  course: CourseMeta;
  title: string;
  durationMinutes: number;
  mcqCount: number;
  practicalCount: number;
  modes: TestMode[];
};

export function getMockTestSummaries(): MockTestSummary[] {
  return getAllCourses().flatMap((course) => {
    const test = getMockTest(course.slug);
    if (!test) return [];
    return [
      {
        course,
        title: test.title,
        durationMinutes: test.durationMinutes,
        mcqCount: test.questions.filter((q) => q.type === "mcq").length,
        practicalCount: test.questions.filter((q) => q.type === "practical").length,
        modes: getTestModes(test),
      },
    ];
  });
}

/** Strips answers and explanations so the running test can't be inspected for them. */
export function toPublicMockTest(courseSlug: string, test: MockTest): PublicMockTest {
  return {
    courseSlug,
    title: test.title,
    durationMinutes: test.durationMinutes,
    marking: MARKING,
    modes: getTestModes(test),
    questions: test.questions.map((q) => {
      const base = {
        id: q.id,
        question: q.question,
        code: q.code,
        codeLanguage: q.codeLanguage,
        difficulty: q.difficulty,
      };
      return q.type === "mcq"
        ? { ...base, type: "mcq" as const, options: q.options }
        : { ...base, type: "practical" as const, answerHint: q.answerHint };
    }),
  };
}

function normalise(value: string, caseSensitive: boolean) {
  const collapsed = value.trim().replace(/\s+/g, " ");
  return caseSensitive ? collapsed : collapsed.toLowerCase();
}

export function reviewQuestion(q: MockQuestion, raw: number | string | undefined): QuestionReview {
  const common = { id: q.id, explanation: q.explanation, difficulty: q.difficulty };

  if (q.type === "mcq") {
    const answered = typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw < q.options.length;
    if (!answered) {
      return { ...common, outcome: "unattempted", marks: 0, yourAnswer: null, correctAnswer: q.correctIndex };
    }
    const isCorrect = raw === q.correctIndex;
    return {
      ...common,
      outcome: isCorrect ? "correct" : "incorrect",
      marks: isCorrect ? MARKING.correct : MARKING.mcqWrong,
      yourAnswer: raw,
      correctAnswer: q.correctIndex,
    };
  }

  const text = typeof raw === "string" ? raw.slice(0, 500) : "";
  if (!text.trim()) {
    return { ...common, outcome: "unattempted", marks: 0, yourAnswer: null, correctAnswer: q.acceptedAnswers[0] };
  }
  const caseSensitive = q.caseSensitive ?? false;
  const given = normalise(text, caseSensitive);
  const isCorrect = q.acceptedAnswers.some((answer) => normalise(answer, caseSensitive) === given);
  return {
    ...common,
    outcome: isCorrect ? "correct" : "incorrect",
    marks: isCorrect ? MARKING.correct : MARKING.practicalWrong,
    yourAnswer: text,
    correctAnswer: q.acceptedAnswers[0],
  };
}

export function gradeMockTest(
  test: MockTest,
  questionIds: unknown,
  answers: MockAnswers,
  timeTakenSeconds: number,
  lessons: LessonSummary[] = []
): MockTestResult {
  const attempt = resolveAttempt(test, questionIds);
  if (!attempt) throw new Error("Invalid question set for this test");
  const { questions, mode } = attempt;
  const review = questions.map((q) => reviewQuestion(q, answers[q.id]));

  const sections: SectionResult[] = (["mcq", "practical"] as const).flatMap((type) => {
    const rows = review.filter((_, i) => questions[i].type === type);
    if (rows.length === 0) return [];
    return [
      {
        type,
        total: rows.length,
        correct: rows.filter((r) => r.outcome === "correct").length,
        incorrect: rows.filter((r) => r.outcome === "incorrect").length,
        unattempted: rows.filter((r) => r.outcome === "unattempted").length,
        score: rows.reduce((sum, r) => sum + r.marks, 0),
        maxScore: rows.length * MARKING.correct,
      },
    ];
  });

  const { topics, revise } = analyseTopics(questions, review, lessons);
  const correct = review.filter((r) => r.outcome === "correct").length;
  const incorrect = review.filter((r) => r.outcome === "incorrect").length;
  const attempted = correct + incorrect;

  return {
    modeKey: mode.key,
    score: review.reduce((sum, r) => sum + r.marks, 0),
    maxScore: questions.length * MARKING.correct,
    correct,
    incorrect,
    unattempted: review.length - attempted,
    accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
    timeTakenSeconds: Math.min(Math.max(Math.round(timeTakenSeconds), 0), mode.durationMinutes * 60),
    sections,
    topics,
    revise,
    review,
  };
}

/**
 * Groups results by course module (in course order) and lists the lessons behind missed or skipped
 * questions, most-missed first. Questions without a known lesson tag are left out of the analysis.
 */
function analyseTopics(
  questions: MockQuestion[],
  review: QuestionReview[],
  lessons: LessonSummary[]
): { topics: TopicResult[]; revise: ReviseLesson[] } {
  const lessonBySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
  const moduleOrder = [...new Set(lessons.map((lesson) => lesson.module))];
  const topics = new Map<string, TopicResult>();
  const missed = new Map<string, number>();

  questions.forEach((q, i) => {
    const lesson = q.lesson ? lessonBySlug.get(q.lesson) : undefined;
    if (!lesson) return;
    const outcome = review[i].outcome;
    const topic = topics.get(lesson.module) ?? { module: lesson.module, total: 0, correct: 0, incorrect: 0, unattempted: 0 };
    topic.total++;
    topic[outcome]++;
    topics.set(lesson.module, topic);
    if (outcome !== "correct") missed.set(lesson.slug, (missed.get(lesson.slug) ?? 0) + 1);
  });

  return {
    topics: [...topics.values()].sort((a, b) => moduleOrder.indexOf(a.module) - moduleOrder.indexOf(b.module)),
    revise: [...missed.entries()]
      .map(([slug, count]) => {
        const lesson = lessonBySlug.get(slug)!;
        return { slug, title: lesson.title, module: lesson.module, missed: count };
      })
      .sort((a, b) => b.missed - a.missed || lessonBySlug.get(a.slug)!.order - lessonBySlug.get(b.slug)!.order)
      .slice(0, 6),
  };
}
