import type { NextRequest } from "next/server";
import { ApiError, handle, json, requireApiUser } from "@/lib/api";
import { sevenDaysAgoIso } from "@/lib/activity";
import { getMockTest } from "@/lib/content/tests";
import { getLeaderboard } from "@/lib/local-auth";

/** Top learners for a topic: `?period=week|all` (default week), `?limit=1..50` (default 10). */
export const GET = handle(async (request: NextRequest, ctx: RouteContext<"/api/v1/leaderboard/[topic]">) => {
  const user = await requireApiUser(request);
  const { topic } = await ctx.params;
  const test = getMockTest(topic);
  if (!test) throw new ApiError(404, "not_found", `No mock test for "${topic}"`);
  const params = request.nextUrl.searchParams;
  const period = params.get("period") === "all" ? "all" : "week";
  const limit = Math.min(Math.max(Number(params.get("limit")) || 10, 1), 50);
  const board = await getLeaderboard(topic, user.id, {
    since: period === "week" ? sevenDaysAgoIso() : undefined,
    fullTestSize: test.questions.length,
    limit,
  });
  // userId is internal; API consumers get display names and ranks only.
  const strip = (row: (typeof board.rows)[number]) => ({
    rank: row.rank,
    displayName: row.displayName,
    isViewer: row.isViewer,
    pct: row.pct,
    timeTakenSeconds: row.timeTakenSeconds,
    submittedAt: row.submittedAt,
  });
  return json({ topic, period, rows: board.rows.map(strip), viewer: board.viewer ? strip(board.viewer) : null });
});
