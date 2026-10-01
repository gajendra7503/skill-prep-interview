export function SupabaseSetupNotice() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
      <h1 className="mb-3 text-2xl font-bold">Accounts aren&apos;t set up yet</h1>
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Login and progress tracking need a Supabase project. Create one at{" "}
        <a href="https://supabase.com" className="underline" target="_blank" rel="noreferrer">
          supabase.com
        </a>
        , run <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">supabase/schema.sql</code>{" "}
        in its SQL editor, then add your project URL and anon key to{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">.env.local</code> (see{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">.env.local.example</code>). Restart
        the dev server afterwards.
      </p>
    </div>
  );
}
