import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { signup } from "@/app/(auth)/actions";
import { createCaptcha } from "@/lib/captcha";

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const params = await searchParams;
  const redirectTo = typeof params.next === "string" ? params.next : "/dashboard";

  return (
    <AuthShell>
        <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">Track your progress, earn certificates and take mock tests.</p>
        <AuthForm action={signup} captcha={createCaptcha()} submitLabel="Sign up" redirectTo={redirectTo} askName />
        <p className="mt-6 text-sm text-slate-500">
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(redirectTo)}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">
            Log in
          </Link>
        </p>
    </AuthShell>
  );
}

export const dynamic = "force-dynamic";
