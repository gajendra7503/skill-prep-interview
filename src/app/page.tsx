import Link from "next/link";
import { CountUp } from "@/components/count-up";
import { getAllCourses, getLessons } from "@/lib/content";
import { getMockTestSummaries } from "@/lib/content/tests";
import { getCurrentUser } from "@/lib/progress";
import { CourseIcon } from "@/components/course-icon";

// What visitors see before signing in: a short summary of what SkillPrep offers.
const FEATURES = [
  {
    title: "In-depth courses",
    body: "Structured lessons that end in a real project, from fundamentals to interview-level detail.",
    icon: "M4 5.5C4 4.7 4.7 4 5.5 4H10c1.1 0 2 .9 2 2v13c0-1.1-.9-2-2-2H4zM20 5.5c0-.8-.7-1.5-1.5-1.5H14c-1.1 0-2 .9-2 2v13c0-1.1.9-2 2-2h6z",
  },
  {
    title: "A quiz on every lesson",
    body: "Check your understanding as you go, with explanations for every answer.",
    icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12.5l2.5 2.5L16 9.5",
  },
  {
    title: "Timed mock tests",
    body: "Quick, full and difficulty-based tests with practical questions and a topic-wise analysis.",
    icon: "M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2.5 2.5M9 2h6",
  },
  {
    title: "AI tutor",
    body: "Stuck on a lesson? Ask questions and get answers grounded in what you are studying.",
    icon: "M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12zM9 10h6M9 13.5h4",
  },
  {
    title: "Verified certificates",
    body: "Finish a course to earn a certificate anyone can verify, ready to add to LinkedIn.",
    icon: "M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM9 13.5 7.5 21 12 18.5 16.5 21 15 13.5",
  },
  {
    title: "Progress you can see",
    body: "Learning paths, streaks, XP, badges and leaderboards keep you moving.",
    icon: "M4 19V9M10 19V5M16 19v-7M22 19H2",
  },
];

export default async function Home() {
  const courses = getAllCourses();
  const user = await getCurrentUser();
  const totalLessons = courses.reduce((sum, c) => sum + getLessons(c.slug).length, 0);
  const testQuestions = getMockTestSummaries().reduce((sum, t) => sum + t.mcqCount + t.practicalCount, 0);

  const stats = [
    { value: courses.length, label: "Courses" },
    { value: totalLessons, label: "Lessons" },
    { value: testQuestions, label: "Mock test questions" },
    { value: "100%", label: "Lessons with a quiz" },
  ];

  return (
    <div>
      <section className="hero-animated relative overflow-hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div aria-hidden="true">
          <span className="blob -left-24 -top-24 h-80 w-80 bg-brand-300 dark:bg-brand-700" />
          <span className="blob right-[-6rem] top-10 h-72 w-72 bg-fuchsia-300 dark:bg-fuchsia-800" />
          <span className="blob bottom-[-8rem] left-1/3 h-72 w-72 bg-amber-200 dark:bg-amber-700/50" />
        </div>
        <div className="stagger relative mx-auto max-w-6xl px-6 pb-16 pt-16 sm:pt-24">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-800 shadow-sm backdrop-blur dark:border-brand-900 dark:bg-brand-950/60 dark:text-brand-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            Structured learning · Interview preparation
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
            Build job-ready skills with courses, quizzes and{" "}
            <span className="text-gradient">timed mock tests</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            In-depth courses that end in a real project, an interview-style quiz on every lesson, and full-length
            tests to measure where you stand.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href={user ? "/courses" : "/signup"}
              className="group inline-flex items-center gap-2 rounded-lg bg-brand-gradient btn-shine px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:brightness-110"
            >
              {user ? "Browse courses" : "Get started free"}
              <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href={user ? "/tests" : "/login"}
              className="rounded-lg border border-slate-300 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-800 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-brand-600 dark:hover:text-brand-300"
            >
              {user ? "Take a mock test" : "Sign in"}
            </Link>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="card-lift rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70"
              >
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">{stat.label}</dt>
                <dd className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                  <CountUp value={stat.value} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {!user ? (
        <section className="mx-auto w-full max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">What you get</h2>
          <p className="mt-1 text-sm text-slate-500">Everything you need to learn a skill and prove it.</p>
          <ul className="stagger mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="card-lift group rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-md shadow-brand-600/20 transition group-hover:rotate-6 group-hover:scale-110" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={feature.icon} />
                  </svg>
                </span>
                <h3 className="font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{feature.body}</p>
              </li>
            ))}
          </ul>
          <div className="reveal mt-8 flex flex-col gap-4 rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 via-white to-amber-50 p-6 sm:flex-row dark:from-brand-950/60 dark:via-slate-900 dark:to-amber-950/30 sm:items-center sm:justify-between dark:border-brand-900">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Covers {courses.length} subjects</p>
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                {courses.map((course) => (
                  <span key={course.slug} className="inline-flex items-center gap-1.5">
                    <CourseIcon icon={course.icon} /> {course.title}
                  </span>
                ))}
              </p>
            </div>
            <Link
              href="/signup"
              className="shrink-0 rounded-md bg-brand-gradient btn-shine px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              Create a free account
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
