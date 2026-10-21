# SkillPrep API (v1)

A JSON API over the same data and rules as the website: courses, lessons, progress, mock tests,
bookmarks, leaderboards and certificates. Base URL: `/api/v1` (e.g. `http://localhost:3000/api/v1`).

## Authentication

Exchange an email and password for a bearer token, then send it on every request:

```bash
curl -X POST http://localhost:3000/api/v1/auth/token \
  -H "content-type: application/json" \
  -d '{"email":"you@example.com","password":"your-password"}'
# → 201 { "token": "…", "tokenType": "Bearer", "expiresAt": "…", "user": { … } }

curl http://localhost:3000/api/v1/me -H "authorization: Bearer <token>"
```

- Tokens last 7 days. `DELETE /api/v1/auth/token` (with the token) signs out.
- After 5 failed sign-ins for an email within 15 minutes, sign-in is refused with `429` until the
  window passes. This applies to the website too.
- Browser code on the same site can call the API without a token; the session cookie is accepted.

## Errors

Every error has the same shape and a matching HTTP status:

```json
{ "error": { "code": "not_found", "message": "Unknown course \"nope\"" } }
```

| Status | `code` | Meaning |
|---|---|---|
| 400 | `invalid_request`, `invalid_json` | Missing or malformed input |
| 401 | `unauthorized`, `invalid_credentials` | No/invalid token, or wrong email/password |
| 404 | `not_found` | Unknown course, lesson, test, question or certificate |
| 413 | `payload_too_large` | Body over 64 KB |
| 429 | `too_many_attempts` | Sign-in locked after repeated failures |
| 500 | `internal_error` | Unexpected server error (details are logged, not returned) |

## Endpoints

`Auth` = requires a token. All responses are `Cache-Control: no-store`.

### Account

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/token` | — | Sign in: `{ email, password }` → token |
| DELETE | `/auth/token` | Auth | Revoke the token used |
| GET | `/me` | Auth | User plus summary (lessons completed, certificates, tests taken) and `gamification` (XP breakdown, level, progress to next level, badges with `earned` / `awardedAt` / `isNew`) |

### Courses and progress

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/courses` | — | All courses with lesson counts |
| GET | `/courses/{course}` | — | Modules and lesson outlines (each with `level`: beginner, intermediate, advanced or pro) |
| GET | `/courses/{course}/lessons/{lesson}` | Auth | Lesson MDX source, quiz, previous/next |
| GET | `/progress` | Auth | Per-course completed lessons, percent, certified |
| PUT | `/progress/{course}/{lesson}` | Auth | Mark complete (idempotent). Returns `newCertificate` when this finishes the course and `newBadges` for any badges it unlocked |
| DELETE | `/progress/{course}/{lesson}` | Auth | Mark not complete (idempotent) |

### Mock tests

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/tests` | — | Topics, question counts and modes |
| GET | `/tests/{topic}` | Auth | Questions **without answers**, plus `modes` and `marking` |
| POST | `/tests/{topic}/attempts` | Auth | Submit and grade an attempt (saved) |
| GET | `/tests/{topic}/attempts` | Auth | Your attempts, newest first |
| POST | `/tests/{topic}/check` | Auth | Practice mode: `{ questionId, answer }` → solution (not saved) |

**Submitting an attempt.** Pick a mode from `GET /tests/{topic}` → `modes`, choose its questions,
then post them with your answers:

- `full`: every question; `easy` / `medium` / `hard`: every question of that difficulty;
- `quick`: any `questionCount` questions with exactly `mcqCount` multiple-choice and
  `practicalCount` practical ones.

```json
POST /api/v1/tests/javascript/attempts
{
  "questionIds": ["js-01", "js-02", "…"],
  "answers": { "js-01": 2, "js-36": "undefined" },
  "timeTakenSeconds": 840
}
```

Answers are an option index (0–3) for multiple-choice questions and typed text for practical ones;
leave a question out to skip it. The server works out the mode from the question set, rejects sets
that match no mode (`400`), grades, saves and returns the full result with solutions and topic
analysis, plus `newBadges` for any badges the attempt unlocked. Marking: +2 correct, −0.5 wrong MCQ, 0
for a wrong practical answer.

### AI tutor

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/tutor` | Auth | `{ enabled, quota: { used, limit, remaining } }` |
| POST | `/tutor` | Auth | Ask about a lesson; the answer **streams back as plain text** |

```json
POST /api/v1/tutor
{
  "courseSlug": "python",
  "lessonSlug": "01-variables-types-and-mutability",
  "question": "Why does b change when I append to a?",
  "history": [{ "role": "user", "content": "…" }, { "role": "assistant", "content": "…" }]
}
```

`history` is optional (the last 6 exchanges are used). Errors before streaming starts use the
normal error shape: `503 tutor_disabled` (no API key configured), `404 not_found` (unknown lesson),
`400 invalid_request` (empty or over 1,500 characters), `429 daily_limit` (quota resets at
midnight IST).

### Bookmarks, leaderboard, certificates

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/bookmarks?topic={topic}` | Auth | Bookmarked question IDs |
| PUT | `/bookmarks/{topic}/{questionId}` | Auth | Bookmark (idempotent) |
| DELETE | `/bookmarks/{topic}/{questionId}` | Auth | Remove bookmark (idempotent) |
| GET | `/leaderboard/{topic}?period=week\|all&limit=1..50` | Auth | Ranked by best full-test score. Lists only opted-in learners (first name + initial) plus your own row |
| GET | `/certificates/{id}` | — | Verify a certificate |
