import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { getAdminAccess, getTeamDetail } from "@/lib/teams";

/** Quote a CSV field, and neutralise leading = + - @ so spreadsheets don't run it as a formula. */
function csv(value: string | number | null): string {
  let text = value === null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Team progress as CSV (one row per member, one column per assignment). Admins and the team's managers only. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/admin/teams/[id]/export">) {
  const { id } = await ctx.params;
  const teamId = Number(id);
  const user = await getCurrentUser();
  const access = await getAdminAccess(user);
  if (!Number.isInteger(teamId) || (!access.isAdmin && !access.managedTeamIds.includes(teamId))) {
    return new Response("Not found", { status: 404 });
  }
  const team = await getTeamDetail(teamId, Date.now());
  if (!team) return new Response("Not found", { status: 404 });

  const header = ["Name", "Email", "Role", ...team.assignments.map((a) => `${a.title} (%)`), "Latest test %", "Last active"];
  const rows = team.members.map((m) => [
    m.name,
    m.email,
    m.role,
    ...m.progress.map((p) => p.pct),
    m.latestTest?.pct ?? null,
    m.lastActive ? m.lastActive.slice(0, 10) : null,
  ]);
  const body = [header, ...rows].map((row) => row.map(csv).join(",")).join("\r\n");
  const filename = `${team.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-progress.csv`;

  // BOM so Excel opens UTF-8 names (e.g. Hindi) correctly.
  return new Response("﻿" + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
