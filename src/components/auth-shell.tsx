import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";

const POINTS = [
  "Courses from Beginner to Pro, each ending in a real project",
  "A quiz on every lesson and timed mock tests",
  "An AI tutor, badges, streaks and verified certificates",
];

/** Two-panel frame for the sign-in and sign-up pages: a branded panel beside the form on wide screens. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-5xl flex-1 items-stretch gap-0 px-6 py-12 lg:grid-cols-2 lg:py-16">
      <aside className="bg-brand-gradient relative hidden overflow-hidden rounded-l-3xl p-10 text-white shadow-2xl shadow-brand-900/30 lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true">
          <span className="blob -left-16 -top-16 h-56 w-56 bg-fuchsia-400/60" />
          <span className="blob -bottom-20 right-[-3rem] h-64 w-64 bg-amber-300/50" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <span className="rounded-xl bg-white/15 p-1.5 ring-1 ring-white/25 backdrop-blur">
              <BrandMark className="h-8 w-8" />
            </span>
            <span className="text-lg font-semibold">SkillPrep</span>
          </div>
          <h2 className="mt-10 text-3xl font-bold leading-tight">
            Learn it properly.
            <br />
            <span className="text-amber-200">Prove it with a certificate.</span>
          </h2>
        </div>
        <ul className="stagger relative mt-10 space-y-4">
          {POINTS.map((point) => (
            <li key={point} className="flex items-start gap-3 text-sm leading-6 text-white/90">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold ring-1 ring-white/30">
                ✓
              </span>
              {point}
            </li>
          ))}
        </ul>
      </aside>
      <div className="animate-scale-in flex flex-col justify-center rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-brand-500/10 sm:p-10 lg:rounded-l-none lg:border-l-0 dark:border-slate-800 dark:bg-slate-900">
        {children}
      </div>
    </div>
  );
}
