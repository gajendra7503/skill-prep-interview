import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavLinks } from "@/components/nav-links";
import type { Theme } from "@/lib/theme";

const mobileLink =
  "rounded-md px-2.5 py-1 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100";

const navLink =
  "hidden rounded-md md:inline-flex px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100";

// The tab for the page you are on.
const activeLink = "bg-brand-gradient !text-white shadow-md shadow-brand-600/25 hover:!text-white";

const memberLinks = [
  { href: "/courses", label: "Courses" },
  { href: "/paths", label: "Paths" },
  { href: "/tests", label: "Mock tests" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/dashboard", label: "Dashboard" },
];

const headerClass =
  "print:hidden sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90";

function Brand() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5">
      <BrandMark />
      <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">SkillPrep</span>
    </Link>
  );
}

export function Navbar({
  signedIn,
  userName,
  theme,
  showAdmin = false,
}: {
  signedIn: boolean;
  /** Shown next to "Log out"; the email address is never displayed. */
  userName: string | null;
  theme: Theme;
  showAdmin?: boolean;
}) {
  // Visitors who aren't signed in get a minimal header with no links to pages they can't open.
  if (!signedIn) {
    return (
      <header className={headerClass}>
      <span aria-hidden="true" className="bg-brand-gradient absolute inset-x-0 bottom-0 h-px opacity-60" />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Brand />
          <nav className="flex shrink-0 items-center gap-1 text-sm font-medium">
            <ThemeToggle initial={theme} />
            <Link href="/login" className={mobileLink}>
              Sign in
            </Link>
            <Link
              href="/signup"
              className="ml-1 rounded-md bg-brand-gradient btn-shine px-3.5 py-1.5 font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  const links = showAdmin ? [...memberLinks, { href: "/admin", label: "Admin" }] : memberLinks;
  return (
    <header className={headerClass}>
      <span aria-hidden="true" className="bg-brand-gradient absolute inset-x-0 bottom-0 h-px opacity-60" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <Brand />
        <nav className="flex shrink-0 items-center gap-1 text-sm font-medium">
          <ThemeToggle initial={theme} />
          <NavLinks links={links} className={navLink} activeClassName={activeLink} />
          <form action={logout} className="flex items-center gap-3 md:ml-3 md:border-l md:border-slate-200 md:pl-4 md:dark:border-slate-700">
            {userName && <span className="hidden max-w-48 truncate text-slate-500 xl:inline">{userName}</span>}
            <button type="submit" className={mobileLink}>
              Log out
            </button>
          </form>
        </nav>
      </div>
      <nav aria-label="Primary" className="grid grid-cols-3 gap-x-1 gap-y-0.5 border-t border-slate-100 px-4 py-1.5 text-xs font-medium sm:text-sm md:hidden dark:border-slate-800">
        <NavLinks
          links={links}
          className={`${mobileLink} whitespace-nowrap text-center`}
          activeClassName={activeLink}
        />
      </nav>
    </header>
  );
}
