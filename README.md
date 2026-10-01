# SkillPrep

A learning platform with practical courses on **React**, **Angular**, and
**Next.js** — each course walks through important topics and ends in a
real-world project. Logged-in users can mark lessons complete and track
progress per course on a dashboard.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Course content as MDX files under `content/<course>/*.mdx`, rendered with `next-mdx-remote`
- Supabase (Postgres + Auth) for accounts and progress tracking

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The course content works
immediately with no setup. Login and progress tracking require Supabase —
without it configured, the site shows a "connect Supabase" notice on the
login/signup/dashboard pages but everything else works.

## Setting up accounts & progress tracking (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, open **SQL Editor** and run the contents of
   [`supabase/schema.sql`](./supabase/schema.sql) — this creates the
   `lesson_progress` table with row-level security so users can only read/write
   their own rows.
3. In **Project Settings → API**, copy the **Project URL** and **anon public**
   key.
4. Copy `.env.local.example` to `.env.local` and fill in those two values.
5. Restart `npm run dev`.
6. (Optional, for quick local testing) In **Authentication → Providers →
   Email**, turn off "Confirm email" so sign-up logs you in immediately
   instead of requiring an email link.

## Adding a new course or lesson

- New course: add `content/<slug>/meta.json` with `title`, `description`,
  `icon`, `accent`.
- New lesson: add `content/<slug>/NN-lesson-name.mdx` with frontmatter
  (`title`, `description`, `module`, `order`). Lessons are sorted by `order`
  and grouped in the sidebar by `module`.

## Project structure

```text
content/<course>/            course metadata + MDX lessons
src/lib/content/             loads and sorts course/lesson content from disk
src/lib/supabase/            Supabase browser/server clients + middleware
src/lib/progress.ts          reads a signed-in user's completed lessons
src/app/courses/[course]/    course overview + lesson pages
src/app/(auth)/              login/signup pages + auth server actions
src/app/dashboard/           per-course progress overview
supabase/schema.sql          the lesson_progress table + RLS policies
```

## Deploy

Deploy on [Vercel](https://vercel.com/new) as with any Next.js app — add the
two `NEXT_PUBLIC_SUPABASE_*` environment variables in the project settings.
