import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { assignableTargets, getAdminAccess, getTeamDetail, type DueStatus } from "@/lib/teams";
import { nowMs } from "@/lib/activity";
import { Notice } from "@/components/admin/notice";
import { addAssignment, addMember, deleteTeam, removeAssignment, removeMember, setMemberRole } from "../../actions";

const input =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950";
const smallButton =
  "rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-400";

const STATUS: Record<DueStatus, { label: string; className: string }> = {
  done: { label: "Done", className: "text-emerald-700 dark:text-emerald-400" },
  overdue: { label: "Overdue", className: "text-rose-700 dark:text-rose-400" },
  "due-soon": { label: "Due soon", className: "text-amber-700 dark:text-amber-400" },
  "on-track": { label: "On track", className: "text-slate-500" },
  "no-due-date": { label: "", className: "text-slate-500" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

export default async function TeamPage({ params, searchParams }: PageProps<"/admin/teams/[id]">) {
  const { id } = await params;
  const teamId = Number(id);
  if (!Number.isInteger(teamId)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/admin/teams/${id}`)}`);
  const access = await getAdminAccess(user);
  if (!access.isAdmin && !access.managedTeamIds.includes(teamId)) redirect("/admin");

  const team = await getTeamDetail(teamId, nowMs());
  if (!team) notFound();
  const query = await searchParams;
  const targets = assignableTargets();
  const canEdit = access.isAdmin;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <Link href="/admin" className="mb-6 inline-block text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        ← {access.isAdmin ? "Admin" : "Your teams"}
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{team.name}</h1>
          {team.description && <p className="mt-1 text-slate-600 dark:text-slate-400">{team.description}</p>}
        </div>
        <div className="flex gap-2">
          <a href={`/admin/teams/${team.id}/export`} className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Export CSV
          </a>
          {canEdit && (
            <form action={deleteTeam.bind(null, team.id)}>
              <button type="submit" className="rounded-md border border-rose-200 px-3.5 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40">
                Delete team
              </button>
            </form>
          )}
        </div>
      </div>
      <Notice notice={typeof query.notice === "string" ? query.notice : undefined} error={typeof query.error === "string" ? query.error : undefined} />

      <section className="mb-8 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="font-semibold">Progress</h2>
          <span className="text-xs text-slate-500">% complete per assignment</span>
        </div>
        {team.members.length === 0 || team.assignments.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">
            {team.members.length === 0 ? "Add members to see progress." : "Add an assignment to track progress."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-6 py-3 font-medium">Member</th>
                  {team.assignments.map((a) => (
                    <th key={a.id} scope="col" className="px-3 py-3 font-medium">
                      <span className="block normal-case tracking-normal text-slate-700 dark:text-slate-300">{a.title}</span>
                      <span className="font-normal normal-case tracking-normal">{a.dueDate ? `Due ${formatDate(a.dueDate)}` : "No due date"}</span>
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-3 font-medium">Latest test</th>
                  <th scope="col" className="px-6 py-3 font-medium">Last active</th>
                </tr>
              </thead>
              <tbody>
                {team.members.map((m) => (
                  <tr key={m.userId} className="border-t border-slate-100 dark:border-slate-800">
                    <th scope="row" className="px-6 py-3 text-left font-medium">
                      {m.name}
                      {m.role === "manager" && <span className="ml-2 text-xs font-normal text-brand-700 dark:text-brand-400">Manager</span>}
                    </th>
                    {m.progress.map((p) => (
                      <td key={p.assignmentId} className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full rounded-full bg-brand-600" style={{ width: `${p.pct}%` }} />
                          </div>
                          <span className="tabular-nums">{p.pct}%</span>
                        </div>
                        {STATUS[p.status].label && <span className={`text-xs font-medium ${STATUS[p.status].className}`}>{STATUS[p.status].label}</span>}
                      </td>
                    ))}
                    <td className="px-3 py-3 tabular-nums text-slate-600 dark:text-slate-400">
                      {m.latestTest ? `${m.latestTest.pct}% · ${m.latestTest.courseSlug}` : "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{m.lastActive ? formatDate(m.lastActive) : "Never"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold">Members ({team.members.length})</h2>
          <ul className="mb-5 divide-y divide-slate-100 dark:divide-slate-800">
            {team.members.map((m) => (
              <li key={m.userId} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span>
                  <span className="font-medium">{m.name}</span>
                  <span className="block text-xs text-slate-500">{m.email} · {m.role}</span>
                </span>
                {canEdit && (
                  <span className="flex gap-2">
                    <form action={setMemberRole.bind(null, team.id, m.userId, m.role === "manager" ? "member" : "manager")}>
                      <button type="submit" className={smallButton}>{m.role === "manager" ? "Make member" : "Make manager"}</button>
                    </form>
                    <form action={removeMember.bind(null, team.id, m.userId)}>
                      <button type="submit" className={smallButton}>Remove</button>
                    </form>
                  </span>
                )}
              </li>
            ))}
            {team.members.length === 0 && <li className="py-2.5 text-sm text-slate-500">No members yet.</li>}
          </ul>
          {canEdit && (
            <form action={addMember.bind(null, team.id)} className="flex flex-wrap gap-2">
              <label htmlFor="member-email" className="sr-only">Email</label>
              <input id="member-email" name="email" type="email" required placeholder="learner@example.com" className={`${input} min-w-0 flex-1`} />
              <label htmlFor="member-role" className="sr-only">Role</label>
              <select id="member-role" name="role" className={input} defaultValue="member">
                <option value="member">Member</option>
                <option value="manager">Manager</option>
              </select>
              <button type="submit" className="rounded-md bg-brand-gradient btn-shine px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110">
                Add
              </button>
            </form>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold">Assignments ({team.assignments.length})</h2>
          <ul className="mb-5 divide-y divide-slate-100 dark:divide-slate-800">
            {team.assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                <span>
                  <span className="font-medium">{a.title}</span>
                  <span className="block text-xs text-slate-500">
                    {a.kind === "path" ? "Learning path" : "Course"} · {a.dueDate ? `due ${formatDate(a.dueDate)}` : "no due date"}
                  </span>
                </span>
                {canEdit && (
                  <form action={removeAssignment.bind(null, team.id, a.id)}>
                    <button type="submit" className={smallButton}>Remove</button>
                  </form>
                )}
              </li>
            ))}
            {team.assignments.length === 0 && <li className="py-2.5 text-sm text-slate-500">Nothing assigned yet.</li>}
          </ul>
          {canEdit && (
            <form action={addAssignment.bind(null, team.id)} className="flex flex-wrap gap-2">
              <label htmlFor="assign-target" className="sr-only">Course or path</label>
              <select id="assign-target" name="target" required className={`${input} min-w-0 flex-1`} defaultValue="">
                <option value="" disabled>Choose a course or path…</option>
                <optgroup label="Learning paths">
                  {targets.paths.map((p) => (
                    <option key={p.slug} value={`path:${p.slug}`}>{p.title}</option>
                  ))}
                </optgroup>
                <optgroup label="Courses">
                  {targets.courses.map((c) => (
                    <option key={c.slug} value={`course:${c.slug}`}>{c.title}</option>
                  ))}
                </optgroup>
              </select>
              <label htmlFor="assign-due" className="sr-only">Due date</label>
              <input id="assign-due" name="dueDate" type="date" className={input} />
              <button type="submit" className="rounded-md bg-brand-gradient btn-shine px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110">
                Assign
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
