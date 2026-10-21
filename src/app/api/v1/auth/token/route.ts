import type { NextRequest } from "next/server";
import { ApiError, handle, json, readJsonBody } from "@/lib/api";
import { LOGIN_LOCKOUT, revokeToken, signIn } from "@/lib/local-auth";

/** Exchange email + password for a bearer token (valid 7 days). Repeated failures lock the email for 15 minutes. */
export const POST = handle(async (request: NextRequest) => {
  const body = await readJsonBody(request);
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) throw new ApiError(400, "invalid_request", "Send `email` and `password`.");

  const result = await signIn(email, password);
  if (!result.ok) {
    if (result.reason === "locked") {
      throw new ApiError(429, "too_many_attempts", `Too many failed attempts. Try again in ${LOGIN_LOCKOUT.windowMinutes} minutes.`);
    }
    throw new ApiError(401, "invalid_credentials", "Email or password is incorrect.");
  }
  return json(
    { token: result.token, tokenType: "Bearer", expiresAt: result.expiresAt.toISOString(), user: { id: result.id, email: result.email } },
    { status: 201 }
  );
});

/** Revoke the bearer token used for this request (sign out). */
export const DELETE = handle(async (request: NextRequest) => {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) throw new ApiError(400, "invalid_request", "Send the token to revoke as `Authorization: Bearer <token>`.");
  await revokeToken(token);
  return new Response(null, { status: 204 });
});
