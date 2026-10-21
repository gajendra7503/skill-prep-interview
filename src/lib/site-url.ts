import { headers } from "next/headers";

/**
 * The site's public origin, for links shared outside the app. Set SITE_URL in production
 * (e.g. https://skillprep.example.com); otherwise it is taken from the request.
 */
export async function getSiteUrl(): Promise<string> {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocol = h.get("x-forwarded-proto") ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
  return `${protocol}://${host}`;
}
