import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { signup } from "@/app/(auth)/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";

export default function SignupPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseSetupNotice />;
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="mb-6 text-2xl font-bold">Create an account</h1>
      <AuthForm action={signup} submitLabel="Sign up" />
      <p className="mt-6 text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 underline dark:text-indigo-400">
          Log in
        </Link>
      </p>
    </div>
  );
}

export const dynamic = "force-dynamic";
