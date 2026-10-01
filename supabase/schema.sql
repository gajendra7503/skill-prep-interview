-- Run this in your Supabase project's SQL editor (Dashboard -> SQL Editor -> New query).

create table if not exists public.lesson_progress (
  user_id uuid references auth.users (id) on delete cascade not null,
  course_slug text not null,
  lesson_slug text not null,
  completed boolean not null default true,
  completed_at timestamptz not null default now(),
  primary key (user_id, course_slug, lesson_slug)
);

alter table public.lesson_progress enable row level security;

create policy "Users can view their own progress"
  on public.lesson_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own progress"
  on public.lesson_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own progress"
  on public.lesson_progress for update
  using (auth.uid() = user_id);

create policy "Users can delete their own progress"
  on public.lesson_progress for delete
  using (auth.uid() = user_id);
