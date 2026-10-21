import type { NextRequest } from "next/server";
import { ApiError, handle, json } from "@/lib/api";
import { getCourse } from "@/lib/content";
import { getCertificateById } from "@/lib/local-auth";

/** Verify a certificate by ID. Public, like the /verify page. */
export const GET = handle(async (_request: NextRequest, ctx: RouteContext<"/api/v1/certificates/[id]">) => {
  const { id } = await ctx.params;
  const found = await getCertificateById(decodeURIComponent(id));
  if (!found) throw new ApiError(404, "not_found", "No certificate with this ID.");
  const { certificate, holderName } = found;
  return json({
    valid: true,
    id: certificate.id,
    holderName,
    courseSlug: certificate.courseSlug,
    courseTitle: getCourse(certificate.courseSlug)?.title ?? certificate.courseSlug,
    issuedAt: certificate.issuedAt,
  });
});
