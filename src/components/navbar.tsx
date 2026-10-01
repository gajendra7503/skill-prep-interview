import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { logout } from "@/app/(auth)/actions";
import { getSearchIndex } from "@/lib/content";
import { SearchPalette } from "@/components/search-palette";

export function Navbar({ userEmail }: { userEmail: string | null }) {
  const configured = isSupabaseConfigured();
  const lessons = getSearchIndex();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/75 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/75">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm">
            S
          </span>
          <span className="text-lg font-bold tracking-tight">SkillPrep</span>
        </Link>
        <div className="flex flex-1 justify-center">
          <SearchPalette lessons={lessons} />
        </div>
        <nav className="flex shrink-0 items-center gap-6 text-sm font-medium">
          <Link href="/" className="text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50">
            Courses
          </Link>
          {configured && (
            <Link
              href="/dashboard"
              className="text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Dashboard
            </Link>
          )}
          {configured ? (
            userEmail ? (
              <form action={logout} className="flex items-center gap-3">
                <span className="text-zinc-500">{userEmail}</span>
                <button
                  type="submit"
                  className="text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Log out
                </button>
              </form>
            ) : (
              <>
                <Link href="/login" className="text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 px-3.5 py-1.5 font-semibold text-white shadow-sm transition hover:brightness-110"
                >
                  Sign up
                </Link>
              </>
            )
          ) : null}
        </nav>
      </div>
    </header>
  );
}
