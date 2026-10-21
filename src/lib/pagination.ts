export const COURSES_PER_PAGE = 6;

export function paginate<T>(items: T[], pageParam: string | string[] | undefined, perPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const requested = Number.parseInt(typeof pageParam === "string" ? pageParam : "1", 10);
  const page = Number.isNaN(requested) ? 1 : Math.min(Math.max(requested, 1), totalPages);
  const start = (page - 1) * perPage;
  return { items: items.slice(start, start + perPage), page, totalPages };
}
