# SkillPrep

A learning platform with practical courses on **React**, **Angular**,
**Next.js**, **JavaScript**, **React Native**, **HTML & CSS**, **Node.js**,
**Express.js**, **TypeScript**, **Redux**, **Linux**, **Python**, **MySQL**, **Data Structures & Algorithms**
and **AI Prompting**. Users can create accounts, sign in, mark
lessons complete, and track progress on a dashboard.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Course content as MDX files under `content/<course>/*.mdx`
- MySQL via Prisma 7 for accounts, sessions, progress, certificates, test
  attempts and bookmarks

## Getting started

You need Node.js 20.9+ and a running MySQL 8 server.

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL` to your MySQL
   connection string, e.g. `mysql://USER:PASSWORD@localhost:3306/skillprep`.
   `.env.local` is git-ignored.
2. Install dependencies (this also generates the Prisma client), then create
   the database and tables:

   ```bash
   npm install
   npm run db:migrate
   ```

3. Start the app and open [http://localhost:3000](http://localhost:3000):

   ```bash
   npm run dev
   ```

### Database scripts

| Script | What it does |
|---|---|
| `npm run db:migrate` | Apply schema changes in development (creates the database if needed) |
| `npm run db:deploy` | Apply existing migrations in production, without creating new ones |
| `npm run db:generate` | Regenerate the Prisma client after editing `prisma/schema.prisma` |
| `npm run db:studio` | Browse and edit data in Prisma Studio |
| `npm run db:import-json` | One-off import of the old `data/auth.json` store (safe to re-run) |

Course content stays in `content/` as files; the database holds only per-user
data.

### Admins, teams and managers

Admin access is granted from the command line only (the person must have
signed up first):

```bash
npm run admin:grant -- someone@example.com
npm run admin:revoke -- someone@example.com
```

Admins see **Admin** in the navbar: create teams, add members by email, make
members managers, and assign courses or learning paths with due dates. Managers
get a read-only view of their own teams. Team progress can be exported as CSV.

### AI tutor (optional)

Each lesson has an "Ask the tutor" panel that answers questions about that
lesson using Claude (`claude-opus-5-5`). It stays switched off until you add a
key to `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
AI_TUTOR_DAILY_LIMIT=20   # questions per learner per day (optional, default 20)
```

Every question is logged in the `tutor_messages` table with its token usage,
so you can track cost.

### API

A JSON API for mobile apps and integrations lives under `/api/v1`. See
[docs/api.md](docs/api.md).

## Adding a new course or lesson

- New course: add `content/<slug>/meta.json` with `title`, `description`,
  `icon`, and `accent`.
- New lesson: add `content/<slug>/NN-lesson-name.mdx` with frontmatter
  (`title`, `description`, `module`, `level`, `order`). `level` is one of
  `beginner`, `intermediate`, `advanced` or `pro`. Lessons are sorted by `order`
  and grouped in the sidebar by `module`.

## Project structure

```text
content/<course>/            course metadata + MDX lessons
src/lib/content/             loads and sorts course/lesson content from disk
src/lib/local-auth.ts        accounts, sessions, progress and tests (Prisma queries)
src/lib/db.ts                shared Prisma client (MySQL via the MariaDB adapter)
prisma/schema.prisma         database schema (migrations in prisma/migrations/)
src/app/courses/[course]/    course overview + lesson pages
src/app/(auth)/              login/signup pages + auth server actions
src/app/dashboard/           per-course progress overview
```

## Deploy

Set `DATABASE_URL` (and `SITE_URL`, used in shared certificate links) in the
host's environment, then run `npm run db:deploy` before starting the app. Use
a dedicated MySQL user with access to the SkillPrep database only, not `root`.
