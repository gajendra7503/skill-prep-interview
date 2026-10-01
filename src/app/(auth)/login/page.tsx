import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { login } from "@/app/(auth)/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  if (!isSupabaseConfigured()) {
    return <SupabaseSetupNotice />;
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="mb-6 text-2xl font-bold">Log in</h1>
      {params.error === "confirmation" && (
        <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">
          That confirmation link is invalid or has expired. Please sign up again or request a new link.
        </p>
      )}
      <AuthForm action={login} submitLabel="Log in" />
      <p className="mt-6 text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-indigo-600 underline dark:text-indigo-400">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export const dynamic = "force-dynamic";
