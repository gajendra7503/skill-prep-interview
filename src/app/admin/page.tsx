import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { getAdminAccess, getAdminOverview, listTeams } from "@/lib/teams";
import { nowMs } from "@/lib/activity";
import { Notice } from "@/components/admin/notice";
import { createTeam } from "./actions";

const input =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950";

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/admin")}`);
  const access = await getAdminAccess(user);
  const query = await searchParams;

  if (!access.canAccess) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold">Admin area</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          This area is for admins and team managers. Ask an admin if you need access.
        </p>
      </div>
    );
  }

  const [overview, teams] = await Promise.all([
    access.isAdmin ? getAdminOverview(nowMs()) : null,
    listTeams(access.isAdmin ? undefined : access.managedTeamIds),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <h1 className="mb-1 text-3xl font-semibold tracking-tight">{access.isAdmin ? "Admin" : "Your teams"}</h1>
      <p className="mb-8 text-slate-600 dark:text-slate-400">
        {access.isAdmin
          ? "Create teams, assign courses and learning paths, and track progress."
          : "Progress for the teams you manage."}
      </p>
      <Notice notice={typeof query.notice === "string" ? query.notice : undefined} error={typeof query.error === "string" ? query.error : undefined} />

      {overview && (
        <section aria-label="Platform overview" className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[
            ["Learners", overview.learners],
            ["Active this week", overview.activeThisWeek],
            ["Tests this week", overview.testsThisWeek],
            ["Avg test score (30 days)", overview.avgScore === null ? "—" : `${overview.avgScore}%`],
            ["Certificates issued", overview.certificates],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </section>
      )}

      <div className={`grid gap-6 ${access.isAdmin ? "lg:grid-cols-[1fr_320px]" : ""}`}>
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <h2 className="border-b border-slate-100 px-6 py-4 font-semibold dark:border-slate-800">Teams</h2>
          {teams.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-500">No teams yet{access.isAdmin ? " — create one to get started." : "."}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-6 py-3 font-medium">Team</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Members</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Assignments</th>
                  <th scope="col" className="px-6 py-3 text-right font-medium">Avg completion</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id} className="border-t border-slate-100 dark:border-slate-800">
                    <th scope="row" className="px-6 py-3 text-left font-medium">
                      <Link href={`/admin/teams/${team.id}`} className="hover:text-brand-700 dark:hover:text-brand-400">
                        {team.name}
                      </Link>
                      {team.description && <p className="text-xs font-normal text-slate-500">{team.description}</p>}
                    </th>
                    <td className="px-3 py-3 text-right tabular-nums">{team.memberCount}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{team.assignmentCount}</td>
                    <td className="px-6 py-3 text-right tabular-nums">{team.avgCompletion === null ? "—" : `${team.avgCompletion}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {access.isAdmin && (
          <section className="self-start rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 font-semibold">Create a team</h2>
            <form action={createTeam} className="space-y-3">
              <div>
                <label htmlFor="team-name" className="mb-1 block text-sm font-medium">Name</label>
                <input id="team-name" name="name" required minLength={2} maxLength={80} placeholder="e.g. Wealth Advisory — Pune" className={input} />
              </div>
              <div>
                <label htmlFor="team-description" className="mb-1 block text-sm font-medium">Description <span className="font-normal text-slate-500">(optional)</span></label>
                <input id="team-description" name="description" maxLength={255} className={input} />
              </div>
              <button type="submit" className="w-full rounded-md bg-brand-gradient btn-shine px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110">
                Create team
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
