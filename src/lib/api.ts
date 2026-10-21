import type { NextRequest } from "next/server";
import { getUserByToken, type AuthUser } from "@/lib/local-auth";
import { ServiceError } from "@/lib/services/learning";

const SESSION_COOKIE = "skillprep_session";
const MAX_BODY_BYTES = 64 * 1024;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { "Cache-Control": "no-store", ...init?.headers } });
}

function errorResponse(status: number, code: string, message: string) {
  return json({ error: { code, message } }, { status });
}

/** The caller's user, from `Authorization: Bearer <token>` or, for same-site browser calls, the session cookie. */
export async function getApiUser(request: NextRequest): Promise<AuthUser | null> {
  const header = request.headers.get("authorization");
  const bearer = header?.match(/^Bearer\s+(\S+)$/i)?.[1];
  const token = bearer ?? request.cookies.get(SESSION_COOKIE)?.value;
  return token ? getUserByToken(token) : null;
}

export async function requireApiUser(request: NextRequest): Promise<AuthUser> {
  const user = await getApiUser(request);
  if (!user) throw new ApiError(401, "unauthorized", "Sign in first: send `Authorization: Bearer <token>` from POST /api/v1/auth/token.");
  return user;
}

/** Parses a JSON object body, rejecting oversized or malformed payloads. */
export async function readJsonBody(request: NextRequest): Promise<Record<string, unknown>> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) throw new ApiError(413, "payload_too_large", "Request body is too large.");
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new ApiError(413, "payload_too_large", "Request body is too large.");
  try {
    const body = JSON.parse(text || "{}");
    if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    // fall through
  }
  throw new ApiError(400, "invalid_json", "Request body must be a JSON object.");
}

/** Wraps a route handler so known errors become clean JSON responses and unknown ones a generic 500. */
export function handle<C>(handler: (request: NextRequest, context: C) => Promise<Response>) {
  return async (request: NextRequest, context: C): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) return errorResponse(error.status, error.code, error.message);
      if (error instanceof ServiceError) {
        return errorResponse(error.code === "not_found" ? 404 : 400, error.code, error.message);
      }
      console.error("API error", request.method, request.nextUrl.pathname, error);
      return errorResponse(500, "internal_error", "Something went wrong. Please try again.");
    }
  };
}
