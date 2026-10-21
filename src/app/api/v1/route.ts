import { json } from "@/lib/api";

/** API index: what's available and how to authenticate. */
export function GET() {
  return json({
    name: "SkillPrep API",
    version: "v1",
    auth: "POST /api/v1/auth/token with { email, password } → send `Authorization: Bearer <token>` on other requests.",
    endpoints: [
      "POST   /api/v1/auth/token",
      "DELETE /api/v1/auth/token",
      "GET    /api/v1/me",
      "GET    /api/v1/courses",
      "GET    /api/v1/courses/{course}",
      "GET    /api/v1/courses/{course}/lessons/{lesson}",
      "GET    /api/v1/progress",
      "PUT    /api/v1/progress/{course}/{lesson}",
      "DELETE /api/v1/progress/{course}/{lesson}",
      "GET    /api/v1/tests",
      "GET    /api/v1/tests/{topic}",
      "GET    /api/v1/tests/{topic}/attempts",
      "POST   /api/v1/tests/{topic}/attempts",
      "POST   /api/v1/tests/{topic}/check",
      "GET    /api/v1/bookmarks?topic={topic}",
      "PUT    /api/v1/bookmarks/{topic}/{questionId}",
      "DELETE /api/v1/bookmarks/{topic}/{questionId}",
      "GET    /api/v1/leaderboard/{topic}?period=week|all",
      "GET    /api/v1/certificates/{id}",
    ],
    docs: "See docs/api.md in the repository.",
  });
}
