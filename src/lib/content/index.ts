import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type {
  CourseMeta,
  LessonFrontmatter,
  LessonModule,
  LessonQuiz,
  LessonSummary,
  SearchableLesson,
} from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");

function courseDirs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

export function getAllCourses(): CourseMeta[] {
  return courseDirs()
    .map((slug) => getCourse(slug))
    .filter((course): course is CourseMeta => course !== null);
}

export function getCourse(slug: string): CourseMeta | null {
  const metaPath = path.join(CONTENT_DIR, slug, "meta.json");
  if (!fs.existsSync(metaPath)) return null;
  const raw = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  return { slug, ...raw };
}

function lessonFiles(courseSlug: string): string[] {
  const dir = path.join(CONTENT_DIR, courseSlug);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((file) => file.endsWith(".mdx"));
}

export function getLessons(courseSlug: string): LessonSummary[] {
  return lessonFiles(courseSlug)
    .map((file) => {
      const fullPath = path.join(CONTENT_DIR, courseSlug, file);
      const { data } = matter(fs.readFileSync(fullPath, "utf-8"));
      const frontmatter = data as LessonFrontmatter;
      return {
        ...frontmatter,
        slug: file.replace(/\.mdx$/, ""),
        courseSlug,
      };
    })
    .sort((a, b) => a.order - b.order);
}

export function getLessonModules(courseSlug: string): LessonModule[] {
  const lessons = getLessons(courseSlug);
  const modules: LessonModule[] = [];
  for (const lesson of lessons) {
    let group = modules.find((m) => m.name === lesson.module);
    if (!group) {
      group = { name: lesson.module, lessons: [] };
      modules.push(group);
    }
    group.lessons.push(lesson);
  }
  return modules;
}

export function getLessonContent(
  courseSlug: string,
  lessonSlug: string
): { frontmatter: LessonFrontmatter; content: string } | null {
  const fullPath = path.join(CONTENT_DIR, courseSlug, `${lessonSlug}.mdx`);
  if (!fs.existsSync(fullPath)) return null;
  const { data, content } = matter(fs.readFileSync(fullPath, "utf-8"));
  return { frontmatter: data as LessonFrontmatter, content };
}

export function getLessonQuiz(courseSlug: string, lessonSlug: string): LessonQuiz | null {
  const fullPath = path.join(CONTENT_DIR, courseSlug, `${lessonSlug}.quiz.json`);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, "utf-8")) as LessonQuiz;
}

export function getSearchIndex(): SearchableLesson[] {
  return getAllCourses().flatMap((course) =>
    getLessons(course.slug).map((lesson) => ({
      ...lesson,
      courseTitle: course.title,
      courseIcon: course.icon,
    }))
  );
}

export function getAdjacentLessons(
  courseSlug: string,
  lessonSlug: string
): { previous: LessonSummary | null; next: LessonSummary | null } {
  const lessons = getLessons(courseSlug);
  const index = lessons.findIndex((lesson) => lesson.slug === lessonSlug);
  return {
    previous: index > 0 ? lessons[index - 1] : null,
    next: index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null,
  };
}
