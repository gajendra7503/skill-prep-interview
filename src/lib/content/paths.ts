import fs from "node:fs";
import path from "node:path";
import { getCourse, getLessons } from "./index";
import type { CourseMeta } from "./types";

type PathDefinition = { slug: string; title: string; description: string; outcome: string; courses: string[] };

export type PathStep = { course: CourseMeta; lessonCount: number };
export type LearningPath = Omit<PathDefinition, "courses"> & { steps: PathStep[]; lessonCount: number };

const PATHS_FILE = path.join(process.cwd(), "content", "paths.json");

/** Learning paths from content/paths.json, skipping any course that doesn't exist. */
export function getLearningPaths(): LearningPath[] {
  if (!fs.existsSync(PATHS_FILE)) return [];
  const { paths } = JSON.parse(fs.readFileSync(PATHS_FILE, "utf-8")) as { paths: PathDefinition[] };
  return paths.map(({ courses, ...rest }) => {
    const steps = courses.flatMap((slug) => {
      const course = getCourse(slug);
      return course ? [{ course, lessonCount: getLessons(slug).length }] : [];
    });
    return { ...rest, steps, lessonCount: steps.reduce((sum, step) => sum + step.lessonCount, 0) };
  });
}

export type StepStatus = "done" | "in-progress" | "not-started";

/** Progress through a path given completed-lesson counts per course. */
export function pathProgress(learningPath: LearningPath, completed: Record<string, number>) {
  const steps = learningPath.steps.map((step) => {
    const done = Math.min(completed[step.course.slug] ?? 0, step.lessonCount);
    const status: StepStatus = done >= step.lessonCount ? "done" : done > 0 ? "in-progress" : "not-started";
    return { ...step, done, status };
  });
  const doneLessons = steps.reduce((sum, step) => sum + step.done, 0);
  return {
    steps,
    doneLessons,
    pct: learningPath.lessonCount > 0 ? Math.round((doneLessons / learningPath.lessonCount) * 100) : 0,
    next: steps.find((step) => step.status !== "done") ?? null,
  };
}
