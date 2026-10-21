import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

const memberLinks = [
  { href: "/courses", label: "Courses" },
  { href: "/paths", label: "Paths" },
  { href: "/tests", label: "Mock tests" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/dashboard", label: "Dashboard" },
];

const visitorLinks = [
  { href: "/login", label: "Sign in" },
  { href: "/signup", label: "Create an account" },
];

export function Footer({ signedIn }: { signedIn: boolean }) {
  const links = signedIn ? memberLinks : visitorLinks;
  return (
    <footer className="relative mt-auto print:hidden border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <span aria-hidden="true" className="bg-brand-gradient absolute inset-x-0 top-0 h-px opacity-70" />
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BrandMark className="h-7 w-7" />
            <span className="text-base font-semibold text-slate-800 dark:text-slate-200">SkillPrep</span>
          </div>
          <p className="mt-1.5">Courses, quizzes and mock tests · © {new Date().getFullYear()} SkillPrep</p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Footer">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-transparent px-3 py-1 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 dark:hover:border-brand-900 dark:hover:bg-brand-950/60 dark:hover:text-brand-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
