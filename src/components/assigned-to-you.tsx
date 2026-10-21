import Link from "next/link";
import type { DueStatus } from "@/lib/teams";

type Assignment = {
  id: number;
  teamName: string;
  kind: "course" | "path";
  targetSlug: string;
  title: string;
  dueDate: string | null;
  pct: number;
  status: DueStatus;
};

const STATUS: Record<DueStatus, { label: string; className: string }> = {
  done: { label: "Done", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
  overdue: { label: "Overdue", className: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400" },
  "due-soon": { label: "Due soon", className: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-400" },
  "on-track": { label: "On track", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  "no-due-date": { label: "No due date", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

/** Courses and paths a learner's teams have assigned them, most urgent first. */
export function AssignedToYou({ assignments }: { assignments: Assignment[] }) {
  if (assignments.length === 0) return null;
  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <h2 className="border-b border-slate-100 px-6 py-4 font-semibold dark:border-slate-800">Assigned to you</h2>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {assignments.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4">
            <div className="min-w-0 flex-1">
              <Link href={a.kind === "course" ? `/courses/${a.targetSlug}` : "/paths"} className="font-medium hover:text-brand-700 dark:hover:text-brand-400">
                {a.title}
              </Link>
              <p className="text-xs text-slate-500">
                {a.kind === "path" ? "Learning path" : "Course"} · {a.teamName}
                {a.dueDate &&
                  ` · due ${new Date(`${a.dueDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
              </p>
            </div>
            <div className="flex w-40 items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${a.pct}%` }} />
              </div>
              <span className="w-9 text-right text-sm tabular-nums">{a.pct}%</span>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS[a.status].className}`}>{STATUS[a.status].label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
