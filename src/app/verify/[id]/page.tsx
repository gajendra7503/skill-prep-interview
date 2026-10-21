import type { Metadata } from "next";
import Link from "next/link";
import { getCourse } from "@/lib/content";
import { getCertificateById } from "@/lib/local-auth";
import { CourseIcon } from "@/components/course-icon";

export const metadata: Metadata = {
  title: "Verify a certificate — SkillPrep",
  robots: { index: false },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
}

/** Public page anyone can open to confirm a certificate is genuine. No sign-in needed. */
export default async function VerifyCertificatePage({ params }: PageProps<"/verify/[id]">) {
  const { id } = await params;
  const found = await getCertificateById(decodeURIComponent(id));
  const course = found ? getCourse(found.certificate.courseSlug) : null;

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-16">
      {found && course ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 border-b border-emerald-200 bg-emerald-50 px-6 py-4 dark:border-emerald-900 dark:bg-emerald-950/50">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l7 3v6c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V5z" />
              <path d="M8.5 12l2.5 2.5 4.5-5" />
            </svg>
            <div>
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">Verified certificate</p>
              <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80">Issued by SkillPrep</p>
            </div>
          </div>
          <dl className="divide-y divide-slate-100 px-6 dark:divide-slate-800">
            <div className="py-4">
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Awarded to</dt>
              <dd className="mt-1 text-2xl font-semibold tracking-tight">{found.holderName}</dd>
            </div>
            <div className="py-4">
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Course</dt>
              <dd className="mt-1 flex items-center gap-2 font-medium">
                <CourseIcon icon={course.icon} /> {course.title}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Issued on</dt>
                <dd className="mt-1">{formatDate(found.certificate.issuedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Certificate ID</dt>
                <dd className="mt-1 font-mono">{found.certificate.id}</dd>
              </div>
            </div>
          </dl>
          <p className="border-t border-slate-100 px-6 py-4 text-sm text-slate-500 dark:border-slate-800">
            This certificate confirms completion of every lesson in the {course.title} course on SkillPrep.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-xl font-semibold">No certificate found</h1>
          <p className="mt-2 text-sm text-slate-500">
            We couldn&apos;t find a certificate with the ID <span className="font-mono">{decodeURIComponent(id)}</span>. Check
            the link or ID and try again.
          </p>
        </div>
      )}
      <p className="mt-6 text-center text-sm">
        <Link href="/" className="font-medium text-brand-700 hover:underline dark:text-brand-400">
          Explore SkillPrep courses →
        </Link>
      </p>
    </div>
  );
}
