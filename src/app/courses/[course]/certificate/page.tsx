import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCourse, getLessonModules, getLessons } from "@/lib/content";
import { getCurrentUser, issueCertificateIfComplete } from "@/lib/progress";
import { Confetti } from "@/components/confetti";
import { PrintButton } from "@/components/print-button";
import { saveCertificateName } from "./actions";
import { CourseIcon } from "@/components/course-icon";
import { ShareCertificate } from "@/components/share-certificate";
import { getSiteUrl } from "@/lib/site-url";

function ordinal(n: number) {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0]);
}

function formatDate(iso: string, month: "long" | "short" = "long") {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month, year: "numeric" });
}

// Picks dark or white text so the rank badge stays readable on light course colours.
function readableTextOn(hex: string) {
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return "#ffffff";
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? "#18181b" : "#ffffff";
}

export default async function CertificatePage({ params }: { params: Promise<{ course: string }> }) {
  const { course: courseSlug } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/courses/${courseSlug}/certificate`)}`);
  }

  const course = getCourse(courseSlug);
  if (!course) notFound();

  // Also backfills certificates for learners who finished before certificates existed.
  const lessons = getLessons(courseSlug);
  const result = await issueCertificateIfComplete(
    user.id,
    courseSlug,
    lessons.map((lesson) => lesson.slug)
  );

  if (!result) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">Certificate locked</h1>
        <p className="mb-6 text-slate-600 dark:text-slate-400">
          Complete every lesson in {course.title} to earn your certificate.
        </p>
        <Link href={`/courses/${courseSlug}`} className="font-medium text-brand-600 underline dark:text-brand-400">
          Back to course
        </Link>
      </div>
    );
  }

  if (!user.name) {
    return (
      <div className="mx-auto w-full max-w-sm px-6 py-16">
        <h1 className="mb-2 text-2xl font-bold">Congratulations!</h1>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          Enter your name as it should appear on your {course.title} certificate.
        </p>
        <form action={saveCertificateName.bind(null, courseSlug)} className="flex flex-col gap-4">
          <input
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            placeholder="Full name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-gradient btn-shine px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110"
          >
            Generate certificate
          </button>
        </form>
      </div>
    );
  }

  const { certificate } = result;
  const verifyUrl = `${await getSiteUrl()}/verify/${certificate.id}`;
  const modules = getLessonModules(courseSlug);
  const issuedOn = formatDate(certificate.issuedAt);
  const learningPeriod = certificate.startedAt
    ? `${formatDate(certificate.startedAt, "short")} – ${formatDate(certificate.issuedAt, "short")}`
    : null;
  const daysTaken = certificate.startedAt
    ? Math.max(
        1,
        Math.ceil(
          (new Date(certificate.issuedAt).getTime() - new Date(certificate.startedAt).getTime()) /
            86_400_000
        )
      )
    : null;

  const stats = [
    { label: "Lessons completed", value: String(lessons.length) },
    { label: "Modules mastered", value: String(modules.length) },
    ...(learningPeriod ? [{ label: "Learning period", value: learningPeriod }] : []),
    ...(daysTaken ? [{ label: "Time taken", value: `${daysTaken} day${daysTaken === 1 ? "" : "s"}` }] : []),
  ];

  return (
    <div
      className="mx-auto w-full max-w-5xl px-6 py-10 print:max-w-none print:p-0"
      style={{ "--accent": course.accent } as React.CSSProperties}
    >
      {/* Celebrate the first time this certificate is opened in this browser. */}
      <Confetti onceKey={`certificate-${certificate.id}`} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/courses/${courseSlug}`} className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">
          ← Back to {course.title}
        </Link>
        <PrintButton />
      </div>

      <ShareCertificate
        verifyUrl={verifyUrl}
        certificateId={certificate.id}
        courseTitle={course.title}
        issuedAt={certificate.issuedAt}
      />

      <div
        className="certificate relative w-full overflow-hidden rounded-xl border-[10px] border-double bg-white px-[5%] py-8 text-center text-slate-900 shadow-xl sm:aspect-[1.414/1] sm:py-[3.5%] print:rounded-none print:shadow-none"
        style={{ borderColor: "var(--accent)" }}
      >
        <div className="flex h-full flex-col items-center justify-between gap-5 sm:gap-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">SkillPrep Academy</p>
            <h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Certificate of Completion</h1>
          </div>

          <div className="w-full">
            <p className="text-sm text-slate-500">This is to certify that</p>
            <p
              className="mx-auto mt-1 inline-block border-b-2 px-8 pb-1 font-serif text-3xl font-semibold italic sm:text-4xl"
              style={{ borderColor: "var(--accent)" }}
            >
              {user.name}
            </p>
            <p className="mt-3 text-sm text-slate-600">has successfully completed the course</p>
            <p className="mt-1 flex items-center justify-center gap-2 text-2xl font-bold sm:text-3xl">
              <span><CourseIcon icon={course.icon} /></span> {course.title}
            </p>
            <p className="mx-auto mt-1 max-w-xl text-xs text-slate-500 sm:text-sm">{course.description}</p>
          </div>

          <div className="w-full">
            <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Skills covered
            </p>
            <ul className="mx-auto flex max-w-3xl flex-wrap justify-center gap-1.5">
              {modules.map((module) => (
                <li
                  key={module.name}
                  className="rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium text-slate-700"
                  style={{
                    borderColor: "color-mix(in srgb, var(--accent) 60%, transparent)",
                    backgroundColor: "color-mix(in srgb, var(--accent) 10%, white)",
                  }}
                >
                  {module.name}
                </li>
              ))}
            </ul>
          </div>

          <dl className="grid w-full grid-cols-2 gap-3 border-y border-slate-200 py-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-[0.65rem] uppercase tracking-wider text-slate-500">{stat.label}</dt>
                <dd className="mt-0.5 text-xs font-semibold text-slate-900 sm:text-sm">{stat.value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex w-full flex-wrap items-end justify-between gap-4 text-xs text-slate-500 sm:flex-nowrap">
            <div className="w-40 text-center">
              <p className="border-b border-slate-400 pb-1 font-serif text-lg italic text-slate-800">SkillPrep</p>
              <p className="mt-1">Head of Learning</p>
            </div>
            <div className="text-center">
              <p
                className="mx-auto flex h-16 w-16 flex-col items-center justify-center rounded-full font-bold shadow-md sm:h-20 sm:w-20"
                style={{ backgroundColor: "var(--accent)", color: readableTextOn(course.accent) }}
              >
                <span className="text-[0.55rem] uppercase tracking-wider">Rank</span>
                <span className="text-xl leading-none sm:text-2xl">#{certificate.rank}</span>
              </p>
              <p className="mt-1">{ordinal(certificate.rank)} learner to complete</p>
            </div>
            <div className="w-40 text-center">
              <p className="border-b border-slate-400 pb-1 font-semibold text-slate-800">{issuedOn}</p>
              <p className="mt-1">Date of issue</p>
            </div>
          </div>

          <p className="text-[0.65rem] text-slate-400">
            Certificate ID <span className="font-mono font-semibold text-slate-600">{certificate.id}</span> · Issued by
            SkillPrep Academy to {user.name} for completing all {lessons.length} lessons of {course.title}. Verify at{" "}
            <span className="font-mono text-slate-600">{verifyUrl.replace(/^https?:\/\//, "")}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
