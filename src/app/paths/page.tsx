import { redirect } from "next/navigation";
import { getLearningPaths } from "@/lib/content/paths";
import { getCompletedCountsByCourse, getCurrentUser } from "@/lib/progress";
import { PathCard } from "@/components/path-card";
import { Pagination } from "@/components/pagination";
import { paginate } from "@/lib/pagination";

const PATHS_PER_PAGE = 6;

export default async function PathsPage({ searchParams }: PageProps<"/paths">) {
  const [user, completed] = await Promise.all([getCurrentUser(), getCompletedCountsByCourse()]);
  if (!user) redirect(`/login?next=${encodeURIComponent("/paths")}`);
  const paths = getLearningPaths();
  const { page, totalPages, items: pagePaths } = paginate(paths, (await searchParams).page, PATHS_PER_PAGE);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <h1 className="mb-1 text-3xl font-semibold tracking-tight">Learning paths</h1>
      <p className="mb-8 max-w-2xl text-slate-600 dark:text-slate-400">
        Courses in a recommended order for a role. Each course you finish counts towards every path it belongs to.
        {totalPages > 1 && (
          <span className="mt-1 block text-sm text-slate-500">
            {paths.length} paths · page {page} of {totalPages}
          </span>
        )}
      </p>
      <div className="stagger grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {pagePaths.map((path) => (
          <PathCard key={path.slug} path={path} completed={completed} showProgress />
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} basePath="/paths" />
    </div>
  );
}
